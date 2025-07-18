<script lang="ts">
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { toast } from 'svelte-sonner';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { imgUrl } from '$lib/config';
  import Footer from '$lib/components/footer.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Icon from '@iconify/svelte';

  interface Product {
    productId: {
      brand: any;
      _id: string;
      productName: string;
      images: string[];
    };
    quantity: number;
    totalAmount: number;
    price: number;
    customSuggestion: string;
    _id: string;
  }

  interface PaymentImage {
    image: string;
    verified: boolean;
  }

  interface Address {
    _id: string;
    receiverName: string;
    receiverMobile: string;
    flatorHouseno: string;
    area: string;
    landmark: string;
  }

  interface Order {
    _id: string;
    user: string;
    orderId: string;
    paymentImages: PaymentImage[];
    products: Product[];
    addressId: Address;
    store: string;
    deliveryAgent: string | null;
    preparationTime: number;
    deliveryTime: string | null;
    deliverySeconds: number;
    distance: string;
    couponDiscount: number;
    deliveryPrice: number;
    platformFee: number;
    subtotal: number;
    tax: number;
    totalPrice: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    razorPayResponse: string;
    razorOrderId: string;
    razorPayId: string;
    tipsRazorPayId: string;
    tipsRazorPayResponse: string;
    tips: number;
    preparedAt: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }

  interface OrderResponse {
    message: string;
    status: boolean;
    data: Order;
  }

  const orderId = $page.params.id;
  let isDialogOpen = false;
  let isImageDialogOpen = false;
  let selectedImage = '';
  let dialogElement: HTMLDivElement | null = null;
  let previewImages: string[] = [];

  const orderQuery = createQuery<OrderResponse>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
      try {
        const response = await _axios.get(`/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.data.status) {
          throw new Error(response.data.message || 'Failed to fetch order details');
        }
        return response.data;
      } catch (error) {
        throw error instanceof Error ? error : new Error('An unexpected error occurred');
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: !!orderId,
  });

  const invoiceMutation = createMutation({
  mutationFn: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    try {
      const response = await _axios.post(
        `/invoice/generate?orderId=${orderId}`,{},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob' // This is the key change!
        }
      );

      // Check if we got a blob response
      if (!(response.data instanceof Blob)) {
        // If not a blob, try to read as JSON (for error messages)
        const text = await response.data.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to generate invoice');
        } catch {
          throw new Error(text || 'Invalid response format');
        }
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Handle error responses that might be JSON
        if (error.response.headers['content-type']?.includes('application/json')) {
          throw new Error(error.response.data.message || 'Failed to generate invoice');
        }
        // Handle blob error responses
        const errorText = await error.response.data.text();
        throw new Error(errorText || 'Server error while generating invoice');
      }
      throw new Error(error.message || 'Failed to generate invoice');
    }
  },
  onSuccess: (pdfBlob: Blob) => {
    // Create a URL for the Blob and trigger download
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Invoice downloaded successfully!');
  },
  onError: (error: Error) => {
    toast.error(error.message || 'Failed to download invoice');
  }
});
  const replacePaymentImageMutation = createMutation({
    mutationFn: async (paymentImages: File[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const formData = new FormData();
      paymentImages.forEach((file) => {
        formData.append('paymentImages', file);
      });

      try {
        const response = await _axios.patch(
          `/orders/${orderId}/upload-payment-image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (!response.data.status) throw new Error(response.data.message);
        return response.data;
      } catch (error: any) {
        if (error.response?.data) throw new Error(error.response.data.message);
        throw new Error('Failed to update payment images');
      }
    },
    onSuccess: () => {
      toast.success('Payment images updated successfully!');
      clearPreview();
      $orderQuery.refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment images');
      clearPreview();
    },
  });

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      for (const file of files) {
        if (!file.type.match(/image\/(jpeg|png)/)) {
          toast.error('Please upload only JPEG or PNG images');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Each image should be less than 5MB');
          return;
        }
      }

      previewImages = files.map(file => URL.createObjectURL(file));
      $replacePaymentImageMutation.mutate(files);
    }
  }

  function clearPreview() {
    previewImages.forEach(url => URL.revokeObjectURL(url));
    previewImages = [];
    const input = document.getElementById('paymentImageUpload') as HTMLInputElement;
    if (input) input.value = '';
  }

  function openImageDialog(imageUrl: string) {
    selectedImage = imageUrl;
    isImageDialogOpen = true;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cancelOrderMutation = createMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
      try {
        const response = await _axios.post(`/orders/cancel/${orderId}`, {}, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.data.status) {
          throw new Error(response.data.message || 'Failed to cancel the order');
        }
        goto('/order-history');
        return response.data;
      } catch (error) {
        throw error instanceof Error ? error : new Error('An unexpected error occurred');
      }
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    },
  });

  const handleCancelOrder = async () => {
    try {
      if (!$orderQuery.data?.data) {
        toast.error('Order details not available');
        return;
      }
      const orderStatus = $orderQuery.data.data.status;
      if (orderStatus !== 'pending' && orderStatus !== 'accepted') {
        toast.error('This order cannot be cancelled.');
        return;
      }
      await $cancelOrderMutation.mutateAsync();
      isDialogOpen = false;
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };
</script>

<div class="xl:max-w-[75%] 2xl:max-w-[60%] lg:max-w-[85%] md:max-w-[75%] mx-auto p-4 lg:pt-10 pb-20">
  {#if $orderQuery.isLoading}
    <div class="space-y-4">
      <Skeleton class="w-full h-24" />
      <Skeleton class="w-full h-48" />
      <Skeleton class="w-full h-64" />
    </div>
  {:else if $orderQuery.error}
    <p class="text-red-500">Error: {$orderQuery.error.message}</p>
  {:else if $orderQuery.data}
    {@const order = $orderQuery.data.data}
    <div class="flex items-center justify-between">
      <h2 class="lg:text-3xl md:text-2xl text-xl font-bold text-[#30363C] mb-4">#{order.orderId}</h2>
      <button
        on:click={() => $invoiceMutation.mutate()}
        class="rounded-lg text-white bg-custom-gradient flex gap-1 flex-nowrap p-2"
        disabled={$invoiceMutation.isPending}
      >
        <span>
          <Icon icon="material-symbols:downloading-rounded" width="24" height="24" />
        </span>
        {#if $invoiceMutation.isPending}
          Downloading...
        {:else}
          Download Invoice
        {/if}
      </button>
    </div>

    <!-- Order Header -->
    <div class="border rounded-lg bg-white shadow-md mb-4">
      <div class="flex lg:flex-wrap gap-4 items-start justify-between lg:p-4 p-2 bg-[#F2F4F5]">
        <div>
          <p class="lg:text-lg text-base text-[#4F585E]">Order Placed</p>
          <p class="font-semibold text-[#30363C] lg:text-base text-sm">
            {formatDate(order.createdAt)} <span class="hidden lg:block"> at {formatTime(order.createdAt)}</span>
          </p>
        </div>
        <div>
          <p class="lg:text-lg text-base text-[#4F585E]">Order Delivered</p>
          <p class="font-semibold text-[#30363C] text-base">
            {order.deliveryTime ? formatDate(order.deliveryTime) : '-'}
          </p>
        </div>
        <div class="lg:block hidden">
          <p class="lg:text-lg text-base text-[#4F585E]">Total Amount</p>
          <p class="font-semibold text-[#30363C] text-base">₹{order.totalPrice?.toFixed(2)}</p>
        </div>
        <div class="flex flex-col lg:items-end">
          {#if order.status === 'pending' || order.status === 'accepted'}
            <button
              class="text-[#FF080C] lg:text-xl md:text-lg text-base font-medium rounded-md"
              on:click={() => { isDialogOpen = true }}
            >
              Cancel Order
            </button>
          {:else}
            {#if order.status !== 'cancelled' && order.status !== 'rejected'}
              <button
                class="text-[#147097] lg:text-xl md:text-lg text-base font-medium rounded-md"
                on:click={() => goto('/')}
              >
                Shop Again
              </button>
            {/if}
          {/if}
        </div>
      </div>
    </div>

    <!-- Shipping and Payment Info -->
    <div class="grid grid-cols-1 lg:grid-cols-3 lg:gap-4 lg:p-4 border-t">
      <div class="rounded-lg lg:p-4 p-2">
        <h3 class="text-xl font-bold text-[#30363C] mb-2">Shipping Address</h3>
        <p class="font-medium text-lg">{order.addressId?.receiverName}</p>
        <p class="text-lg">{order.addressId?.flatorHouseno}, {order.addressId?.area}</p>
        <p class="text-lg">{order.addressId?.landmark}</p>
        <p class="mt-2 text-lg">Phone: {order.addressId?.receiverMobile}</p>
      </div>
      
      <div class="rounded-lg lg:p-4 p-2">
        <h3 class="text-xl font-bold text-[#30363C] mb-2">Payment Mode</h3>
        <p class="text-lg font-medium capitalize">{order.paymentMethod}</p>
        
        {#if order.paymentStatus === 'failed' || order.paymentStatus === 'initiated'}
          <div class="mt-4">
            <h3 class="text-lg font-semibold text-[#30363C] mb-2">
              {order.paymentStatus === 'failed' ? 'Payment Failed' : 'Payment Initiated'}
            </h3>
            <div class="flex flex-wrap gap-4">
              {#if order.paymentImages && order.paymentImages.length > 0}
                <div class="flex flex-wrap gap-3">
                  {#each order.paymentImages as image}
                    <div class="relative">
                      <img
                        src={imgUrl + image.image}
                        alt="Payment Receipt"
                        class="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                        on:click={() => openImageDialog(imgUrl + image.image)}
                      />
                      {#if image.verified}
                        <div class="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
              
              <div class="border-2 w-28 h-28 items-center flex-col justify-center flex border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-w-[120px]">
                {#if previewImages.length > 0}
                  <div class="mb-3 flex flex-wrap gap-2">
                    {#each previewImages as image, index}
                      <div class="relative">
                        <!-- Commented out image preview -->
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="text-center h-full flex flex-col justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-9 w-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                {/if}

                <label class="mt-3 text-nowrap w-fit flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#147097] hover:bg-[#115a7a] cursor-pointer">
                  {#if $replacePaymentImageMutation.isPending}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  {:else}
                    Choose Files
                  {/if}
                  <input
                    id="paymentImageUpload"
                    type="file"
                    class="sr-only"
                    accept="image/jpeg,image/png"
                    on:change={handleFileChange}
                    multiple
                    disabled={$replacePaymentImageMutation.isPending}
                  />
                </label>
              </div>
            </div>
          </div>
        {:else if order.paymentImages && order.paymentImages.length > 0}
          <div class="mt-4">
            <h3 class="text-lg font-semibold text-[#30363C] mb-2">Payment Receipts</h3>
            <div class="flex flex-wrap gap-3">
              {#each order.paymentImages as image}
                <div class="relative">
                  <img
                    src={imgUrl + image.image}
                    alt="Payment Receipt"
                    class="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                    on:click={() => openImageDialog(imgUrl + image.image)}
                  />
                  {#if image.verified}
                    <div class="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <div class="rounded-lg lg:p-4 p-2">
        <h3 class="text-xl font-bold text-[#30363C] mb-2">Payment Summary</h3>
        <div class="text-lg flex justify-between mt-1">
          <span>Subtotal ({order.products?.length || 0} items)</span>
          <span class="font-medium">₹{order.subtotal?.toFixed(2)}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span>Delivery Charge</span>
          <span class="text-green-600 font-medium">
            {order.deliveryPrice > 0 ? `₹${order.deliveryPrice?.toFixed(2)}` : 'FREE'}
          </span>
        </div>
        <div class="flex justify-between mt-1">
          <span>Platform Fee</span>
          <span class="font-medium">₹{order.platformFee?.toFixed(2)}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span>Tax</span>
          <span class="font-medium">₹{order.tax?.toFixed(2)}</span>
        </div>
        <div class="flex justify-between mt-1 border-t pt-1">
          <span class="font-bold">Total Amount</span>
          <span class="font-bold">₹{order.totalPrice?.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Product Details -->
    <div class="border rounded-lg bg-white shadow-md mt-4">
      {#each order.products as product}
        <div class="flex items-center p-4 border-b last:border-b-0 gap-4">
          <div class="w-20 h-20">
            <img
              src={imgUrl + product.productId.images[0]}
              alt={product.productId.productName}
              class="w-full h-full object-cover rounded"
            />
          </div>
          <div class="flex-1">
            <p class="text-xl capitalize font-semibold text-[#30363C]">{product.productId.productName}</p>
            <div class="flex gap-4 lg:gap-8 mt-2">
              <p class="lg:text-lg text-sm">
                <span class="text-[#461497]">BRAND:</span> {product.productId.brand?.name}
              </p>
              <p class="lg:text-lg text-sm">
                <span class="text-[#461497]">QTY:</span> {product.quantity}
              </p>
              <p class="lg:text-lg text-sm">
                <span class="text-[#461497]">AMOUNT:</span> ₹{product.totalAmount?.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            class="text-primary lg:block hidden text-xl px-4 py-2 rounded-md hover:bg-[#f0e6fd] self-end sm:self-auto"
            on:click={() => goto(`/products/${product.productId._id}`)}
          >
            Buy Again
          </button>
        </div>
      {/each}
    </div>

    <!-- Image Preview Dialog -->
    {#if isImageDialogOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-3xl w-full">
          <div class="p-3 border-b flex justify-between items-center">
            <h3 class="text-md font-medium">Payment Receipt</h3>
            <button
              on:click={() => isImageDialogOpen = false}
              class="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4 flex justify-center">
            <img
              src={selectedImage}
              alt="Payment Receipt"
              class="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      </div>
    {/if}

    <!-- Cancel Order Dialog -->
    {#if isDialogOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 transition-all duration-300">
        <div class="bg-white rounded-lg flex gap-3 flex-col items-center shadow-lg p-6 w-full max-w-md max-h-[60vh] overflow-y-auto scrollbar-hide" role="dialog" aria-label="Cancel order confirmation" bind:this={dialogElement}>
          <h3 class="text-xl font-semibold text-[#30363C]">Cancel Order</h3>
          <p class="text-center text-gray-600">Are you sure you want to cancel this order?</p>
          <div class="flex justify-center gap-4 mt-4 w-full">
            <button
              on:click={handleCancelOrder}
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              disabled={$cancelOrderMutation.isPending}
            >
              {#if $cancelOrderMutation.isPending}
                Processing...
              {:else}
                Confirm Cancel
              {/if}
            </button>
            <button
              on:click={() => { isDialogOpen = false }}
              class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <p class="text-gray-500">No order details found</p>
  {/if}
</div>

<Footer />

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>