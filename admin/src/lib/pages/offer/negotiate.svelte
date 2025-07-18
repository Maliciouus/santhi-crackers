<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { offerStore, saveOfferData, updateOfferField, initializeOfferStore } from '$lib/pages/offer/offer-store';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Icon from '@iconify/svelte';
  import { _axios } from '$lib/_axios';

  let isSubmitting = false;
  let isActive: boolean;
  let searchQuery = '';
  let productResults: any[] = [];
  let isLoading = false;
  let newProduct = { productId: '', productName: '', successPercentage: '', failurePercentage: '', limit: '',MOQ:'' };
  let dropdownOpen = false;
  let isSearching = false;
  let page = 1;
  let hasMore = true;
  let showDeleteDialog = false;
  let productToDelete: { productId: string; productName: string } | null = null;
  let localItems: any[] = [];

  onMount(async () => {
    await initializeOfferStore();
    await searchProducts('');
  });

  async function toggleProductActiveStatus(productId: string, active: boolean) {
  try {
    const offerId = $offerStore.data?._id;
    if (!offerId) {
      toast.error('No offer ID found.');
      return;
    }

    const response = await _axios.patch(`/offer/product-active/${offerId}`, {
      productId,
      active,
    });

    if (response.data.status) {
      await initializeOfferStore();
      toast.success(`Product ${active ? 'activated' : 'deactivated'} in offer successfully`);
    } else {
      toast.error(response.data.message || 'Failed to toggle product active status');
    }
  } catch (error) {
    console.error('Error toggling product active status:', error);
    toast.error('An error occurred while toggling product active status');
  }
}

