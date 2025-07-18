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
    unit: string;
    id: string | number;
    name: string;
    image: string[];
    MRP: number;
    available: boolean;
    description?: string;
    discount?: number;
    ratings?: number;
    categoryId?: string;
    categoryName?: string;
    favorite?: boolean;
  }

  $: isLoggedIn = $writableGlobalStore.isLogedIn;

  const productsQuery = createQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const userId = isLoggedIn ? localStorage.getItem('_id') : null;
      const response = await _axios.get('/products/', {
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

      // console.log('API Response:', response.data.data);

      const allProducts = response.data.data.map((product: any) => {
        // console.log('Raw product from API:', product);
        // console.log('Mapping product unit:', product.unit);
        // console.log('Unit type:', typeof product.unit);
        const mappedProduct = {
          id: product._id,
          name: product.productName,
          image: product.images,
          discount: product.discount || 0,
          MRP: product.price,
          unit: product.unit,
          description: product.description,
          ratings: product.ratings,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          favorite: product.favorite,
          available: product.available,
        };
        // console.log('Mapped product unit:', mappedProduct.unit);
        return mappedProduct;
      });

      // console.log('Mapped products:', allProducts);
      return allProducts;
    },
  });

  $: products = $productsQuery.data ?? [];
  $: productsLoading = $productsQuery.isLoading;
  $: productsError = $productsQuery.error ? ($productsQuery.error as Error).message : null;

  // Debug reactive statement
  // $: {
  //   console.log('Products in component:', products);
  //   products.forEach((product, index) => {
  //     console.log(`Product ${index} unit:`, product.unit);
  //     console.log(`Product ${index} full object:`, product);
  //   });
  // }
</script>

<section class="pl-4 md:px-6 lg:px-8 py-10">
  <div class="mt-10">
    <div class="flex items-start gap-4">
      <img src="/svg/firework1.svg" alt="">
      <h2 class="lg:text-4xl text-2xl font-bold text-primary mb-6 text-left">Our Products</h2>
      <img class="scale-x-[-1]" src="/svg/firework1.svg" alt="">
    </div>
    {#if productsLoading || productsError}
      <!-- Skeleton Loader for Product Cards -->
      <div class="flex gap-6 overflow-x-auto">
        {#each Array(4) as _}
          <div class="flex-shrink-0 w-64 bg-white rounded-xl shadow-md overflow-hidden">
            <!-- Image Skeleton -->
            <Skeleton class="h-48 w-full" />
            <!-- Content Skeleton -->
            <div class="px-4 py-2 space-y-2">
              <Skeleton class="h-5 w-3/4" />
              <div class="flex items-center gap-2">
                <Skeleton class="h-4 w-12" />
                <Skeleton class="h-4 w-12" />
              </div>
              <Skeleton class="h-4 w-20" />
            </div>
          </div>
        {/each}
      </div>
    {:else if products.length === 0}
      <p class="text-center text-gray-500 mt-10">No products found</p>
    {:else}
      <div class="flex flex-col justify-center items-center md:pt-10">
        <div class="flex md:gap-6 items-center flex-wrap gap-4 py-1 px-1 scrollbar-hide">
          {#each products as product (product.id)}
            <div class="flex-wrap">
           
              <ProductCard
                id={product.id}
                image={product.image[0]}
                discount={product.discount}
                name={product.name}
                MRP={product.MRP}
                unit={product?.unit}
                favorite={product.favorite}
                available={product.available}
              />
            </div>
          {/each}
        </div>
        <button
          on:click={() => goto('/Products')}
          class="flex items-center justify-center gap-2 px-6 py-2 mt-10 mb-20 rounded-xl text-red-700 font-medium shadow-[0_4px_0px_0px_#b30000] bg-gradient-to-r from-[#fbe6c2] to-[#f7c079] transition hover:scale-[1.02]"
        >
          View All
          <Icon icon="mdi:arrow-right-thin" class="text-red-700 text-xl" />
        </button>
      </div>
    {/if}
  </div>
</section>
