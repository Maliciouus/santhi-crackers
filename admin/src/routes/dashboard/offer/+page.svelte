<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import Flat from '$lib/pages/offer/flat-offer.svelte';
    import Mrp from '$lib/pages/offer/mrp.svelte';
    import Negotiate from '$lib/pages/offer/negotiate.svelte';
    import Discount from '$lib/pages/offer/discount.svelte';
    import Icon from '@iconify/svelte';
    import { offerStore, changeOfferMode } from '$lib/pages/offer/offer-store';
    import { onMount } from 'svelte';
  
    onMount(() => {
      // Initialize the store with the current mode
      if ($offerStore.mode) {
        changeOfferMode($offerStore.mode);
      }
    });
  
    // Handle tab change
    function handleTabChange(value:any) {
      changeOfferMode(value);
    }
  </script>
  
  <svelte:head>
    <title>Dashboard | Offers</title>
    <meta name="description" content="Offer management dashboard" />
  </svelte:head>
  <Tabs.Root 
    class="w-full p-4" 
    value={$offerStore.mode} 
    onValueChange={handleTabChange}
    
  >
    <Tabs.List>
      <Tabs.Trigger value="flat" class="flex items-center">
        <Icon class="w-4 h-4" icon="hugeicons:discount" />
        <span class="ml-2">Flat % Discount</span>
      </Tabs.Trigger>
      <Tabs.Trigger value="discount" class="flex items-center">
        <Icon class="w-4 h-4" icon="icon-park-outline:tag-one" />
        <span class="ml-2">MRP Discount</span>
      </Tabs.Trigger>
      <Tabs.Trigger value="negotiate" class="flex items-center">
        <Icon class="w-4 h-4" icon="tdesign:user-talk-1" />
        <span class="ml-2">Negotiable</span>
      </Tabs.Trigger>
      <Tabs.Trigger value="mrp" class="flex items-center">
        <Icon class="w-4 h-4" icon="material-symbols:currency-rupee-circle-outline" />
        <span class="ml-2">On MRP Purchase</span>
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="flat">
      <Flat />
    </Tabs.Content>
    <Tabs.Content value="discount">
      <Discount />
    </Tabs.Content>
    <Tabs.Content value="mrp">
      <Mrp />
    </Tabs.Content>
    <Tabs.Content value="negotiate">
      <Negotiate />
    </Tabs.Content>
  </Tabs.Root>