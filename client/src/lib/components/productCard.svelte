<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores'; // Import page store to access route
  import { imgUrl } from '$lib/config';
  import { _axios } from '$lib/_axios';
  import { toast } from 'svelte-sonner';
  import { writableGlobalStore } from '$lib/stores/global-store';
  import { queryClient } from '$lib/query-client';
  import { createMutation } from '@tanstack/svelte-query';

  // Props for the product card
  export let image: string;
  export let discount: number | null = null;
  export let name: string;
  export let available: boolean = true;
  export let MRP: number;
  export let unit: string ;
  // export let strikePrice: number;
  export let id: string | number;
  export let favorite: boolean = false;
  export let comboOffer: boolean = false;
  export let offerType: string | null = null;


  // Calculate savings
  // $: savings = strikePrice > MRP ? strikePrice - MRP : 0;

  // Compute card width class based on route for mobile screens
  $: cardWidthClass = $page.url.pathname === '/' ||
                    $page.url.pathname === '/offers' ||
                    ($page.url.pathname.startsWith('/Products/') &&
                     $page.url.pathname.split('/').length === 3)
                    ? 'w-48' : 'w-full';
  // Handle click to navigate to product details page or combo offer page
  function handleClick() {
    if (comboOffer) {
      goto(`/comboOffers/${id}`);
    } else {
      if (offerType === 'negotiation' || offerType === 'discount' || offerType === 'onMRP') {
        goto(`/Products/${id}?offerType=${offerType}`);
      } else {
        goto(`/Products/${id}`);
      }
    }
  }
  // console.log(unit)

  // Handle favorite toggle
  async function handleFavorite() {
    const token = localStorage.getItem('token');
    if (!$writableGlobalStore.isLogedIn) {
      toast.error('Please log in to add to favorites');
      goto('/login');
      return;
    }

    try {
      const response = await _axios.post(
        '/favorites/favorite',
        { productId: id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        favorite = !favorite;
        toast.success(response.data.message);
      queryClient.invalidateQueries(['wishCount']);

      } else {
        toast.error(response.data.message || 'Failed to toggle favorite');
      }
    } catch (error: any) {
      // console.error('Failed to toggle favorite:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        goto('/login');
      } else {
        toast.error(error.response?.data?.message || 'An error occurred while toggling favorite');
      }
    }
  }

  const addToCartMutation = createMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token || !$writableGlobalStore.isLogedIn) {
        throw new Error('Please log in to add to cart');
      }

      const response = await _axios.post(
        comboOffer ? '/cart/updateCombo' : '/cart/update',
        {
          products: [
            {
              productId: id,
              quantity: 1,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Product added to cart successfully!');
    },
    onError: (error: any) => {
      if (error.message === 'Please log in to add to cart') {
        toast.error(error.message);
        goto('/login');
      } else {
        toast.error(error.message || 'An error occurred while adding to cart');
      }
    },
  });

  // Handle add to cart
  function handleAddToCart() {
    $addToCartMutation.mutate();
  }

</script>

<div
  class="relative group bg-white border rounded-xl shadow-md overflow-hidden transition-transform duration-200 {cardWidthClass} md:w-56"
  style="cursor: pointer;"
  on:click={handleClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
  <!-- Discount Badge -->
  <!-- {#if discount}
    <div
      class="absolute top-0 right-0 bg-[#FA8232] text-white md:text-sm text-xs font-bizGothic font-medium rounded-full px-4 py-2"
    >
      {discount}% OFF
    </div>
  {/if} -->

  <!-- Product Image with Overlay and Icons -->
  <div class="relative md:h-48 h-40 flex justify-center items-center">
    <img
      class="object-cover max-h-full max-w-full"
      src={imgUrl + image}
      alt={name}
    />
    <!-- Overlay on hover -->
    {#if available}
      <div
        class="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-4"
      >
        <!-- Heart Icon -->
        <button
          class="bg-white h-10 w-10 flex justify-center items-center rounded-full transition-all hover:scale-110 duration-200"
          on:click|stopPropagation={handleFavorite}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {#if favorite}
            <img class="px-2.5" src="/svg/fav-filled.svg" alt="Favorited" />
          {:else}
            <img class="px-2.5" src="/svg/fav.svg" alt="Favorite" />
          {/if}
        </button>
        <!-- Cart Icon -->
        <button
          class="bg-white h-10 w-10 flex justify-center items-center rounded-full transition-all hover:scale-110 duration-200"
          on:click|stopPropagation={handleAddToCart}
          aria-label="Add to cart"
        >
          <img class="p-2" src="/svg/cart.svg" alt="Cart" />
        </button>
      </div>
      <!-- {:else}
      <div class="absolute">
        <p class="text-red-500 text-lg text-semibold  rounded-lg px-2">Out of Stock</p>
      </div> -->
    {/if}
  </div>

  <!-- Product Details -->
  <div class="md:px-4 px-2 py-2 border-t shadow-md">
    <!-- Product Name -->
    <h3
      class="font-medium md:text-base text-sm text-[#222222] py-1 capitalize overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {name}
    </h3>

    <!-- Price Section -->
    <div class="flex items-center gap-2 mt-1">
      <span class="text-[#565555] md:text-base font-medium text-sm">₹{Math.round(MRP - (MRP * (discount || 0) / 100))}</span> <span>/ {unit}</span>
      {#if discount}
        <span class="text-[#848484] md:text-sm text-xs line-through">₹{MRP}</span>
      {/if}
    </div>

    <!-- Savings Section -->
    <!-- {#if savings > 0}
      <div
        class="mt-1 py-2 border-t border-[#EDEDED] md:text-base text-sm text-[#249B3E]"
      >
        Save - ₹{savings}
      </div>
    {/if} -->
  </div>

  <!-- Out of Stock Overlay -->
  {#if !available}
    <div
      class="absolute inset-0 bg-black/30 flex justify-center items-center text-white text-lg font-medium"
    >
      Out of Stock
    </div>
  {/if}
</div>