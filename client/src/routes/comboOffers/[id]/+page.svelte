<script lang="ts">
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { imgUrl } from '$lib/config';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import ProductCard from '$lib/components/productCard.svelte';
  import { page } from '$app/stores';
  import Footer from '$lib/components/footer.svelte';
  import { onDestroy, onMount } from 'svelte';
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import Icon from '@iconify/svelte';
  import { writableGlobalStore } from '$lib/stores/global-store';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { queryClient } from '$lib/query-client';
  import { writable } from 'svelte/store';

  $: productId = $page.params.id;
  let isInitialLoad = true;
  
  // Create a local cart state to manage optimistic UI updates
  const localCartStore = writable({
      count: 0,
      quantity: 0
  });
  
  // Sync with actual data when available
  $: if($cartCountQuery.data?.count !== undefined) {
      localCartStore.update(state => ({...state, count: $cartCountQuery.data.count}));
  }
  
  $: cartCount = $writableGlobalStore.isLogedIn ? $localCartStore.count : 0;
  
  onMount(() => {
      setTimeout(() => {
          isInitialLoad = false;
      }, 500); // Short delay to ensure smooth transition
  });
  
  $: bundleListPrice = comboOffer?.productsIncluded.reduce((sum: number, item: { productId: { price: number; }; quantity: number; }) => {
      return sum + (item.productId.price * item.quantity);
  }, 0) || 0;
  
  $: {
      const foundItem = $cartQuery.data?.cart?.products.find(
          (item: { productId: { _id: string } }) => item.productId._id === productId
      );
      
      if (foundItem) {
          localCartStore.update(state => ({...state, quantity: foundItem.quantity}));
      }
  }
  
  $: cartQuantity = $localCartStore.quantity;
  $: dealPrice = comboOffer?.comboPrice || 0;
  $: youSave = bundleListPrice - dealPrice;
  $: savingsPercentage = bundleListPrice > 0 ? ((youSave / bundleListPrice) * 100).toFixed(0) : 0;
  
  interface ComboOffer {
    _id: string;
    comboName: string;
    productsIncluded: {
      productId: ProductDetails;
      quantity: number;
      _id: string;
    }[];
    comboPrice: number;
    comboDescription: string;
    strikePrice: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    image: string;
    isDeleted: boolean;
  }

  interface ProductDetails {
    favorite: boolean | undefined;
    _id: string;
    productName: string;
    price: number;
    images: string[];
    discount: number;
    strikePrice: number;
    negotiateLimit?: number;
    negotiate?: boolean;
    specifications?: {
      name: string;
      fields: Record<string, string>;
    }[];
  }

  const cartQuery = createQuery({
  queryKey: ['cart'],
  queryFn: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in.');
    }

    try {
      const response = await _axios.get('/cart', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to fetch cart');
    } catch (error) {
      throw error instanceof Error ? error : new Error('An unexpected error occurred');
    }
  },
  retry: 1,
  staleTime: 0,
  enabled: $writableGlobalStore.isLogedIn,
});

  const comboOfferQuery = createQuery<ComboOffer>({
    queryKey: ['comboOffer', productId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      try {
        const response = await _axios.get(`/offers/combo/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (!response.data.status && response.data.message === "No combo product found") {
          return {
            message: "No combo product found",
            status: false,
          };
        }

        if (response.data.status) {
          return response.data;
        }

        throw new Error(response.data.message || 'Failed to fetch product');
      } catch (error) {
        throw error instanceof Error ? error : new Error('An unexpected error occurred');
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: $writableGlobalStore.isLogedIn,
  });
  
  const cartCountQuery = createQuery({
    queryKey: ['cartCount'],
    queryFn: async () => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('No token found');
      }

      const response = await _axios.get('/cart/count', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.data.status && response.data.message !== "No active cart found") {
        throw new Error(response.data.message || 'Failed to fetch cart count');
      }

      return response.data;
    },
    retry: 1,
    staleTime: 0,
    enabled: $writableGlobalStore.isLogedIn,
  });

  $: comboOffer = $comboOfferQuery.data?.comboOffer;
  $: isLoading = $comboOfferQuery.isLoading;
  $: error = $comboOfferQuery.error;

  let selectedProductIndex = 0;
  
  $: selectedProduct = comboOffer?.productsIncluded[selectedProductIndex]?.productId;
  
  const addToCartMutation = createMutation({
      mutationFn: async (quantity: number) => {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
          if (!token || !$writableGlobalStore.isLogedIn) {
              throw new Error('Please log in to add to cart');
          }

          try {
              const response = await _axios.post(
                  '/cart/updateCombo',
                  {
                      products: [{
                          productId: productId,
                          quantity: quantity
                      }]
                  },
                  {
                      headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                      },
                  }
              );

              if (!response.data.status) {
                  throw new Error(response.data.message || 'Failed to update cart');
              }
              toast.success('Quantity updated successfully')
              return response.data;
          } catch (error) {
              console.error("Failed to update cart:", error);
              throw error;
          }
      },
      onMutate: (quantity) => {
          // Optimistically update the UI
          localCartStore.update(state => {
              // If going from 0 to 1, increase count by 1
              if (state.quantity === 0 && quantity > 0) {
                  return {
                      count: state.count + 1,
                      quantity: quantity
                  };
              }
              // If going from some quantity to 0, decrease count by 1
              else if (state.quantity > 0 && quantity === 0) {
                  return {
                      count: Math.max(0, state.count - 1),
                      quantity: 0
                  };
              }
              // Otherwise just update the quantity
              return {
                  ...state,
                  quantity: quantity
              };
          });
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['cart']);
          queryClient.invalidateQueries(['cartCount']);
      },
      onError: (error: any) => {
          // Revert optimistic update
          localCartStore.update(state => ({
              ...state,
              quantity: $cartQuery.data?.cart?.products.find(
                  (item: { productId: { _id: string } }) => item.productId._id === productId
              )?.quantity || 0
          }));
          
          if (error.message === 'Please log in to add to cart') {
              toast.error(error.message);
              window.location.href = '/login';
          } else {
              toast.error(error.message || 'An error occurred while updating cart');
          }
      },
  });
  
  function addToCart() {
      if (!comboOffer) return;
      $addToCartMutation.mutate(1);
  }

  function incrementQuantity() {
      $addToCartMutation.mutate(cartQuantity + 1);
  }

  function decrementQuantity() {
      $addToCartMutation.mutate(Math.max(0, cartQuantity - 1));
  }
</script>

<section class="bg-[#F2F4F5] py-4 px-4 md:px-6 lg:px-8">
<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/" class="text-[#4F585E] hover:text-[#01A0E2] text-base">Home</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/offers" class="text-[#01A0E2] text-base">Offers</Breadcrumb.Link>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>
</section>

<div class="min-h-screen bg-white p-6">
{#if isInitialLoad || isLoading}
  <!-- Full page skeleton loader -->
  <div class="flex gap-6">
    <div class="flex-1">
      <div class="flex gap-6">
        <Skeleton class="h-96 w-96 rounded-lg" />
        <div class="flex-1 space-y-4">
          <Skeleton class="h-6 w-48" />
          <Skeleton class="h-8 w-64" />
          <Skeleton class="h-6 w-32" />
          <Skeleton class="h-6 w-48" />
          <div class="flex gap-2">
            {#each Array(4) as _}
              <Skeleton class="h-10 w-10 rounded-full" />
            {/each}
          </div>
          <Skeleton class="h-6 w-32" />
          <Skeleton class="h-10 w-32" />
          <Skeleton class="h-10 w-32" />
        </div>
      </div>
    </div>
    <div class="hidden xl:flex flex-col gap-4">
      <Skeleton class="h-40 w-80" />
      <Skeleton class="h-40 w-80" />
    </div>
  </div>
{:else if error}
  <div class="text-red-500">Error loading combo product. Please try again later.</div>
{:else if comboOffer}
  <!-- Main Product Section -->
  <div class="flex gap-6">
    <!-- Product Image and Details -->
    <div class="flex-1">
      <div class="flex md:flex-row flex-col md:gap-12 gap-3">
        <div class="block md:hidden">
          <h1 class="text-xl font-bold text-[#30363C]">{comboOffer?.comboName}</h1>
        </div>
        
        <!-- Product Image -->
        <div class="flex md:flex-row flex-col gap-5">
          <!-- Main Image Container -->
          <div class="bg-[#F3F9FB] !max-h-[350px] !md:min-w-72 rounded-xl flex justify-center items-center shadow p-5 relative">
            <img
              src={imgUrl + comboOffer?.image}
              alt={comboOffer?.comboName}
              class="h-56 w-96 object-contain"
            />
          </div>
        </div>
    
        <!-- Product Details -->
        <div class="flex-1 flex flex-col">
          <div class="hidden md:block">
            <div class="flex xl:gap-4 gap-2 text-sm text-[#4F585E] mb-2">
              <!-- Dynamic brand and quantity info would go here -->
            </div>
            <p class="text-gray-800 text-lg">{comboOffer?.comboName}</p>
            <h1 class="text-3xl font-bold text-[#30363C]">
              {#each comboOffer?.productsIncluded as product, index}
                {product?.productId?.productName}{#if index < comboOffer.productsIncluded.length - 1}, <span> </span>{/if}
              {/each}
            </h1>
          </div>
          
          <div class="lg:flex justify-between hidden flex-wrap mt-4 mr-20">
            <div>
              <p class="md:text-lg text-base text-[#4F585E] mt-2">M.R.P <span class="line-through">₹{comboOffer.strikePrice}</span></p>
              <p class={`text-[#111827] font-bold md:text-2xl text-lg`}>₹{comboOffer.comboPrice}</p>
            </div>
            
            <div class="mt-4 self-end">
              {#if cartQuantity > 0}
                <div class="flex items-center rounded-lg gap-2 bg-[#F3FBFF] border-[#0EA5E9] border">
                  <button
                    on:click={decrementQuantity}
                    class="w-14 h-10 text-3xl flex items-center justify-center text-[#01A0E2]"
                    disabled={$addToCartMutation.isPending}
                  >
                    -
                  </button>
                  <span class="text-lg">{cartQuantity}</span>
                  <button
                    on:click={incrementQuantity}
                    class="w-14 h-10 text-2xl flex items-center justify-center text-[#01A0E2]"
                    disabled={$addToCartMutation.isPending}
                  >
                    +
                  </button>
                </div>
              {:else}
                <button
                  class="bg-[#01A0E2] text-xl text-white px-6 py-3 rounded-lg hover:scale-105 transition-all"
                  on:click={() => $addToCartMutation.mutate(1)}
                  disabled={$addToCartMutation.isPending}
                >
                  {#if $addToCartMutation.isPending}
                    Adding...
                  {:else}
                    Add to cart
                  {/if}
                </button>
              {/if}
            </div>
          </div>

          <div class="flex justify-between lg:hidden flex-wrap">
            <div>
              <p class="md:text-lg text-base text-[#4F585E] mt-2">M.R.P <span class="line-through">₹{comboOffer.strikePrice}</span></p>
              <p class={`text-[#111827] font-bold md:text-2xl text-lg`}>₹{comboOffer.comboPrice}</p>
            </div>
            <div class="mt-4 self-end">
              {#if cartQuantity > 0}
                <div class="flex items-center rounded-lg gap-2 bg-[#F3FBFF] border-[#0EA5E9] border">
                  <button
                    on:click={decrementQuantity}
                    class="w-14 h-10 text-3xl flex items-center justify-center text-[#01A0E2]"
                    disabled={$addToCartMutation.isPending}
                  >
                    -
                  </button>
                  <span class="text-lg">{cartQuantity}</span>
                  <button
                    on:click={incrementQuantity}
                    class="w-14 h-10 text-2xl flex items-center justify-center text-[#01A0E2]"
                    disabled={$addToCartMutation.isPending}
                  >
                    +
                  </button>
                </div>
              {:else}
                <button
                  class="bg-[#01A0E2] text-xl text-white px-6 py-3 rounded-lg hover:scale-105 transition-all"
                  on:click={addToCart}
                  disabled={$addToCartMutation.isPending}
                >
                  {#if $addToCartMutation.isPending}
                    Adding...
                  {:else}
                    Add to cart
                  {/if}
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Summary -->
    <div class="max-w-lg bg-white p-6 rounded-lg shadow-md border h-fit">
      <h2 class="text-lg font-bold text-[#30363C] mb-4">Please add item(s) to proceed</h2>
      <button 
        on:click={() => { if(cartCount > 0) { goto('/cart'); } }}
        class={`w-full ${cartCount > 0 ? 'bg-[#01A0E2] cursor-pointer' : 'bg-gray-400 cursor-not-allowed'} text-white py-3 rounded-lg`}
      >
        Go to cart ({cartCount})
      </button>
    </div>
  </div>

  <div class="mt-8 bg-white">
    {#if comboOffer}
      <h1 class="py-4 text-2xl font-bold">
        This combo pack contains <span>{comboOffer.productsIncluded.length}</span> items
      </h1>
      <div class="w-fit grid gap-2 pb-8 text-sm text-[#4F585E]" style="grid-template-columns: auto auto;">
        <div class="text-right font-semibold">Bundle List Price:</div>
        <div class="text-[#30363C] line-through">₹{bundleListPrice.toFixed(2)}</div>
      
        <div class="text-right font-semibold">Deal Price:</div>
        <div class="text-[#01A0E2] font-bold text-base">₹{dealPrice.toFixed(2)}</div>
      
        <div class="text-right font-semibold">You Save:</div>
        <div>
          ₹{youSave.toFixed(2)} ({savingsPercentage}% less than buying separately)
        </div>
      </div>
      
      <div class="rounded-lg">
        <div>
          <!-- Product Tabs -->
          <div class="flex border-b bg-[#F5F5F5] rounded-lg border-gray-200">
            {#each comboOffer.productsIncluded as product, index}
              <button
                class={`px-6 py-3 font-semibold text-lg focus:outline-none ${selectedProductIndex === index 
                  ? 'border border-[#0EA5E9] text-[#0EA5E9] rounded-lg bg-[#F3FBFF]' 
                  : 'text-[#4B5563] hover:text-[#0EA5E9]'}`}
                on:click={() => selectedProductIndex = index}
              >
                {product.productId.productName}
              </button>
            {/each}
          </div>
        
          <!-- Product Details Section -->
          <div class="flex flex-col md:flex-row gap-8 mt-6">
            <!-- Product Image -->
            <div class="md:w-1/4">
              <div class="rounded-xl flex justify-center items-center p-5">
                <img
                  src={imgUrl + (selectedProduct?.images?.[0] || '')}
                  alt={selectedProduct?.productName || 'Product Image'}
                  class="h-64 w-64 object-contain"
                />
              </div>
            </div>
        
            <!-- Specifications -->
            <div class="md:w-1/2">
              <!-- Price Details -->
              <div class="mt-4">
                <h2 class="text-3xl font-semibold">{selectedProduct?.productName}</h2>
                <div class="flex items-center gap-2 mt-2">
                  <p class="text-lg font-bold">₹{selectedProduct?.price}</p>
                </div>
              </div>
              
              {#if selectedProduct?.specifications?.length > 0}
                <div class="mt-5 space-y-4">
                  {#each selectedProduct.specifications as spec}
                    <div class="space-y-2">
                      <span class="font-semibold text-lg text-[#4B5563] pb-2">{spec.name}</span>
                      {#each Object.entries(spec.fields) as [key, value]}
                        {#if value && value !== ''}
                          <div class="flex">
                            <span class="text-[#4F585E] w-40">{key}</span>
                            <span class="text-[#4F585E] mx-2">:</span>
                            <span class="text-[#30363C]">{value}</span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-gray-500">No specifications available for this product.</p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
</div>  
<Footer />