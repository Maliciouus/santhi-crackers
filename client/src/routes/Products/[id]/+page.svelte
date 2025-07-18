<script>
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { queryClient } from "$lib/query-client";
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Star, Heart, ShoppingCart, Minus, Plus, Truck, Shield, RefreshCw } from 'lucide-svelte';
  import { _axios } from '$lib/_axios';
  import Footer from '$lib/components/footer.svelte';
  import { imgUrl } from '$lib/config';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { toast } from 'svelte-sonner';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  // Component state
  let selectedImage = 0;
  let quantity = 1;
  let isDescriptionExpanded = false;
  let showAllSpecs = false;
  let isFavorite = false;
  /**
	 * @type {HTMLParagraphElement}
	 */
  let descriptionRef;
  let showViewMore = false;
  let isInitialLoading = true; // Track initial page load


  /**
	 * @type {string | null}
	 */
  let productId = null;

  /**
	 * @param {string} url
	 */
  
// Improved YouTube embed function
// Improved YouTube embed function
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  
  // Remove any whitespace
  url = url.trim();
  
  // Handle YouTube URL with timestamp (e.g., ?t=123 or &t=123)
  const timePattern = /[?&]t=(\d+)/;
  const timeMatch = url.match(timePattern);
  const timeParam = timeMatch ? `&start=${timeMatch[1]}` : '';
  
  // Handle multiple YouTube URL formats
  const patterns = [
    // Standard watch URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    // Short URLs
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    // Embed URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    // Mobile URLs
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    // YouTube Shorts URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return embed URL with proper parameters
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=1${timeParam}`;
    }
  }
  
  console.warn('Invalid YouTube URL:', url);
  return '';
}

// Alternative: Direct video ID extraction if you have just the video ID
function createEmbedFromVideoId(videoId, autoplay = false) {
  if (!videoId) return '';
  
  const autoplayParam = autoplay ? '&autoplay=1' : '&autoplay=0';
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&controls=1${autoplayParam}`;
}

// Usage examples:
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30',
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/shorts/he9P0oj1dzs'
];

