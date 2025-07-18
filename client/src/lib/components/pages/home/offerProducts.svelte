<script lang="ts">
  import axios from 'axios';
  import { createQuery } from '@tanstack/svelte-query';
  import ProductCard from '$lib/components/productCard.svelte';
  import { _axios } from '$lib/_axios';
  import { imgUrl } from '$lib/config';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { goto } from '$app/navigation';
  import { writableGlobalStore } from '$lib/stores/global-store';
  import Icon from '@iconify/svelte';

  interface Product {
    id: string | number;
    name: string;
    image: string;
    discount: number;
    MRP: number;
    strikePrice: number;
    available: boolean;
    description?: string;
    ratings?: number;
    categoryId?: string;
    categoryName?: string;
    favorite?: boolean;
  }

  interface ComboOffer {
    _id: string;
    comboName: string;
    image: string;
    comboPrice: number;
    strikePrice: number;
    active: boolean;
  }

  $: isLoggedIn = $writableGlobalStore.isLogedIn;

  const productsQuery = createQuery<Product[]>({
    queryKey: ['ComboOffers'],
    queryFn: async () => {
      const userId = isLoggedIn ? localStorage.getItem('_id') : null;
      const response = await _axios.get('/offers/combo', {
        params: {
          limit: 7,
          page: 1,
          userId
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to fetch products');
      }

      const groupedProducts = response.data.data;
      const allProducts = groupedProducts.flatMap((category: any) =>
        category.products.map((product: any) => ({
          id: product._id,
          name: product.productName,
          image: product.images,
          discount: product.discount || 0,
          MRP: product.price,
          strikePrice: product.strikePrice || product.price,
          description: product.description,
          ratings: product.ratings,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          favorite: product.favorite,
          available: product.available,
        }))
      );

      return allProducts;
    },
  });

  const comboOffersQuery = createQuery<{
    comboOffers: ComboOffer[];
    total: number;
    status: boolean;
  }>({
    queryKey: ['comboOffers'],
    queryFn: async () => {
      const response = await _axios.get('/offers/combo', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });

      const { data } = response;

      if (!data || typeof data !== 'object' || !('status' in data)) {
        throw new Error('Invalid response from server');
      }

      if (!data.status) {
        throw new Error(data.message || 'Failed to fetch combo offers');
      }

      return data;
    },
    refetchOnWindowFocus: false,
    enabled: typeof window !== 'undefined',
  });

  $: products = $productsQuery.data ?? [];
  $: productsLoading = $productsQuery.isLoading;
  $: productsError = $productsQuery.error ? ($productsQuery.error as Error).message : null;

  $: comboOffers = $comboOffersQuery.data?.comboOffers ?? [];
  $: comboOffersLoading = $comboOffersQuery.isLoading;
  $: comboOffersError = $comboOffersQuery.error ? ($comboOffersQuery.error as Error).message : null;
</script>

{#if comboOffers.length > 0}
  <section class="px-2 md:px-6 lg:px-8 py-10">
    <div class="lg:mb-8 mb-2">
      <h2 class="lg:text-3xl text-lg font-bold text-[#30363C] mb-6 text-left">Combo Offers</h2>
      <div class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
        <div class="flex gap-2 md:gap-4 lg:gap-6">
          {#if comboOffersLoading}
            {#each Array(3) as _}
              <div class="min-w-[160px] md:min-w-[200px]">
                <Skeleton class="w-full h-[250px] rounded-lg" />
              </div>
            {/each}
          {:else if comboOffersError}
            <div class="text-center w-full text-red-500">
              Error loading combo offers: {comboOffersError}
            </div>
          {:else}
            {#each comboOffers as comboOffer (comboOffer._id)}
              <div class="snap-start min-w-[160px] md:min-w-[200px]">
                <ProductCard
                  id={comboOffer._id}
                  image={comboOffer.image}
                  name={comboOffer.comboName}
                  MRP={comboOffer.comboPrice}
                  strikePrice={comboOffer.strikePrice}
                  comboOffer={true}
                />
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </section>
{/if}

<style>
  /* Fallback for scrollbar-hide */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>