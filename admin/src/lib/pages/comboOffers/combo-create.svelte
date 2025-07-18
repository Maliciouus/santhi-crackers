<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
    import * as Select from '$lib/components/ui/select';
	import { imgUrl } from '$lib/config';
	import { _comboSchema, type ComboStoreProps } from '$lib/pages/comboOffers/combo-store';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { onMount } from 'svelte';

	interface Product {
		_id: string;
		productName: string;
		description?: string;
		price: number;
		strikePrice?: number;
		images?: string[];
		category?: {
			_id: string;
			name: string;
		};
		brand?: {
			_id: string;
			name: string;
		};
		ratings?: number;
		productCode?: string;
		topSeller?: boolean;
		gst?: number;
		active?: boolean;
		isDeleted?: boolean;
		options?: Array<{
			title: string;
			values: string[];
			_id: string;
		}>;
		createdAt?: string;
		updatedAt?: string;
	}

	let { comboStore }: ComboStoreProps = $props();
	let searchQuery = $state('');
	let edit = $state(false);
	let image = $state<File | null>(null);
	let existingImageUrl = $state<string | null>(null);
	let selectedProducts = $state<Array<{ productId: string; quantity: number }>>([]);
	let availableProducts = $state<Product[]>([]);
	let filteredProducts = $state<Product[]>([]);
	let comboImageInput: HTMLInputElement | null = null;

    let tempProduct = $state<{ productId: string; productName: string } | null>(null);
let tempQuantity = $state<number>(1);

	let dropdownOpen = $state<boolean[]>([]);
	let searchQueries = $state<string[]>([]);
	$effect(() => {
		edit = $comboStore.mode === 'create' && $comboStore.id ? true : false;

		if (edit && $comboStore.image) {
			existingImageUrl = $comboStore.image;
			selectedProducts = $comboStore.productsIncluded || [];
		} else if (!edit) {
			existingImageUrl = null;
			image = null;
			selectedProducts = [];
		}

		comboImageInput = document.getElementById('combo-image') as HTMLInputElement;

		// Load available products
		fetchProducts();
	});


onMount(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
        if (!event.target) return;

        // Check if the click was outside the dropdown
        const target = event.target as HTMLElement;
        const isDropdownClick = target.closest('.dropdown-container') || 
                               target.closest('#product-search');
        
        // If click was outside dropdown area, close all dropdowns
        if (!isDropdownClick) {
            dropdownOpen = dropdownOpen.map(() => false);
            dropdownOpen[0] = false; // Ensure the main dropdown is closed too
        }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
        document.removeEventListener('click', handleClickOutside);
    };
});;
	async function fetchProducts(query?: string) {
		try {
			const response = await _axios.get(`/product/all?limit=100&q=${query || ''}`);
			if (response.data.status) {
				availableProducts = response.data.products || [];
				filteredProducts = availableProducts; // Initialize filtered products
			}
		} catch (error) {
			console.error('Failed to fetch products:', error);
			toast.error('Failed to load products list');
		}
	}

    function addProduct() {
    if (!tempProduct || tempQuantity <= 0) {
        toast.error('Please select a product and enter a valid quantity.');
        return;
    }

    // Check if the product is already in the list
    const isProductAlreadyAdded = selectedProducts.some(
        (p) => p.productId === tempProduct.productId
    );

    if (isProductAlreadyAdded) {
        toast.error('This product is already added to the combo.');
        return;
    }

    // Add the product to the list
    selectedProducts = [...selectedProducts, { productId: tempProduct.productId, quantity: tempQuantity }];

    // Reset the temporary selection
    tempProduct = null;
    tempQuantity = 1;
    searchQuery = '';
}

function removeProduct(index: number) {

    selectedProducts.splice(index, 1);

    selectedProducts = [...selectedProducts];

    searchQueries.splice(index, 1);
    dropdownOpen.splice(index, 1);


    searchQueries = [...searchQueries];
    dropdownOpen = [...dropdownOpen];
}

