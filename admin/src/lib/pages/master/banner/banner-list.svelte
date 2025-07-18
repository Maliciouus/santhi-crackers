<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { imgUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	async function fetchBanners(limit = 10, page = 1) {
		const res = await _axios.get(`/banner/all?limit=${limit}&page=${page}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(5);
	let selectedBannerId = $state('');
	let modelOpen = $state(false);

	const query = createQuery({
		queryKey: ['banners fetch'],
		queryFn: () => fetchBanners(limit, page)
	});

	const deleteMutation = createMutation({
		mutationFn: async (id: string) => {
			// Check the total number of banners before deletion
			const currentTotal = $query.data?.total || 0;
			if (currentTotal <= 1) {
				
				// Prevent deletion if only one banner remains
				toast.error('Cannot delete the last banner! At least one banner must remain.');
				throw new Error('Cannot delete the last banner');

			}
			// Proceed with deletion if more than one banner exists
			return _axios.delete(`/banner/${id}`);
		},
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['banners fetch']
			});
			toast(data?.message ?? 'Banner Deleted ✅');
			selectedBannerId = '';
			modelOpen = false;
		},
		onError(error) {
			if (error.message !== 'Cannot delete the last banner') {
				console.error('Deletion error:', error);
				toast.error('Failed to delete banner');
			}
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
					<Table.Head>Banner Title</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head class="">Preview</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.banners || [] as banner, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell>{banner.bannerTitle}</Table.Cell>
						<Table.Cell class="">{banner.bannerDescription}</Table.Cell>
						<Table.Cell>
							<button
								onclick={() => {
									const newWindow = window.open();
									if (newWindow) {
										const imageHTML = `<img src="${imgUrl + banner.bannerImage}" alt="${banner.bannerTitle}" />`;
										newWindow.document.write(imageHTML);
										newWindow.document.title = banner.bannerTitle;
									}
								}}
							>
								<img
									src={imgUrl + banner.bannerImage}
									alt={banner.bannerTitle}
									class="h-[40px] w-full rounded-sm cursor-pointer object-cover"
								/>
							</button>
						</Table.Cell>
						<Table.Cell class="flex justify-end gap-2 items-center">
							<button
								disabled={$deleteMutation.isPending}
								onclick={() => {
									modelOpen = true;
									selectedBannerId = banner._id;
								}}
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
					<Dialog.Title class="flex flex-col gap-2 justify-center items-center text-center">
						Do you want to delete this Banner?
						<span class="text-sm font-semibold">This action cannot be undone.</span>
					</Dialog.Title>
				</Dialog.Header>
				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => $deleteMutation.mutate(selectedBannerId)}
					>
						Yes
					</Button>
					<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>
						No
					</Button>
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
			<p class="text-center text-xs">No Banners Found!</p>
		{/if}
	</div>
</div>