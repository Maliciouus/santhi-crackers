<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { productCreateProps } from './schema';
	import { TimePicker } from 'svelte-time-picker';
	import { goto } from '$app/navigation';

	async function fetchProducts(limit = 10, page = 1, search = '', categoryId = '',brandId='') {
		const res = await _axios.get(
			`/product/all?limit=${limit}&page=${page}&q=${search}&categoryId=${categoryId}&brandId=${brandId}`
		);
		const data = await res.data;
		return data;
	}

	let { productEditStore }: productCreateProps = $props();

	let selectedProductId = $state('');
	let page = $state(1);
	let limit = $state(9);
	let search = $state('');
	let disableModelOpen = $state(false);
	let disableType = $state('date');
	// svelte-ignore state_referenced_locally
		let disabledUntill = $state(disableType === 'date' ? 2 : '12:00');
	$effect(() => {
		if (disableType === 'date') {
            disabledUntill=2; 
        } else {
            disabledUntill="12:00"; 
        }
    });
	let modelOpen = $state(false);
	let selectedCategory = $state('');
	let selectedBrand= $state('');

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await tick();
			page = 1;
			$query.refetch();
		}, 500);
	}

	async function fetchCategory() {
		const res = await _axios.get(`/productcategory/select`);
		const data = await res.data;
		return data;
	}
	async function fetchBrand() {
		const res = await _axios.get(`/brands/select`);
		const data = await res.data;
		return data;
	}
	const query = createQuery({
		queryKey: ['products fetch'],
		queryFn: () =>
			fetchProducts(limit, page, search, selectedCategory ? selectedCategory.split(' -&- ')[0] : '', selectedBrand ? selectedBrand.split(' -&- ')[0] : '')
	});

	const statusCountQuery = createQuery({
		queryKey: ['Category Fetch Select'],
		queryFn: () => fetchCategory()
	});
	const brandCountQuery = createQuery({
		queryKey: ['Brand Fetch Select'],
		queryFn: () => fetchBrand()
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/product/${id}?permanent=${permanent}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['products fetch']
			});
			toast(data?.message ?? 'Product Deleted ✅');
			selectedProductId = '';
			modelOpen = false;
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
	const topSellerMutation = createMutation({
		mutationFn: ({ id}: { id: string }) =>
			_axios.patch(`/product/topseller/${id}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['topseller toogle']
			});
			toast(data?.message ?? 'TopSeller activated ✅');
			selectedProductId = '';
		},
		onError(error, variables, context) {
			window.location.reload()
			console.error('onError', error, variables, context);
		}
	});

	function onCategoryChange(category: string) {
		selectedCategory = category;
		page = 1;
		$query.refetch();
	}
	function onBrandChange(brand: string) {
		selectedBrand = brand;
		page = 1;
		$query.refetch();
	}
	const disableMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean; disabledUntill: any }) =>
			_axios.delete(
				`/product/${id}?permanent=${permanent}&reEnable=${disabledUntill}&type=${disableType}`
			),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['products fetch']
			});
			if (data?.status === true) {
				toast(data?.message ?? 'Products Updated ✅');
				disableModelOpen = false;
				// selectedCategoryId = '';
			}
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
	function formatTime(date: Date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
	function handleTimeChange(event: { detail: any; }) {
        if (event.detail instanceof Date) {
            let formattedTime = formatTime(event.detail);  
            disabledUntill=formattedTime;  
            console.log("Selected Time:", formattedTime);  
        }
    }
	function formatTo12Hour(time: string | number) {
        if (typeof time !== 'string') return ''; // Ensure time is a string

        let [hours, minutes] = time.split(':').map(Number);
        let period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 0-23 to 12-hour format

        return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
    }
</script>

<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
	<div class="flex items-center justify-end ml-auto mb-4 gap-4">
		<Select.Root
		type="single"
		bind:value={selectedBrand}
		onValueChange={(value) => onBrandChange(value)}
	>
		<Select.Trigger class="w-[180px]">
			{selectedBrand
				? selectedBrand.includes(' -&- ')
					? selectedBrand.split(' -&- ')[1]
					: selectedBrand
				: 'Select Brand'}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Item value={''} class="capitalize">{'Select Brand'}</Select.Item>
				{#each $brandCountQuery.data?.brand || [] as brand}
					<Select.Item
						value={`${brand._id} -&- ${brand.name}`}
						label={brand.name}
						class="capitalize">{brand.name}</Select.Item
					>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
		<Select.Root
			type="single"
			bind:value={selectedCategory}
			onValueChange={(value) => onCategoryChange(value)}
		>
			<Select.Trigger class="w-[180px]">
				{selectedCategory
					? selectedCategory.includes(' -&- ')
						? selectedCategory.split(' -&- ')[1]
						: selectedCategory
					: 'Select Category'}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Item value={''} class="capitalize">{'Select Status'}</Select.Item>
					{#each $statusCountQuery.data?.categories || [] as category}
						<Select.Item
							value={`${category._id} -&- ${category.name}`}
							label={category.name}
							class="capitalize">{category.name}</Select.Item
						>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
		<div class="grid gap-2 relative">
			<Input
				type={'text'}
				required
				class="pr-10 min-w-[400px]"
				placeholder={'Search Products'}
				bind:value={search}
				oninput={debounceSearch}
			/>
			{#if !search}
				<Icon
					icon={'iconamoon:search'}
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{:else}
				<Icon
					icon={'mdi:clear-outline'}
					onclick={() => {
						search = '';
						debounceSearch();
					}}
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto h-[calc(100vh-300px)] overflow-y-auto hidescrollbarthumb">
		<Table.Root class="mb-4">
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption>No Products Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row class="">
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Product Name</Table.Head>
					<Table.Head>Product Code</Table.Head>
					<Table.Head>Unit</Table.Head>
					<Table.Head>Category</Table.Head>
					<Table.Head>Price</Table.Head>
					<Table.Head>Discount</Table.Head>
					<Table.Head>Stock</Table.Head>
					<Table.Head>Active</Table.Head>
					<!-- <Table.Head>Top Seller</Table.Head> -->
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.products || [] as product, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell>{product.productName}</Table.Cell>
						<Table.Cell>{product.productCode}</Table.Cell>
						<!-- <Table.Cell>{product.unit.name}</Table.Cell> -->
						<Table.Cell>{product.unit?.name}</Table.Cell>
						<Table.Cell>{product.category?.name}</Table.Cell>
						<Table.Cell>₹ {product.price}</Table.Cell>
						<Table.Cell>{product?.discount} %</Table.Cell>
						<Table.Cell>{product.stock}</Table.Cell>
						<Table.Cell>
							<Switch
							class="text-right"
							disabled={$deleteMutation.isPending}
							checked={product.active}
							onCheckedChange={(e) => {
								// if (product.active) {
								// 	disableModelOpen = true;
								// 	selectedProductId = product._id;
								// } else {
								// 	disabledUntill= 0,
								// 	$disableMutation.mutate({
								// 		disabledUntill: 0,
								// 		id: product._id,
								// 		permanent: false
								// 	});
								// }
								$disableMutation.mutate({
										disabledUntill: 0,
										id: product._id,
										permanent: false
									});
							}}
						/>
							
						</Table.Cell>
						<!-- <Table.Cell>
							<Switch
							class="text-right"
							disabled={$topSellerMutation.isPending}
							checked={product.topSeller}
							onCheckedChange={() => {
								$topSellerMutation.mutate({
										id: product._id
									});
							}}
						/>
							
						</Table.Cell> -->
						<Table.Cell class="flex gap-4 items-center">
							<button
								onclick={() => {
									$productEditStore = {
				id: product._id,
				mode: 'create', // Set mode to 'edit'
				category: product.category,
				brand:product.brand,
				description: product.description,
				productName: product.productName,
				stock:product.stock,
				price: product.price.toString(),
				unit:product.unit,
discount:product?.discount.toString(),
				occations:product.occations,
				ageGroup:product.ageGroup,
				   group:product.groups,
				   ytLink:product.ytLink,
				// negotiationLimit:product.negotiateLimit.toString(),
				// strikePrice: product.strikePrice.toString(),
				// rating: product.ratings.toString(),
				productCode: product.productCode,
				topSeller: product.topSeller,
				images: product.images,
				gst: product.gst.toString(),
				active: product.active, // Add active status
				options: product.options || [], // Add options if available
				specifications:product.specifications || []
			};
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>
							<button onclick={() => ((modelOpen = true), (selectedProductId = product._id))}>
								<Icon icon={'mingcute:delete-2-fill'} class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<Dialog.Root open={modelOpen} onOpenChange={(e) => (modelOpen = e)}>
		<Dialog.Content>
			<Dialog.Header class="text-center">
				<div class="flex justify-center items-center">
					<Icon icon={'jam:triangle-danger-f'} class="text-red-500 text-6xl" />
				</div>

				<Dialog.Title class=" flex flex-col gap-2 justify-center items-center text-center">
					Do you want to delete this product ?

					<span class="text-sm font-semibold"> This action cannot be undone. </span>
				</Dialog.Title>
			</Dialog.Header>

			<div class="flex gap-4 justify-around">
				<Button
					class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
					onclick={() => {
						$deleteMutation.mutate({ id: selectedProductId, permanent: true });
					}}>Yes</Button
				>
				<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root
		open={disableModelOpen}
		onOpenChange={async (e) => {
			disableModelOpen = e;
			if (!e) {
      window.location.reload(); 
    }
		}}
	>
		<Dialog.Content class="max-w-[400px]">
			<Dialog.Header class="text-center">
				<Dialog.Title class=" flex flex-col gap-2 justify-center items-center text-center">
					{#if disableType === 'date'}
					This Product will be disabled for {disabledUntill ?? 2} days.
				{:else}
					This Product will be disabled until {formatTo12Hour(disabledUntill)}.
				{/if}
				</Dialog.Title>
			</Dialog.Header>

			<form class="my-6">
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="Type">Type</Label>
						<Select.Root
							name="type"
							type="single"
							bind:value={disableType}
							onValueChange={(value) => (disableType = value)}
						>
							<Select.Trigger class="">
								<span class="capitalize">{disableType ? disableType : 'Select Type'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Item value={'date'} class="capitalize">Date</Select.Item>
									<Select.Item value={'time'} class="capitalize">Time</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="grid gap-4 mt-4">
					<div class="flex flex-col gap-2">
						<Label for="disabledUntill">Disabled Until</Label>
						{#if disableType === 'date'}
							<Input
								id="disabledUntill"
								type="number"
								min="2"
								max="14"
								placeholder="2 days"
								required
								bind:value={disabledUntill}
							/>
						{:else}
						
								<div class="">
									<TimePicker 
									on:change={handleTimeChange}
								/>
								</div>
				
						{/if}
					</div>
				</div>
			</form>

			<div class="flex gap-4  justify-around">
				<Button
					class="bg-white text-black font-bold w-full border-2 border-red-500 hover:bg-white"
					onclick={() => {
						$disableMutation.mutate({
							id: selectedProductId,
							permanent: false,
							disabledUntill: disabledUntill
						});
					}}>Yes</Button
				>
				<Button
					class="text-white font-bold w-full"
					onclick={() => {
						disableModelOpen = false;
						window.location.reload();
					}}>No</Button
				>
			</div>
		</Dialog.Content>
	</Dialog.Root>
	{#if !$query.isLoading && $query?.data?.total > 0}
		<Paginator
			total={$query?.data?.total || 0}
			{limit}
			{page}
			callback={(_page: any) => {
				if (_page === page) return;
				page = _page;
				$query.refetch();
			}}
		/>
	{/if}
</div>