function updateProduct(index: number, value: number) {
    if (value <= 0) {
        toast.error('Quantity must be a positive number.');
        return;
    }

    selectedProducts = selectedProducts.map((product, i) => {
        if (i === index) {
            return { ...product, quantity: value };
        }
        return product;
    });
}

	const createComboMutation = createMutation({
		mutationFn: (data: FormData) =>
			edit
				? _axios.patch(`/combo-offer/update/${$comboStore.id}`, data, {
						headers: { 'Content-Type': 'multipart/form-data' }
					})
				: _axios.post('/combo-offer/create', data, {
						headers: { 'Content-Type': 'multipart/form-data' }
					}),

		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['combo fetch']
			});

			if (data.status || data.ok) {
				$comboStore.mode = 'list';

				reset();
				image = null;
				existingImageUrl = null;
				selectedProducts = [];

				cleanImage();

				goto('/dashboard/comboOffer');
				toast(edit ? 'Combo Offer Updated ✅' : 'Combo Offer Created ✅');
			} else {
				toast.error(data.message);
			}
		},
		onError(error) {
			console.error('Error:', error);
			toast.error('An error occurred while processing your request.');
		}
	});

	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
    defaults(zod(_comboSchema)),
    {
        SPA: true,
        validationMethod: 'oninput',
        validators: zod(_comboSchema),
        clearOnSubmit: 'none',
        invalidateAll: false,
        resetForm: false,
        async onSubmit() {
            const { valid } = await validateForm({
                focusOnError: true
            });

            if (!valid) {
                toast.error('Please fill out all required fields correctly.');
                return;
            }

            if (!edit && !image) {
                toast.error('Image is required when creating a new combo offer.');
                return;
            }

            if (selectedProducts.length <= 1) {
                toast.error('Please add at least two product to the combo.');
                return;
            }

            // Validate all products have valid IDs and quantities
            const invalidProduct = selectedProducts.find(
                (p) => !p.productId || p.quantity <= 0
            );

            if (invalidProduct) {
                toast.error('All products must have a valid product ID and quantity.');
                return;
            }

            // Create FormData
            let formData = new FormData();

            // Append all fields to FormData
            formData.append('comboName', $form.comboName);
            formData.append('comboDescription', $form.comboDescription);
            formData.append('comboPrice', $form.comboPrice.toString());
            formData.append('strikePrice', $form.strikePrice.toString());

            // Append productsIncluded as a JSON string
            formData.append('productsIncluded', JSON.stringify(selectedProducts));

            // Append the image if it exists
            if (image) formData.append('image', image);

            // Trigger the mutation
            $createComboMutation.mutate(formData);
        }
    }
);

	$effect(() => {
		if (edit) {
			$form.comboName = $comboStore.comboName;
			$form.comboDescription = $comboStore.comboDescription;
			$form.comboPrice = $comboStore.comboPrice;
			$form.strikePrice = $comboStore.strikePrice || 0;
		} else {
			reset();
		}
	});

	function cleanImage() {
		image = null;
		existingImageUrl = null;
		if (comboImageInput) comboImageInput.value = '';
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		if (file.size > 200000) {
			cleanImage();
			toast.error('Image size is too large! Max size is 200kb');
			return;
		}

		const img = new Image();
		img.src = URL.createObjectURL(file);

		img.onload = () => {
			const { width, height } = img;

			if (width < 100 || height < 100) {
				toast.error('Image dimensions must be at least 100x100 pixels.');
				cleanImage();
				return;
			}

			image = file;
			existingImageUrl = null;
		};

		img.onerror = () => {
			cleanImage();
			toast.error('Invalid image file.');
		};
	}

	function filterProducts(query: string) {
		searchQuery = query;
		if (query) {
			filteredProducts = availableProducts.filter(product =>
				product.productName.toLowerCase().includes(query.toLowerCase())
			);
			if (filteredProducts.length === 0) {
				fetchProducts(query);
			}
		} else {
			filteredProducts = availableProducts;
		}
	}

	function getProductName(productId: string): string {
		const product = availableProducts.find(p => p._id === productId);
		return product ? product.productName : 'Select a product';
	}
    function handleSearchInput(event: Event, index: number) {
    const target = event.target as HTMLInputElement;
    const query = target.value;

    // Update the search query for this index
    searchQueries[index] = query;

    // Open the dropdown when searching
    dropdownOpen[index] = true;

    // If very few results, fetch more from API
    const filtered = filterProductsForIndex(query, index);
    if (filtered.length < 5) {
        fetchProducts(query);
    }
}
    function selectProduct(productId: string, index: number) {
		// Update the product
		updateProduct(index, 'productId', productId);
		
		// Set the search query to product name for better UX
		const product = availableProducts.find(p => p._id === productId);
		if (product) {
			searchQueries[index] = product.productName;
		}
		
		// Close the dropdown after selection
		dropdownOpen[index] = false;
	}
    function filterProductsForIndex(query: string, index: number) {
        // Get the list of product IDs already selected in other inputs
        const selectedProductIds = selectedProducts
            .map((p, i) => (i !== index ? p.productId : '')) // Exclude the current index
            .filter(id => id !== ''); // Remove empty strings

        // Filter available products based on the query and exclude already selected products
        if (query) {
            return availableProducts.filter(product =>
                product.productName.toLowerCase().includes(query.toLowerCase()) &&
                !selectedProductIds.includes(product._id) // Exclude already selected products
            );
        }
        return availableProducts.filter(product => !selectedProductIds.includes(product._id));
    }
</script>

