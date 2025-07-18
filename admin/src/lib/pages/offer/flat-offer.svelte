<script lang="ts">
  import { _axios } from '$lib/_axios';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { offerStore, saveOfferData, updateOfferField, initializeOfferStore } from '$lib/pages/offer/offer-store';
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let isSubmitting = false;
  let percentage: string = '';
  let minPrd: string = '';
  let products: Array<any> = [];
  let isActive: boolean;
  let showDeleteDialog = false;
  let productToDelete: { productId: string; productName: string } | null = null;

  // Product search functionality
  let searchQuery = '';
  let productResults: any[] = [];
  let isLoading = false;
  let dropdownOpen = false;
  let isSearching = false;
  let page = 1;
  let hasMore = true;
  let selectedProduct: { _id: string; productName: string; price: number } | null = null;

  // Initialize component with store data
  onMount(() => {
    initializeOfferStore();
    searchProducts('');
  });

  // Subscribe to store changes
  $: if ($offerStore.data) {
    percentage = $offerStore.data.percentage?.toString() || '';
    minPrd = $offerStore.data.minPrd?.toString() || '';
    // Combine products and items (temporary until migration)
    products = ($offerStore.data.items || []).map(i => ({
      _id: i.productId._id,
      productName: i.productId.productName,
      price: i.productId.price,
      active: i.active
    }));
    isActive = $offerStore.data.isActive !== undefined ? $offerStore.data.isActive : true;
  }

  // Validate input
  function validateNumber(value: string): boolean {
    return /^[0-9]+$/.test(value);
  }

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

  // Product search functions
  async function searchProducts(term: string, isLoadMore = false) {
    if (isLoadMore && !hasMore) return;

    isLoading = true;
    isSearching = true;

    try {
      const currentPage = isLoadMore ? page : 1;
      const response = await _axios.get(`/product/all?q=${term}`);
      const allProducts = response.data.products || [];

      // Filter out products that are in other offers
      const filteredProducts = allProducts.filter((product: { negotiate: any; discount: number; onMRP: number }) => {
        return !(product.negotiate || product.discount > 0 || product.onMRP > 0);
      });

      if (isLoadMore) {
        productResults = [...productResults, ...filteredProducts];
      } else {
        productResults = filteredProducts;
      }

      hasMore = filteredProducts.length === 10;
      page = currentPage + 1;
    } catch (error) {
      console.error('Error searching products:', error);
      productResults = [];
    } finally {
      isLoading = false;
      isSearching = false;
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

  function selectProduct(product: { _id: string; productName: string; price: number }) {
    selectedProduct = product;
    searchQuery = product.productName;
    dropdownOpen = false;
  }

  async function addProduct() {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    // Check if product already exists
    if (products.some(p => p._id === selectedProduct?._id)) {
      toast.error('This product is already in the offer list');
      return;
    }

    try {
      const offerId = $offerStore.data?._id;
      if (!offerId) {
        toast.error('No offer ID found. Please save the offer first.');
        return;
      }

      const response = await _axios.post(`/offer/${offerId}/add-product`, {
        productId: selectedProduct._id,
        active: true // Default to active
      });

      if (response.data.status) {
        await initializeOfferStore();
        toast.success('Product added successfully');
        selectedProduct = null;
        searchQuery = '';
      } else {
        toast.error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('An error occurred while adding the product');
    }
  }

  // Update product active status
  async function updateProductActive(productId: string, active: boolean) {
    try {
      const offerId = $offerStore.data?._id;
      if (!offerId) {
        toast.error('No offer ID found.');
        return;
      }

      const response = await _axios.patch(`/offer/update-products`, {
        products: [{ productId, active }]
      }, {
        params: { id: offerId }
      });

      if (response.data.status) {
        await initializeOfferStore();
        toast.success('Product active status updated');
      } else {
        toast.error(response.data.message || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product active status:', error);
      toast.error('An error occurred while updating product status');
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateNumber(percentage)) {
      toast.error('Discount must be a valid number');
      return;
    }

    if (!validateNumber(minPrd)) {
      toast.error('Minimum product quantity must be a valid number');
      return;
    }

    // Update store with form values
    updateOfferField('percentage', parseInt(percentage));
    updateOfferField('minPrd', parseInt(minPrd));
    updateOfferField('isActive', isActive);

    // Save data
    isSubmitting = true;
    try {
      const result = await saveOfferData();
      if (result && result.status) {
        toast.success('Flat offer saved successfully');
      } else {
        toast.error('Failed to save flat offer');
      }
    } catch (error) {
      console.error('Error saving flat offer:', error);
      toast.error('An error occurred while saving');
    } finally {
      isSubmitting = false;
    }
  }

  function removeItem(productId: string, productName: string) {
    productToDelete = { productId, productName };
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
          productId: productToDelete.productId,
        },
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

  function calculateDiscountedPrice(price: number): number {
    if (!percentage) return price;
    return price - price * (parseInt(percentage) / 100);
  }
</script>

<div class="flex w-full gap-6 mt-10">
  <!-- Left Panel - Form -->
  <div class="w-full lg:w-1/3 p-4 shadow rounded-md bg-white dark:bg-gray-800">
    <div class="flex justify-between mb-4 items-center">
      <h3 class="text-lg font-medium">Flat Discount Offer</h3>
      <div class="flex items-center space-x-2">
        <Label for="active-status">Active</Label>
        <Switch
        id="active-status"
        checked={isActive}
        onCheckedChange={(e) => toggleOfferActiveStatus(!isActive)}
      />
      
      </div>
    </div>
    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Discount Percentage</Label>
      <Input
        type="number"
        placeholder="Enter discount percentage"
        bind:value={percentage}
        class="w-full"
      />
      {#if percentage && !validateNumber(percentage)}
        <span class="text-xs text-red-500">Must be a valid number</span>
      {/if}
    </div>

    <div class="mb-4">
      <Label class="block text-sm font-medium mb-1">Minimum Products (static)</Label>
      <Input
        type="number"
        placeholder="Enter minimum product quantity"
        bind:value={minPrd}
        class="w-full"
        disabled
      />
      {#if minPrd && !validateNumber(minPrd)}
        <span class="text-xs text-red-500">Must be a valid number</span>
      {/if}
    </div>

    <Button onclick={handleSubmit} class="w-full" disabled={isSubmitting}>
      {#if isSubmitting}
        <Icon icon="lucide:loader" class="h-4 w-4 animate-spin mr-2" />
        Saving...
      {:else}
        <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
        Save Offer
      {/if}
    </Button>
  </div>

  <!-- Right Panel - Products List -->
  <div class="w-2/3 pr-4 shadow bg-white p-5 rounded-lg">
    <div class="mb-4">
      <Label class="block text-lg font-medium mb-1">Add Products</Label>
      <div class="relative">
        <Input
          type="text"
          placeholder="Search for products..."
          bind:value={searchQuery}
          autocomplete="off"
          oninput={handleProductSearch}
          onfocus={handleFocus}
          onblur={handleBlur}
          class="w-1/2"
        />
        {#if dropdownOpen}
          <div
            class="dropdown-container absolute z-20 w-1/2 bg-white dark:bg-gray-900 mt-1 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto"
            onscroll={handleScroll}
          >
            {#if isSearching}
              <div class="p-2 text-gray-500">Searching...</div>
            {:else if productResults.length > 0}
              {#each productResults as product}
                <div
                  class="p-2 hover:bg-gray-100 w-full dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                  onmousedown={() => selectProduct({
                    _id: product._id,
                    productName: product.productName,
                    price: product.price
                  })}
                >
                  <p class="text-black dark:text-white">{product.productName}</p>
                  <p class="text-black dark:text-white">₹{product.price}</p>
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
    {#if selectedProduct}
      <div class="mt-2 w-1/2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <div onclick={() => {
          selectedProduct = null;
          searchQuery = '';
        }} class="flex justify-end w-full">
          <Icon icon="lucide:x" class="h-4 w-4 mr-1 text-red-600" />
        </div>
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium text-lg">{selectedProduct.productName}</p>
            <div class="flex w-full justify-between gap-10 items-center">
              <p class="text-base"><span class="font-medium">Price:</span> ₹{selectedProduct.price.toFixed(2)}</p>
              <p class="text-base"><span class="font-medium">Offer Price:</span> ₹{calculateDiscountedPrice(selectedProduct.price).toFixed(2)}</p>
            </div>
          </div>
          <Button onclick={addProduct} size="sm" class="ml-2">
            <Icon icon="lucide:plus" class="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    {/if}
    <div class="flex justify-between">
      <h3 class="text-lg font-medium mb-2">Products in Offer</h3>
    </div>

    {#if products.length === 0}
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
              <th class="py-2 px-4 text-left font-medium">Original Price</th>
              <th class="py-2 px-4 text-left font-medium">Discounted Price</th>
              <th class="py-2 px-4 text-center font-medium">Active</th>
              <th class="py-2 px-4 text-right font-medium w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each products as product}
              <tr class="border-t hover:bg-gray-50">
                <td class="py-2 px-4">
                  <div>
                    <span class="font-medium text-gray-600">{product.productName || 'Unknown Product'}</span>
                  </div>
                </td>
                <td class="py-2 px-4 text-gray-600">
                  ₹{(product.price || 0).toFixed(2)}
                </td>
                <td class="py-2 px-4 text-gray-600">
                  ₹{calculateDiscountedPrice(product.price || 0).toFixed(2)}
                </td>
                <td class="text-center">
                  <Switch
                  id={`active-status-${product._id}`}
                  checked={product.active}
                  onCheckedChange={(e) => toggleProductActiveStatus(product._id, !product.active)}
                />
                </td>
                <td class="py-2 px-4 text-right">
                  <Button
                    type="button"
                    size="icon"
                    class="h-8 w-8 bg-red-600 hover:bg-red-700"
                    onclick={() => removeItem(product._id, product.productName)}
                  >
                    <Icon icon="lucide:trash-2" class="h-4 w-4 z-20" />
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if showDeleteDialog && productToDelete}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 class="text-lg font-medium mb-4">Confirm Deletion</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Are you sure you want to remove <span class="font-medium">{productToDelete.productName}</span> from the offer list?
      </p>
      <div class="flex justify-end space-x-2">
        <Button variant="outline" onclick={cancelDelete}>Cancel</Button>
        <Button class="bg-red-600 hover:bg-red-700" onclick={confirmDelete}>Confirm</Button>
      </div>
    </div>
  </div>
{/if}
