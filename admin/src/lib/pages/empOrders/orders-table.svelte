<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { formatDate, setBadgeColor } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';

	async function fetchOrders(limit = 10, page = 1, search = '', selectedStatus = '') {
		const res = await _axios.get(
			`/empOrders/all?limit=${limit}&page=${page}&q=${search}&status=${selectedStatus}`
		);
		const data = await res.data;
		return data;
	}

	async function fetchStatusCount() {
		const res = await _axios.get(`/empOrders/ordercount`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let selectedStatus = $state('');

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
		queryKey: ['EmpOrders fetch', debounceSearch],
		queryFn: () => fetchOrders(limit, page, search, selectedStatus)
	});

	const statusCountQuery = createQuery({
		queryKey: ['orders statuscount'],
		queryFn: () => fetchStatusCount()
	});

	function viewOrder(orderId: string) {
		goto(`/dashboard/empOrders/${orderId}`);
	}

	function onStatusChange(status: string) {
		selectedStatus = status;
		$query.refetch();
	}
</script>

<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto overflow-auto">
	<div class="flex items-center justify-end ml-auto mb-4 gap-4">
		<Select.Root
			type="single"
			bind:value={selectedStatus}
			onValueChange={(value) => onStatusChange(value)}
		>
			<Select.Trigger class="w-[180px]">
				<span class="capitalize">{selectedStatus ? selectedStatus : 'Select Status'}</span>
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Item value={''} class="capitalize">{'Select Status'}</Select.Item>
					{#each $statusCountQuery.data?.data || [] as status}
						<Select.Item value={status.status} class="capitalize"
							>{status.status} - ({status.count})</Select.Item
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
				placeholder={'Search Orders'}
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

		<!-- <Button
			disabled={$exportQuery.isPending}
			onclick={() => {
				$exportQuery.refetch();
			}}>{$exportQuery.isPending ? 'Exporting...' : 'Export'}</Button
		> -->

		<Button
			disabled={$query.isPending}
			onclick={() => {
				$query.refetch();
			}}
		>
			<Icon icon="ic:round-refresh" />
		</Button>
	</div>

	<div class="overflow-x-auto h-[calc(100vh-250px)] overflow-y-auto hidescrollbarthumb">
		<Table.Root>
			{#if $query.isLoading || $query.isRefetching}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Orders Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head class="cursor-pointer">Order Id</Table.Head>
					<Table.Head>User Name</Table.Head>
					<Table.Head>Mobile</Table.Head>
					<Table.Head>Ordered At</Table.Head>
					<Table.Head>Status</Table.Head>
					<!-- <Table.Head>Actions</Table.Head> -->
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if $query.isLoading || $query.isRefetching}
					<Table.Row>
						<Table.Cell colspan={6}>Loading....</Table.Cell>
					</Table.Row>
				{:else}
					{#each $query.data?.orders || [] as order, i}
						<Table.Row>
							<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
							<Table.Cell
								class="cursor-pointer  underline underline-offset-4 text-primary font-bold"
								onclick={() => viewOrder(order._id)}>{order?.orderId}</Table.Cell
							>
							<Table.Cell>
								<button
									class="capitalize   font-bold "
									
								>
									{order?.userData.username}
								</button></Table.Cell
							>
							<Table.Cell>{order?.userData.mobile}</Table.Cell>
							<Table.Cell>{formatDate(new Date(order?.createdAt).toISOString())}</Table.Cell>

							<Table.Cell class="capitalize">
								<Badge class={setBadgeColor(order?.status)}>{order?.status}</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
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
