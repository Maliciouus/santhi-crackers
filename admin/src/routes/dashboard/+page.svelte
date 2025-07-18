<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Orderoverview from '$lib/components/dashboard/orderoverview.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';

	const dashboardFetchQuery = createQuery({
		queryKey: ['dashboard stats fetch'],
		queryFn: () => _axios.get('/dashboard'),
		select(data) {
			return data.data.data;
		}
	});

	let thisMonthOrders = $state(0);

	const recentOrdersQuery = createQuery({
		queryKey: ['orders fetch recent'],
		queryFn: () => _axios.get(`/dashboard/orderhistory`),
		select(data) {
			if (data && data.data) thisMonthOrders = data.data.thisMonthOrders;
			return data.data;
		}
	});
</script>

<svelte:head>
	<title>Dashboard</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<div class="overflow-y-scroll w-full h-[calc(100vh-100px)] hidescrollbarthumb">
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center p-4">
		{#if $dashboardFetchQuery.data}
			<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
				<Card.Header>
					<Card.Title class="flex justify-between text-zinc-700">
						{'Total Orders'}
						<Icon class="text-2xl text-zinc-700" icon={'mynaui:cart'} />
					</Card.Title>
					<Card.Description class="text text-zinc-800 text-3xl font-bold">
						{$dashboardFetchQuery.data.totalOrders}
					</Card.Description>
				</Card.Header>
				<Card.Footer class="mt-4">
					<Card.Description class="text-zinc-400"></Card.Description>
				</Card.Footer>
			</Card.Root>

			<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
				<Card.Header>
					<Card.Title class="flex justify-between text-zinc-700">
						{'Today Orders'}
						<Icon class="text-2xl text-zinc-700" icon={'uiw:date'} />
					</Card.Title>
					<Card.Description class="text text-zinc-800 text-3xl font-bold">
						{$dashboardFetchQuery.data.todayOrders}
					</Card.Description>
				</Card.Header>
				<Card.Footer class="mt-4">
					<Card.Description class="text-zinc-400"></Card.Description>
				</Card.Footer>
			</Card.Root>

			<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
				<Card.Header>
					<Card.Title class="flex justify-between text-zinc-700">
						{'New Customers'}
						<Icon class="text-2xl text-zinc-700" icon={'ion:people-outline'} />
					</Card.Title>
					<Card.Description class="text text-zinc-800 text-3xl font-bold">
						+ {$dashboardFetchQuery.data.newCustomers}
					</Card.Description>
				</Card.Header>
				<Card.Footer class="mt-4">
					<Card.Description class="text-zinc-400"></Card.Description>
				</Card.Footer>
			</Card.Root>

			<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
				<Card.Header>
					<Card.Title class="flex justify-between text-zinc-700">
						{'Average Order Value'}
						<Icon class="text-2xl text-zinc-700" icon={'uil:arrow-growth'} />
					</Card.Title>
					<Card.Description class="text text-zinc-800 text-3xl font-bold">
						₹ {$dashboardFetchQuery.data.avgOrderValue}
					</Card.Description>
				</Card.Header>
				<Card.Footer class="mt-4">
					<Card.Description class="text-zinc-400"></Card.Description>
				</Card.Footer>
			</Card.Root>
		{/if}
	</div>

	<div class="flex flex-col lg:flex-row">
		<Orderoverview />

		<div class="w-full px-2">
			<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
				<Card.Header>
					<Card.Title class="flex text-3xl justify-between text-zinc-700">
						<h3>Recent Orders</h3>
						<Button
							onclick={() => {
								goto('/hidden-admin-base-007/dashboard/orders');
							}}>View All</Button
						>
					</Card.Title>
					<Card.Description>
						{thisMonthOrders} Order{thisMonthOrders > 1 ? 's' : ''} were placed this month
					</Card.Description>
				</Card.Header>

				<Card.Content>
					{#if $recentOrdersQuery.isLoading}
						<p>Loading....</p>
					{:else if $recentOrdersQuery.data.orders.length === 0}
						<p class="text-center w-full text-xs">No Orders Found!</p>
					{/if}

					{#if $recentOrdersQuery?.data?.orders?.length > 0}
						{#each $recentOrdersQuery?.data?.orders || [] as order, i}
							<div class="flex items-center gap-2 py-2 cursor-pointer">
								<div class="flex">
									<Avatar.Root class="mx-4 cursor-pointer">
										<Avatar.Image src={order?.user.image} alt="Profile" class="object-cover"
										></Avatar.Image>
										<Avatar.Fallback class="text-white capitalize font-bold bg-primary">
											{order?.user.username[0]}
										</Avatar.Fallback>
									</Avatar.Root>
									<div>
										<p
											class="text-zinc-900 font-bold text-sm truncate w-[80px] md:w-[100px] lg:w-[200px] capitalize"
										>
											{order?.user.username}
										</p>
										<p class="text-zinc-700 text-sm">
											{order?.user.mobile}
										</p>
									</div>
								</div>

								<a
									class="cursor-pointer underline underline-offset-4 text-primary text-center"
									href={`/hidden-admin-base-007/dashboard/orders/${order?._id}`}
								>
									{order?.orderId}
								</a>

								<div class="text-zinc-900 capitalize ml-auto">
									₹ {order?.totalPrice}
								</div>
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
