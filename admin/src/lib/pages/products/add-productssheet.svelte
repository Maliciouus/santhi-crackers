<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { productEditStore, productStore, type TFoodSuggestion } from './schema';

	let {
		foodSuggetions = $bindable([])
	}: {
		foodSuggetions: TFoodSuggestion[];
	} = $props();

	let search = $state('');
	let page = $state(1);
	let limit = $state(10);
	let Id = $derived($productEditStore.id);

	$effect(() => {
		if ($productStore.productsSheetOpen) {
			$suggetionsQuery.refetch();
		}
	});

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await tick();
			page = 1;
			page = 1;
			$suggetionsQuery.refetch();
		}, 500);
	}

	async function fetchProducts(search = '', page = 1, limit = 10) {
		const res = await _axios.get(
			`/product/select?q=${search}&page=${page}&limit=${limit}&id=${Id}`
		);
		const data = await res.data;
		return data;
	}

	const suggetionsQuery = createQuery({
		queryKey: ['product select', debounceSearch],
		queryFn: () => fetchProducts(search, page, limit)
	});
	function checkIfSuggetionExists(id: string) {
		return foodSuggetions.some((suggetion) => suggetion.id === id);
	}
</script>

<Sheet.Root
	open={$productStore.productsSheetOpen}
	onOpenChange={(val) => ($productStore.productsSheetOpen = val)}
>
	<Sheet.Content class="bg-zinc-200 border-none ">
		<Sheet.Header>
			<Sheet.Title class="text-zinc-900">Add Products</Sheet.Title>
			<Sheet.Description class="pb-3">This added products will show in users app.</Sheet.Description
			>
		</Sheet.Header>
		<div class="w-full ml-auto">
			<div class="grid gap-2 relative">
				<Input
					type={'text'}
					required
					class="pr-10"
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
		<div class="flex flex-col min-h-[80%] gap-4 p-2 text-zinc-900">
			<p>{foodSuggetions.length} Items Selected</p>

			{#if $suggetionsQuery?.isLoading}
				<p class="text-zinc-600 text-sm">Loading...</p>
			{/if}
			{#if $suggetionsQuery?.data?.products.length === 0}
				<p class="text-zinc-600 text-sm">No Products found</p>
			{/if}

			<ScrollArea class="h-full">
				<div class="flex flex-wrap">
					{#each $suggetionsQuery.data?.products || [] as product}
						<button
							class={`m-1 p-2 px-4 font-bold  border-2 rounded-full ${checkIfSuggetionExists(product._id) ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-800 border-zinc-600'} text-white text-xs`}
							onclick={() => {
								if (!checkIfSuggetionExists(product._id)) {
									foodSuggetions.push({
										name: product.productName,
										id: product._id
									});
								} else {
									foodSuggetions = foodSuggetions.filter((current) => current.id !== product._id);
								}
							}}
						>
							{product.productName} - {product.productCode}
						</button>
					{/each}
				</div>
			</ScrollArea>
		</div>
		<div class="text-zinc-100">
			{#if !$suggetionsQuery.isLoading && $suggetionsQuery?.data?.total > 0}
				<Paginator
					total={$suggetionsQuery?.data?.total || 0}
					{limit}
					{page}
					callback={(_page: any) => {
						if (_page === page) return;
						page = _page;
						$suggetionsQuery.refetch();
					}}
					showTotal={false}
				/>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
