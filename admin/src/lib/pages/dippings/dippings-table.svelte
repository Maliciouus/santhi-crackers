<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { imgUrl } from '$lib/config';
	import Icon from '@iconify/svelte';
	import { tick } from 'svelte';
	import type { DippingStoreProps } from './dippings-store';

	let { dippingStore }: DippingStoreProps = $props();

	async function fetchDippings(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/dippings/all?limit=${limit}&page=${page}&q=${search}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let modelOpen = $state(false);
	let selectedDippingId = $state('');

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await tick();
			page = 1;

			$query.refetch();
		}, 500);
	}

	const query = createQuery({
		queryKey: ['dipping fetch', debounceSearch],
		queryFn: () => fetchDippings(limit, page, search)
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/dippings/${id}?permanent=${permanent}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['dipping fetch']
			});
			toast(data?.message ?? 'Dipping Updated ✅');
			modelOpen = false;
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
</script>

<div>
	<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
		<div class="w-[40%] ml-auto">
			<div class="grid gap-2 relative">
				<Input
					type={'text'}
					required
					class="pr-10"
					placeholder={'Search Dipping'}
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

		<Table.Root class="">
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Dippings Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row class="">
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Dipping name</Table.Head>
					<Table.Head class="cursor-pointer">Price</Table.Head>
					<Table.Head class="cursor-pointer">Image</Table.Head>
					<Table.Head class="">Active</Table.Head>
					<Table.Head class="">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.dippings || [] as dipping, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>

						<Table.Cell>{dipping.name}</Table.Cell>
						<Table.Cell>{dipping.price}</Table.Cell>
						<Table.Cell>
							<button
								onclick={() => {
									const newWindow = window.open();
									if (newWindow) {
										const imageHTML = `<img src="${imgUrl + dipping.image}" alt="${dipping.name}" />`;
										newWindow.document.write(imageHTML);
										newWindow.document.title = dipping.name;
									}
								}}
							>
								<img
									src={imgUrl + dipping.image}
									alt={dipping.name}
									class="h-[50px] rounded-sm cursor-pointer"
								/>
							</button>
						</Table.Cell>

						<Table.Cell>
							<Switch
								class="text-right"
								disabled={$deleteMutation.isPending}
								checked={dipping.active}
								onclick={() =>
									$deleteMutation.mutate({
										id: dipping._id,
										permanent: false
									})}
							/>
						</Table.Cell>

						<Table.Cell class="gap-4 flex items-center">
							<button
								onclick={() => {
									$dippingStore = {
										...$dippingStore,
										mode: 'create',
										id: dipping._id,
										name: dipping.name,
										price: dipping.price.toString()
									};

									goto(`/hidden-admin-base-007/dashboard/dippings?mode=create&id=${dipping._id}`);
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>

							<button onclick={() => ((modelOpen = true), (selectedDippingId = dipping._id))}>
								<Icon icon={'mingcute:delete-2-fill'} class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<Dialog.Root controlledOpen={true} open={modelOpen} onOpenChange={(e) => (modelOpen = e)}>
			<Dialog.Content>
				<Dialog.Header class="text-center">
					<Dialog.Title class="text-center">Do you want to delete this Dipping ?</Dialog.Title>
				</Dialog.Header>

				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => $deleteMutation.mutate({ id: selectedDippingId, permanent: true })}
						>Yes</Button
					>
					<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button
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
			<!-- {:else}
			<p class="text-center text-xs mt-4">No Dippings Found!</p> -->
		{/if}
	</div>
</div>