testUrls.forEach(url => {
  console.log(`Original: ${url}`);
  console.log(`Embed: ${getYouTubeEmbedUrl(url)}`);
  console.log('---');
});
  // Reset product data and set initial loading state
  onMount(() => {
    queryClient.removeQueries(['product']);
    productId = $page.params.id;
    isInitialLoading = !productId;
    if (productId) {
      $productQuery.refetch();
    }

    const checkOverflow = () => {
      if (descriptionRef) {
        const { scrollHeight, offsetHeight } = descriptionRef;
        showViewMore = scrollHeight > offsetHeight;
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  });

  // Update productId reactively
  $: productId = $page.params.id;
  $: {
    console.log('Reactive: productId updated to:', productId);
    isInitialLoading = !productId;
    if (productId) {
      $productQuery.refetch();
    }
  }
  let isVideoDialogOpen = false;
  const productQuery = createQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      console.log('queryFn: Attempting to fetch product with ID:', productId);
      if (!productId) {
        console.error('queryFn: No product ID provided');
        throw new Error('No product ID provided');
      }
      try {
        const response = await _axios.get(`/products/${productId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('queryFn: API Response:', response.data);
        if (!response.data.status) {
          console.error('queryFn: API Error:', response.data.message);
          throw new Error(response.data.message || 'Failed to fetch product');
        }
        const product = response.data.data;
        return {
          id: product._id,
          name: product.productName,
          images: product.images || [],
          ytLink: product.ytLink || '',
          discount: product.discount || 0,
          stock: product.stock || 0,
          flat: product.flat || 0,
          unit: product.unit || '',
          MRP: product.price || 0,
          strikePrice: product.strikePrice || product.price || 0,
          description: product.description || '',
          ratings: product.ratings || 0,
          categoryId: product.category?._id || '',
          categoryName: product.category?.name || '',
          favorite: product.favorite || false,
          brand: product.brand?.name || null,
          brandId: product.brand?._id || null,
          productCode: product.productCode || '',
          gst: product.gst || 0,
          options: product.options || [],
          specifications: product.specifications || [],
        };
      } catch (error) {
        console.error('queryFn: Fetch Error:', error);
        throw error;
      }
    },
    enabled: !!productId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // const addToCartMutation = createMutation({
  //   mutationFn: async () => {
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       throw new Error('Please log in to add to cart');
  //     }

  //     const response = await _axios.post(
  //       '/cart/update',
  //       {
  //         products: [
  //           {
  //             productId: $productQuery.data?.id,
  //             quantity: quantity,
  //           }
  //         ]
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );


  //     if (!response.data.status) {
  //       throw new Error(response.data.message || 'Failed to add to cart');
  //     }

  //     return response.data;

  //   },
  //   onSuccess: (data) => {
  //     queryClient.invalidateQueries({ queryKey: ['cart'] });
  //     queryClient.invalidateQueries({ queryKey: ['cartCount'] });
  //     toast.success('Product added to cart successfully!');
  //     // $writableGlobalStore.cartCount = ($writableGlobalStore.cartCount || 0) + quantity;
  //     console.log('Added to cart:', data);
  //   },
  //   onError: (error) => {
  //     if (error.message === 'Please log in to add to cart') {
  //       toast.error(error.message);
  //       goto('/login');
  //     } else {
  //       toast.error(error.message || 'An error occurred while adding to cart');
  //     }
  //   }
  // });
  const addToCartMutation = createMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to add to cart');
      }
      const response = await _axios.post(
        '/cart/update',
        {
          products: [
            {
              productId: $productQuery.data?.id,
              quantity: quantity,
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.status) throw new Error(response.data.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      toast.success('Product added to cart successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add product to cart');
    },
  });
  // Debug query state
  // $: console.log('productQuery state:', {
  //   isLoading: $productQuery?.isLoading,
  //   isError: $productQuery?.isError,
  //   error: $productQuery?.error,
  //   data: $productQuery?.data,
  //   isEnabled: !!productId,
  //   queryKey: ['product', productId],
  // });

  const handleQuantityChange = (/** @type {string} */ type) => {
    if (!$productQuery.data) return;
    if (type === 'increment' && quantity < $productQuery.data.stock) {
      quantity = quantity + 1;
    } else if (type === 'decrement' && quantity > 1) {
      quantity = quantity - 1;
    }
  };

  const renderStars = (/** @type {number} */ rating) => {
    return Array.from({ length: 5 }, (_, index) => ({
      filled: index < Math.floor(rating),
      half: index < rating && index >= Math.floor(rating)
    }));
  };

  const handleImageSelect = (/** @type {number} */ index) => {
    selectedImage = index;
  };

  const handleFavoriteToggle = () => {
    isFavorite = !isFavorite;
  };

  const handleAddToCart = () => {
    if (!$productQuery.data) return;
    $addToCartMutation.mutate();
  };


  $: visibleSpecs = showAllSpecs && $productQuery.data ? $productQuery.data.specifications : ($productQuery.data?.specifications || []).slice(0, 2);

  $: discountPercentage = $productQuery.data ? Math.round((($productQuery.data.strikePrice - $productQuery.data.MRP) / $productQuery.data.strikePrice) * 100) : 0;
</script>

<main class="lg:!mx-20 md:mx-10 mx-4 py-8 max-w-screen-2xl scrollbar-hide">
  {#if $productQuery.isLoading || !$productQuery.data}
    <!-- Skeleton for initial load or query loading -->
    <div class="flex flex-col md:flex-row gap-8 lg:gap-12">
      <!-- Image Gallery - Sticky -->
      <div class="lg:sticky lg:top-8 lg:self-start">
        <div class="flex flex-col-reverse lg:flex-row gap-4">
          <!-- Main Image -->
          <div class="flex-1">
            <div class="relative aspect-square lg:w-[400px] md:w-[280px] w-full h-full md:h-[280px] lg:h-[400px] rounded-2xl overflow-hidden bg-gray-100 border">
              <Skeleton class="w-full h-full" />
            </div>
            <!-- Thumbnails -->
            <div class="flex justify-center gap-3 my-10 overflow-x-auto lg:overflow-y-auto lg:max-h-96">
              <div class="flex gap-3">
                {#each Array(4) as _}
                  <Skeleton class="w-16 h-16 lg:w-20 lg:h-20 rounded-lg" />
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Product Details - Scrollable -->
      <div class="lg:max-h-[80vh] lg:overflow-y-auto w-full space-y-6 scrollbar-hide">
        <!-- Product Header -->
        <div>
          <Skeleton class="h-6 w-48 mb-2" />

          <div class="flex items-center gap-4 mb-4">
            {#each Array(5) as _}
              <Skeleton class="h-4 w-4" />
            {/each}
            <Skeleton class="h-4 w-16" />
          </div>
          <div class="flex items-center gap-4 mb-4">
            <Skeleton class="h-8 w-20" />
            <Skeleton class="h-12 w-32" />
          </div>
          <Skeleton class="h-6 w-40 mb-6" />
        </div>
        <!-- Description -->
        <div>
          <Skeleton class="h-6 w-32 mb-3" />
          <div class="space-y-2">
            <Skeleton class="h-4 w-full" />

          </div>
        </div>
        <!-- Options -->
        <div>
          <Skeleton class="h-6 w-32 mb-3" />
          <div class="flex gap-2">
            {#each Array(3) as _}
              <Skeleton class="h-8 w-16" />
            {/each}
          </div>
        </div>
        <!-- Specifications -->
        <div>
          <Skeleton class="h-6 w-32 mb-3" />
          {#each Array(2) as _}
            <div class="mb-4">
              <Skeleton class="h-6 w-48 mb-2" />
              <div class="space-y-1">
                {#each Array(1) as _}
                  <div class="flex justify-between">
                    <Skeleton class="h-4 w-24" />
                  </div>
                {/each}
              </div>
            </div>
          {/each}
          <Skeleton class="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  {:else if $productQuery.isError}
    <div class="flex justify-center items-center h-48">
      <p class="text-red-500">
        Error: {$productQuery.error?.message || 'Failed to load product data'}
      </p>
    </div>
  {:else if $productQuery.data}
    <!-- Display actual content when data is available -->
    <div class="flex flex-col md:flex-row gap-8 lg:gap-12">
      <!-- Image Gallery - Sticky -->
      <div class="lg:sticky lg:top-8 lg:self-start">
        <div class="flex flex-col-reverse lg:flex-row gap-4">
          <!-- Main Image -->
          <div class="flex-1">
            <div class="relative aspect-square lg:w-[400px] md:w-[280px] w-full h-full md:h-[280px] lg:h-[400px] rounded-2xl overflow-hidden bg-gray-100 border">
              {#if $productQuery.data?.images?.length > 0}
                <img
                  src="{imgUrl}{$productQuery.data.images[selectedImage]}"
                  alt={$productQuery.data.name}
                  class="w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                />
                <!-- <button
                  on:click={handleFavoriteToggle}
                  class="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                >
                  <Heart
                    class="w-5 h-5 {isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}"
                  />
                </button> -->
              {:else}
                <div class="w-full h-full flex items-center justify-center">
                  <p class="text-gray-500">No image available</p>
                </div>
              {/if}
            </div>
            <!-- Thumbnails -->
            <div class="flex justify-center gap-3 my-10 overflow-x-auto lg:overflow-y-auto lg:max-h-96">
              {#if $productQuery.data?.images}
                {#each $productQuery.data.images as image, index}
                  <button
                    on:click={() => handleImageSelect(index)}
                    class="relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:border-blue-300 {selectedImage === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}"
                  >
                    <img
                      src="{imgUrl}{image}"
                      alt="{$productQuery.data.name} {index + 1}"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                {/each}
              {/if}
            </div>
        
          </div>
        </div>
      </div>
      <!-- Product Details - Scrollable -->
      <div class="lg:max-h-[80vh] lg:overflow-y-auto w-full space-y-6 scrollbar-hide">
        <!-- Product Header -->
        <div>
          <!-- <div class="text-sm text-gray-500 mb-2">
            {$productQuery.data.categoryName} - {$productQuery.data.productCode}
          </div> -->
          <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 capitalize">
            {$productQuery.data.name}
          </h1>
          {#if $productQuery.data.brand}
            <p class="text-lg text-gray-600 mb-4">by {$productQuery.data.brand}</p>
          {/if}
          <!-- Rating -->
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-1">
              {#each renderStars($productQuery.data.ratings) as star}
                <Star
                  class="w-4 h-4 {star.filled ? 'fill-yellow-400 text-yellow-400' : star.half ? 'fill-yellow-200 text-yellow-400' : 'fill-gray-200 text-gray-200'}"
                />
              {/each}
            </div>
            <span class="text-sm font-medium text-gray-900">
              {$productQuery.data.ratings.toFixed(1)}
            </span>
            <span class="text-sm text-gray-500">
              ({$productQuery.data.ratings.toFixed(1)} Reviews)
            </span>
          </div>
          <!-- Price -->
          <div class="flex items-center gap-4 mb-4 flex-wrap">
            {#if $productQuery.data.gst <= 0}
              <span class="text-green-700 text-sm">Inclusive GST</span>
            {/if}
            {#if $productQuery.data.discount}
            <span class="text-3xl font-bold text-gray-900">₹{Math.round($productQuery.data.MRP - ($productQuery.data.MRP * ($productQuery.data.discount || 0) / 100))}</span> 
            {/if}
            <span class="text-xl line-through  text-gray-700">
              ₹{$productQuery.data.MRP.toLocaleString()}
            </span>
            <span>/ {$productQuery.data.unit?.name}</span>
            {#if discountPercentage > 0}
              <span class="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                {discountPercentage}% OFF
              </span>
            {/if}
          </div>
              <!-- Action Buttons -->
              <div class="flex gap-3 mt-6  w-full">
                <div class="flex items-center border rounded-lg">
                  <button
                    on:click={() => handleQuantityChange('decrement')}
                    class="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus class="w-4 h-4" />
                  </button>
                  <span class="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    on:click={() => handleQuantityChange('increment')}
                    class="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={!$productQuery.data || quantity >= $productQuery.data.stock}
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                </div>
                <button
                on:click|preventDefault={handleAddToCart}
                class=" bg-custom-gradient !w-fit hover:shadow-lg text-white py-3 px-6 rounded-lg hover:scale-95 duration-500 transition-all flex items-center justify-center gap-2 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!$productQuery.data || $productQuery.data.stock === 0 || $addToCartMutation.isPending}
              >
                {#if $addToCartMutation.isPending}
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                {:else}
                  <ShoppingCart class="w-5 h-5" />
                  {$productQuery.data?.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                {/if}
              </button>
              </div>
          <!-- Stock Status -->
          <div class="flex items-center gap-2 my-6">
            <div class="w-2 h-2 rounded-full {$productQuery.data.stock > 0 ? 'bg-green-500' : 'bg-red-500'}"></div>
            <span class="text-sm font-medium {$productQuery.data.stock > 0 ? 'text-green-700' : 'text-red-700'}">
              {$productQuery.data.stock > 0 ? `In Stock (${$productQuery.data.stock} available)` : 'Out of Stock'}
            </span>
          </div>
        </div>
        <!-- Description -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <div class="relative">
      
<!-- Improved YouTube Dialog Section with Shorts Support -->
{#if $productQuery.data.ytLink}
  <Dialog.Root bind:open={isVideoDialogOpen}>
    <Dialog.Trigger 
      class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm mb-2 font-medium transition-colors"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      {$productQuery.data.ytLink.includes('/shorts/') ? 'Watch Shorts Video' : 'Watch Video Preview'}
    </Dialog.Trigger>
    
    <Dialog.Content class={$productQuery.data.ytLink.includes('/shorts/') ? "sm:max-w-[500px] w-[95vw] max-h-[90vh] bg-transparent border-0" : "sm:max-w-[900px] w-[95vw] max-h-[90vh] bg-transparent border-0"}>
      <Dialog.Header class="pb-4">
        <!-- <Dialog.Title class="text-xl font-semibold">
          {$productQuery.data.ytLink.includes('/shorts/') ? 'Shorts Video' : 'Video Preview'}
        </Dialog.Title>
        <Dialog.Description class="text-gray-600">
          Watch the {$productQuery.data.ytLink.includes('/shorts/') ? 'shorts video' : 'video preview'} for {$productQuery.data.name}
        </Dialog.Description> -->
      </Dialog.Header>
      
      <div class="relative w-full bg-black rounded-lg overflow-hidden">
        {#if getYouTubeEmbedUrl($productQuery.data.ytLink)}
          <!-- Check if it's a shorts video for different aspect ratio -->
          {#if $productQuery.data.ytLink.includes('/shorts/')}
            <div class="relative w-full" style="aspect-ratio: 9/16; max-height: 600px;">
              <iframe
                src={getYouTubeEmbedUrl($productQuery.data.ytLink)}
                title="Product Shorts Video - {$productQuery.data.name}"
                class="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
          {:else}
            <div class="relative w-full aspect-video">
              <iframe
                src={getYouTubeEmbedUrl($productQuery.data.ytLink)}
                title="Product Video Preview - {$productQuery.data.name}"
                class="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
          {/if}
        {:else}
          <div class="w-full aspect-video flex items-center justify-center bg-gray-100 text-gray-500">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <p>Invalid video URL</p>
            </div>
          </div>
        {/if}
      </div>
      
      <Dialog.Footer class="pt-4 ">
        <Button 
          variant="outline" 
          onclick={() => isVideoDialogOpen = false}
          class="w-full text-sm md:text-lg font-bold hover:text-white border-0 text-white  bg-custom-gradient hover:scale-110 transition-all duration-300"
        >
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}

            <p
              bind:this={descriptionRef}
              class="text-gray-700 leading-relaxed transition-all duration-300 {!isDescriptionExpanded ? 'line-clamp-3' : ''}"
            >
              {$productQuery.data.description || 'No description available'}
            </p>
            {#if showViewMore}
              <button
                on:click={() => isDescriptionExpanded = !isDescriptionExpanded}
                class="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </button>
            {/if}
          </div>
        </div>
        <!-- Options -->
        {#if $productQuery.data.options && $productQuery.data.options.length > 0}
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Options</h3>
            {#each $productQuery.data.options as option}
              <div class="mb-4">
                <h4 class="font-medium text-gray-700 mb-2">{option.title}</h4>
                <div class="flex gap-2 flex-wrap">
                  {#each option.values as value}
                    <button class="border border-gray-300 px-3 py-2 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      {value}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        <!-- Specifications -->
        {#if $productQuery.data.specifications && $productQuery.data.specifications.length > 0}
          <div>
            <div class="overflow-hidden w-[70%]">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 bg-red-50 p-3 rounded-lg">Specifications</h3>
              </div>
              <div class="py-6 space-y-6">
                {#each visibleSpecs as spec}
                  <div>
                    <h4 class="text-base font-semibold text-gray-900 mb-3 p-2 px-4 rounded-lg bg-gray-50">
                      {spec.name}
                    </h4>
                    <div class="space-y-2 lg:w-[60%] md:w-[70%] w-[90%] pl-8">
                      {#each Object.entries(spec.fields) as [key, value]}
                        <div class="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span class="text-gray-600 font-medium">{key}</span>
                          <span class="text-gray-900 text-right">{value}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
                <!-- Show preview of next section when collapsed -->
                {#if !showAllSpecs && $productQuery.data.specifications.length > 2}
                  <div class="relative opacity-40">
                    <h4 class="text-base font-semibold text-gray-900 mb-3 pb-2">
                      {$productQuery.data.specifications[2].name}
                    </h4>
                    <div class="space-y-2">
                      {#each Object.entries($productQuery.data.specifications[2].fields).slice(0, 2) as [key, value]}
                        <div class="flex justify-between py-2">
                          <span class="text-gray-600 font-medium">{key}</span>
                          <span class="text-gray-900">{value}</span>
                        </div>
                      {/each}
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
                  </div>
                {/if}
                {#if $productQuery.data.specifications.length > 2}
                  <button
                    on:click={() => showAllSpecs = !showAllSpecs}
                    class="w-full mt-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {showAllSpecs ? 'Show Less Specifications' : 'Show All Specifications'}
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/if}
        <!-- Footer space -->
        <div class="pb-8"></div>
      </div>
    </div>
  {/if}
</main>

<Footer />

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