async function toggleOfferActiveStatus(active: boolean) {
  try {

    const offerId = $offerStore.data?._id;
    if (!offerId) {
      toast.error('No offer ID found.');
      return;
    }

    const response = await _axios.patch(`/offer/offer-active/${offerId}`, {
      isActive: active,
    });

    if (response.data.status) {
      await initializeOfferStore();
      toast.success(`Offer ${active ? 'activated' : 'deactivated'} successfully`);
    } else {
      toast.error(response.data.message || 'Failed to toggle offer active status');
    }
  } catch (error) {
    console.error('Error toggling offer active status:', error);
    toast.error('An error occurred while toggling offer active status');
  }
}

  $: if ($offerStore.data && $offerStore.data.items) {
    localItems = $offerStore.data.items.map(item => {
      const product = typeof item.productId === 'object' && item.productId ? item.productId : { _id: item.productId, productName: '', price: 0 };
      return {
        productId: product._id || item.productId,
        productName: product.productName || 'Unknown Product',
        price: product.price || 0,
        MOQ: product.negMOQ || 0,
        active: item.active,
        successPercentage: item.successPercentage || 0,
        failurePercentage: item.failurePercentage || 0,
        limit: product.negotiateLimit || 0, // Added limit
        strikePrice: product.strikePrice || 0
      };
    });
  }

  $: if ($offerStore.data) {
    isActive = $offerStore.data.isActive !== undefined ? $offerStore.data.isActive : true;
  }

  async function searchProducts(term: string, isLoadMore = false) {
    if (isLoadMore && !hasMore) return;

    isLoading = true;
    isSearching = true;

    try {
      const currentPage = isLoadMore ? page : 1;
      const response = await _axios.get(`/product/all?q=${term}`);
      const newProducts = response.data.products || [];
      const filteredProducts = newProducts.filter(product => !(product.flat && product.flat > 0));
      if (isLoadMore) {
        productResults = [...productResults, ...filteredProducts];
      } else {
        productResults = filteredProducts;
      }

      hasMore = newProducts.length === 10;
      page = currentPage + 1;
    } catch (error) {
      console.error('Error searching products:', error);
      productResults = [];
    } finally {
      isLoading = false;
      isSearching = false;
    }
  }

  function validateNumber(value: string): boolean {
    return /^[0-9]+$/.test(value) && parseInt(value) >= 0;
  }

  function removeItem(index: number) {
    openDeleteDialog(index);
  }

  function openDeleteDialog(index: number) {
    productToDelete = localItems[index];
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!productToDelete) return;

    try {
      const offerId = $offerStore.data?._id;
      if (!offerId) {
        toast.error('No offer ID found. Please save the offer first.');
        return;
      }

      const response = await _axios.delete(`/offer/remove-product`, {
        params: {
          id: offerId,
          productId: productToDelete.productId
        }
      });

      if (response.data.status) {
        await initializeOfferStore();
        toast.success('Product removed successfully');
      } else {
        toast.error(response.data.message || 'Failed to remove product');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('An error occurred while removing the product');
    } finally {
      showDeleteDialog = false;
      productToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteDialog = false;
    productToDelete = null;
  }

  function selectProduct(product: { _id: string; productName: string; price: number; strikePrice?: number }) {
    newProduct.productId = product._id;
    newProduct.productName = product.productName;
    searchQuery = product.productName;
    dropdownOpen = false;
  }

  async function addNewProduct() {
    if (
      !newProduct.productId ||
      !validateNumber(newProduct.successPercentage) ||
      !validateNumber(newProduct.failurePercentage) ||
      !validateNumber(newProduct.limit)
    ) {
      toast.error('Please select a product and enter valid success percentage, failure percentage, and negotiation limit');
      return;
    }

    const existingProductIndex = localItems.findIndex(item => item.productId === newProduct.productId);

    if (existingProductIndex >= 0) {
      toast.error('This product is already in the negotiate list');
      newProduct = { productId: '', productName: '', successPercentage: '', failurePercentage: '', limit: '',MOQ:'' };
      searchQuery = '';
      return;
    }

    try {
      const offerId = $offerStore.data?._id;
      if (!offerId) {
        toast.error('No offer ID found. Please save the offer first.');
        return;
      }

      const response = await _axios.post(`/offer/${offerId}/add-product`, {
        productId: newProduct.productId,
        successPercentage: parseInt(newProduct.successPercentage),
        failurePercentage: parseInt(newProduct.failurePercentage),
        limit: parseInt(newProduct.limit),
        MOQ:parseInt(newProduct.MOQ)
      });

      if (response.data.status) {
        await initializeOfferStore();
        toast.success('Product added successfully');
      } else {
        toast.error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('An error occurred while adding the product');
    }

    newProduct = { productId: '', productName: '', successPercentage: '', failurePercentage: '', limit: '',MOQ:'' };
    searchQuery = '';
  }

  function updateSuccessPercentage(index: number, value: string) {
    if (validateNumber(value)) {
      localItems = localItems.map((item, i) => i === index ? { ...item, successPercentage: parseInt(value) } : item);
    }
  }

  function updateFailurePercentage(index: number, value: string) {
    if (validateNumber(value)) {
      localItems = localItems.map((item, i) => i === index ? { ...item, failurePercentage: parseInt(value) } : item);
    }
  }

  function updateLimit(index: number, value: string) {
    if (validateNumber(value)) {
      localItems = localItems.map((item, i) => i === index ? { ...item, limit: parseInt(value) } : item);
    }
  }
  function updateMOQ(index: number, value: string) {
    if (validateNumber(value)) {
      localItems = localItems.map((item, i) => i === index ? { ...item, MOQ: parseInt(value) } : item);
    }
  }

  async function handleSubmit() {
  if (localItems.length === 0) {
    toast.error('Please add at least one product with negotiate details');
    return;
  }

  isSubmitting = true;
  try {
    const offerId = $offerStore.data?._id;
    if (!offerId) {
      toast.error('No offer ID found. Please save the offer first.');
      return;
    }

    // First update the products with their negotiation details
    const updateResponse = await _axios.patch(`/offer/update-products`, {
      products: localItems.map(item => ({
        productId: item.productId,
        successPercentage: item.successPercentage,
        failurePercentage: item.failurePercentage,
        limit: item.limit,
        MOQ:item.MOQ
      }))
    }, {
      params: { id: offerId }
    });

    if (updateResponse.data.status) {
      // Update the offer store with the latest items
      updateOfferField('items', localItems.map(item => ({
        productId: item.productId,
        successPercentage: item.successPercentage,
        failurePercentage: item.failurePercentage,
        limit: item.limit,
        MOQ:item.MOQ
      })));

      // Update active status
      updateOfferField('isActive', isActive);

      // Here we're considering the update successful based on the first API call
      // No need for another saveOfferData() call which might be failing
      await initializeOfferStore();
      toast.success('Negotiate offer saved successfully');
    } else {
      toast.error(updateResponse.data.message || 'Failed to update negotiate details');
    }
  } catch (error) {
    console.error('Error saving negotiate offer:', error);
    toast.error('An error occurred while saving');
  } finally {
    isSubmitting = false;
  }
}

  function handleProductSearch(event: { target: { value: any } }) {
    const term = event.target.value;
    searchQuery = term;
    page = 1;
    hasMore = true;
    searchProducts(term);
  }

  function handleFocus() {
    dropdownOpen = true;
  }

  function handleBlur() {
    setTimeout(() => {
      dropdownOpen = false;
    }, 200);
  }

  function handleScroll(event: Event) {
    const dropdown = event.target as HTMLElement;
    if (dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 10) {
      searchProducts(searchQuery, true);
    }
  }
</script>

<div class="flex w-full gap-6 mt-10">
  <div class="w-full lg:w-1/3 p-4 shadow rounded-md bg-white dark:bg-gray-800">
    <h3 class="text-lg font-medium mb-4">Add Negotiable Product</h3>

    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Select Product</Label>
      <div class="relative">
        <Input
          id="product-search"
          type="text"
          placeholder="Select or search for a product..."
          bind:value={searchQuery}
          autocomplete="off"
          oninput={handleProductSearch}
          onfocus={handleFocus}
          onblur={handleBlur}
          class="w-full"
        />
        {#if dropdownOpen}
          <div
            class="dropdown-container absolute z-20 w-full bg-white dark:bg-gray-900 mt-1 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto"
            on:scroll={handleScroll}
          >
            {#if isSearching}
              <div class="p-2 text-gray-500">Searching...</div>
            {:else if productResults.length > 0}
              {#each productResults as product}
                <div
                  class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                  on:mousedown={() =>
                    selectProduct({
                      _id: product._id,
                      productName: product.productName,
                      price: product.price,
                      strikePrice: product.strikePrice
                    })
                  }
                >
                  <span class="text-black dark:text-white">{product.productName}</span>
                  <span class="text-black dark:text-white">₹{product.price}</span>
                </div>
              {/each}
              {#if hasMore && !isSearching}
                <div class="p-2 text-gray-500">Loading more...</div>
              {/if}
            {:else}
              <div class="p-2 text-gray-500">No products found</div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Negotiation Limit (₹)</Label>
      <Input
        type="number"
        placeholder="Enter negotiation limit"
        bind:value={newProduct.limit}
        class="w-full"
        min="0"
      />
      {#if newProduct.limit && !validateNumber(newProduct.limit)}
        <span class="text-xs text-red-500">Must be a valid non-negative number</span>
      {/if}
    </div>
    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Minimum order qunatity (pcs)</Label>
      <Input
        type="number"
        placeholder="Enter MOQ"
        bind:value={newProduct.MOQ}
        class="w-full"
        min="0"
      />
      {#if newProduct.MOQ && !validateNumber(newProduct.MOQ)}
        <span class="text-xs text-red-500">Must be a valid number</span>
      {/if}
    </div>
    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Success Discount (%)</Label>
      <Input
        type="number"
        placeholder="Enter success discount"
        bind:value={newProduct.successPercentage}
        class="w-full"
        min="0"
      />
      {#if newProduct.successPercentage && !validateNumber(newProduct.successPercentage)}
        <span class="text-xs text-red-500">Must be a valid non-negative number</span>
      {/if}
    </div>
    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Failure Discount (%)</Label>
      <Input
        type="number"
        placeholder="Enter failure discount"
        bind:value={newProduct.failurePercentage}
        class="w-full"
        min="0"
      />
      {#if newProduct.failurePercentage && !validateNumber(newProduct.failurePercentage)}
        <span class="text-xs text-red-500">Must be a valid non-negative number</span>
      {/if}
    </div>

    <Button onclick={addNewProduct} class="w-full">
      <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
      Add Product
    </Button>
  </div>

  <div class="w-2/3 pr-4 shadow bg-white p-5 rounded-lg">
    <div class="mb-4 flex justify-between">
      <h3 class="text-lg font-medium mb-2">Negotiable Products</h3>
      <div class="flex items-center space-x-2">
        <Label for="active-status">Active</Label>
        <Switch
        id="active-status"
        checked={isActive}
        onCheckedChange={(e) => toggleOfferActiveStatus(!isActive)}
      />
      </div>
    </div>

    {#if localItems.length === 0}
      <div class="text-center py-16 border rounded-md bg-gray-50">
        <Icon icon="lucide:package" class="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p class="text-gray-500">No products added yet.</p>
        <p class="text-sm text-gray-400">Add products from the form on the left</p>
      </div>
    {:else}
      <div class="border rounded-md overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-100 text-black">
            <tr>
              <th class="py-2 px-4 text-left font-medium">Product</th>
              <th class="py-2 px-4 text-left font-medium">Price</th>
              <th class="py-2 px-4 text-left font-medium w-32">Negotiation Limit (₹)</th>
              <th class="py-2 px-4 text-left font-medium w-32">MOQ (pcs)</th>
              <th class="py-2 px-4 text-left font-medium w-32">Success Discount (%)</th>
              <th class="py-2 px-4 text-left font-medium w-32">Failure Discount (%)</th>
              <th class="py-2 px-4 text-right font-medium w-16">Active</th>
              <th class="py-2 px-4 text-right font-medium w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each localItems as item, index}
              <tr class="border-t hover:bg-gray-50">
                <td class="py-2 px-4">
                  <div>
                    <span class="font-medium text-gray-600 ">{item.productName}</span>
                  </div>
                </td>
                <td class="py-2 px-4">
                  <div>
                    <span class="font-medium text-gray-600 whitespace-nowrap">₹{item.price}</span>
                  </div>
                </td>
                <td class="py-2 px-4">
                  <Input
                    type="number"
                    value={item.limit}
                    class="h-8"
                    min="0"
                    oninput={(e) => updateLimit(index, e.currentTarget.value)}
                  />
                </td>
                <td class="py-2 px-4">
                  <Input
                    type="number"
                    value={item.MOQ}
                    class="h-8"
                    min="0"
                    oninput={(e) => updateMOQ(index, e.currentTarget.value)}
                  />
                </td>
                <td class="py-2 px-4">
                  <Input
                    type="number"
                    value={item.successPercentage}
                    class="h-8"
                    min="0"
                    oninput={(e) => updateSuccessPercentage(index, e.currentTarget.value)}
                  />
                </td>
                <td class="py-2 px-4">
                  <Input
                    type="number"
                    value={item.failurePercentage}
                    class="h-8"
                    min="0"
                    oninput={(e) => updateFailurePercentage(index, e.currentTarget.value)}
                  />
                </td>
                <td class="text-center">
                  <Switch
                  id={`active-status-${item._id}`}
                  checked={item.active}
                  onCheckedChange={(e) => toggleProductActiveStatus(item.productId, !item.active)}
                />
                </td>
                <td class="py-2 px-4 text-right">
                  <Button
                    type="button"
                    size="icon"
                    class="h-8 w-8 bg-red-600 hover:bg-red-700"
                    onclick={() => removeItem(index)}
                  >
                    <Icon icon="lucide:trash-2" class="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-between items-center">
        <div></div>
        <Button onclick={handleSubmit} disabled={isSubmitting} class="px-6">
          {#if isSubmitting}
            <Icon icon="lucide:loader" class="h-4 w-4 animate-spin mr-2" />
            Saving...
          {:else}
            <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
            Save Changes
          {/if}
        </Button>
      </div>
    {/if}
  </div>
</div>

{#if showDeleteDialog && productToDelete}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 class="text-lg font-medium mb-4">Confirm Deletion</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Are you sure you want to remove <span class="font-medium">{productToDelete.productName}</span> from the negotiate list?
      </p>
      <div class="flex justify-end space-x-2">
        <Button variant="outline" onclick={cancelDelete}>Cancel</Button>
        <Button class="bg-red-600 hover:bg-red-700" onclick={confirmDelete}>Confirm</Button>
      </div>
    </div>
  </div>
{/if}