<!-- QuoteSection.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import Icon from '@iconify/svelte';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js"; // Import ShadCN Skeleton

  // Define the type for the quote data based on the API response
  interface Quote {
    _id: string;
    quote: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }

  interface QuoteResponse {
    message: string;
    data: Quote[];
    status: boolean;
  }

  // Fetch the quote using createQuery
  const quoteQuery = createQuery<QuoteResponse, Error>({
    queryKey: ['quote'],
    queryFn: async () => {
      const response = await _axios.get('/quotes/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
</script>

<div class="pt-10 px-4 md:px-6 lg:px-8">
  <div class="bg-[#F5FAF9] rounded-lg relative md:py-10 py-6">
    <!-- Decorative Elements -->
    <div class="absolute left-0 top-0 h-full">
      <img
        src="/images/circle.png"
        class="rounded-t-lg h-[60%] w-auto"
        alt="Decorative Circle 1"
      />
    </div>
    <div class="absolute left-32 bottom-0">
      <img
        src="/images/circle1.png"
        class="h-[30%] w-auto"
        alt="Decorative Circle 2"
      />
    </div>
    <div class="absolute right-48 bottom-5">
      <img
        src="/svg/diamond.svg"
        class="h-[30%] w-auto"
        alt="Decorative Diamond"
      />
    </div>
    <div class="absolute right-0 top-0">
      <img
        src="/svg/curve.svg"
        class="!lg:h-[30%] !h-[10%] w-auto"
        alt="Decorative Curve"
      />
    </div>

    <!-- Quote Content -->
    <div class="lg:w-1/2 md:w-3/4 w-5/6 flex justify-center items-center mx-auto px-4 sm:px-6 lg:px-8">
      {#if $quoteQuery.isLoading || $quoteQuery.isError}
        <!-- Skeleton Loader -->
        <div class="space-y-2">
          <span class="!font-bizGothic text-[#52827F] text-6xl inline-block !rotate-180">"</span>
          <Skeleton class="h-8 w-full max-w-[800px] mx-auto bg-[#DFEDEA]" />
          <span class="!font-bizGothic text-[#52827F] text-6xl flex justify-end">"</span>
        </div>
      {:else if $quoteQuery.data && $quoteQuery.data.data.length > 0}
        <div class=" text-gray-800">
          <p class="relative">
            <span class="!font-bizGothic text-[#52827F] md:text-6xl text-4xl inline-block !rotate-180 absolute md:-top-12 md:-left-12 -top-6 -left-6">"</span>
            <span class="relative lg:text-2xl md:text-xl text-base">
              {$quoteQuery.data.data[0].quote}
              <span class="!font-bizGothic text-[#52827F] md:text-6xl text-4xl absolute md:-bottom-12 -bottom-7 md:px-3 px-1">"</span>
            </span>
          </p>
        </div>
      {:else}
        <p class="text-gray-600 italic">No quotes available.</p>
      {/if}
    </div>
  </div>
</div>