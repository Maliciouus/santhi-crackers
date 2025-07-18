<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { imgUrl } from '$lib/config';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import ProductCard from '$lib/components/productCard.svelte';
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import Footer from '$lib/components/footer.svelte';
  import { writableGlobalStore } from '$lib/stores/global-store';
  import { tick, onMount } from 'svelte';
  import { Slider } from "$lib/components/ui/slider/index.js";
  import Icon from '@iconify/svelte';
  import { goto } from '$app/navigation';

  // ... (Interfaces remain unchanged)
  interface Category {
    _id: string;
    name: string;
  }

  interface Brand {
    _id: string;
    name: string;
  }

  interface Product {
    stock: number;
    id: string | number;
    name: string;
    image: string;
    discount: number;
    MRP: number;
    strikePrice: number;
    description?: string;
    ratings?: number;
    brandId?: string;
    brandName?: string;
    categoryId?: string;
    categoryName?: string;
    favorite: boolean;
    unit:string;
  }

  interface CategoryResponse {
    categories: Category[];
    status: string;
    showMessage: string;
  }

  interface BrandResponse {
    brands: Brand[];
    status: boolean;
    total: number;
    message: string;
  }

  // Corrected typo: isLoggedIn instead of isLogedIn
  $: isLoggedIn = $writableGlobalStore.isLogedIn;

  let searchTerm = '';
  let selectedCategoryIds: string[] = [];
  let selectedBrandIds: string[] = [];
  let priceRange = [0, 10000];
  let isMobileSidebarOpen = false;
  let isDesktopFilterOpen = false;
  let desktopFilterElement: HTMLDivElement | null = null;
  let toggleTimeout: NodeJS.Timeout | null = null;

  let debounceTimeout: any;

  onMount(() => {
    // Initialize isLoggedIn based on token
    const token = localStorage.getItem('token');
    if (token && !$writableGlobalStore.isLogedIn) {
      writableGlobalStore.update((store) => ({ ...store, isLoggedIn: true }));
    }
    console.log("Wishlist mounted, isLoggedIn:", isLoggedIn, "token:", token);

    // Trigger refetch if logged in
    if (isLoggedIn) {
      $wishlistQuery.refetch();
    }

    // Handle outside click for desktop filter
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isDesktopFilterOpen && desktopFilterElement && !desktopFilterElement.contains(target)) {
        isDesktopFilterOpen = false;
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      clearTimeout(debounceTimeout);
      if (toggleTimeout) clearTimeout(toggleTimeout);
    };
  });

  function debounceSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      await tick();
      $wishlistQuery.refetch();
    }, 500);
  }

  function handleSearch(event: Event) {
    searchTerm = (event.target as HTMLInputElement).value;
    debounceSearch();
  }

  function toggleCategory(categoryId: string) {
    if (selectedCategoryIds.includes(categoryId)) {
      selectedCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
    } else {
      selectedCategoryIds = [...selectedCategoryIds, categoryId];
    }
    $wishlistQuery.refetch();
  }

  function toggleBrand(brandId: string) {
    if (selectedBrandIds.includes(brandId)) {
      selectedBrandIds = selectedBrandIds.filter((id) => id !== brandId);
    } else {
      selectedBrandIds = [...selectedBrandIds, brandId];
    }
    $wishlistQuery.refetch();
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function toggleDesktopFilter() {
    if (toggleTimeout) return;
    toggleTimeout = setTimeout(() => {
      isDesktopFilterOpen = !isDesktopFilterOpen;
      toggleTimeout = null;
    }, 300);
  }

  function handlePriceChange(newValue: number[]) {
    priceRange = newValue;
    $wishlistQuery.refetch();
  }

  function clearCategory(categoryId: string) {
    selectedCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
    $wishlistQuery.refetch();
  }

  function clearBrand(brandId: string) {
    selectedBrandIds = selectedBrandIds.filter((id) => id !== brandId);
    $wishlistQuery.refetch();
  }

  function clearPriceRange() {
    priceRange = [0, 10000];
    $wishlistQuery.refetch();
  }

  function clearAllFilters() {
    selectedCategoryIds = [];
    selectedBrandIds = [];
    priceRange = [0, 10000];
    searchTerm = '';
    $wishlistQuery.refetch();
  }

  const categoryQuery = createQuery<Category[]>({
    queryKey: ['category'],
    queryFn: async () => {
      const response = await _axios.get('/categories/all?limit=10', {
        headers: { 'Content-Type': 'application/json' },
      });
      const data: CategoryResponse = response.data;
      if (data.status !== 'success') {
        throw new Error(data.showMessage || 'Failed to fetch categories');
      }
      return data.categories;
    },
    retry: 1,
    staleTime: 0,
    enabled: true,
  });

  const brandsQuery = createQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await _axios.get('/brand/all', {
        headers: { 'Content-Type': 'application/json' },
      });
      const data: BrandResponse = response.data;
      if (!data.status) {
        throw new Error(data.message || 'Failed to fetch brands');
      }
      return data.brands;
    },
    retry: 1,
    staleTime: 0,
    enabled: true,
  });

  const wishlistQuery = createQuery<Product[]>({
    queryKey: ['wishlist', searchTerm, selectedCategoryIds, selectedBrandIds, priceRange],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        writableGlobalStore.update((store) => ({ ...store, isLoggedIn: false }));
        goto('/login');
        throw new Error('No token found. Redirecting to login.');
      }
      const params: Record<string, any> = {};

      if (searchTerm.trim() !== '') params.search = searchTerm;
      if (selectedCategoryIds.length > 0) params.category = selectedCategoryIds.join(',');
      if (selectedBrandIds.length > 0) params.brand = selectedBrandIds.join(',');
      if (priceRange[0] > 0 || priceRange[1] < 10000) {
        params.minPrice = priceRange[0].toString();
        params.maxPrice = priceRange[1].toString();
      }
      const response = await _axios.get('/favorites/getfavorites', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to fetch wishlist');
      }

      return response.data.favorites.flatMap((favorite: any) =>
        favorite.products.map((product: any) => ({
          id: product._id,
          name: product.productName,
          image: product.images?.[0] || '',
          discount: product.discount || 0,
          stock: product.stock,
          MRP: product.price,
          strikePrice: product.strikePrice || product.price,
          description: product.description,
          ratings: product.ratings,
          brandId: product.brand?._id,
          brandName: product.brand?.name,
          categoryId: product.category?._id,
          categoryName: product.category?.name,
          unit:product.unit,
          favorite: true
        }))
      );
    },
    enabled: isLoggedIn,
    retry: 1,
    staleTime: 0,
    onError: (error: any) => {
      console.error("Wishlist query error:", error.message);
      if (error.message.includes('token')) {
        goto('/login');
      }
    }
  });

  $: categories = $categoryQuery.data ?? [];
  $: categoriesLoading = $categoryQuery.isLoading;
  $: categoriesError = $categoryQuery.error ? ($categoryQuery.error as Error).message : null;

  $: brands = $brandsQuery.data ?? [];
  $: brandsLoading = $brandsQuery.isLoading;
  $: brandsError = $brandsQuery.error ? ($brandsQuery.error as Error).message : null;

  $: products = $wishlistQuery.data ?? [];
  $: productsLoading = $wishlistQuery.isLoading;
  $: productsError = $wishlistQuery.error ? ($wishlistQuery.error as Error).message : null;

  $: activeFilters = [
    ...selectedCategoryIds.map(id => categories.find(cat => cat._id === id)?.name || ''),
    ...selectedBrandIds.map(id => brands.find(brand => brand._id === id)?.name || ''),
    priceRange[0] > 0 || priceRange[1] < 10000 ? `₹${priceRange[0]} - ₹${priceRange[1]}` : '',
  ].filter(filter => filter !== '');

  // Debug logs
  $: console.log("isLoggedIn:", isLoggedIn, "token:", localStorage.getItem('token'));
  $: console.log("wishlistQuery status:", {
    enabled: $wishlistQuery.isEnabled,
    loading: $wishlistQuery.isLoading,
    error: $wishlistQuery.error,
    data: $wishlistQuery.data
  });
