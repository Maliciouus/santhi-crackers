<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';

	async function fetchUser(id: string) {
		const res = await _axios.get(`/users/${id}`);
		const data = await res.data;
		return data;
	}

	async function fetchOrders(limit = 10, page = 1, userId = '') {
		const res = await _axios.get(
			`/users/orderhistory?limit=${limit}&page=${page}&userId=${userId}`
		);
		const data = await res.data;
		return data;
	}

	let _page = $state(1);
	let limit = $state(7);

	const query = createQuery({
		queryKey: ['admin user fetch'],
		queryFn: () => fetchUser($page.params?.userid)
	});

	const orderHistoryQuery = createQuery({
		queryKey: ['admin user order history'],
		queryFn: () => fetchOrders(limit, _page, $page.params?.userid)
	});

	function viewOrder(orderId: string) {
		goto(`/dashboard/orders/${orderId}`);
	}
</script>

<svelte:head>
	<title>Dashboard | User</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>
<div
	class="w-[95%] mx-auto p-6 space-y-6 h-[calc(100vh-60px)] overflow-y-auto hidescrollbarthumb text-zinc-800"
>
	{#if $query.isLoading}
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if $query.data?.user}
		{@const user = $query.data.user}
		<div class="flex justify-between">
			<div>
				<div class="flex gap-2 items-center justify-between">
					<h1 class="text-3xl font-bold capitalize mb-2">{user.username}</h1>
				</div>
				<p class="text-muted-foreground">
					Joined At {new Date(user.createdAt).toLocaleString('en-IN', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					})}
				</p>

				<div class="flex gap-2 items-center mt-4">
					<p class="text-muted-foreground flex gap-2 items-center">
						<Icon icon="fluent:call-48-regular" class="text-lg" />
						{user.mobile}
					</p>
					<p class="text-muted-foreground flex gap-2 items-center">
						<Icon icon="ic:outline-email" class="text-lg" />
						{#if user.email}
							{user.email}
						{:else}
							Not Available
						{/if}
					</p>
				</div>

				<div class="flex gap-2 items-center mt-4">
					<p class="text-muted-foreground">Preffered Cusine: {user.prefferedCusine}</p>
				</div>
			</div>
			<div>
				<Button size="sm" onclick={() => history.back()}>
					<Icon icon="ep:arrow-up-bold" class="text-lg rotate-[-90deg]" />
					Back</Button
				>
			</div>
		</div>

		<div class="overflow-x-auto">
			<h2 class="text-3xl font-bold">Order History</h2>
			<Table.Root>
				{#if $orderHistoryQuery.isLoading}
					<Table.Caption>Loading....</Table.Caption>
				{:else if $orderHistoryQuery?.data?.total === 0}
					<Table.Caption class="text-center w-full text-xs">No Orders Found!</Table.Caption>
				{/if}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[100px]">Sl.No</Table.Head>
						<Table.Head class="cursor-pointer">Order Id</Table.Head>

						<Table.Head>Amount</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $orderHistoryQuery.data?.orders || [] as order, i}
						<Table.Row>
							<Table.Cell>{i + 1 + (_page - 1) * limit}</Table.Cell>
							<Table.Cell
								class="cursor-pointer  underline underline-offset-4 text-[#fd8d27]"
								onclick={() => viewOrder(order._id)}>{order?.orderId}</Table.Cell
							>
							<Table.Cell
								>{order?.totalPrice - order.couponDiscount + order.deliveryPrice} ₹</Table.Cell
							>
							<Table.Cell class="capitalize">{order?.status}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		{#if !$orderHistoryQuery.isLoading && $orderHistoryQuery?.data?.total > 0}
			<Paginator
				total={$orderHistoryQuery?.data?.total || 0}
				{limit}
				page={_page}
				callback={(newPage: any) => {
					if (_page === newPage) return;
					_page = newPage;
					$orderHistoryQuery.refetch();
				}}
			/>
		{/if}
	{/if}
</div>
