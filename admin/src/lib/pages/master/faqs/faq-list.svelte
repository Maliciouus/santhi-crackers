<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { faqStore } from './faq-store';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	async function fetchFaq(limit = 10, page = 1) {
		const res = await _axios.get(`/faqs/all?limit=${limit}&page=${page}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let selectedFaqId = $state('');
	let modelOpen = $state(false);

	const query = createQuery({
		queryKey: ['faqs fetch'],
		queryFn: () => fetchFaq(limit, page)
	});

	const deleteMutation = createMutation({
		mutationFn: (id: string) => _axios.delete(`/faqs/${id}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['faqs fetch']
			});
			toast(data?.message ?? 'FAQ Updated ✅');
			selectedFaqId = '';
			modelOpen = false;
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
			selectedFaqId = '';
			modelOpen = false;
		}
	});
</script>

<div>
	<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
		<Table.Root class="mb-4">
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption>No FAQ Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head class="w-[300px]">Question</Table.Head>
					<Table.Head class="w-[300px]">Answer</Table.Head>
					<Table.Head class=" w-[100px]">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.faqs || [] as faq, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>

						<Table.Cell
							class="w-[300px] max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis"
							style="text-overflow: ellipsis;"
							title={faq.question}
						>
							{faq.question}
						</Table.Cell>

						<Table.Cell
							class="w-[300px] max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis"
							style="text-overflow: ellipsis;"
							title={faq.answer}
						>
							{faq.answer}
						</Table.Cell>

						<!-- <Table.Cell>
							<Switch
								class="text-right"
								disabled={$deleteMutation.isPending}
								checked={faq.isActive}
								onclick={() => $deleteMutation.mutate(faq._id)}
							/>
						</Table.Cell> -->
						<Table.Cell class="flex items-center gap-4">
							<button
								onclick={() => {
									$faqStore = {
										...$faqStore,
										mode: 'edit',
										id: faq._id,
										question: faq.question,
										answer: faq.answer
									};
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>
							<button
								disabled={$deleteMutation.isPending}
								onclick={() => ((modelOpen = true), (selectedFaqId = faq._id))}
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
						Do you want to delete this FAQ ?

						<span class="text-sm font-semibold"> This action cannot be undone. </span>
					</Dialog.Title>
				</Dialog.Header>

				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => $deleteMutation.mutate(selectedFaqId)}>Yes</Button
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
			<p class="text-center text-xs">No FAQ Found!</p> -->
		{/if}
	</div>
</div>
