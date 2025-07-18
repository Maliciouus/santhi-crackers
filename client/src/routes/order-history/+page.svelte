<script lang="ts">
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { toast } from 'svelte-sonner';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import Icon from '@iconify/svelte';
  import { imgUrl } from '$lib/config';
  import Footer from '$lib/components/footer.svelte';
  import { goto } from '$app/navigation';
  import { writableGlobalStore } from '$lib/stores/global-store';
  import { queryClient } from '$lib/query-client';

  interface Address {
    _id: string;
    flatorHouseno: string;
    area: string;
    landmark: string;
  }

  interface Product {
    _id: string;
    productId?: {
      size: any;
      brand: {
        _id: string;
        name: string;
      };
      _id: string;
      productName: string;
      price: number;
      images: string[];
    };
    quantity: number;
    totalAmount: number;
    customSuggestion: string;
    options?: Array<{
      title: string;
      value: string;
      _id: string;
    }>;
    selectedOffer?: {
      offerType: string;
      discount?: number;
      flatAmount?: number;
      negotiate?: {
        negotiatedPrice: number;
        attempts: Array<{
          amount: number;
          attemptNumber: number;
          _id: string;
        }>;
        _id: string;
      };
      _id: string;
    };
  }

  interface Order {
    _id: string;
    orderId: string;
    products: Product[];
    addressId: Address;
    store: string;
    deliveryAgent: string | null;
    preparationTime: number;
    mapPloygonResponse: string;
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
    orders: Order[];
  }

  let isDialogOpen = false;
  let dialogElement: HTMLDivElement | null = null;
  const orderToCancel = {
    _id: '',
    orderId: '',
    status: ''
  };
  let isLoggedIn = $writableGlobalStore.isLogedIn;

  const ordersQuery = createQuery<OrderResponse>({
    queryKey: ['orders'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      try {
        const response = await _axios.get('/orders/orderhistory', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (!response.data.status) {
          throw new Error(response.data.message || 'Failed to fetch orders');
        }
        return response.data;
      } catch (error) {
        throw error instanceof Error ? error : new Error('An unexpected error occurred');
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: true,
  });

  let activeTab = 'not yet shipped';
  let showDialog = false;
  let selectedOrderId = '';
  let selectedProductId = '';

  $: filteredOrders = $ordersQuery.data?.orders.filter(order => {
    if (activeTab === 'not yet shipped' && order.status === 'pending') return true;
    if (activeTab === 'not yet shipped' && order.status === 'accepted') return true;
    if (activeTab === 'not yet shipped' && order.status === 'ready for delivery') return true;
    if (activeTab === 'cancelled' && order.status === 'cancelled') return true;
    if (activeTab === 'cancelled' && order.status === 'rejected') return true;
    if (activeTab === 'delivered' && order.status === 'delivered') return true;
    return false;
  }) || [];

  const cancelOrderMutation = createMutation({
    mutationFn: async (orderId) => {
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
      $ordersQuery.refetch();
      orderToCancel.status = '';
      orderToCancel._id = '';
      orderToCancel.orderId = '';
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.');
      orderToCancel.status = '';
      orderToCancel._id = '';
      orderToCancel.orderId = '';
    },
  });

  const handleCancelOrder = async (orderId: any, status: any) => {
    try {
      if (!$ordersQuery.data?.orders) {
        toast.error('Order details not available');
        return;
      }

      const orderStatus = status;

      if (orderStatus !== 'pending' && orderStatus !== 'accepted') {
        toast.error('This order cannot be cancelled.');
        return;
      } else {
        $cancelOrderMutation.mutate(orderId);
        isDialogOpen = false;
      }
    } catch (error) {
      toast.error('Failed to cancel order. Please try again.');
    }
  };

  const reorderMutation = createMutation({
    mutationFn: async ({ products }: { products: any[] }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await _axios.post(
        '/cart/reorder',
        { products },
        {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to reorder products');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Products reordered successfully!');
      //@ts-ignore
      queryClient.invalidateQueries(['cart']);
      //@ts-ignore
      queryClient.invalidateQueries(['cartCount']);
      goto('/cart');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder products');
    },
  });

  const handleReorder = async (orderId: string) => {
    try {
      const order = $ordersQuery.data?.orders.find(o => o._id === orderId);
      if (!order) {
        toast.error('Order details not available');
        return;
      }

      const productsToReorder = order.products.map(product => ({
        productId: product.productId?._id,
        quantity: product.quantity,
        options: product.options || [],
      }));

      const hasSelectedOffer = productsToReorder.some(product => product.selectedOffer !== null);

      if (hasSelectedOffer) {
        selectedOrderId = orderId;
        selectedProductId = productsToReorder.find(product => product.selectedOffer !== null)?.productId;
        showDialog = true;
      } else {
        $reorderMutation.mutate({ products: productsToReorder });
      }
    } catch (error) {
      toast.error('Failed to reorder. Please try again.');
    }
  };

  const handleDialogAction = (action: string) => {
    if (action === 'revisit') {
      goto(`/Products/${selectedProductId}`);
    } else if (action === 'reorder') {
      const order = $ordersQuery.data?.orders.find(o => o._id === selectedOrderId);
      if (order) {
        const productsToReorder = order.products.map(product => ({
          productId: product.productId?._id,
          quantity: product.quantity,
          options: product.options || [],
          selectedOffer: product.selectedOffer?.offerType === 'Flat' ? product.selectedOffer : null,
        }));
        $reorderMutation.mutate({ products: productsToReorder });
      }
    }
    showDialog = false;
  };
</script>

{#if isLoggedIn}
<div class="xl:max-w-[75%] 2xl:max-w-[60%] lg:max-w-[85%] md:max-w-[75%] bg-white mx-auto p-4 pb-20">
  <div class="fixed bg-white w-full pt-5 -mt-4">
    <h2 class="lg:text-3xl md:text-2xl text-xl font-bold text-[#30363C] mb-4">Your Orders</h2>

    <!-- Tab Navigation -->
    <div class="flex space-x-4 mb-4">
      <button
        class="px-4 py-2 lg:text-xl text-lg font-medium {activeTab === 'not yet shipped' ? 'border-b-2 border-primary text-primary' : 'text-[#4F585E] hover:text-gray-700'}"
        onclick={() => (activeTab = 'not yet shipped')}
      >
        Not yet Shipped
      </button>
      <button
        class="px-4 py-2 lg:text-xl text-lg font-medium {activeTab === 'cancelled' ? 'border-b-2 border-primary text-primary' : 'text-[#4F585E] hover:text-gray-700'}"
        onclick={() => (activeTab = 'cancelled')}
      >
        Cancelled
      </button>
      <button
        class="px-4 py-2 lg:text-xl text-lg font-medium {activeTab === 'delivered' ? 'border-b-2 border-primary text-primary' : 'text-[#4F585E] hover:text-gray-700'}"
        onclick={() => (activeTab = 'delivered')}
      >
        Order Delivered
      </button>
    </div>
  </div>

  <!-- Order List -->
  <div class="mt-32">
    {#if $ordersQuery.isLoading}
      <Skeleton class="w-full h-24" />
    {:else if $ordersQuery.error}
      <p class="text-red-500">Error: {$ordersQuery.error.message}</p>
    {:else if filteredOrders.length === 0}
      <p class="text-gray-500">No orders found in this category</p>
    {:else}
      <div class="lg:space-y-4 space-y-6">
        {#each filteredOrders as order}
          <div onclick={() => { goto(`/order-history/${order._id}`) }} class="border rounded-lg bg-white shadow-md">
            <!-- Order Details -->
            <div class="flex space-x-3 justify-between p-4 bg-[#F2F4F5]">
              <div>
                <p class="text-lg text-[#4F585E]">Order Placed</p>
                <p class="font-semibold text-[#30363C] text-base">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <!-- <div>
                <p class="text-lg text-[#4F585E]">Order Delivered</p>
                <p class="font-semibold text-[#30363C] text-base">{order.deliveryTime ? new Date(order.deliveryTime).toLocaleDateString() : '-'}</p>
              </div> -->
              <div class="lg:block hidden max-w-xs">
                <p class="text-lg text-[#4F585E]">Ship To</p>
                <p class="font-semibold text-[#30363C] text-base truncate">
                  {order.addressId?.flatorHouseno}, {order.addressId?.area}
                </p>
              </div>
              <div class="lg:block hidden">
                <p class="text-lg text-[#4F585E]">Total Amount</p>
                <p class="font-semibold text-[#30363C] text-base">₹{order.totalPrice.toFixed(2)}</p>
              </div>
              <div class="lg:block hidden">
                <p class="text-lg text-[#4F585E]">Order Id</p>
                <p class="font-semibold text-[#30363C] text-base">#{order.orderId}</p>
              </div>
              <div class="lg:flex items-center hidden">
                {#if order.status === 'pending' || order.status === 'accepted'}
                  <button
                    class="text-[#FF080C] lg:text-lg text-base font-medium rounded-md"
                    onclick={(e) => {
                      e.stopPropagation();
                      orderToCancel._id = order._id;
                      orderToCancel.status = order.status;
                      orderToCancel.orderId = order.orderId;
                      isDialogOpen = true;
                    }}
                  >
                    Cancel Order
                  </button>
                {:else if order.status !== 'cancelled' && order.status !== 'rejected'}
                  <button
                    class="text-primary lg:text-xl md:text-lg text-base font-medium rounded-md"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleReorder(order._id);
                    }}
                  >
                    Reorder
                  </button>
                {/if}
              </div>
              <div class="flex flex-col items-end lg:hidden">
                <p class="font-semibold text-[#30363C] text-base">₹{order.totalPrice.toFixed(2)}</p>
                {#if order.status === 'pending' || order.status === 'accepted'}
                  <button
                    class="text-[#FF080C] lg:text-lg text-base font-medium rounded-md"
                    onclick={(e) => {
                      e.stopPropagation();
                      orderToCancel._id = order._id;
                      orderToCancel.status = order.status;
                      orderToCancel.orderId = order.orderId;
                      isDialogOpen = true;
                    }}
                  >
                    Cancel Order
                  </button>
                {:else if order.status !== 'cancelled' && order.status !== 'rejected'}
                  <button
                    class="text-primary lg:text-xl md:text-lg text-base font-medium rounded-md"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleReorder(order._id);
                    }}
                  >
                    Reorder
                  </button>
                {/if}
              </div>
            </div>

            <div class="lg:hidden flex px-4 py-2 justify-between">
              <div class="block lg:hidden">
                <p class="text-base">
                  <span class="text-[#4F585E]">Ship To: </span>
                  <p class="font-semibold text-[#30363C] text-base truncate">
                    {order.addressId?.flatorHouseno}, {order.addressId?.area}
                  </p>
              </div>
              <p class="font-semibold text-[#30363C] text-base">#{order.orderId}</p>
            </div>

            <!-- Product List -->
            {#each order.products as product}
              <div class="flex items-center space-x-4 py-2 p-4 lg:border-t border-b">
                <div class="bg-[#F5F5F5] border-[#EDEDED] border rounded-lg">
                  {#if product.productId?.images?.[0]}
                    <img
                      src={imgUrl + product.productId.images[0]}
                      alt={product.productId?.productName || 'Product Image'}
                      class="w-20 h-16 object-contain rounded px-2 py-1"
                    />
                  {:else}
                    <img
                      src="placeholder.png"
                      alt="Product"
                      class="w-20 h-16 object-contain rounded px-2 py-1"
                    />
                  {/if}
                </div>
                <div class="flex-1">
                  <p class="lg:text-xl text-lg font-semibold text-[#30363C]">{product.productId?.productName || 'Product Name'}</p>
                  <div class="flex flex-wrap gap-4 mt-2">
                    <p class="text-sm text-gray-500">
                      <span class="text-primary">BRAND:</span> {product.productId?.brand?.name || 'N/A'}
                    </p>
                    {#if product.options && product.options.length > 0}
                      {#each product.options as option}
                        <p class="text-sm text-gray-500">
                          <span class="text-primary">{option.title.toUpperCase()}:</span> {option.value}
                        </p>
                      {/each}
                    {/if}
                    <p class="text-sm text-gray-500">
                      <span class="text-primary">QUANTITY:</span> {product.quantity}
                    </p>
                    <p class="text-sm text-gray-500">
                      <span class="text-primary">AMOUNT:</span> ₹{product.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button class="text-primary lg:block hidden text-lg hover:underline">Buy Again</button>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
{:else}
<div class="container max-w-2xl my-20 py-20 rounded-lg shadow-lg flex-col gap-3 flex justify-center items-center">
  <p class="text-lg font-medium">Please login to access Order History</p>
  <button onclick={() => { goto('/login') }} class="bg-primary hover:bg-primary rounded-lg px-4 text-lg text-white py-2">Login</button>
</div>
{/if}

<!-- Dialog for revisiting offer -->
{#if showDialog}
<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
  <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
    <h2 class="text-xl font-bold mb-4">Do you need to revisit the product to avail offers?</h2>
    <div class="flex justify-end space-x-4">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded-md"
        onclick={() => handleDialogAction('revisit')}
      >
        Yes, Revisit
      </button>
      <button
        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
        onclick={() => handleDialogAction('reorder')}
      >
        No, Reorder
      </button>
    </div>
  </div>
</div>
{/if}

{#if isDialogOpen}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 transition-all duration-300">
  <div
    class="bg-white rounded-lg flex gap-3 flex-col items-center shadow-lg p-6 w-full max-w-md max-h-[60vh] overflow-y-auto scrollbar-hide"
    role="dialog"
    aria-label="Add user form"
    bind:this={dialogElement}
  >
    <p>Are you sure you need to cancel the order ({orderToCancel.orderId})?</p>
    <div class="flex justify-center gap-5 items-center">
      <button onclick={() => handleCancelOrder(orderToCancel._id, orderToCancel.status)} class="px-3 py-2 shadow-sm bg-primary text-white rounded-lg font-medium">Confirm</button>
      <button onclick={() => { isDialogOpen = false; orderToCancel.status = ''; orderToCancel._id = ''; }} class="px-3 py-2 shadow-sm bg-red-600 border text-white rounded-lg font-medium">Decline</button>
    </div>
  </div>
</div>
{/if}

<Footer />
