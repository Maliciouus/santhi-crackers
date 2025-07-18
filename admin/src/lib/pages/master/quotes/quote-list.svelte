<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import { quoteStore } from './quote-store';

	async function fetchQuote(limit = 10, page = 1) {
		const res = await _axios.get(`/quotes/all`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let selectedFaqId = $state('');
	let modelOpen = $state(false);

	const query = createQuery({
		queryKey: ['quotes fetch'],
		queryFn: () => fetchQuote()
	});

	const deleteMutation = createMutation({
		mutationFn: (id: string) => _axios.delete(`/quotes/${id}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['quotes fetch']
			});
			toast(data?.message ?? 'Quote Updated ✅');
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
				<Table.Caption>No Quote Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head class="w-[300px]">Quote</Table.Head>
					<Table.Head class=" w-[100px]">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.data || [] as quotes, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>

						<Table.Cell
							class="w-[300px] max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis"
							style="text-overflow: ellipsis;"
							title={quotes.quote}
						>
							{quotes.quote}
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
									$quoteStore = {
										...$quoteStore,
										mode: 'edit',
										id: quotes._id,
										quote: quotes.quote
									};
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>


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
