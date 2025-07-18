<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Table from '$lib/components/ui/table';
	import TableCell from '$lib/components/ui/table/table-cell.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { formatDate, setBadgeColor } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';

	let selectedTab = $state<
		'accepted' | 'rejected' | 'pending' |'assigned'| 'delivered' | 'ready for delivery'
	>('pending');
	let preparationTimeModel = $state(false);
	let preparationTime = $state(15);
	let rejectId = $state('');
	let orderdata = $state();
	let total = $state();
	async function fetchOrders(limit = 10, page = 1, search = '', selectedStatus = '') {
		const res = await _axios.get(
			`/orders/today?limit=${limit}&page=${page}&q=${search}&status=${selectedStatus}`
		);
		const data = await res.data;
		total = data.total;
		return data;
	}
    $effect(() => {
    if (!$query.isLoading && total === 0) {
        localStorage.removeItem('hasUnreadNotification');
    }
});
	async function fetchOrder(id: string) {
		const res = await _axios.get(`/orders/order?orderId=${id}`);
		return res.data;
	}

	function hasQuantityChanged(): boolean {
		return orderdata?.order?.products.some(
			(product: { quantity: number }) => product.quantity !== 2
		);
	}
	async function updateOrderQuantities(
		orderId: string,
		updatedProducts: { productId: string; quantity: number }[]
	) {
		try {
			await _axios.post(`/orders/updatequantities`, {
				orderId,
				products: updatedProducts
			});
			toast.success('Order quantities updated successfully');
			$query.refetch();
		} catch (error) {
			toast.error('Failed to update order quantities');
		}
	}
	let rejectConfirmationDialog = $state(false);

	function handleQuantityChange(productId: string, newQuantity: number) {
		const product = $query.data?.order.products.find(
			(p: { productId: string }) => p.productId === productId
		);

		if (product) {
			product.quantity = Math.max(1, newQuantity);

			toast.success(`Product ${productId} updated with quantity: ${product.quantity}`);
		} else {
			console.log(`Product ${productId} not found`);
		}
	}
	async function submitUpdatedQuantities() {
		const updatedProducts = orderdata?.order?.products.map(
			(product: { productId: any; quantity: any }) => ({
				productId: product.productId._id,
				quantity: product.quantity
			})
		);

		await updateOrderQuantities(orderdata?.order?._id, updatedProducts);
	}
	async function updateOrder(order: any) {
		let orderId = order?._id;
		try {
			await _axios.patch(`/orders/update-status/${orderId}`, {
				status: 'accepted'
			});
			toast.success('Order status updated successfully');
			$query.refetch();
		} catch {
			console.log('error');
		}
	}
	async function removeProduct(
		productId: string,
		order: {
			order: {
				_id: any;
				products: string | any[];
			};
		}
	) {
		try {
			if (order?.order && order?.order?.products.length === 1) {
				toast.error('Cannot remove the last product in the order');
				return;
			}
			await _axios.post(`/orders/removeproduct`, {
				orderId: order?.order?._id,
				productId: productId
			});
			toast.success('Product removed successfully');
			$query.refetch();
		} catch (error) {
			toast.error('Failed to remove product');
		}
	}
	async function exportOrderReport() {
		const res = await _axios.post(`/report/orderexport`);
		const data = await res.data;
		return data;
	}

	async function fetchStatusCount() {
		const res = await _axios.get(`/orders/ordercount`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let search = $state('');
	let selectedStatus = $state('pending');

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
		queryKey: ['todaysOrder fetch', debounceSearch],
		queryFn: () => fetchOrders(limit, page, search, selectedStatus),
		refetchOnWindowFocus: true,
	    refetchOnMount:true,
	    refetchOnReconnect:true,
	});

	const statusCountQuery = createQuery({
		queryKey: ['orders statuscount'],
		queryFn: () => fetchStatusCount()
	});

	function viewOrder(orderId: string) {
		goto(`/dashboard/orders/${orderId}`);
	}

	function onTabChange(
		tab: 'accepted' | 'rejected' | 'pending' |'assigned'| 'delivered' | 'ready for delivery'
	) {
		selectedTab = tab;
		selectedStatus = tab;
		page = 1;
		$query.refetch();
	}

	async function handleStatusChange(orderId: string, status: string) {
		try {
			const response = await _axios.patch(`/orders/update-status/${orderId}`, { status });
			if (response.status === 200) {
				$query.refetch();
				rejectConfirmationDialog = false;
				preparationTimeModel = false;
				if (status === 'rejected') {
					rejectId = '';
				}
			}
		} catch (error) {
			console.error('Error updating status:', error);
		}
	}