</script>

<!-- <section class="bg-[#F2F4F5] py-1 px-4 md:px-6 lg:px-8">
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/" class="text-[#4F585E] hover:text-[#01A0E2] text-base">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/wishlist" class="text-[#01A0E2] text-base">Wishlist</Breadcrumb.Link>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</section> -->

<div class="flex min-h-screen px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-4 relative">
  <!-- Desktop Filter Drawer -->
  <div
    class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 {isDesktopFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}"
  ></div>
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <aside
     class="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out {isDesktopFilterOpen ? 'translate-x-0' : '-translate-x-full'}"
    bind:this={desktopFilterElement}
    role="dialog"
    aria-label="Filter drawer"
  >
    <div class="p-6 h-full overflow-y-auto">
      <!-- Close Button -->
      <button
        on:click={() => (isDesktopFilterOpen = false)}
        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <Icon icon="mdi:close" class="w-6 h-6" />
      </button>
      <!-- Desktop Filter Content -->
      <div>
        <h2 class="text-2xl font-bold text-[#30363C] my-4">Price Range</h2>
        <Slider
          type="multiple"
          bind:value={priceRange}
          max={10000}
          step={100}
          onValueCommit={() => $wishlistQuery.refetch()}
        />
        <div class="flex justify-between mt-2 text-[#4F585E]">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-[#30363C] mb-4">Categories</h2>
        {#if categoriesLoading || categoriesError}
          <div class="space-y-3">
            {#each Array(5) as _}
              <div class="flex items-center gap-2">
                <Skeleton class="h-5 w-5" />
                <Skeleton class="h-5 w-32" />
              </div>
            {/each}
          </div>
        {:else}
          <div class="space-y-3">
            {#each categories as category}
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  class="min-h-5 min-w-5 text-blue-600"
                  checked={selectedCategoryIds.includes(category._id)}
                  on:change={() => toggleCategory(category._id)}
                />
                <span class="text-lg text-[#4F585E]">{category.name}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>
      <div>
        <h2 class="text-2xl font-bold text-[#30363C] my-4">Brands</h2>
        {#if brandsLoading || brandsError}
          <div class="space-y-3">
            {#each Array(5) as _}
              <div class="flex items-center gap-2">
                <Skeleton class="h-5 w-5" />
                <Skeleton class="h-5 w-32" />
              </div>
            {/each}
          </div>
        {:else}
          <div class="space-y-3">
            {#each brands as brand}
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  class="min-h-5 min-w-5 text-blue-600"
                  checked={selectedBrandIds.includes(brand._id)}
                  on:change={() => toggleBrand(brand._id)}
                />
                <span class="text-lg text-[#4F585E]">{brand.name}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>
     
      <!-- Apply Button -->
      <!-- <button
        on:click={() => (isDesktopFilterOpen = false)}
        class="mt-6 w-full bg-custom-gradient text-white py-3 rounded-lg font-medium hover:bg-[#0077A8] transition-colors"
      >
        Apply Filters
      </button> -->
    </div>
  </aside>

  <!-- Main Content -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <main class="flex-1 lg:px-3  py-0 p-0">
    <!-- Filter Button and Active Filters -->
    <p class="lg:hidden block text-3xl py-5 font-bold">
			Wishlist
		</p>
    <div class="flex items-center justify-between mb-4">
      <button
        on:click|stopPropagation={toggleDesktopFilter}
        class="bg-custom-gradient text-white text-base px-6 py-2 rounded-full items-center hidden lg:flex"
      >
        <Icon icon="mdi:filter" class="w-5 h-5 mr-2" />
        Filters
      </button>
      <!-- Mobile Filter Button -->
      <button
        on:click|stopPropagation={toggleMobileSidebar}
        class="bg-custom-gradient text-white text-base px-6 py-2 rounded-full flex items-center lg:hidden"
      >
        <Icon icon="mdi:filter" class="w-5 h-5 mr-2" />
        Filters
      </button>
      <!-- Active Filters -->
      {#if activeFilters.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each activeFilters as filter}
            <span class="bg-[#F3F9FB] text-[#222222] text-base px-4 py-1 rounded-full flex items-center">
              {filter}
              <button
                on:click={() => {
                  if (categories.find(cat => cat.name === filter)) {
                    clearCategory(categories.find(cat => cat.name === filter)?._id || '');
                  } else if (brands.find(brand => brand.name === filter)) {
                    clearBrand(brands.find(brand => brand.name === filter)?._id || '');
                  } else if (filter.startsWith('₹')) {
                    clearPriceRange();
                  }
                }}
                class="ml-2 text-[#01A0E2]"
              >
                <Icon icon="mdi:close" class="w-4 h-4" />
              </button>
            </span>
          {/each}
          <button
            on:click={clearAllFilters}
            class="bg-[#008ECC] text-white text-base px-4 py-1 rounded-full flex items-center"
          >
            Clear All
            <Icon icon="mdi:close" class="w-4 h-4 ml-2" />
          </button>
        </div>
      {/if}
    </div>

    <!-- Mobile Sidebar Overlay -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 transition-opacity duration-300 {isMobileSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}"
      on:click|stopPropagation={toggleMobileSidebar}
    ></div>

    <!-- Mobile Sidebar Content -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
      <div class="p-6 h-full overflow-y-auto">
        <!-- Close Button -->
        <button
          on:click|stopPropagation={toggleMobileSidebar}
          class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
        <!-- Filter Content -->
        <div>
          <h2 class="text-2xl font-bold text-[#30363C] my-4">Price Range</h2>
          <Slider
            type="multiple"
            bind:value={priceRange}
            max={10000}
            step={100}
            onValueCommit={() => $wishlistQuery.refetch()}
          />
          <div class="flex justify-between mt-2 text-[#4F585E]">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-[#30363C] mb-4">Categories</h2>
          {#if categoriesLoading || categoriesError}
            <div class="space-y-3">
              {#each Array(5) as _}
                <div class="flex items-center gap-2">
                  <Skeleton class="h-5 w-5" />
                  <Skeleton class="h-5 w-32" />
                </div>
              {/each}
            </div>
          {:else}
            <div class="space-y-3">
              {#each categories as category}
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="min-h-5 min-w-5 text-blue-600"
                    checked={selectedCategoryIds.includes(category._id)}
                    on:change={() => toggleCategory(category._id)}
                  />
                  <span class="text-lg text-[#4F585E]">{category.name}</span>
                </label>
              {/each}
            </div>
          {/if}
        </div>
        <div>
          <h2 class="text-2xl font-bold text-[#30363C] my-4">Brands</h2>
          {#if brandsLoading || brandsError}
            <div class="space-y-3">
              {#each Array(5) as _}
                <div class="flex items-center gap-2">
                  <Skeleton class="h-5 w-5" />
                  <Skeleton class="h-5 w-32" />
                </div>
              {/each}
            </div>
          {:else}
            <div class="space-y-3">
              {#each brands as brand}
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="min-h-5 min-w-5 text-blue-600"
                    checked={selectedBrandIds.includes(brand._id)}
                    on:change={() => toggleBrand(brand._id)}
                  />
                  <span class="text-lg text-[#4F585E]">{brand.name}</span>
                </label>
              {/each}
            </div>
          {/if}
        </div>
       
        <!-- Apply Button -->
        <button
          on:click={toggleMobileSidebar}
          class="mt-6 w-full bg-[#008ECC] text-white py-3 rounded-lg font-medium hover:bg-[#0077A8] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <!-- Header -->
    {#if !isLoggedIn}
      <div class="text-center py-10">
        <p class="text-lg text-[#4F585E]">Please log in to view your wishlist.</p>
        <button
          on:click={() => goto('/login')}
          class="mt-4 bg-[#008ECC] text-white px-6 py-2 rounded-lg font-medium"
        >
          Log In
        </button>
      </div>
    {:else}
      <!-- <div class="flex items-center mb-1">
        <div class="w-1/2 md:block hidden"></div>
        <div class="md:w-1/2 w-full flex">
          <div class="lg:w-1/3 w-1/6 md:block hidden"></div>
          <div class="border md:py-7 py-5 flex lg:w-2/3 w-full rounded-full bg-white md:p-1 p-0.5">
            <div class="relative w-full">
              <input
                type="text"
                placeholder="Search wishlist products"
                class="w-full absolute top-1/2 transform -translate-y-1/2 lg:text-xl text-base md:pl-16 pl-10 rounded-full focus:outline-none focus:ring-0 text-gray-700"
                on:input={handleSearch}
              />
              <img
                class="absolute left-1 md:w-[45px] w-[32px] top-1/2 transform -translate-y-1/2 text-gray-400"
                src="/svg/search.svg"
                alt="search"
              />
            </div>
          </div>
        </div>
      </div> -->

      <!-- Product Grid -->
      <!-- <div class="mb-1 text-right text-xs md:text-sm text-[#4F585E]">
        {#if productsLoading}
          Loading...
        {:else if productsError}
          Error: {productsError}
        {:else if products.length === 0}
          No products found
        {:else}
          {products.length} results found
        {/if}
      </div> -->
      {#if productsLoading}
        <div class="flex flex-wrap lg:gap-10 gap-5">
          {#each Array(12) as _}
            <div class="w-56 bg-white rounded-xl shadow-md overflow-hidden">
              <Skeleton class="h-48 w-56" />
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
      {:else if productsError}
        <div class="text-red-500 text-center py-10">{productsError}</div>
      {:else if products.length === 0}
        <div class="text-center py-10">
          <p class="text-lg text-[#4F585E]">No products in your wishlist.</p>
        </div>
      {:else}
        <div>
          <div class="card md:flex md:flex-wrap grid grid-cols-2 justify-center md:justify-normal lg:gap-10 gap-3">
            {#each (products as any[]) as product (product.id)}
              <ProductCard
                id={product.id}
                image={product.image}
                discount={product.discount}
                name={product.name}
                MRP={product.MRP}
                unit={product.unit?.name}
                favorite={product.favorite}
                available={product.stock === 0 ? false : true}
              />
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>
<Footer />
<style>
  @media (max-width: 768px) and (min-width: 500px) {
    .card {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
  }
</style>