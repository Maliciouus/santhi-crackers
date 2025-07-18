<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { imgUrl } from '$lib/config';
  import Icon from '@iconify/svelte';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";

  // Define the type for a brand
  interface Brand {
    name: string;
    image: string;
  }
  interface Store {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    storeDescription: string;
    storeImage?: string;
  }
  // Define the type for a category
  interface Category {
    _id: any;
    name: string;
  }

  // Define the type for the brand API response
  interface BrandResponse {
    brands: Brand[];
    status: boolean;
    total: number;
    message: string;
  }

  // Define the type for the category API response
  interface CategoryResponse {
    categories: Category[];
    status: string;
    showMessage: string;
  }

  // Fetch brands using Svelte Query
  const brandsQuery = createQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const response = await _axios.get('/brand/all', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Brands API Response:', response.data);
        const data: BrandResponse = response.data;
        if (!data.status) {
          throw new Error(data.message || 'Failed to fetch brands');
        }
        return data.brands;
      } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: true,
  });

  // Fetch categories using Svelte Query
  const categoryQuery = createQuery<Category[]>({
    queryKey: ['category'],
    queryFn: async () => {
      try {
        const response = await _axios.get('/categories/all?limit=5', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Categories API Response:', response.data);
        const data: CategoryResponse = response.data;
        if (data.status !== 'success') {
          throw new Error(data.showMessage || 'Failed to fetch categories');
        }
        return data.categories;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: true,
  });
  const storeQuery = createQuery<Store>({
    queryKey: ['store'],
    queryFn: async () => {
      const response = await _axios.get('/store');
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to fetch store info');
      }
      
      // Return only the fields we need for the frontend
      return {
        storeName: response.data.store.storeName,
        storeAddress: response.data.store.storeAddress,
        storePhone: response.data.store.storePhone,
        storeEmail: response.data.store.storeEmail,
        storeDescription: response.data.store.storeDescription,
        storeImage: response.data.store.storeImage
      };
    }
  });

  $: store = $storeQuery.data;
  $: storeLoading = $storeQuery.isLoading;
  $: storeError = $storeQuery.error;


  // Access query states for categories
  $: categories = $categoryQuery.data ?? [];
  $: categoriesLoading = $categoryQuery.isLoading;
  $: categoriesError = $categoryQuery.error ? ($categoryQuery.error as Error).message : null;
</script>

<footer class="text-white py-10 bg-custom-gradient">


<!-- Main Footer Section -->
<div class="px-4 md:px-6 lg:px-8 lg:mt-10 md:mt-14 mt-10 lg:mb-6 md:mb-10 mb-8 ">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
    <!-- Column 1: Company Description -->
    <div>
      <div class="flex items-center gap-3 mb-4">
        <img
          src="/images/dummyLogo.png"
          alt="logo"
          class="lg:h-28 md:h-20 h-16"
        />
      </div>
      {#if storeLoading}
          <div class="flex items-center gap-3 mb-4">
            <Skeleton class="lg:h-28 md:h-20 h-16 w-32" />
          </div>
          <Skeleton class="h-24 w-full" />
        {:else if storeError}
          <p class="text-red-500">Error loading store information</p>
        {:else}
      <p class="lg:text-lg md:text-base text-sm text-white leading-relaxed">
        {store?.storeDescription || 'Jeya Medical Enterprises is a surgical distributor.It is established in the year 2014.It sells the surgical products in the wholesale and retail manner.'}
      </p>
      {/if}
    </div>

    <!-- Column 2: Categories -->
    <div class="lg:pl-32">
      <h3 class="lg:text-3xl md:text-2xl text-xl text-white font-bold mb-4">Categories</h3>
      {#if categoriesLoading || categoriesError}
        <!-- Skeleton Loader for Categories -->
        <ul class="space-y-2">
          {#each Array(6) as _} <!-- 5 categories + "View More" -->
            <li>
              <Skeleton class="h-6 w-32" />
            </li>
          {/each}
        </ul>
      {:else}
        {#if categories.length === 0}
          <div class="text-xl text-white">No categories available</div>
        {:else}
          <ul class="space-y-2">
            {#each categories as category}
              <li>
                <a href={`/Products/?${category._id}`} class="lg:text-lg md:text-base text-sm hover:underline text-white">
                  {category.name}
                </a>
              </li>
            {/each}
            <li>
              <a href="/Products" class="lg:text-lg md:text-base text-sm text-white hover:underline">View More</a>
            </li>
          </ul>
        {/if}
      {/if}
    </div>

    <!-- Column 3: Quick Links -->
    <div class="lg:pl-10">
      <h3 class="lg:text-3xl md:text-2xl text-xl text-white font-bold mb-4">Quick Links</h3>
      <ul class="space-y-2 text-white">
        <li>
          <a href="/address-management" class="lg:text-lg md:text-base text-sm hover:underline">Address Management</a>
        </li>
        <li>
          <a href="/order-history" class="lg:text-lg md:text-base text-sm hover:underline">Order History</a>
        </li>
        <li>
          <a href="/demand-products" class="lg:text-lg md:text-base text-sm hover:underline">Demand Products</a>
        </li>
        <li>
          <a href="/wishlist" class="lg:text-lg md:text-base text-sm hover:underline">Wishlist</a>
        </li>
        <li>
          <a href="/cart" class="lg:text-lg md:text-base text-sm hover:underline">Cart</a>
        </li>
        <li>
          <a href="/privacy-policy" class="lg:text-lg md:text-base text-sm hover:underline">Privacy Policy</a>
        </li>
        <li>
          <a href="/terms-and-conditions" class="lg:text-lg md:text-base text-sm hover:underline">Terms & Conditions</a>
        </li>
      </ul>
    </div>

    <!-- Column 4: Contact Us -->
    <div class="pr-10">
      <h3 class="lg:text-3xl md:text-2xl text-xl text-white font-bold mb-4">Contact Us</h3>
      {#if storeLoading}
      <ul class="space-y-3">
        {#each Array(3) as _}
          <li>
            <Skeleton class="h-6 w-full" />
          </li>
        {/each}
      </ul>
    {:else if storeError}
      <p class="text-red-500">Error loading contact information</p>
    {:else}
      <ul class="space-y-3">
        <li class="flex items-start gap-2">
          <Icon icon="mynaui:location-selected" class="text-white min-h-8 min-w-8 mt-1" />
          <span class="md:text-lg text-base text-white">
            {store?.storeAddress}
          </span>
        </li>
        <li class="flex items-center gap-2">
          <Icon icon="mynaui:telephone-call" class="text-white min-h-7 min-w-7" />
          <a 
            href={`tel:${store?.storePhone?.replace(/\D/g, '')}`} 
            class="md:text-lg text-base text-white hover:underline"
          >
            {store?.storePhone}
          </a>
        </li>
        <li class="flex items-center gap-2">
          <Icon icon="iconoir:mail" class="text-white min-h-7 min-w-7" />
          <a 
            href={`mailto:${store?.storeEmail}`} 
            class="md:text-lg text-base text-white hover:underline"
          >
            {store?.storeEmail}
          </a>
        </li>
      </ul>
    {/if}
    </div>
  </div>
</div>

</footer>
<div class="border-t bg-custom-gradient py-2 flex-col md:flex-row flex items-center justify-center   !border-gray-100/30">
  <p class="text-white">
    <a href="https://www.wenoxo.in/">
      <span class="text-white">© 2025 Wenoxo Technologies. All rights reserved. </span> 
    </a>
    <!-- | <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a> -->
  </p>
  </div>
