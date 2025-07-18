<script lang="ts">
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import Icon from '@iconify/svelte';
  import { imgUrl } from "$lib/config";
  import { toast } from 'svelte-sonner';
  import { queryClient } from "$lib/query-client";
  import { goto } from "$app/navigation";
  import { writableGlobalStore } from "$lib/stores/global-store";
  import Footer from "$lib/components/footer.svelte";
  import { onMount, onDestroy } from 'svelte';
  import { loadRazorpay, initiatePayment } from '$lib/payment';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Copy } from "lucide-svelte";
  import X from "@lucide/svelte/icons/x";

  interface ProductDetails {
    HSNCode: any;
    strikePrice: any;
    _id: string;
    stock: number;
    productName: string;
    price: number;
    images: string[];
    gst: number;
    discount: number;
    onMRP: number;
    flat: number;
    negMOQ?: number;
  }

  interface CartItem {
    selectedOffer: any;
    productId: ProductDetails;
    quantity: number;
    totalAmount: number;
    price: number;
    customSuggestion: string;
    _id: string;
  }

  interface CartResponse {
    message: string;
    status: boolean;
    cart: {
      _id: string;
      user: string;
      products: CartItem[];
      subtotal: number;
      tax: number;
      totalPrice: number;
      totalDistance: number;
      deliveryFee: number;
      platformFee: number;
      deliverySeconds: number;
      status: string;
      lastUpdated: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
    };
    totalDistance: number;
    deliveryFee: number;
    platformFee: number;
    coupons: any[];
    deliverySeconds: number;
    deliveryMinutes: number;
    couponError?: string;
    summary: {
      subtotalBeforeDiscount: number;
      totalDiscount: number;
      subtotal: number;
      tax: number;
      totalPrice: number;
      couponDiscount: number;
    };
  }

  interface Address {
    _id: string;
    receiverName: string;
    receiverMobile: string;
    flatorHouseno: string;
    area: string;
    landmark: string;
    addressString: string;
    latitude: string;
    longitude: string;
    active: boolean;
    addressType: string;
    userId: string;
    isPrimary: boolean;
  }

  interface Notification {
    _id: string;
    title: string;
    description: string;
    requiresResponse: boolean;
    response?: string;
  }

  // State variables
  let isCouponVisible = false;
  let couponCode = '';
  let couponError = '';
  let couponDiscount = 0;
  let isApplying = false;
  let isPaying = false;
  let showShimmer = true;
  let notifications: Notification[] = [];
  let notificationResponse = {
    id: '',
    loading: false,
    success: false,
    error: false
  };
  let isConfirmationDialogOpen = false;
  let isDialogOpen = false;
  let previewImages: string[] = [];
  let selectedFiles: File[] = [];
  let isUploading = false;

  // Computed properties
  $: isLoggedIn = $writableGlobalStore.isLogedIn;
  $: cartData = $cartQuery.data;
  $: cartItems = showShimmer ? [] : (cartData?.cart?.products || []);
  $: isCartLoading = showShimmer || $cartQuery.isLoading;
  $: isAddressesLoading = showShimmer || $addressesQuery.isLoading;
  $: error = $cartQuery.error ? ($cartQuery.error as Error).message : null;
  $: primaryAddress = showShimmer ? null : ($addressesQuery.data?.find((address) => address.isPrimary) || null);
  $: totalAmount = isCartLoading ? 0 : (cartData?.cart?.subtotal || 0);
  $: totalDiscount = isCartLoading ? 0 : cartItems.reduce((sum, item) => sum + (item.productId.discount || 0) * item.quantity, 0);
  $: deliveryFee = isCartLoading ? 0 : (cartData?.deliveryFee || 0);
  $: platformFee = isCartLoading ? 0 : (cartData?.platformFee || 0);
  $: tax = isCartLoading ? 0 : (cartData?.cart?.tax || 0);
  $: totalPrice = isCartLoading ? 0 : (cartData?.cart?.totalPrice || 0);
  $: taxRate = isCartLoading || totalAmount === 0 ? 0 : tax / totalAmount;
  $: cgst = isCartLoading ? 0 : totalAmount * (taxRate / 2);
  $: sgst = isCartLoading ? 0 : totalAmount * (taxRate / 2);
  $: formattedCgst = isCartLoading ? '0.00' : Number(cgst.toFixed(4)).toString();
  $: formattedSgst = isCartLoading ? '0.00' : Number(sgst.toFixed(4)).toString();
  $: showFlatOfferInfo = (() => {
    const flatOfferItems = cartItems.filter(item =>
      item.productId.flat && !item.productId.onMRP && !item.productId.discount
    );
    return flatOfferItems.length === 1;
  })();

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  }

  function handleDialogCloseAttempt() {
    isConfirmationDialogOpen = true;
  }

  function confirmCancel() {
    isConfirmationDialogOpen = false;
    isDialogOpen = false;
    clearPreviews();
  }

  function cancelConfirmation() {
    isConfirmationDialogOpen = false;
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Validate files
      for (const file of files) {
        if (!file.type.match(/image\/(jpeg|png)|application\/pdf/)) {
          toast.error('Please upload only JPEG, PNG, or PDF files');
          return;
        }
        if (file.size > 100 * 1024) {
          toast.error('Each file should be less than 100KB');
          return;
        }
      }

      // Clear previous previews
      clearPreviews();

      // Create previews
      selectedFiles = files;
      previewImages = files.map(file => URL.createObjectURL(file));
    }
  }

  function clearPreviews() {
    previewImages.forEach(url => URL.revokeObjectURL(url));
    previewImages = [];
    selectedFiles = [];
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  }

  function removePreview(index: number) {
    URL.revokeObjectURL(previewImages[index]);
    previewImages = previewImages.filter((_, i) => i !== index);
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function triggerFileUpload(e: Event) {
    e.preventDefault();
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onMount(() => {
    showShimmer = true;
    $cartQuery.refetch();
    const timer = setTimeout(() => {
      showShimmer = false;
    }, 1000);
    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    clearPreviews();
  });

  function toggleCoupon() {
    couponCode = '';
    $cartQuery.refetch();
    if (cartItems.length !== 0) {
      isCouponVisible = !isCouponVisible;
    }
  }

  async function handleNotificationResponse(notificationId: string, response: 'yes' | 'no') {
    notificationResponse = {
      id: notificationId,
      loading: true,
      success: false,
      error: false
    };

    try {
      const token = localStorage.getItem('token');
      await _axios.post('/notification/respond', {
        notificationId,
        response
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      notificationResponse = {
        id: notificationId,
        loading: false,
        success: true,
        error: false
      };

      notifications = notifications.filter(n => n._id !== notificationId);
    } catch (error) {
      notificationResponse = {
        id: notificationId,
        loading: false,
        success: false,
        error: true
      };
    }
  }

  function closeNotification(notificationId: string) {
    notifications = notifications.filter(n => n._id !== notificationId);
  }

  const addressesQuery = createQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await _axios.get('/address/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.data.status) throw new Error(response.data.message);
      return response.data.addresses || [];
    },
    retry: 1,
    staleTime: 0
  });

  const cartQuery = createQuery<CartResponse>({
    queryKey: ['cart', couponCode],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      try {
        const url = couponCode ? `/cart?couponCode=${couponCode}` : '/cart';
        const response = await _axios.get(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.data.status && response.data.message === "No active cart found") {
          return {
            message: "No active cart found",
            status: false,
            cart: {
              _id: '',
              user: '',
              products: [],
              subtotal: 0,
              tax: 0,
              totalPrice: 0,
              totalDistance: 0,
              deliveryFee: 0,
              platformFee: 0,
              deliverySeconds: 0,
              status: 'active',
              lastUpdated: '',
              createdAt: '',
              updatedAt: '',
              __v: 0,
            },
            totalDistance: 0,
            deliveryFee: 0,
            platformFee: 0,
            coupons: [],
            deliverySeconds: 0,
            deliveryMinutes: 0,
          };
        }

        if (response.data.status) {
          couponError = response.data.couponError || '';
          couponDiscount = response.data.summary.couponDiscount || 0;

          if (response.data.cart?.products) {
            response.data.cart.products.forEach((item: { productId: { flat: number; discount: any; onMRP: any; price: number; }; price: number; totalAmount: number; quantity: number; }) => {
              if (item.productId.flat && !item.productId.discount && !item.productId.onMRP) {
                item.price = item.price;
                item.totalAmount = item.price * item.quantity;
              }
            });
          }

          return response.data;
        }

        throw new Error(response.data.message);
      } catch (error) {
        throw error;
      }
    },
    retry: 1,
    staleTime: 0
  });

  const placeOrderMutation = createMutation({
    mutationFn: async ({ addressId, paymentImages }: { addressId: string; paymentImages?: File[] }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      if (!addressId) throw new Error('Please select a delivery address');
      if (!paymentImages || paymentImages.length === 0) throw new Error('Please upload at least one payment image');

      const outOfStockItems = cartItems.filter(
        item => item?.productId && typeof item.productId.stock === 'number' && item.productId.stock <= 0
      );

      if (outOfStockItems.length > 0) {
        const outOfStockNames = outOfStockItems
          .map(item => item.productId.productName)
          .join(', ');
        throw new Error(
          `Cannot place order: The following items are out of stock: ${outOfStockNames}. Please remove them from the cart to proceed.`
        );
      }

      const insufficientStockItems = cartItems.filter(
        item => item?.productId && typeof item.productId.stock === 'number' && item.quantity > item.productId.stock
      );

      if (insufficientStockItems.length > 0) {
        const itemDetails = insufficientStockItems.map(item =>
          `Only ${item.productId.stock} units of ${item.productId.productName} are available`
        ).join(', ');
        throw new Error(`Insufficient stock: ${itemDetails}. Please modify the quantities and try again.`);
      }

      try {
        const formData = new FormData();
        formData.append('addressId', addressId);
        paymentImages.forEach(file => {
          formData.append('paymentImages', file);
        });

        const response = await _axios.post('/orders/order', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (!response.data.status) throw new Error(response.data.message);
        return response.data;
      } catch (error: any) {
        if (error.response?.data) throw new Error(error.response.data.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      toast.success('Order placed successfully!');
      clearPreviews();
      goto(`/order-confirmation/${data.order._id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to place order');
      clearPreviews();
    }
  });

  const updateQuantityMutation = createMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await _axios.post(
        '/cart/updatequantity',
        { productId, quantity },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.data.status) throw new Error(response.data.message);
      return response.data;
    },
    onSuccess: () => {
      $cartQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      toast.success('Quantity updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update quantity');
    },
  });

  const removeProductMutation = createMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await _axios.delete(`/cart/remove-product/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.data.status) throw new Error(response.data.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cartCount']);
      $cartQuery.refetch();
      toast.success('Product removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove product');
    },
  });

  async function validateStock() {
    $cartQuery.refetch();
    const outOfStockItems = cartItems.filter(
      item => item?.productId && typeof item.productId.stock === 'number' && item.productId.stock <= 0
    );

    if (outOfStockItems.length > 0) {
      const outOfStockNames = outOfStockItems
        .map(item => item.productId.productName)
        .join(', ');
      throw new Error(
        `${outOfStockNames} are Out of Stock. Please remove to proceed.`
      );
    }

    const insufficientStockItems = cartItems.filter(
      item => item?.productId && typeof item.productId.stock === 'number' && item.quantity > item.productId.stock
    );

    if (insufficientStockItems.length > 0) {
      const itemDetails = insufficientStockItems.map(item =>
        `Only ${item.productId.stock} units of ${item.productId.productName} are available`
      ).join(', ');

      throw new Error(`Insufficient stock: ${itemDetails}. Please modify the quantities and try again.`);
    }
  }

  async function handlePayNow() {
    isPaying = true;

    if (!primaryAddress) {
      toast.error('Please select a delivery address');
      isPaying = false;
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      isPaying = false;
      return;
    }

    try {
      await validateStock();
      isDialogOpen = true;
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error(error.message || 'Failed to validate cart');
      isPaying = false;
    }
  }

  function updateQuantity(productId: string, change: number, stock: number) {
    const item = cartItems.find((item) => item.productId._id === productId);

    if (item) {
      let newQuantity;
      const minQuantity = item.selectedOffer?.offerType === 'Negotiate' && item.productId.negMOQ
        ? item.productId.negMOQ
        : 1;

      newQuantity = item.quantity + change;

      if (newQuantity < minQuantity) {
        toast.error(`Minimum order quantity for ${item.productId.productName} is ${minQuantity}.`);
        return;
      }

      if (newQuantity > stock) {
        toast.error(`Only ${stock} units of ${item.productId.productName} are available in stock. Please modify the quantity and proceed.`);
        return;
      }

      item.quantity = newQuantity;
      item.totalAmount = item.price * newQuantity;
      $updateQuantityMutation.mutate({ productId, quantity: newQuantity });
    }
  }

  function removeProduct(productId: string) {
    cartItems = cartItems.filter((item) => item.productId._id !== productId);
    $removeProductMutation.mutate(productId);
  }

  async function handleAddressClick() {
    await goto('/address-management', {
      state: { editAddressId: primaryAddress?._id }
    });
  }

  function handleUploadAndPlaceOrder() {
    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one payment receipt');
      return;
    }

    isUploading = true;
    $placeOrderMutation.mutate({
      addressId: primaryAddress?._id || '',
      paymentImages: selectedFiles
    });
  }
</script>

<div class="fixed bottom-4 right-4 z-50 max-w-md w-full space-y-2">
  {#each notifications as notification (notification._id)}
    <div class="bg-white shadow-lg rounded-lg p-4 border border-gray-200 transition-all duration-300">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold">{notification.title}</h3>
          <p class="text-sm text-gray-600">{notification.description}</p>
        </div>
        <button onclick={() => closeNotification(notification._id)} class="text-gray-400 hover:text-gray-600">
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      {#if notification.requiresResponse && !notification.response}
        <div class="mt-3 flex justify-end space-x-2">
          {#if notificationResponse.loading && notificationResponse.id === notification._id}
            <span class="text-sm text-gray-500">Processing...</span>
          {:else if notificationResponse.success && notificationResponse.id === notification._id}
            <span class="text-sm text-green-500">Response recorded</span>
          {:else if notificationResponse.error && notificationResponse.id === notification._id}
            <span class="text-sm text-red-500">Failed, try again</span>
          {:else}
            <button
              onclick={() => handleNotificationResponse(notification._id, 'yes')}
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Yes
            </button>
            <button
              onclick={() => handleNotificationResponse(notification._id, 'no')}
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              No
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

{#if isLoggedIn}
<div class="!flex !justify-center !items-center py-14">
  <div class="flex lg:flex-row flex-col lg:w-full md:w-[65%] w-full justify-between xl:px-12 lg:px-8 px-4 md:px-6 gap-5">
    <div class="border bg-white lg:hidden max-w-3xl flex justify-between rounded-lg shadow-lg p-3">
      <div>
        <h3 class="text-base text-[#4F585E] font-medium mb-3">Deliver To</h3>
        {#if isAddressesLoading}
          <div class="space-y-2">
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-3/4" />
          </div>
        {:else if $addressesQuery.error && !showShimmer}
          <p class="text-red-500 text-sm">Error fetching address: {$addressesQuery.error.message}</p>
        {:else if !primaryAddress && !showShimmer}
          <p class="text-gray-500 text-sm">No address available</p>
        {:else if primaryAddress}
          <p class="text-lg text-[#30363C] font-semibold mb-2">{primaryAddress.flatorHouseno}, {primaryAddress.area}, {primaryAddress.landmark}</p>
          <p class="text-base text-[#4F585E] mb-1.25">☎ {primaryAddress.receiverMobile} - {primaryAddress.receiverName}</p>
        {/if}
      </div>
      <button
        onclick={handleAddressClick}
        class="h-fit bg-custom-gradient text-white px-3 py-1.5 rounded-md cursor-pointer lg:text-lg text-base whitespace-nowrap font-medium"
      >
        {primaryAddress && !showShimmer ? 'Edit address' : 'Add address'}
      </button>
    </div>

    {#if showFlatOfferInfo}
      <div class="lg:hidden rounded-lg p-1 text-sm text-yellow-600">
        <Icon icon="mdi:information" class="w-5 h-5 inline mr-1" />
        {cartItems.find(item => item.productId.flat)?.productId?.productName} has a flat {cartItems.find(item => item.productId.flat)?.productId.flat}% discount.
        To avail Flat discount, Please add one more product from Flat Offer. <span class="text-blue-500 underline mx-1" onclick={()=>{goto("/offers")}}>Visit?</span>
      </div>
    {/if}

    <div class="cart-items max-w-3xl lg:hidden block bg-white rounded-lg shadow-lg p-2 h-fit border">
      {#if isCartLoading}
        <div class="space-y-4 py-4">
          {#each Array(3) as _}
            <div class="flex items-center py-3.5 border-b border-gray-300">
              <div style="width: 30%;" class="flex gap-4 items-center">
                <Skeleton class="w-12 h-12" />
                <Skeleton class="h-6 w-3/4" />
              </div>
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 7%;" class="h-6" />
            </div>
          {/each}
        </div>
      {:else if error && !showShimmer}
        <p class="text-center py-4 text-red-500">Error: {error}</p>
      {:else if cartItems.length === 0 && !showShimmer}
        <div class="flex flex-col items-center py-8">
          <Icon icon="mdi:cart-off" class="w-10 h-10 text-[#d8dee3]" />
          <p class="text-center text-lg text-[#b5bbc1] mt-4">Your cart is empty</p>
        </div>
      {:else}
        {#each cartItems as item}
          <div class="cart-item gap-5 relative grid grid-cols-3 items-center py-3.5 border-b border-gray-300">
            <div class="flex gap-4 col-span-2 items-center">
              <div class="w-20 h-20 relative rounded-lg mr-3.75 bg-[#F5F5F5] border-[#EDEDED]">
                <img
                  src={imgUrl + item.productId.images[0]}
                  alt="img"
                  class="p-3"
                />
                {#if item.productId.stock === 0}
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                    <span class="text-white text-sm font-bold text-center">Out of Stock</span>
                  </div>
                {/if}
              </div>
              <div class="item-details flex-1">
                <button
                  onclick={() => {
                    if(item.productId.stock!=0){
                      goto(`/Products/${item.productId._id}`)
                    }
                  }}
                  class={`font-bold text-lg mb-0.5 ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C] hover:underline hover:text-[#01A0E2]'}`}
                >
                  {item.productId.productName}
                </button>
                <p>
                  {#if item.productId?.discount}
                    <span class={`${item.productId.stock === 0 ? 'text-[#30363c6d]' : 'text-[#249B3E]'} line-through`}>
                      ₹{item.productId.price}
                    </span>
                    <span class='ml-2'>
                      ₹{item.price}
                    </span>
                  {:else}
                    <span class={`${item.productId.stock === 0 ? 'text-[#30363c6d]' : 'text-[#249B3E]'}`}>
                      ₹{item.productId.price}
                    </span>
                  {/if}
                </p>
                <p class="text-sm">
                  GST: {item.productId.gst}%
                </p>
              </div>
            </div>
            <div class={`item-total text-center font-semibold text-base ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C]'}`}>
              ₹{item.totalAmount.toFixed(2)}
              <div
                class={`quantity flex items-center justify-between border rounded-md
                  ${item.productId.stock === 0 ? 'bg-primary/10 border-[#30363c6d]' : 'bg-primary/10 border-primary'}
                `}
              >
                <button
                  onclick={() => updateQuantity(item.productId._id, -1, item.productId.stock)}
                  class={`w-7.5 h-7.5 pl-2 border-gray-300 text-base flex items-center justify-center
                    ${item.quantity <= (item.selectedOffer?.offerType === 'Negotiate' && item.productId.negMOQ ? item.productId.negMOQ : 1) || item.productId.stock === 0 ? 'text-[#30363c6d] cursor-not-allowed' : 'text-primary cursor-pointer'}
                  `}
                  disabled={$updateQuantityMutation.isPending || item.quantity <= (item.selectedOffer?.offerType === 'Negotiate' && item.productId.negMOQ ? item.productId.negMOQ : 1) || item.productId.stock === 0}
                >
                  -
                </button>
                <span
                  class={`w-7.5 text-center text-sm
                    ${item.productId.stock === 0 ? 'text-[#30363c6d]' : 'text-[#4F585E]'}
                  `}
                >
                  {item.quantity}
                </span>
                <button
                  onclick={() => updateQuantity(item.productId._id, 1, item.productId.stock)}
                  class={`w-7.5 h-7.5 pr-2 border-gray-300 text-base flex items-center justify-center
                    ${item.productId.stock === 0 ? 'text-[#30363c6d] cursor-not-allowed' : 'text-primary cursor-pointer'}
                  `}
                  disabled={$updateQuantityMutation.isPending || item.productId.stock === 0}
                >
                  +
                </button>
              </div>
            </div>
            <button
              onclick={() => removeProduct(item.productId._id)}
              class="text-red-500 cursor-pointer absolute top-0 right-0"
              disabled={$removeProductMutation.isPending}
            >
              <Icon icon="mdi:close-circle" class="w-5 h-5" />
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <div class="cart-items hidden lg:block bg-white rounded-lg shadow-lg p-2 lg:w-[75%] h-fit border">
      <div class="cart-header flex items-center justify-between text-sm py-2 text-[#475156] border border-gray-300 bg-[#F2F4F5]">
        <span style="width: 30%; text-align: center;">PRODUCT</span>
        <span style="width: 13%; text-align: center;">PRICE</span>
        <span style="width: 13%; text-align: center;">GST (%)</span>
        <span style="width: 13%; text-align: center;">OFFER</span>
        <span style="width: 13%; text-align: center;">TOTAL</span>
        <span style="width: 13%; text-align: center;">QUANTITY</span>
        <span style="width: 5%; text-align: center;"></span>
      </div>
      {#if isCartLoading}
        <div class="space-y-4 py-4">
          {#each Array(3) as _}
            <div class="flex items-center py-3.5 border-b border-gray-300">
              <div style="width: 30%;" class="flex gap-4 items-center">
                <Skeleton class="w-12 h-12" />
                <Skeleton class="h-6 w-3/4" />
              </div>
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 17%;" class="h-6" />
              <Skeleton style="width: 7%;" class="h-6" />
            </div>
          {/each}
        </div>
      {:else if error && !showShimmer}
        <p class="text-center py-4 text-red-500">Error: {error}</p>
      {:else if cartItems.length === 0 && !showShimmer}
        <div class="flex flex-col items-center py-8">
          <Icon icon="mdi:cart-off" class="w-10 h-10 text-[#d8dee3]" />
          <p class="text-center text-lg text-[#b5bbc1] mt-4">Your cart is empty</p>
        </div>
      {:else}
        {#each cartItems as item}
          <div class={`cart-item py-3.5 flex items-center border-b border-gray-300`}>
            <div style="width: 30%;" class="flex gap-4 items-center">
              <div class="w-20 h-20 rounded-lg mr-3.75 relative bg-[#F5F5F5] border-[#EDEDED]">
                <img
                  src={imgUrl + item.productId.images[0]}
                  alt="img"
                  class="p-3"
                />
                {#if item.productId.stock === 0}
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                    <span class="text-white text-center text-sm font-bold">Out of Stock</span>
                  </div>
                {/if}
              </div>
              <div class="item-details flex-1">
                <p
                  onclick={() => {
                    if(item.productId.stock!=0){
                      goto(`/Products/${item.productId._id}`)
                    }
                  }}
                  class={`cursor-pointer font-bold text-lg mb-0.5 ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C] hover:underline hover:scale-105'}`}
                >
                  {item.productId.productName}
                </p>
              </div>
            </div>
            <div style="width: 13%;" class={`item-price text-center font-semibold text-base ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C]'}`}>
              <span class="line-through pr-1">₹{item.productId.price}</span>
              <span class='text-green-600'>₹{item.price.toFixed(2)}</span>
            </div>
            <div style="width: 13%;" class={`item-price text-center font-semibold text-base ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C]'}`}>
              {item.productId.gst}%
            </div>
            <div
              style="width: 13%;"
              class={`item-offer text-center font-semibold text-base ${item.productId.stock === 0 ? 'text-[#30363c6d]' : 'text-[#30363C]'}`}
            >
              {#if (item.productId.discount)}
                {item.productId.discount}%
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </div>
            <div style="width: 13%;" class={`item-total text-center font-semibold text-base ${item.productId.stock===0?'text-[#30363c6d]':'text-[#30363C]'}`}>
              ₹{item.totalAmount.toFixed(2)}
            </div>
            <div
              style="width: 13%;"
              class={`quantity flex items-center justify-between border rounded-md
                ${item.productId.stock === 0 ? 'bg-[#e9e9eace] border-[#30363c6d]' : 'bg-[#F3FBFF] border-priimary'}
              `}
            >
              <button
                onclick={() => updateQuantity(item.productId._id, -1, item.productId.stock)}
                class={`w-7.5 h-7.5 pl-2 border-gray-300 text-base flex items-center justify-center
                  ${item.quantity <= (item.selectedOffer?.offerType === 'Negotiate' && item.productId.negMOQ ? item.productId.negMOQ : 1) || item.productId.stock === 0 ? 'text-[#30363c6d] cursor-not-allowed' : 'text-[#01A0E2] cursor-pointer'}
                `}
                disabled={$updateQuantityMutation.isPending || item.quantity <= (item.selectedOffer?.offerType === 'Negotiate' && item.productId.negMOQ ? item.productId.negMOQ : 1) || item.productId.stock === 0}
              >
                -
              </button>
              <span
                class={`w-7.5 text-center text-sm
                  ${item.productId.stock === 0 ? 'text-[#30363c6d]' : 'text-[#4F585E]'}
                `}
              >
                {item.quantity}
              </span>
              <button
                onclick={() => updateQuantity(item.productId._id, 1, item.productId.stock)}
                class={`w-7.5 h-7.5 pr-2 border-gray-300 text-base flex items-center justify-center
                  ${item.productId.stock === 0 ? 'text-[#30363c6d] cursor-not-allowed' : 'text-primary cursor-pointer'}
                `}
                disabled={$updateQuantityMutation.isPending || item.productId.stock === 0}
              >
                +
              </button>
            </div>
            <div style="width: 5%;" class="remove flex items-center justify-center">
              <button
                onclick={() => removeProduct(item.productId._id)}
                class="text-red-500 cursor-pointer"
                disabled={$removeProductMutation.isPending}
              >
                <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
              </button>
            </div>
          </div>
        {/each}
      {/if}

      {#if showFlatOfferInfo}
        <div class="rounded-lg p-1 text-sm text-yellow-600">
          <Icon icon="mdi:information" class="w-5 h-5 inline mr-1" />
          {cartItems.find(item => item.productId.flat)?.productId?.productName} has a flat {cartItems.find(item => item.productId.flat)?.productId.flat}% discount.
          To avail Flat discount, Please add one more product from Flat Offer. <span class="text-primary underline mx-1" onclick={()=>{goto("/offers")}}>Visit?</span>
        </div>
      {/if}
    </div>

    <div class="billing lg:w-[25%] md:max-w-2xl max-w-3xl">
      <div class="border hidden bg-white lg:flex justify-between rounded-lg shadow-lg p-3">
        <div>
          <h3 class="text-base text-[#4F585E] font-medium mb-2.5">Deliver To</h3>
          {#if isAddressesLoading}
            <div class="space-y-2">
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-3/4" />
            </div>
          {:else if $addressesQuery.error && !showShimmer}
            <p class="text-red-500 text-sm">Error fetching address: {$addressesQuery.error.message}</p>
          {:else if !primaryAddress && !showShimmer}
            <p class="text-gray-500 text-sm">No address available</p>
          {:else if primaryAddress}
            <p class="text-lg text-[#30363C] font-semibold mb-2">{primaryAddress.flatorHouseno}, {primaryAddress.area}, {primaryAddress.landmark}</p>
            <p class="text-base text-[#4F585E] mb-1.25">☎ {primaryAddress.receiverMobile} - {primaryAddress.receiverName}</p>
          {/if}
        </div>
        <button
          onclick={handleAddressClick}
          class="h-fit bg-custom-gradient text-white px-4 py-2 rounded-md cursor-pointer text-lg whitespace-nowrap font-medium"
        >
          {primaryAddress && !showShimmer ? 'Edit address' : 'Add address'}
        </button>
      </div>

      <div class="summary lg:mt-5 bg-white rounded-lg shadow-lg p-3 border">
        <h3 class="text-lg font-semibold text-[#4F585E] mb-2.5">Bill Summary</h3>
        {#if isCartLoading}
          <!-- Loading Skeleton -->
        {:else}
          <div class="flex justify-between mb-1 text-sm">
            <span class="text-[#30363C] font-semibold">Subtotal</span>
            <span class="text-gray-800">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div class="flex flex-col w-full items-end mb-2.5">
            <p onclick={toggleCoupon} class="text-sm text-primary hover:underline cursor-pointer">{isCouponVisible ? "Cancel" : 'Apply Coupon?'}</p>
            {#if isCouponVisible}
              <div class="relative w-full">
                <input
                  type="text"
                  bind:value={couponCode}
                  class="border-[#009bde] w-full border text-sm rounded-md p-1 pl-2 pr-20 placeholder:text-xs focus:ring-0 focus:outline-none"
                  placeholder="Enter Coupon Code"
                  disabled={couponDiscount > 0}
                />
                {#if couponCode.trim().length > 0}
                  <button
                    disabled={couponDiscount > 0 || isApplying}
                    onclick={() => {$cartQuery.refetch()}}
                    class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white text-primary text-sm px-2 py-0.5 rounded-md hover:bg-gray-100"
                  >
                    {#if isApplying}
                      <Icon icon="mdi:loading" class="w-5 h-5 animate-spin" />
                    {:else if couponDiscount > 0}
                      <span>Applied</span>
                    {:else}
                      <span>Apply Coupon</span>
                    {/if}
                  </button>
                {/if}
              </div>
              {#if couponError}
                <p class="text-red-500 text-xs mt-1">{couponError}</p>
              {/if}
            {/if}
          </div>
          {#if couponDiscount > 0}
            <div class="flex justify-between mb-1 text-sm">
              <span class="text-[#30363C] font-semibold">Coupon Discount</span>
              <span class="text-green-600">-₹{couponDiscount.toFixed(2)}</span>
            </div>
          {/if}
          <div class="flex justify-between mb-1 text-sm">
            <span class="text-[#30363C] font-semibold">CGST</span>
            <span class="text-gray-800">₹{formattedCgst}</span>
          </div>
          <div class="flex justify-between mb-1 text-sm">
            <span class="text-[#30363C] font-semibold">SGST</span>
            <span class="text-gray-800">₹{formattedSgst}</span>
          </div>
          <div class="flex justify-between mb-2.5 text-sm">
            <span class="text-[#30363C] font-semibold">Delivery Charge</span>
            <span class="free text-green-600">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div class="total flex justify-between font-bold text-base">
            <span class="text-[#30363C] font-bold">Total Amount</span>
            <span class="text-gray-800">₹{totalPrice.toFixed(2)}</span>
          </div>
          <div class="relative">
            <div 
              class="bg-custom-gradient cursor-pointer w-full mt-2 rounded-lg text-white p-1 font-bold text-center"
              onclick={handlePayNow}
            >
              {#if isPaying}
                Processing...
              {:else}
                PAY NOW
              {/if}
            </div>
          
            {#if isDialogOpen}
              <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div class="max-h-[90dvh] relative overflow-y-auto bg-white rounded-lg p-6 w-full max-w-md">
                  <div class="z-30 sticky top-0 right-0 flex justify-end w-full">
                    <div onclick={handleDialogCloseAttempt} class="bg-red-600 text-white p-1 rounded-lg">
                      <X />
                    </div>
                  </div>
                  
                  <div class="relative w-full rounded-lg overflow-hidden">
                    <p class="text-primary text-xl text-center">
                      Make Payment Using
                    </p>
                    <p class="text-center">
                      Scanner, Number & Bank account
                    </p>
                    <img src="/images/qr.jpeg" alt="">
                    <div class="flex items-center justify-center gap-2 mt-2">
                      <p class="text-lg">UPI ID: stains@okaxis</p>
                      <button
                        onclick={() => copyToClipboard('stains@okaxis', 'UPI ID')}
                        class="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Copy UPI ID"
                        title="Copy UPI ID"
                      >
                        <Copy class="w-4 h-4 text-primary hover:text-blue-500" />
                      </button>
                    </div>
                    <div class="flex items-center justify-center">
                      <div class="flex gap-4 items-center justify-center border border-gray-100 shadow rounded-lg w-fit mt-2 p-3">
                        <div class="flex items-center gap-2">
                          <p class="text-lg">1234567890</p>
                          <button
                            onclick={() => copyToClipboard('1234567890', 'Phone number')}
                            class="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Copy phone number 1234567890"
                            title="Copy phone number"
                          >
                            <Copy class="w-4 h-4 text-primary hover:text-blue-500" />
                          </button>
                        </div>
                        <div class="flex items-center gap-2">
                          <p class="text-lg">0987654321</p>
                          <button
                            onclick={() => copyToClipboard('0987654321', 'Phone number')}
                            class="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Copy phone number 0987654321"
                            title="Copy phone number"
                          >
                            <Copy class="w-4 h-4 text-primary hover:text-blue-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="pt-4 flex items-center justify-center flex-col gap-3">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onchange={handleFileChange}
                      class="hidden"
                      multiple
                    />
                    <Button 
                      onclick={triggerFileUpload}
                      class="w-full text-sm md:text-lg font-bold hover:text-white border-0 scale-95 text-white bg-custom-gradient transition-all duration-300"
                      disabled={isUploading}
                    >
                      {#if isUploading}
                        Uploading...
                      {:else}
                        Choose Files
                      {/if}
                    </Button>
                    {#if previewImages.length > 0}
                      <div class="flex flex-wrap gap-2 mt-2">
                        {#each previewImages as image, index}
                          <div class="relative">
                            {#if image.includes('application/pdf')}
                              <div class="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border">
                                <span class="text-xs">PDF</span>
                              </div>
                            {:else}
                              <img 
                                src={image} 
                                alt="Preview" 
                                class="w-16 h-16 object-cover rounded border"
                              />
                            {/if}
                            <button
                              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                              onclick={() => removePreview(index)}
                            >
                              <X class="w-3 h-3" />
                            </button>
                          </div>
                        {/each}
                      </div>
                    {/if}
                    <div>
                      <p class="text-primary">Supported Size: 100kb (JPEG, PNG, PDF)</p>
                    </div>
                    <Button 
                      onclick={handleUploadAndPlaceOrder}
                      class="w-full text-sm md:text-lg font-bold hover:text-white border-0 text-white bg-green-500 hover:bg-green-600 transition-all duration-300"
                      disabled={isUploading || selectedFiles.length === 0}
                    >
                      {#if $placeOrderMutation.isPending}
                        Placing Order...
                      {:else}
                        Place Order
                      {/if}
                    </Button>
                  </div>
                </div>
              </div>
            {/if}
          
            {#if isConfirmationDialogOpen}
              <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div class="max-w-sm bg-white rounded-lg p-6">
                  <div class="pb-4">
                    <h2 class="text-lg font-bold">Confirm Cancellation</h2>
                    <p>
                      Are you sure you want to cancel the payment?
                    </p>
                  </div>
                  <div class="pt-4 flex items-center justify-center flex-row gap-3">
                    <Button 
                      onclick={confirmCancel}
                      class="w-full text-sm font-bold border-0 hover:bg-red-600 text-white bg-red-600 hover:scale-105 transition-all duration-300"
                    >
                      Yes, Cancel
                    </Button>
                    <Button 
                      onclick={cancelConfirmation}
                      class="w-full text-sm font-bold border-0 hover:bg-primary text-white bg-custom-gradient hover:scale-105 transition-all duration-300"
                    >
                      No, Continue
                    </Button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
{:else}
<div class="container max-w-2xl my-20 py-20 rounded-lg shadow-lg flex-col gap-3 flex justify-center items-center">
  <p class="text-lg font-medium">Please login to access Cart</p>
  <button onclick={() => goto('/login')} class="bg-custom-gradient hover:scale-105 rounded-lg px-4 text-lg text-white py-2">Login</button>
</div>
{/if}

<Footer />

<style>
  .notification-enter {
    opacity: 0;
    transform: translateY(20px);
  }
  .notification-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.3s ease;
  }
  .notification-exit {
    opacity: 1;
  }
  .notification-exit-active {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  }
</style>