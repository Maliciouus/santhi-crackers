<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Switch } from '$lib/components/ui/switch';
	import { imgUrl } from '$lib/config';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	async function fetchSuggetions(limit = 10, page = 1) {
		const res = await _axios.get(`/suggestions/all?limit=${limit}&page=${page}`);
		const data = await res.data;
		return data;
	}

	let selectedSuggestionId = $state('');
	let page = $state(1);
	let limit = $state(10);
	let modelOpen = $state(false);

	const query = createQuery({
		queryKey: ['suggestions fetch'],
		queryFn: () => fetchSuggetions(limit, page)
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/suggestions/${id}?permanent=${permanent}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['suggestions fetch']
			});
			toast(data?.message ?? 'Suggetion Deleted ✅');
			selectedSuggestionId = '';
			modelOpen = false;
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
</script>

<div>
	<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
		<Table.Root class="mb-4">
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row class="">
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head>Image</Table.Head>
					<Table.Head class="">Active</Table.Head>
					<Table.Head class="">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.suggetions || [] as suggetions, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>

						<Table.Cell>{suggetions.name}</Table.Cell>

						<Table.Cell>
							<button
								onclick={() => {
									const newWindow = window.open();
									if (newWindow) {
										const imageHTML = `<img src="${imgUrl + suggetions.icon}" alt="${suggetions.name}" />`;
										newWindow.document.write(imageHTML);
										newWindow.document.title = suggetions.name;
									}
								}}
							>
								<img
									src={imgUrl + suggetions.icon}
									alt={suggetions.name}
									class="h-[50px] rounded-sm cursor-pointer"
								/>
							</button>
						</Table.Cell>

						<Table.Cell class="">
							<Switch
								class=""
								disabled={$deleteMutation.isPending}
								checked={suggetions.active}
								onclick={() =>
									$deleteMutation.mutate({
										id: suggetions._id,
										permanent: false
									})}
							/>
						</Table.Cell>
						<Table.Cell class="">
							<button
								disabled={$deleteMutation.isPending}
								onclick={() => ((modelOpen = true), (selectedSuggestionId = suggetions._id))}
							>
								<Icon icon={'fluent:delete-28-regular'} class="text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<Dialog.Root controlledOpen={true} open={modelOpen} onOpenChange={(e) => (modelOpen = e)}>
			<Dialog.Content>
				<Dialog.Header class="text-center">
					<div class="flex justify-center items-center">
						<Icon icon={'jam:triangle-danger-f'} class="text-red-500 text-6xl" />
					</div>

					<Dialog.Title class=" flex flex-col gap-2 justify-center items-center text-center">
						Do you want to delete this suggetion ?

						<span class="text-sm font-semibold"> This action cannot be undone. </span>
					</Dialog.Title>
				</Dialog.Header>

				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => {
							$deleteMutation.mutate({ id: selectedSuggestionId, permanent: true });
						}}>Yes</Button
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
		{:else}
			<p class="text-center text-xs">No Timings Found!</p>
		{/if}
	</div>
</div>