</script>

<title> Dashboard | Manager - Today's Orders </title>

<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto overflow-auto">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-4">
			<Tabs.Root value={selectedTab} onValueChange={(value) => onTabChange(value)}>
				<Tabs.List>
					<Tabs.Trigger value="pending" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="mdi:receipt-text-pending" />
						<span>New</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="accepted" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="mdi:check-circle-outline" />
						<span>Accepted</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="rejected" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="mdi:close-circle-outline" />
						<span>Rejected</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="assigned" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="line-md:check-all" />
						<span>Assigned</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="ready for delivery" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="bxs:thermometer" />
						<span>Ready</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="picked" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="lucide:truck" />
						<span>On the way</span>
					</Tabs.Trigger>
					<Tabs.Trigger value="delivered" class="flex items-center gap-2">
						<Icon class="w-4 h-4" icon="mdi:success-circle" />
						<span>Delivered</span>
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</div>
		<div class="flex items-center gap-4">
			<div class="grid gap-2 relative">
				<Input
					type={'text'}
					required
					class="pr-10 min-w-[300px]"
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
			<Button
				disabled={$query.isPending}
				onclick={() => {
					$query.refetch();
				}}
			>
				<Icon icon="ic:round-refresh" />
			</Button>
		</div>
	</div>

	<div class="overflow-x-auto">
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
					<Table.Head>Amount</Table.Head>
					{#if selectedTab === 'pending'}
						<Table.Head>Action</Table.Head>
					{:else}
						<Table.Head>Status</Table.Head>
					{/if}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if $query.isLoading || $query.isRefetching}
					<Table.Row>
						<!-- <Table.Cell colspan={6}>Loading....</Table.Cell> -->
					</Table.Row>
				{:else}
					{#each $query.data?.orders || [] as order, i}
						<Table.Row>
							<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
							<Table.Cell
								class="cursor-pointer  underline underline-offset-4 text-[#f15d5d] font-bold"
								onclick={() => viewOrder(order._id)}>{order?.orderId}</Table.Cell
							>
							<Table.Cell>
								<button
									class="capitalize underline underline-offset-2 text-[#f15d5d] font-bold cursor-pointer"
									onclick={() =>
										goto(`/dashboard/users/${order?.userData._id}`)}
								>
									{order?.userData.username}
								</button></Table.Cell
							>
							<Table.Cell>{order?.userData.mobile}</Table.Cell>
							<Table.Cell>{formatDate(new Date(order?.createdAt).toISOString())}</Table.Cell>
							<Table.Cell
								>{order?.totalPrice - order.couponDiscount + order.deliveryPrice} ₹</Table.Cell
							>

							{#if selectedTab === 'pending'}
								<Table.Cell class="capitalize flex gap-2">
									<Button
										class="accept-button"
										onclick={async () => {
											try {
										updateOrder(order)
												// preparationTimeModel = true;
												// const orderData = await fetchOrder(order._id);
												// orderdata = orderData;
											} catch (error) {
												toast.error('Failed to fetch order details');
											}
										}}
									>
										Accept
									</Button>
									<Button
										class="reject-button"
										onclick={() => {
											rejectId = order?._id;
											rejectConfirmationDialog = true;
										}}
									>
										Reject
									</Button>
								</Table.Cell>
							{:else}
                            <TableCell>
								<Badge class={` ${setBadgeColor(order?.status)}`}>{order?.status}</Badge>
                            </TableCell>
							{/if}
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
		<Dialog.Root
			onOpenChange={(e) => (rejectConfirmationDialog = e)}
			open={rejectConfirmationDialog}
		>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Confirm Rejection</Dialog.Title>
					<Dialog.Description>Are you sure you want to reject this order?</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (rejectConfirmationDialog = false)}>
						Cancel
					</Button>
					<Button onclick={() => handleStatusChange(rejectId, 'rejected')}>Confirm</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
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

<style>
	:global(.accept-button) {
		background-color: #10a929;
		color: white;
		transition: all 0.3s ease;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	:global(.accept-button):hover {
		background-color: #16a34a;
		transform: scale(1.05);
		z-index: 10;
	}

	:global(.reject-button) {
		background-color: #ef4444;
		color: white;
		transition: all 0.3s ease;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	:global(.reject-button):hover {
		background-color: #dc2626;
		transform: scale(1.05);
		z-index: 10;
	}
</style>
