<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Table from '$lib/components/ui/table';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';

	async function fetchRestaurents(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/restaurent/all?limit=${limit}&page=${page}&q=${search}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(8);
	let search = $state('');

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
		queryKey: ['restaurent fetch', debounceSearch],
		queryFn: () => fetchRestaurents(limit, page, search)
	});
</script>

<div class="mt-6 text-maintext font-pt mx-auto overflow-auto">
	<div class="w-[40%] ml-auto mb-4">
		<div class="grid gap-2 relative">
			<Input
				type={'text'}
				required
				class="pr-10"
				placeholder={'Search Restaurent'}
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

	<div class="overflow-x-auto">
		<Table.Root>
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Restaurents Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Restaurent Name</Table.Head>
					<Table.Head class="cursor-pointer">Restaurent Phone</Table.Head>
					<Table.Head>Restaurent Address</Table.Head>
					<Table.Head>Active</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.restaurents || [] as restaurent, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell>{restaurent.restaurentName}</Table.Cell>
						<Table.Cell class="cursor-pointer  text-ellipsis overflow-hidden"
							>{restaurent.restaurentPhone}</Table.Cell
						>
						<Table.Cell class="cursor-pointer   text-ellipsis overflow-hidden"
							>{restaurent.restaurentAddress || '-'}</Table.Cell
						>
						<Table.Cell>{restaurent.active ? 'Yes' : 'No'}</Table.Cell>

						<Table.Cell class="flex items-center">
							<button>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl mr-4" />
							</button>

							<button>
								<Icon icon={'proicons:open'} class="text-green-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

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
