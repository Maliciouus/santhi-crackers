<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import ProductCard from '$lib/components/productCard.svelte';
  import { imgUrl } from '$lib/config';
  import { goto } from '$app/navigation';
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import Footer from '$lib/components/footer.svelte';

  // Interfaces based on the API response
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
  }

  interface OfferItem {
    productName: string;
    type: string;
    percentage: number;
    image: string;
    name: string;
    MRP: number;
    strikePrice: number;
    favorite: boolean | undefined;
    id: string | number;
    _id: string;
    productId: ProductDetails;
    discount?: number;
    successPercentage?: number;
    failurePercentage?: number;
    mrpReduction?: number;
  }

  interface Offer {
    _id: string;
    type: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    percentage?: number;
    items: OfferItem[];
    noOfAttempts?: number;
  }

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

  // Fetch regular offers
  const offersQuery = createQuery<Offer[]>({
    queryKey: ['userOffers'],
    queryFn: async () => {
      const response = await _axios.get('/offers/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });

      const { data } = response;

      if (!data || typeof data !== 'object' || !('status' in data)) {
        throw new Error('Invalid response from server');
      }

      if (!data.status) {
        throw new Error(data.message || 'Failed to fetch offers');
      }

      return data.data as Offer[];
    },
    refetchOnWindowFocus: false,
    enabled: typeof window !== 'undefined',
  });

  // Fetch combo offers
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

  // Group offers by type and filter active offers with non-empty items
  $: groupedOffers = $offersQuery.data?.reduce((acc, offer) => {
    if (offer.isActive && offer.items.length > 0) {
      if (!acc[offer.type]) acc[offer.type] = [];
      acc[offer.type].push(offer);
    }
    return acc;
  }, {} as Record<string, Offer[]>);

  // Store combo offers data (filtered for active and non-deleted)
  $: comboOffers = $comboOffersQuery.data?.comboOffers.filter(combo => combo.active && !combo.isDeleted) ?? [];

  // Check if there are any valid offers or combo offers to display
  $: hasValidOffers = groupedOffers && Object.keys(groupedOffers).length > 0;
  $: hasValidComboOffers = comboOffers.length > 0;
  $: showNoOffersMessage = !isLoading && !error && !hasValidOffers && !hasValidComboOffers;

  // Combined loading state
  $: isLoading = $offersQuery.isLoading || $comboOffersQuery.isLoading;
  $: error = $offersQuery.error || $comboOffersQuery.error;
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

<div class="min-h-screen px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
  <main class="lg:p-6">
    {#if isLoading}
      <div class="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {#each Array(4) as _}
          <div class="min-w-[224px] bg-white rounded-xl shadow-md overflow-hidden">
            <Skeleton class="h-48 w-full" />
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
    {:else if error}
      <div class="text-red-500 text-center py-10">{error.message}</div>
    {:else}
      <!-- Regular Offers Sections -->
      {#if hasValidOffers}
        <!-- Flat Offers Section -->
        {#if groupedOffers['flat']}
          <div class="lg:mb-8 mb-2">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
              Flat Offers
              <!-- <a href="/Products" class="text-blue-500 hover:underline">View All</a> -->
            </h2>
            <div class="flex overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              <div class="flex gap-4 lg:gap-6">
                {#each groupedOffers['flat'] as offer (offer._id)}
                  {#each offer.items as item (item._id)}
                    <div class="">
                      <ProductCard
                        id={item.productId._id}
                        image={`${imgUrl}/${item.productId.images[0]}`}
                        discount={item.productId.discount || offer.percentage}
                        name={item.productId.productName}
                        MRP={item.productId.price}
                        strikePrice={item.productId.strikePrice}
                        favorite={item.productId.favorite}
                        offerType={'flat'}
                      />
                    </div>
                  {/each}
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Negotiable Products Section -->
        {#if groupedOffers['negotiate']}
          <div class="lg:mb-8 mb-2">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
              Negotiable Products
              <!-- <a href="/Products" class="text-blue-500 hover:underline">View All</a> -->
            </h2>
            <div class="flex overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              <div class="flex gap-4 lg:gap-6">
                {#each groupedOffers['negotiate'] as offer (offer._id)}
                  {#each offer.items as item (item._id)}
                    <div class="">
                      <ProductCard
                        id={item.productId._id}
                        image={`${imgUrl}/${item.productId.images[0]}`}
                        discount={item.discount}
                        name={item.productId.productName}
                        MRP={item.productId.price}
                        strikePrice={item.productId.strikePrice}
                        favorite={item.productId.favorite}
                        offerType={'negotiation'}
                      />
                    </div>
                  {/each}
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Discount on MRP Section -->
        {#if groupedOffers['discount']}
          <div class="lg:mb-8 mb-2">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
              Discount on MRP
              <!-- <a href="/Products" class="text-blue-500 hover:underline">View All</a> -->
            </h2>
            <div class="flex overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              <div class="flex gap-4 lg:gap-6">
                {#each groupedOffers['discount'] as offer (offer._id)}
                  {#each offer.items as item (item._id)}
                    <div class="">
                      <ProductCard
                        id={item.productId._id}
                        image={`${imgUrl}/${item.productId.images[0]}`}
                        discount={item.discount}
                        name={item.productId.productName}
                        MRP={item.productId.price}
                        strikePrice={item.productId.strikePrice}
                        favorite={item.productId.favorite}
                        offerType={'discount'}
                      />
                    </div>
                  {/each}
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- MRP Reduction Section -->
        {#if groupedOffers['mrp']}
          <div class="lg:mb-8 mb-2">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
              MRP Reduction
              <!-- <a href="/Products" class="text-blue-500 hover:underline">View All</a> -->
            </h2>
            <div class="flex overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              <div class="flex gap-4 lg:gap-6">
                {#each groupedOffers['mrp'] as offer (offer._id)}
                  {#each offer.items as item (item._id)}
                    <div class="">
                      <ProductCard
                        id={item.productId._id}
                        image={`${imgUrl}/${item.productId.images[0]}`}
                        discount={item.discount}
                        name={item.productId.productName}
                        MRP={item.productId.price}
                        strikePrice={item.productId.strikePrice}
                        favorite={item.productId.favorite}
                        offerType={'onMRP'}
                      />
                    </div>
                  {/each}
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Combo Offers Section -->
      {#if hasValidComboOffers}
        <div class="lg:mb-8 mb-2">
          <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
            Combo Offers
            <!-- <a href="/Products" class="text-blue-500 hover:underline">View All</a> -->
          </h2>
          <div class="flex overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            <div class="flex gap-4 lg:gap-6">
              {#each comboOffers as comboOffer (comboOffer._id)}
                <div class="">
                  <ProductCard
                    id={comboOffer._id}
                    image={`${imgUrl}/${comboOffer.image}`}
                    name={comboOffer.comboName}
                    MRP={comboOffer.comboPrice}
                    strikePrice={comboOffer.strikePrice}
                    comboOffer={true}
                  />
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- No Offers Message -->
      {#if showNoOffersMessage}
        <div class="text-center py-10">
          <p class="text-lg text-[#4F585E]">No offer products to preview</p>
        </div>
      {/if}
    {/if}
  </main>
</div>

<Footer />