<div class="max-w-[80%] mx-auto text-maintext h-[calc(100vh-120px)] overflow-y-auto hidescrollbarthumb">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="comboName">Combo Name</Label>
			<Input
				id="comboName"
				autocomplete='off'
				class="pr-10 mt-1"
				placeholder="Ex: Summer Special Combo..."
				aria-invalid={$errors.comboName ? 'true' : undefined}
				bind:value={$form.comboName}
				{...$constraints.comboName}
			/>
			{#if $errors.comboName}<span class="invalid text-xs text-red-500">{$errors.comboName}</span>{/if}
		</div>

		<div>
			<Label for="comboDescription">Description</Label>
			<Textarea
				id="comboDescription"
				class="pr-10 mt-1"
				placeholder="Ex: Special combo offer with amazing products..."
				rows={3}
				aria-invalid={$errors.comboDescription ? 'true' : undefined}
				bind:value={$form.comboDescription}
				{...$constraints.comboDescription}
			/>
			{#if $errors.comboDescription}<span class="invalid text-xs text-red-500">{$errors.comboDescription}</span>{/if}
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="comboPrice">Combo Price</Label>
				<Input
					id="comboPrice"
					autocomplete='off'
					class="pr-10 mt-1"
					type="number"
					placeholder="Ex: 99.99"
					aria-invalid={$errors.comboPrice ? 'true' : undefined}
					bind:value={$form.comboPrice}
					{...$constraints.comboPrice}
				/>
				{#if $errors.comboPrice}<span class="invalid text-xs text-red-500">{$errors.comboPrice}</span>{/if}
			</div>

			<div>
				<Label for="strikePrice">Strike Price (Original)</Label>
				<Input
					id="strikePrice"
					class="pr-10 mt-1"
					autocomplete='off'
					type="number"
					placeholder="Ex: 129.99"
					aria-invalid={$errors.strikePrice ? 'true' : undefined}
					bind:value={$form.strikePrice}
					{...$constraints.strikePrice}
				/>
				{#if $errors.strikePrice}<span class="invalid text-xs text-red-500">{$errors.strikePrice}</span>{/if}
			</div>
		</div>

		<div>
			<Label for="combo-image">Combo Image <span class="text-gray-500 text-xs">(Min 100 X 100) ~ 200kb</span></Label>
			<Input
				id="combo-image"
				required={!edit}
				class="pr-10 mt-1"
				type="file"
				accept=".jpg, .jpeg, .png, .webp"
				onchange={handleImageUpload}
			/>
		</div>

		{#if image || existingImageUrl}
			<p class="text-xs text-zinc-500">* Click to remove image</p>
			<div class="flex gap-4">
				<div class="flex flex-col justify-center items-start gap-2 mt-2 hover:cursor-pointer hover:shadow-lg">
					<button onclick={() => cleanImage()}>
						<!-- svelte-ignore a11y_img_redundant_alt -->
						<img
							class="w-[100px] h-[100px] object-cover rounded-md"
							src={image ? URL.createObjectURL(image) : `${imgUrl}${existingImageUrl}`}
							alt="Combo Image"
						/>
					</button>
				</div>
			</div>
		{/if}

        <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
                <Label>Products Included</Label>
            </div>
        
            <!-- List of Added Products -->
                {#each selectedProducts as product, index}
                    <div class="flex gap-2 items-end mb-2  dark:bg-gray-800 p-2 rounded">
                        <div class="flex-grow">
                            <!-- <Label for={`product-${index}`} class="text-xs">Product</Label> -->
                            <Input
                                id={`product-${index}`}
								autocomplete='off'
                                type="text"
                                value={getProductName(product.productId)}
                                readonly
                                class="w-full mt-1"
                            />
                        </div>
                        <div class="w-24">
                            <!-- <Label for={`qty-${index}`} class="text-xs">Quantity</Label> -->
                            <Input
                                id={`qty-${index}`}
								autocomplete='off'
                                type="number"
                                min="1"
                                class="mt-1"
                                bind:value={product.quantity}
                                onchange={(e) => updateProduct(index, parseInt(e.currentTarget.value))}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            class="mb-0"
                            onclick={() => removeProduct(index)}
                        >
                            Remove
                        </Button>
                    </div>
                {/each}
        
            <!-- Default Input Fields for Adding Products -->
            <div class="flex gap-2 items-end mb-4">
                <div class="flex-grow">
                    <Label for="product-search" class="text-xs">Product</Label>
                    <div class="relative">
                        <Input
                            id="product-search"
							autocomplete='off'
                            type="text"
                            placeholder="Search and select products..."
                            bind:value={searchQuery}
                  
                            oninput={(e) => filterProducts(e.currentTarget.value)}
                            onfocus={() => dropdownOpen[0] = true}
                            class="w-full mt-1"
                        />
                        {#if dropdownOpen[0] && filteredProducts.length > 0}
                            <div class="dropdown-container absolute z-20 w-full bg-white dark:bg-gray-900 mt-1 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto">
                                {#each filteredProducts as prod}
                                    <div 
                                        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                        onclick={() => {
                                            tempProduct = { productId: prod._id, productName: prod.productName };
                                            searchQuery = prod.productName;
                                            dropdownOpen[0] = false;
                                        }}
                                    >
                                        <span class="text-black dark:text-white">
                                            {prod.productName}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="w-24">
                    <Label for="quantity" class="text-xs">Quantity</Label>
                    <Input
                        id="quantity"
                        type="number"
						autocomplete='off'
                        min="1"
                        class="mt-1"
                        bind:value={tempQuantity}
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="mb-0 text-black"
                    onclick={addProduct}
                >
                    Add
                </Button>
            </div>
        </div>

		<Button class="w-[100px] mt-4" type="submit" disabled={$createComboMutation.isPending}>
			{edit ? 'Update' : $createComboMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>