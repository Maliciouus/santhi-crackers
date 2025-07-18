<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { imgUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { _productsSchema, productEditStore, type Option } from './schema';
	import { z } from 'zod';
	import { isAxiosError } from 'axios';
  

	let ageGroup = [
    { _id: '1', name: 'Kids' },
    { _id: '2', name: 'Adults' }
  ];

  let OccationsData = [
    { _id: '1', name: 'Diwali' },
    { _id: '2', name: 'New Year' },
    { _id: '3', name: 'Christmas' },
    { _id: '4', name: 'Wedding Celebration' },
    { _id: '5', name: 'Birthday Party' },
    { _id: '6', name: 'Anniversary' },
    { _id: '7', name: 'Pongal' },
    { _id: '8', name: 'Eid' },
    { _id: '9', name: 'Independence Day' },
    { _id: '10', name: 'Navratri' },
    { _id: '11', name: 'Housewarming' },
    { _id: '12', name: 'Temple Festival' },
    { _id: '13', name: 'Corporate Event' },
    { _id: '14', name: 'Victory Celebration' }
  ];

	// Specification Schema
	const _specificationSchema = z.object({
	  name: z.string({ message: 'Specification name is required' }).min(1, 'Specification name is required'),
	  fields: z.array(z.string({ message: 'Field is required' }).min(1, 'Field cannot be empty')),
	});
  
	let selectedOccasions = $state<string[]>([]);
  let selectedAgeGroups = $state<string[]>([]);
  let selectOccasionOpen = $state(false);
  let selectAgeGroupOpen = $state(false);


	// Fetch functions
	async function fetchCategories() {
	  const res = await _axios.get(`/productcategory/select`);
	  return res.data;
	}

	async function fetchSpecifications() {
	  const res = await _axios.get('/specification/all');
	  return res.data;
	}
  
	async function fetchBrands() {
	  const res = await _axios.get(`/brands/select`);
	  return res.data;
	}
  
	// Queries
	const specificationsQuery = createQuery({
	  queryKey: ['specifications'],
	  queryFn: fetchSpecifications,
	});
  
	const categoryQuery = createQuery({
	  queryKey: ['category select'],
	  queryFn: fetchCategories,
	});
  
	const brandQuery = createQuery({
	  queryKey: ['brand select'],
	  queryFn: fetchBrands,
	});
	async function fetchGroups() {
		const res = await _axios.get(`/group/all?page=1&limit=100&q=`); // Fetch all groups
		return res.data;
	}
	const groupQuery = createQuery({
		queryKey: ['groups'],
		queryFn: fetchGroups,
	});
  
	// State
	let files = $state<File[]>([]);
	let edit = $state(false);
	let existingImages = $state<string[]>([]);
	let selectedSpecifications = $state<{ id: string; name: string; fields: Record<string, string> }[]>([]);
	let optionsError = $state<string | null>(null);
  
	// Popup state
	let showSpecPopup = $state(false);
	let showBrandPopup = $state(false);
	let showCategoryPopup = $state(false);
	let newSpecName = $state('');
	let specFields = $state<string[]>([]);
	let currentSpecField = $state('');
	let selectOpen = $state(false);
	let selectUnitOpen = $state(false);
	let selectCategoryOpen = $state(false);
	let selectBrandOpen = $state(false);
	let selectGroupOpen = $state(false);
	let selectedGroups = $state<{id: string, name: string}[]>([]);
	// Category Popup State
	let newCategoryName = $state('');
	let newCategoryCode = $state('');
	let newCategoryDescription = $state('');
	let newCategoryImage = $state<File | null>(null);
	let newCategoryImagePreview = $state<string | null>(null);
  
	// Brand Popup State
	let newBrandName = $state('');
	let newBrandImage = $state<File | null>(null);
	let newBrandImagePreview = $state<string | null>(null);
  
// Group Popup State
let showGroupPopup = $state(false);
    let newGroupName = $state('');
    let newGroupImage = $state<File | null>(null);
    let newGroupImagePreview = $state<string | null>(null);

		let showUnitPopup = $state(false);
  let newUnitName = $state('');

  $effect(() => {
  if ($productEditStore.id) {
    edit = true;
    $form.category = $productEditStore.category?._id
      ? `${$productEditStore.category._id} -&- ${$productEditStore.category.name}`
      : '';
	  console.log($productEditStore.group,$productEditStore.group.map(g => `${g._id} -&- ${g.name}`));
	  console.log($productEditStore.category)
	  $form.group = $productEditStore.group.map(g => `${g._id} -&- ${g.name}`);
	  $form.group = Array.isArray($productEditStore.group) && $productEditStore.group.length
      ? $productEditStore.group.map(g => `${g._id} -&- ${g.name}`)
      : [];
	  $form.ytLink = $productEditStore.ytLink || '';
	  $form.ageGroup = $productEditStore.ageGroup?.length
      ? $productEditStore.ageGroup.map(g => `${g}`)
      : [];
	  $form.occasions = $productEditStore.occations?.length
      ? $productEditStore.occations.map(g => `${g}`)
      : [];
    $form.brand = $productEditStore.brand?._id
      ? `${$productEditStore.brand._id} -&- ${$productEditStore.brand.name}`
      : '';
    $form.unit = $productEditStore.unit?._id
      ? `${$productEditStore.unit._id} -&- ${$productEditStore.unit.name}`
      : '';
    $form.description = $productEditStore.description || '';
    $form.productName = $productEditStore.productName || '';
    $form.price = $productEditStore.price ? String($productEditStore.price) : '';
    $form.discount = $productEditStore.discount ? String($productEditStore.discount) : '';
    $form.stock = $productEditStore.stock ? String($productEditStore.stock) : '';
    $form.productCode = $productEditStore.productCode || '';
    $form.topSeller = $productEditStore.topSeller ?? false;
    $form.gst = $productEditStore.gst ? String($productEditStore.gst) : '';
    $form.active = $productEditStore.active ?? true;

    // Initialize occasions and ageGroup
    selectedOccasions = $productEditStore.occations || [];
    selectedAgeGroups = $productEditStore.ageGroup || [];

    existingImages = Array.isArray($productEditStore.images)
      ? $productEditStore.images
      : typeof $productEditStore.images === 'string' && $productEditStore.images
      ? [$productEditStore.images]
      : [];

    if ($productEditStore.specifications?.length > 0) {
      const availableSpecs = $specificationsQuery.data?.specifications || [];
      selectedSpecifications = $productEditStore.specifications
        .map((storedSpec: any) => {
          const matchingSpec = availableSpecs.find((spec: any) => spec.name === storedSpec.name);
          return {
            id: storedSpec._id || storedSpec.name,
            name: storedSpec.name || matchingSpec?.name || 'Unknown',
            fields:
              storedSpec.fields ||
              (matchingSpec
                ? Object.fromEntries(matchingSpec.fields.map((field: any) => [field, '']))
                : {}),
          };
        })
        .filter((spec, index, self) => index === self.findIndex((s) => s.name === spec.name));
    } else {
      selectedSpecifications = [];
    }
  } else {
    edit = false;
    reset();
    files = [];
    existingImages = [];
    selectedSpecifications = [];
    selectedOccasions = [];
    selectedAgeGroups = [];
  }
});
	const createGroupMutation = createMutation({
        mutationFn: async (data: FormData) => {
            const response = await _axios.post('/group/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Group created successfully');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            showGroupPopup = false;
			$form.group = [`${data.data._id} -&- ${data.data.name}`];
            newGroupName = '';
            newGroupImage = null;
            newGroupImagePreview = null;
        },
        onError: (error) => {
            let errorMessage = 'Failed to create group';
            if (isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            } else {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            console.error('Group creation error:', error);
        },
    });

  
	// Specification creation mutation
	const createSpecificationMutation = createMutation({
	  mutationFn: async (data: { name: string; fields: string[] }) => {
		const response = await _axios.post('/specification/addspec', data);
		if (!response.data) {
		  throw new Error('Invalid response from server');
		}
		return response;
	  },
	  onSuccess: (response) => {
		if (response.data?.status === true || response.status === 200) {
		  toast.success('Specification created successfully');
		  queryClient.invalidateQueries({ queryKey: ['specifications'] });
		  selectedSpecifications = [
			...selectedSpecifications,
			{
			  id: response.data.data?._id || response.data.data?.name || Date.now().toString(),
			  name: response.data.data?.name || newSpecName,
			  fields: Object.fromEntries(
				(response.data.data?.fields || specFields).map((field: string) => [field, ''])
			  ),
			},
		  ];
		  newSpecName = '';
		  specFields = [];
		  currentSpecField = '';
		  showSpecPopup = false;
		} else {
		  throw new Error(response.data?.message || 'Failed to create specification');
		}
	  },
	  onError: (error) => {
		let errorMessage = 'Failed to create specification';
		if (isAxiosError(error)) {
		  errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
		} else {
		  errorMessage = error.message;
		}
		toast.error(errorMessage);
		console.error('Specification creation error:', error);
	  }
	});
  
	// Category creation mutation
	const createCategoryMutation = createMutation({
	  mutationFn: async (data: FormData) => {
		const response = await _axios.post('/productcategory/create', data);
		return response.data;
	  },
	  onSuccess: (data) => {
		toast.success('Category created successfully');
		console.log('Category creation response:', data);
		queryClient.invalidateQueries({ queryKey: ['category select'] });
		showCategoryPopup = false;
		$form.category = `${data.data._id} -&- ${data.data.name}`;
		newCategoryName = '';
		newCategoryCode = '';
		newCategoryDescription = '';
		newCategoryImage = null;
		newCategoryImagePreview = null;
	  },
	  onError: (error) => {
		toast.error('Failed to create category');
		console.error('Category creation error:', error);
	  }
	});
  
	// Brand creation mutation
const createBrandMutation = createMutation({
  mutationFn: async (data: FormData) => {
    const response = await _axios.post('/brands/create', data);
    return response.data;
  },
  onSuccess: (data) => {
		console.log('Brand creation response:', data);
      toast.success(data.message || 'Brand created successfully');
      queryClient.invalidateQueries({ queryKey: ['brand select'] });
      showBrandPopup = false;
      // Assuming the response contains the brand ID and name directly
      $form.brand = `${data.data._id} -&- ${data.data.name}`;
      newBrandName = '';
      newBrandImage = null;
      newBrandImagePreview = null;
  },
  onError: (error) => {
    toast.error('Failed to create brand');
    console.error('Brand creation error:', error);
  }
});

  
	// Specification form
	const { form: specForm, errors: specErrors, enhance: specEnhance, constraints: specConstraints, reset: specReset } = superForm(
	  defaults(zod(_specificationSchema)),
	  {
		SPA: true,
		validationMethod: 'oninput',
		validators: zod(_specificationSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		onSubmit: () => {
		  if (specFields.length === 0) {
			toast.error('Please add at least one field');
			return;
		  }
		  const data = {
			name: newSpecName.trim(),
			fields: specFields,
		  };
		  $createSpecificationMutation.mutate(data);
		},
	  }
	);
  
	// Product creation mutation
	const createProductMutation = createMutation({
	  mutationFn: (data: FormData) =>
		edit ? _axios.put(`/product/${$productEditStore.id}`, data) : _axios.post('/product/create', data),

	  onSuccess({ data }) {
		queryClient.refetchQueries({ queryKey: ['products fetch'] });
		if (data.status === true) {
		  if (edit) {
			$productEditStore.mode = 'list';
			reset();
			toast('Product Updated ✅');
			goto('/dashboard/products?mode=list');
			$productEditStore.id = '';
			$productEditStore.category = { categoryNumber: 0, _id: '', name: '' };
			$productEditStore.brand = { _id: '', name: '' };
			$productEditStore.group = { _id: '', name: '' };
			$productEditStore.ageGroup = [];
			$productEditStore.ytLink = '';
			$productEditStore.occations = [];
			$productEditStore.unit = { _id: '', name: '' };
			$productEditStore.description = '';
			$productEditStore.productName = '';
			$productEditStore.price = '';
			$productEditStore.discount = '';
			$productEditStore.stock = '';
			$productEditStore.productCode = '';
			$productEditStore.topSeller = false;
			$productEditStore.images = '';
			$productEditStore.gst = '';
			selectedSpecifications = [];
		  } else {
			toast('Product Created ✅');
			$productEditStore.mode = 'list';
		  }
		  reset();
		  files = [];
		  existingImages = [];
		} else {
		  toast.error(data.message);
		}
	  },
	  onError(error) {
		console.error('onError', error);
		toast.error('An error occurred while processing your request.');
	  },
	});
  
	// Product form
	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
	  defaults(zod(_productsSchema), { stock: '' }),
	  {
		SPA: true,
		validationMethod: 'onblur',
		validators: zod(_productsSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		async onSubmit() {
  const groupIds = Array.isArray($form.group)
    ? $form.group.map((group) => group.split(' -&- ')[0])
    : [];

	const ageGroups = Array.isArray($form.ageGroup)
    ? $form.ageGroup.map((ageGroup) => ageGroup)
    : [];
	const occasionsData = Array.isArray($form.occasions)
    ? $form.occasions.map((occasions) => occasions)
    : [];
  const { valid } = await validateForm({ focusOnError: true });

  if (!$form.category) {
    toast.error('Please select a category');
    return;
  }

  if (!valid) {
    for (const field in $errors) {
      if ($errors[field]) {
        toast.error(`${field}: ${$errors[field]}`);
      }
    }
    return;
  }

  if (files.length === 0 && (!edit || existingImages.length === 0)) {
    toast.error('Please upload at least one image');
    return;
  }

  if (!$form.unit) {
    toast.error('Please select a unit');
    return;
  }

  let formData = new FormData();
  formData.append('productName', $form.productName);
  if($form.ytLink){
	formData.append('ytLink', $form.ytLink);
  }
  formData.append('category', $form.category.split(' -&- ')[0]);
  formData.append('brand', $form.brand.split(' -&- ')[0]);
  ageGroups.forEach((ageGroup) => {
    formData.append('ageGroup', ageGroup);
  });
  occasionsData.forEach((occasions) => {
    formData.append('occations', occasions);
  });
  groupIds.forEach((groupId) => {
    formData.append('groups', groupId);
  });
  formData.append('unit', $form.unit.split(' -&- ')[0]);
  formData.append('price', $form.price);
  formData.append('discount', $form.discount);
  formData.append('stock', String($form.stock));
  formData.append('productCode', $form.productCode);
  formData.append('description', $form.description);

  files.forEach((file) => {
    formData.append('images', file);
  });

  formData.append('existingImages', JSON.stringify(existingImages));
  formData.append('topSeller', $form.topSeller.toString());
  formData.append('gst', $form.gst);
  formData.append('specifications', JSON.stringify(selectedSpecifications));

  console.log('Form Data:', Object.fromEntries(formData.entries()));
  $createProductMutation.mutate(formData);
}
	  }
	);
  
	function toggleSpecification(specName: string) {
	  const spec = $specificationsQuery.data?.specifications.find((s: { name: string }) => s.name === specName);
	  if (!spec) return;
  
	  const isSelected = selectedSpecifications.some((s) => s.name === spec.name);
	  if (isSelected) {
		selectedSpecifications = selectedSpecifications.filter((s) => s.name !== spec.name);
	  } else {
		const existingSpec = selectedSpecifications.find((s) => s.name === spec.name);
		if (!existingSpec) {
		  selectedSpecifications = [
			...selectedSpecifications,
			{
			  id: spec._id || spec.name,
			  name: spec.name,
			  fields: Object.fromEntries(
				spec.fields.map((field: any) => [field, existingSpec?.fields[field] || ''])
			  ),
			},
		  ];
		}
	  }
	}
  
	function handleAddSpecField() {
	  if (currentSpecField.trim()) {
		specFields = [...specFields, currentSpecField];
		$specForm.fields = specFields;
		currentSpecField = '';
	  }
	}
  
	function handleRemoveSpecField(index: number) {
	  specFields = specFields.filter((_, i) => i !== index);
	  $specForm.fields = specFields;
	}
  
	function closeSpecPopup() {
	  showSpecPopup = false;
	  newSpecName = '';
	  specFields = [];
	  currentSpecField = '';
	  $specForm.name = '';
	  $specForm.fields = [];
	  specReset();
	}
  
	function openSpecPopup() {
	  showSpecPopup = true;
	  selectOpen = false;
	}
  
	function openCategoryPopup() {
	  showCategoryPopup = true;
	  selectCategoryOpen = false;
	  newCategoryName = '';
		newCategoryCode = '';
		newCategoryDescription = '';
		newCategoryImage = null;
		newCategoryImagePreview = null;
	}
  
	function closeCategoryPopup() {
	  showCategoryPopup = false;
	  newCategoryName = '';
		newCategoryCode = '';
		newCategoryDescription = '';
		newCategoryImage = null;
		newCategoryImagePreview = null;
	}
  
	function handleCreateCategory() {
	  const formData = new FormData();
	  formData.append('name', newCategoryName);
	  formData.append('code', newCategoryCode);
	  formData.append('description', newCategoryDescription);
	  if (newCategoryImage) {
		formData.append('image', newCategoryImage);
	  }
	  $createCategoryMutation.mutate(formData);
	}
  
	function openBrandPopup() {
	  showBrandPopup = true;
	  selectBrandOpen = false;
	  newBrandName = '';
		newBrandImage = null;
		newBrandImagePreview = null;
	}
  
	function closeBrandPopup() {
	  showBrandPopup = false;
	  newBrandName = '';
		newBrandImage = null;
		newBrandImagePreview = null;
	}
  
	function handleCreateBrand() {
	  const formData = new FormData();
	  formData.append('name', newBrandName);
	  if (newBrandImage) {
		formData.append('image', newBrandImage);
	  }
	  $createBrandMutation.mutate(formData);
	}
  
	function handleBrandFileSelect(event: Event) {
	  const target = event.target as HTMLInputElement;
	  const file = target.files?.[0];
	  if (file) {
		newBrandImage = file;
		newBrandImagePreview = URL.createObjectURL(file);
	  }
	}
  
	function handleCategoryFileSelect(event: Event) {
	  const target = event.target as HTMLInputElement;
	  const file = target.files?.[0];
	  if (file) {
		newCategoryImage = file;
		newCategoryImagePreview = URL.createObjectURL(file);
	  }
	}

	async function fetchUnits() {
  const res = await _axios.get(`/unit/all`);
  return res.data;
}
function openUnitPopup() {
    showUnitPopup = true;
	selectUnitOpen = false;
  }

  // Function to close unit popup
  function closeUnitPopup() {
    showUnitPopup = false;
    newUnitName = '';
  }

  // Function to handle unit creation
  function handleCreateUnit() {
    $createUnitMutation.mutate({ name: newUnitName });
  }
// Query for fetching units
const unitsQuery = createQuery({
  queryKey: ['units'],
  queryFn: fetchUnits,
});
// Unit creation mutation
const createUnitMutation = createMutation({
  mutationFn: async (data: { name: string }) => {
    const response = await _axios.post('/unit/create', data);
    return response.data;
  },
  onSuccess: (data) => {
    toast.success(data.message || 'Unit created successfully');
    queryClient.invalidateQueries({ queryKey: ['units'] });
    showUnitPopup = false;
    $form.unit = `${data.data._id} -&- ${data.data.name}`; // Set the newly created unit as selected
    newUnitName = '';
  },
  onError: (error) => {
    toast.error('Failed to create unit');
    console.error('Unit creation error:', error);
  }
});


function openGroupPopup() {
        showGroupPopup = true;
        selectGroupOpen = false;
        newGroupName = '';
        newGroupImage = null;
        newGroupImagePreview = null;
    }

    function closeGroupPopup() {
        showGroupPopup = false;
        newGroupName = '';
        newGroupImage = null;
        newGroupImagePreview = null;
    }
	function handleGroupFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            newGroupImage = file;
            newGroupImagePreview = URL.createObjectURL(file);
        }
    }

    function handleCreateGroup() {
        const formData = new FormData();
        formData.append('name', newGroupName);
        if (newGroupImage) {
            formData.append('image', newGroupImage);
        }
        $createGroupMutation.mutate(formData);
    }
  </script>
  
  <div class="max-w-[95%] mx-auto text-maintext h-[calc(100vh-60px)] overflow-y-auto hidescrollbarthumb">
	<form method="POST" use:enhance class="grid gap-4 py-4 grid-cols-2">
	  <div class="col-span-2 bg-zinc-200 text-zinc-900 p-2 rounded-md select-none" id="productformcreate">
		<p class="font-bold">Product Details</p>
	  </div>
  
	  <div class="col-span-2 flex flex-col gap-2">
		<Label for="topSeller">Top Seller</Label>
		<Switch
		  id="topSeller"
		  class="mt-1"
		  aria-invalid={$errors.topSeller ? 'true' : undefined}
		  bind:checked={$form.topSeller}
		  {...$constraints.topSeller}
		/>
		{#if $errors.topSeller}
		  <span class="invalid text-xs text-red-500">{$errors.topSeller}</span>
		{/if}
	  </div>
  
	  <div>
		<Label>Product Name</Label>
		<Input
		  class="pr-10 mt-1"
		  autocomplete="off"
		  placeholder="Ex: Ground Chakra"
		  aria-invalid={$errors.productName ? 'true' : undefined}
		  bind:value={$form.productName}
		  {...$constraints.productName}
		/>
		{#if $errors.productName}
		  <span class="invalid text-xs text-red-500">{$errors.productName}</span>
		{/if}
	  </div>
	  <div>
		<Label for="productCode">Product Code</Label>
		<Input
		  id="productCode"
		  autocomplete="off"
		  class="pr-10 mt-1 uppercase"
		  placeholder="Ex: RB001"
		  aria-invalid={$errors.productCode ? 'true' : undefined}
		  bind:value={$form.productCode}
		  {...$constraints.productCode}
		  maxlength={14}
		/>
		{#if $errors.productCode}
		  <span class="invalid text-xs text-red-500">{$errors.productCode}</span>
		{/if}
	  </div>
	  <div>
		<Label for="unit">Unit</Label>
		<Select.Root
		  type="single"
		  name="unit"
		  bind:open={selectUnitOpen}
		  bind:value={$form.unit}
		  onValueChange={(value) => {
			$form.unit = value;
		  }}
		>
		  <Select.Trigger class="pr-10 mt-1">
			{$form.unit ? $form.unit.split(' -&- ')[1] : 'Select Unit'}
		  </Select.Trigger>
		  <Select.Content>
			<Select.Group>
			  <Select.GroupHeading>
				<div class="flex justify-between">
				  <p>Units</p>
				  <button
					type="button"
					class="py-1 px-3 rounded-lg text-white cursor-pointer bg-custom-gradient"
					onclick={openUnitPopup}
				  >
					Add new
				  </button>
				</div>
			  </Select.GroupHeading>
			  {#each $unitsQuery.data?.data || [] as unit}
				<Select.Item value={`${unit._id} -&- ${unit.name}`} label={unit.name}>
				  {unit.name}
				</Select.Item>
			  {/each}
			</Select.Group>
		  </Select.Content>
		</Select.Root>
		{#if $errors.unit}
		  <span class="invalid text-xs text-red-500">{$errors.unit}</span>
		{/if}
	  </div>
	  <div>
		<Label for="price">Price</Label>
		<Input
		  id="price"
		  autocomplete="off"
		  type="text"
		  class="pr-10 mt-1"
		  placeholder="Ex: 300"
		  aria-invalid={$errors.price ? 'true' : undefined}
		  bind:value={$form.price}
		  onkeypress={(e) => {
			const char = e.key;
			if (!/[0-9]/.test(char)) {
			  e.preventDefault();
			}
		  }}
		  {...$constraints.price}
		/>
		{#if $errors.price}
		  <span class="invalid text-xs text-red-500">{$errors.price}</span>
		{/if}
	  </div>
	  <div>
		<Label for="discount">Discount (%)</Label>
		<Input
		  id="discount"
		  autocomplete="off"
		  type="text"
		  class="pr-10 mt-1"
		  placeholder="Ex: 10"
		  aria-invalid={$errors.discount ? 'true' : undefined}
		  bind:value={$form.discount}
		  onkeypress={(e) => {
			const char = e.key;
			if (!/[0-9]/.test(char)) {
			  e.preventDefault();
			}
		  }}
		  {...$constraints.discount}
		/>
		{#if $errors.discount}
		  <span class="invalid text-xs text-red-500">{$errors.discount}</span>
		{/if}
	  </div>
	  <div>
		<Label for="category">Category</Label>
		<Select.Root
		  type="single"
		  name="category"
		  bind:open={selectCategoryOpen}
		  bind:value={$form.category}
		  onValueChange={(value) => {
			$form.category = value;
		  }}
		>
		  <Select.Trigger class="pr-10 mt-1">
			{$form.category
			  ? $form.category.includes(' -&- ')
				? $form.category.split(' -&- ')[1]
				: $form.category
			  : 'Select Category'}
		  </Select.Trigger>
		  <Select.Content class="max-h-[200px]" >
			<Select.Group>
			  <Select.GroupHeading>
				<div class="flex justify-between">
				  <p>Categories</p>
				  <button
					type="button"
					class="py-1 px-3 rounded-lg text-white cursor-pointer bg-custom-gradient"
					onclick={openCategoryPopup}
				  >
					Add new
				  </button>
				</div>
			  </Select.GroupHeading>
			  {#each $categoryQuery.data?.categories || [] as category}
				<Select.Item value={`${category._id} -&- ${category.name}`} label={category.name}>
				  {category.name}
				</Select.Item>
			  {/each}
			</Select.Group>
		  </Select.Content>
		</Select.Root>
		{#if $errors.category}
		  <span class="invalid text-xs text-red-500">{$errors.category}</span>
		{/if}
	  </div>
	  <div>
		<Label for="brand">Brand</Label>
		<Select.Root
		  type="single"
		  name="brand"
		  bind:open={selectBrandOpen}
		  bind:value={$form.brand}
		  onValueChange={(value) => {
			$form.brand = value;
		  }}
		>
		  <Select.Trigger class="pr-10 mt-1">
			{$form.brand
			  ? $form.brand.includes(' -&- ')
				? $form.brand.split(' -&- ')[1]
				: $form.brand
			  : 'Select Brand'}
		  </Select.Trigger>
		  <Select.Content class="max-h-[200px]">
			<Select.Group>
			  <Select.GroupHeading>
				<div class="flex justify-between">
				  <p>Brand</p>
				  <button
					type="button"
					class="py-1 px-3 rounded-lg text-white cursor-pointer bg-custom-gradient"
					onclick={openBrandPopup}
				  >
					Add new
				  </button>
				</div>
			  </Select.GroupHeading>
			  {#each $brandQuery.data?.brand || [] as brand}
				<Select.Item value={`${brand._id} -&- ${brand.name}`} label={brand.name}>
				  {brand.name}
				</Select.Item>
			  {/each}
			</Select.Group>
		  </Select.Content>
		</Select.Root>
		{#if $errors.brand}
		  <span class="invalid text-xs text-red-500">{$errors.brand}</span>
		{/if}
	  </div>
	<!-- Add this section to your product form -->


<div>
	<Label for="group">Group</Label>
	<Select.Root
	  type="multiple"
	  name="group"
	  bind:open={selectGroupOpen}
	  bind:value={$form.group}
	  onValueChange={(value) => {
		if (!Array.isArray(value)) {
		  value = [value];
		}
		$form.group = value;
	  }}
	>
	  <Select.Trigger class="pr-10 mt-1">
		{#if Array.isArray($form.group) && $form.group.length > 0}
  {$form.group.map(val => val.split(' -&- ')[1]).join(', ')}
{:else}
  Select Group
{/if}


	  </Select.Trigger>
	  <Select.Content class="max-h-[200px]" >
		<Select.Group>
		  <Select.GroupHeading>
			<div class="flex justify-between">
			  <p>Groups</p>
			  <button
				type="button"
				class="py-1 px-3 rounded-lg text-white cursor-pointer bg-custom-gradient"
				onclick={openGroupPopup}
			  >
				Add new
			  </button>
			</div>
		  </Select.GroupHeading>
		  {#each $groupQuery.data?.groups || [] as group}
			<Select.Item value={`${group._id} -&- ${group.name}`} label={group.name}>
			  {group.name}
			</Select.Item>
		  {/each}
		</Select.Group>
	  </Select.Content>
	</Select.Root>
	{#if $errors.group}
	  <span class="invalid text-xs text-red-500">{$errors.group}</span>
	{/if}
  </div>
	  <div>
		<Label for="stock">Available Stock (qty)</Label>
		<Input
		  id="stock"
		  autocomplete="off"
		  type="text"
		  class="pr-10 mt-1"
		  placeholder="Ex: 40"
		  aria-invalid={$errors.stock ? 'true' : undefined}
		  bind:value={$form.stock}
		  onkeypress={(e) => {
			const char = e.key;
			if (!/[0-9]/.test(char)) {
			  e.preventDefault();
			}
		  }}
		  {...$constraints.stock}
		/>
		{#if $errors.stock}
		  <span class="invalid text-xs text-red-500">{$errors.stock}</span>
		{/if}
	  </div>
	  <div>
		<Label for="gst">GST (%)</Label>
		<Input
		  id="gst"
		  autocomplete="off"
		  type="text"
		  class="pr-10 mt-1"
		  placeholder="Ex: 1"
		  aria-invalid={$errors.gst ? 'true' : undefined}
		  bind:value={$form.gst}
		  onkeypress={(e) => {
			const char = e.key;
			if (!/[0-9]/.test(char)) {
			  e.preventDefault();
			}
		  }}
		  {...$constraints.gst}
		/>
		{#if $errors.gst}
		  <span class="invalid text-xs text-red-500">{$errors.gst}</span>
		{/if}
	  </div>
  <div class="col-span-2 grid grid-cols-2 gap-4">
  <!-- Occasions Select -->
  <div>
    <Label for="occasions">Occasions</Label>
    <Select.Root
      type="multiple"
      name="occasions"
      bind:open={selectOccasionOpen}
      bind:value={selectedOccasions}
	  onValueChange={(value) => {
		if (!Array.isArray(value)) {
		  value = [value];
		}
		$form.occasions = value;
	  }}
    >
      <Select.Trigger class="pr-10 mt-1">
        {#if selectedOccasions.length > 0}
          {selectedOccasions.map((val) => OccationsData.find(occ => occ.name === val)?.name).join(', ')}
        {:else}
          Select Occasions
        {/if}
      </Select.Trigger>
      <Select.Content class="max-h-[200px]">
        <Select.Group>
          {#each OccationsData as occasion}
            <Select.Item value={occasion.name} label={occasion.name}>
              {occasion.name}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Age Groups Select -->
  <div>
    <Label for="ageGroup">Age Groups</Label>
    <Select.Root
      type="multiple"
      name="ageGroup"
      bind:open={selectAgeGroupOpen}
      bind:value={selectedAgeGroups}
	  onValueChange={(value) => {
		if (!Array.isArray(value)) {
		  value = [value];
		}
		$form.ageGroup = value;
	  }}
    >
      <Select.Trigger class="pr-10 mt-1">
        {#if selectedAgeGroups.length > 0}
          {selectedAgeGroups.map((val) => ageGroup.find(ag => ag.name === val)?.name).join(', ')}
        {:else}
          Select Age Groups
        {/if}
      </Select.Trigger>
      <Select.Content class="max-h-[200px]">
        <Select.Group>
          {#each ageGroup as ageGroupItem}
            <Select.Item value={ageGroupItem.name} label={ageGroupItem.name}>
              {ageGroupItem.name}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>
</div>
<div>
	<Label>YouTube URL</Label>
	<Input
	  class="pr-10 mt-1"
	  autocomplete="off"
	  placeholder="https://www.youtube.com/shorts/212******65fg"
	  aria-invalid={$errors.ytLink ? 'true' : undefined}
	  bind:value={$form.ytLink}
	  {...$constraints.ytLink}
	/>
	{#if $errors.ytLink}
	  <span class="invalid text-xs text-red-500">{$errors.ytLink}</span>
	{/if}
  </div>
	  <!-- Specifications Section -->
	  <div>
		<Label for="specifications">Specifications</Label>
		<Select.Root bind:open={selectOpen}>
		  <Select.Trigger class="pr-10 mt-1 w-full">
			Select Specifications
		  </Select.Trigger>
		  <Select.Content class="max-h-[200px]">
			<Select.Group>
			  <Select.GroupHeading>
				<div class="flex justify-between">
				  <p>Specifications</p>
				  <button
					type="button"
					class="py-1 px-3 rounded-lg text-white cursor-pointer bg-custom-gradient"
					onclick={openSpecPopup}
				  >
					Add new
				  </button>
				</div>
			  </Select.GroupHeading>
			  {#each $specificationsQuery.data?.specifications || [] as spec}
				<div class="flex items-center px-2 py-1">
				  <input
					type="checkbox"
					autocomplete="off"
					id={spec.name}
					checked={selectedSpecifications.some((s) => s.name === spec.name)}
					onchange={() => toggleSpecification(spec.name)}
					class="mr-2"
				  />
				  <label for={spec.name} class="flex-1">{spec.name}</label>
				</div>
			  {/each}
			</Select.Group>
		  </Select.Content>
		</Select.Root>
	  </div>
  
	  {#each selectedSpecifications as spec, index}
		<div class="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
		  <div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-gray-700">{spec.name}</h3>
			<button
			  type="button"
			  class="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition-colors"
			  onclick={() => toggleSpecification(spec.name)}
			>
			  Remove
			</button>
		  </div>
		  {#each Object.entries(spec.fields) as [field, value]}
			<div class="flex flex-col gap-2 mb-4">
			  <Label class="text-sm font-medium text-gray-600">{field}</Label>
			  <Input
				bind:value={spec.fields[field]}
				autocomplete="off"
				placeholder={`Enter ${field}`}
				class="w-full"
			  />
			</div>
		  {/each}
		</div>
	  {/each}
  
	  <div class="col-span-2">
		<Label for="description">Description</Label>
		<Textarea
		  id="description"
		  class="pr-10 mt-1"
		  placeholder="Ex: Description about the product........"
		  rows={5}
		  aria-invalid={$errors.description ? 'true' : undefined}
		  bind:value={$form.description}
		  {...$constraints.description}
		/>
		{#if $errors.description}
		  <span class="invalid text-xs text-red-500">{$errors.description}</span>
		{/if}
	  </div>
  
	  <div class="col-span-2">
		<Label>Images</Label>
		<button
		  type="button"
		  class="flex flex-col cursor-pointer justify-center items-center gap-2 h-[130px] bg-zinc-200 rounded-lg border-black border-[1px] w-full mt-2"
		  onclick={() => document.getElementById('files')?.click()}
		>
		  <Icon icon={'gravity-ui:files'} class="w-[50px] h-[50px] text-zinc-700" />
		  <h4 class="text-gray-700">Click to Upload Files</h4>
		  <h6 class="text-sm text-gray-500">(96 X 69) ~ 2 mb</h6>
		</button>
  
		<div class="flex flex-wrap gap-2 p-2">
		  {#if edit && existingImages.length > 0}
			{#each existingImages as image}
			  <div class="relative">
				<img
				  class="w-[100px] h-[100px] object-cover rounded-md"
				  src={`${imgUrl}${image}`}
				  alt="Existing product"
				/>
				<button
				  type="button"
				  class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
				  onclick={() => {
					existingImages = existingImages.filter((img) => img !== image);
				  }}
				>
				  <Icon icon="mdi:close" class="w-4 h-4 text-white" />
				</button>
			  </div>
			{/each}
		  {/if}
		  {#each files as file}
			<div class="relative">
			  <img
				class="w-[100px] h-[100px] object-cover rounded-md"
				src={URL.createObjectURL(file)}
				alt="New upload"
			  />
			  <button
				type="button"
				class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
				onclick={() => {
				  const newFiles = Array.from(files);
				  newFiles.splice(newFiles.indexOf(file), 1);
				  files = newFiles;
				}}
			  >
				<Icon icon="mdi:close" class="w-4 h-4 text-white" />
			  </button>
			</div>
		  {/each}
		</div>
		{#if $errors.images}
		  <span class="invalid text-xs text-red-500">{$errors.images}</span>
		{/if}
	  </div>
  
	  <Button class="w-[100px]" type="submit" onclick={()=>{console.log($form)}} disabled={$createProductMutation.isPending}>
		{$createProductMutation.isPending
		  ? edit
			? 'Updating...'
			: 'Creating...'
		  : edit
		  ? 'Update'
		  : 'Create'}
	  </Button>
	</form>
  
	<Input
	  type="file"
	  class="hidden"
	  accept=".jpg, .jpeg, .png, .webp"
	  multiple
	  id="files"
	  onchange={async (e: any) => {
		const newFiles = Array.from(e.target.files) as File[];
		for (const file of newFiles) {
		  if (file.size > 1024 * 1024 * 2) {
			toast.error(`Image ${file.name} is too large! Max size is 2 MB`);
			return;
		  }
		}
		const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		const invalidFiles = newFiles.filter((file) => !validImageTypes.includes(file.type));
		if (invalidFiles.length > 0) {
		  toast.error('Please upload only JPG, JPEG, PNG, or WEBP images.');
		  return;
		}
		files = newFiles;
	  }}
	/>
  
	<!-- Specification Creation Popup -->
	{#if showSpecPopup}
	  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
		  <h2 class="text-xl text-black font-semibold mb-4">Create New Specification</h2>
		  <form method="POST" use:specEnhance class="grid gap-4">
			<div>
			  <Label for="specName">Specification Name</Label>
			  <Input
				id="specName"
				autocomplete="off"
				class="pr-10 mt-1"
				placeholder="Ex: Material"
				aria-invalid={$specErrors.name ? 'true' : undefined}
				bind:value={$specForm.name}
				oninput={() => (newSpecName = $specForm.name)}
				{...$specConstraints.name}
			  />
			  {#if $specErrors.name}
				<span class="invalid text-xs text-red-500">{$specErrors.name}</span>
			  {/if}
			</div>
  
			{#each specFields as field, index}
			  <div class="flex items-center gap-2">
				<div class="flex-1">
				  <Label>Field {index + 1}</Label>
				  <Input
					bind:value={specFields[index]}
					oninput={() => ($specForm.fields = specFields)}
					class="pr-10 mt-1"
					placeholder="Ex: Field Value"
					aria-invalid={$specErrors.fields?.[index] ? 'true' : undefined}
					{...$specConstraints.fields?.[index]}
				  />
				  {#if $specErrors.fields?.[index]}
					<span class="invalid text-xs text-red-500">{$specErrors.fields[index]}</span>
				  {/if}
				</div>
				<button
				  type="button"
				  onclick={() => handleRemoveSpecField(index)}
				  class="mt-6 text-white hover:bg-red-700 bg-red-500 h-6 w-6 flex justify-center items-center rounded-full border border-white"
				>
				  <Icon icon="material-symbols:close-rounded" class="text-white" />
				</button>
			  </div>
			{/each}
  
			<div>
			  <Label for="newSpecField">New Field</Label>
			  <div class="flex gap-2">
				<Input
				  id="newSpecField"
				  bind:value={currentSpecField}
				  class="pr-10 mt-1"
				  placeholder="Ex: New Field"
				/>
				<Button type="button" onclick={handleAddSpecField} class="mt-1">
				  Add Field
				</Button>
			  </div>
			</div>
  
			<div class="flex justify-end gap-2 mt-4">
			  <Button type="button" variant="outline" class="text-black" onclick={closeSpecPopup}>
				Cancel
			  </Button>
			  <Button type="submit" disabled={$createSpecificationMutation.isPending}>
				{$createSpecificationMutation.isPending ? 'Saving...' : 'Save'}
				<Icon icon="zondicons:add-outline" class="text-white ml-2" />
			  </Button>
			</div>
		  </form>
		</div>
	  </div>
	{/if}
  
	<!-- Category Creation Popup -->
	{#if showCategoryPopup}
	  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
		  <h2 class="text-xl font-semibold text-black mb-4">Create New Category</h2>
		  <form class="grid gap-4">
			<div>
			  <Label for="categoryName">Category Name</Label>
			  <Input
				id="categoryName"
				bind:value={newCategoryName}
				class="pr-10 mt-1"
				placeholder="Ex: Surgical Equipments"
			  />
			</div>
			<div>
			  <Label for="categoryCode">Category Code</Label>
			  <Input
				id="categoryCode"
				bind:value={newCategoryCode}
				class="pr-10 mt-1"
				placeholder="Ex: 1001"
			  />
			</div>
			<div>
			  <Label for="categoryDescription">Description</Label>
			  <Textarea
				id="categoryDescription"
				bind:value={newCategoryDescription}
				class="pr-10 mt-1"
				placeholder="Ex: All kinds of equipments for your surgical needs.."
				rows={3}
			  />
			</div>
			<div>
			  <Label for="categoryImage">Category Image</Label>
			  <Input
				id="categoryImage"
				type="file"
				onchange={handleCategoryFileSelect}
				class="pr-10 mt-1"
				accept=".jpg, .jpeg, .png, .webp"
			  />
			  {#if newCategoryImagePreview}
				<div class="mt-2">
				  <img src={newCategoryImagePreview} alt="Category Preview" class="w-20 h-20 object-cover" />
				</div>
			  {/if}
			</div>
			<div class="flex justify-end gap-2 mt-4">
			  <Button type="button" variant="outline" onclick={closeCategoryPopup}>
				Cancel
			  </Button>
			  <Button type="button" onclick={handleCreateCategory}>
				Save
			  </Button>
			</div>
		  </form>
		</div>
	  </div>
	{/if}
  
	<!-- Brand Creation Popup -->
	{#if showBrandPopup}
	  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
		  <h2 class="text-xl font-semibold text-black mb-4">Create New Brand</h2>
		  <form class="grid gap-4">
			<div>
			  <Label for="brandName">Brand Name</Label>
			  <Input
				id="brandName"
				bind:value={newBrandName}
				class="pr-10 mt-1"
				placeholder="Ex: XY Brand"
			  />
			</div>
			<div>
			  <Label for="brandImage">Brand Image</Label>
			  <Input
				id="brandImage"
				type="file"
				onchange={handleBrandFileSelect}
				class="pr-10 mt-1"
				accept=".jpg, .jpeg, .png, .webp"
			  />
			  {#if newBrandImagePreview}
				<div class="mt-2">
				  <img src={newBrandImagePreview} alt="Brand Preview" class="w-20 h-20 object-cover" />
				</div>
			  {/if}
			</div>
			<div class="flex justify-end gap-2 mt-4">
			  <Button type="button" variant="outline" onclick={closeBrandPopup}>
				Cancel
			  </Button>
			  <Button type="button" onclick={handleCreateBrand}>
				Save
			  </Button>
			</div>
		  </form>
		</div>
	  </div>
	{/if}
	{#if showUnitPopup}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-xl font-semibold text-black mb-4">Create New Unit</h2>
      <form class="grid gap-4">
        <div>
          <Label for="unitName">Unit Name</Label>
          <Input
            id="unitName"
            bind:value={newUnitName}
            class="pr-10 mt-1"
            placeholder="Ex: Kilogram"
          />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onclick={closeUnitPopup}>
            Cancel
          </Button>
          <Button type="button" onclick={handleCreateUnit}>
            Save
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
{#if showGroupPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
		<h2 class="text-xl font-semibold text-black mb-4">Create New Group</h2>
		<form class="grid gap-4">
			<div>
				<Label for="groupName">Group Name</Label>
				<Input
					id="groupName"
					bind:value={newGroupName}
					class="pr-10 mt-1"
					placeholder="Ex: Premium Products"
				/>
			</div>
			<div>
				<Label for="groupImage">Group Image</Label>
				<Input
					id="groupImage"
					type="file"
					required
					onchange={handleGroupFileSelect}
					class="pr-10 mt-1"
					accept=".jpg, .jpeg, .png, .webp"
				/>
				{#if newGroupImagePreview}
					<div class="mt-2">
						<img src={newGroupImagePreview} alt="Group Preview" class="w-20 h-20 object-cover" />
					</div>
				{/if}
			</div>
			<div class="flex justify-end gap-2 mt-4">
				<Button type="button" variant="outline" onclick={closeGroupPopup}>
					Cancel
				</Button>
				<Button type="button" onclick={handleCreateGroup}>
					Save
				</Button>
			</div>
		</form>
	</div>
</div>
{/if}
	<div class="h-[100px] text-transparent"></div>
  </div>
  