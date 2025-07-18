<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	type Props = {
		total: number;
		limit: number;
		page: number;
		callback: (page: number) => void;
		showTotal?: boolean;
	};

	let { total, limit, page, callback, showTotal = true }: Props = $props();

	let start = $derived((page - 1) * limit + 1);
	let end = $derived(Math.min(page * limit, total));
</script>

<Pagination.Root
	count={total}
	perPage={limit}
	siblingCount={1}
	onPageChange={(_page) => {
		if (_page === page) return;
		page = _page;
		callback(page);
	}}
	class="mt-4"
>
	{#snippet children({ pages, currentPage })}
		<div class="flex items-center justify-between w-full">
			<div></div>
			<Pagination.Content class="flex items-center justify-center text-zinc-900">
				<Pagination.Item>
					<Pagination.PrevButton>
						<ChevronLeft class="size-4" />
						<span class="hidden sm:block">Previous</span>
					</Pagination.PrevButton>
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link {page} isActive={currentPage === page.value}>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton>
						<span class="hidden sm:block">Next</span>
						<ChevronRight class="size-4" />
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>

			{#if showTotal}
				<div class=" text-sm text-zinc-900">
					{start} - {end} of {total}
				</div>
			{/if}
		</div>
	{/snippet}
</Pagination.Root>
