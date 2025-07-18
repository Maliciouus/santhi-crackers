<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { imgUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import { hexToRgba } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { TimePicker } from 'svelte-time-picker';
	import { derived } from 'svelte/store';
	import type { ComboStoreProps } from './combo-store';

	let { comboStore }: ComboStoreProps = $props();

	async function fetchCombos(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/combo-offer/all?limit=${limit}&page=${page}`);
		return res.data;
	}

	async function fetchStatus() {
		const res = await _axios.get(`/combo/activeStatus`);
		return res.data;
	}

	onMount(() => {
		fetchStatus();
	});

	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let modelOpen = $state(false);
	let selectedComboId = $state('');

	
    async function toggleStatus(id: string, active: boolean) {
    try {
        const response = await _axios.delete(`/combo-offer/${id}`, {
            params: { permanent: false } // Toggle active status
        });

        if (response.data.status) {
            toast.success(`Combo ${active ? 'deactivated' : 'activated'} successfully`);
            $query.refetch(); // Refresh the combo list
        } else {
            toast.error(response.data.message || 'Failed to update Combo status');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to update Combo status');
    }
}

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			page = 1;
			$query.refetch();
		}, 500);
	}

	const statusQuery = createQuery({
		queryKey: ['Combo Status fetch'],
		queryFn: () => fetchStatus()
	});

	const query = createQuery({
		queryKey: ['combo fetch', debounceSearch],
		queryFn: () => fetchCombos(limit, page, search),
		staleTime: 0
	});

	const majorityActive = derived(query, ($query) => {
		if (!$query?.data?.combos || $query.data.combos.length === 0) {
			return false;
		}

		const activeCount = $query.data.combos.filter((combo: { active: boolean }) => combo.active).length;
		return activeCount > $query.data.combos.length - activeCount;
	});

	

    const deleteMutation = createMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
        _axios.delete(`/combo-offer/${id}`, {
            params: { permanent } // Pass permanent flag
        }),
    onSuccess({ data }) {
        queryClient.refetchQueries({
            queryKey: ['combo fetch'] // Refresh the combo list
        });
        toast(data?.message ?? 'Combo Deleted ✅');
        modelOpen = false; // Close the delete confirmation dialog
        selectedComboId = ''; // Reset the selected combo ID
    },
    onError(error) {
        console.error('Error:', error);
        toast.error('Failed to delete Combo');
    }
});


</script>

<div class="mt-6 text-maintext">
	<div class="w-[50%] ml-auto mb-4 flex items-center gap-5">
		<div class="grid gap-2 w-full relative">
			<Input
				type="text"
				required
				class="pr-10"
				placeholder="Search Combo"
				bind:value={search}
				oninput={debounceSearch}
			/>
			{#if !search}
				<Icon
					icon="iconamoon:search"
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{:else}
				<Icon
					icon="mdi:clear-outline"
					on:click={() => {
						search = '';
						debounceSearch();
					}}
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto h-[calc(100vh-300px)] overflow-y-auto hidescrollbarthumb">
		<Table.Root>
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Combos Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Combo Name</Table.Head>
					<Table.Head>Price</Table.Head>
					<Table.Head>Strike Price</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head>Products Included</Table.Head>
					<Table.Head>Image</Table.Head>
					<Table.Head>Active</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.comboOffers || [] as combo, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell>{combo.comboName}</Table.Cell>
						<Table.Cell>{combo.comboPrice}</Table.Cell>
						<Table.Cell>{combo.strikePrice}</Table.Cell>
						<Table.Cell>{combo.comboDescription}</Table.Cell>
						<Table.Cell>
							{#each combo.productsIncluded as product}
								<div class="flex gap-2">
									<span>{product.productId.productName}</span>
									<span>(Qty: {product.quantity})</span>
								</div>
							{/each}
						</Table.Cell>
						<Table.Cell>
							{#if combo.image}
								<button
									onclick={() => {
										const newWindow = window.open();
										if (newWindow) {
											const imageHTML = `<img src="${imgUrl + combo.image}" alt="${combo.comboName}" />`;
											newWindow.document.write(imageHTML);
											newWindow.document.title = combo.comboName;
										}
									}}
								>
									<div
										class="p-4 shadow-lg rounded-lg border border-gray-100 w-[85px] flex justify-center items-center"
									>
										<img
											src={imgUrl + combo.image}
											alt={combo.comboName}
											class="h-[40px] rounded-sm cursor-pointer"
										/>
									</div>
								</button>
							{:else}
								-
							{/if}
						</Table.Cell>
						<Table.Cell>
							<Switch
								class="text-right"
								checked={combo.active}
								onCheckedChange={() => toggleStatus(combo._id, combo.active)}
							/>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-4">
								<button
									onclick={() => {
										$comboStore = {
											...$comboStore,
											mode: 'create',
											id: combo._id,
											comboName: combo.comboName,
											strikePrice: combo.strikePrice,
                                            comboPrice:combo.comboPrice,
											comboDescription: combo.comboDescription,
											image: combo.image,
                                            productsIncluded: combo.productsIncluded.map((product: { productId: { _id: any; }; quantity: any; }) => ({
                productId: product.productId._id, 
                quantity: product.quantity 
            }))
										};
										goto(`/dashboard/comboOffer?mode=create&id=${combo._id}`);
									}}
								>
									<Icon icon="basil:edit-outline" class="hover:text-red-500 text-xl" />
								</button>

								<button onclick={() => ((modelOpen = true), (selectedComboId = combo._id))}>
									<Icon icon="mingcute:delete-2-fill" class="hover:text-red-500 text-xl" />
								</button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<Dialog.Root open={modelOpen} on:openChange={(e:any) => (modelOpen = e)}>
		<Dialog.Content>
			<Dialog.Header class="text-center">
				<div class="flex justify-center items-center">
					<Icon icon="jam:triangle-danger-f" class="text-red-500 text-6xl" />
				</div>

				<Dialog.Title class="flex flex-col gap-2 justify-center items-center text-center">
					Do you want to delete this Category?

					<span class="text-sm font-semibold"> This action cannot be undone. </span>
				</Dialog.Title>
			</Dialog.Header>

			<div class="flex gap-4 justify-around">
				<Button
					class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
					onclick={() => {
						$deleteMutation.mutate({ id: selectedComboId, permanent: true });
					}}>Yes</Button
				>
				<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
	{#if !$query.isLoading && $query?.data?.total > 0}
		<Paginator
			total={$query?.data?.total || 0}
			{limit}
			{page}
			callback={(_page: number) => {
				if (_page === page) return;
				page = _page;
				$query.refetch();
			}}
		/>
	{/if}
</div>