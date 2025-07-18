<script lang="ts">
	import { page } from '$app/state';
	import { _axios } from '$lib/_axios';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { orderStatuses } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';

	async function fetchOrder(id: string) {
		const res = await _axios.get(`/empOrders/order?orderId=${id}`);
		return res.data;
	}

	async function fetchDeliveryAgent() {
		const res = await _axios.get(`/deliveryagent/select`);
		const data = await res.data;
		return data;
	}

	const query = createQuery({
		queryKey: ['order fetch'],
		queryFn: () => fetchOrder(page.params?.order)
	});

	const deliveryAgentQuery = createQuery({
		queryKey: ['delivery agent fetch'],
		queryFn: () => fetchDeliveryAgent()
	});

	async function updateOrderStatus(newStatus: string) {
		if (!newStatus) return;
		if (newStatus === 'assigned') {
			if (!assignedDeliveryAgent) {
				toast.error('Please select a delivery agent');
				return;
			}
		}

		if (newStatus == 'accepted') {
			updateOrder();
			return;
		}

		try {
			await _axios.patch(`/empOrders/update-status/${$query.data?.order?._id}`, {
				status: newStatus
			});
			toast.success('Order status updated successfully');
			$query.refetch();
		} catch (error) {
			toast.error('Failed to update order status');
		}
	}

	function hasQuantityChanged(): boolean {
		return $query.data?.order.products.some(
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
		const updatedProducts = $query.data?.order.products.map(
			(product: { productId: any; quantity: any }) => ({
				productId: product.productId._id,
				quantity: product.quantity
			})
		);

		await updateOrderQuantities($query.data?.order._id, updatedProducts);
	}

	async function removeProduct(productId: string) {
		try {
			const order = $query.data?.order;
			const OrderId = order?._id;
			if (order && order.products.length === 1) {
				toast.error('Cannot remove the last product in the order');
				return;
			}
			await _axios.post(`/orders/removeproduct`, {
				orderId: OrderId,
				productId: productId
			});
			toast.success('Product removed successfully');
			$query.refetch();
		} catch (error) {
			toast.error('Failed to remove product');
		}
	}

	async function assignDeliveryAgent(value: string) {
		try {
			const [agentId] = value.split(' -&- ');
			await _axios.patch(`/orders/assign-agent/${$query.data?.order?._id}`, {
				agentId
			});
			toast.success('Delivery agent assigned successfully');
			$query.refetch();
		} catch (error) {
			toast.error('Failed to assign delivery agent');
		}
	}

	async function updateOrder() {
		try {
			await _axios.patch(`/empOrders/update-status/${$query.data?.order?._id}`, {
				status: 'accepted'
			});
			toast.success('Order status updated successfully');
			$query.refetch();
		} catch {
			console.log('error');
		}
	}

	let selectedStatus = $state($query.data?.order?.status || 'pending');
	let assignedDeliveryAgent = $state($query.data?.order?.deliveryAgent?.name || '');
	let preparationTimeModel = $state(false);
	let preparationTime = $state(15);

	$effect(() => {
		selectedStatus = $query.data?.order?.status || 'pending';
		assignedDeliveryAgent = $query.data?.order?.deliveryAgent
			? `${$query.data?.order?.deliveryAgent?._id} -&- ${$query.data?.order?.deliveryAgent?.name}`
			: '';
	});
</script>

<svelte:head>
	<title>Dashboard | Order - {$query.data?.order?.orderId || ''}</title>
	<meta name="description" content="Order management dashboard for Ecommerce" />
</svelte:head>

<div
	class="w-[95%] mx-auto p-6 space-y-6 h-[calc(100vh-60px)] overflow-y-auto hidescrollbarthumb text-zinc-700"
>
	{#if $query.isLoading}
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if $query.data?.order}
		{@const order = $query.data.order}
		<div class="flex justify-between items-center">
			<div>
				<div class="flex gap-2 items-center">
					<h1 class="text-3xl font-bold">Order {order.orderId}</h1>
					<span class="text-sm text-muted-foreground">({order.status})</span>
				</div>
				<p class="text-muted-foreground">
					Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					})}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Select.Root
					type="single"
					bind:value={selectedStatus}
					onValueChange={updateOrderStatus}
					disabled={['cancelled', 'delivered'].includes(order.status)}
				>
					<Select.Trigger class="w-[180px]">
						<span class="capitalize">{selectedStatus}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each orderStatuses as status}
								<Select.Item value={status} class="capitalize">{status}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>

				<Button onclick={() => window.history.back()} class="cursor-pointer font-bold">
					Back
					<Icon icon="lets-icons:refund-back" class="w-6 h-6 font-bold" />
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-4">
			<Card.Root class="mt-4 col-span-1 bg-zinc-100 border-blue-300 border-2 border-solid">
				<Card.Header>
					<Card.Title>Customer Information</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex gap-3 flex-col">
						<div class="flex gap-3">
							<p class="font-semibold">Name</p>
							:
							<p>{order.user.username}</p>
						</div>
						<div class="flex gap-3">
							<p class="font-semibold">Email</p>
							:
							<p>{order.user.email}</p>
						</div>
						<div class="flex gap-3">
							<p class="font-semibold">Phone</p>
							:
							<p>{order.user.mobile}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<div>
				<Card.Root class="mt-4 bg-zinc-100 border-blue-300 border-2 border-solid">
					<Card.Header>
						<Card.Title>Delivery Address</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if order.address}
							<div class="space-y-4">
								<div>
									<p class="font-semibold text-lg">{order.address.flatNo}</p>
									<p class="text-muted-foreground">{order.address.area}</p>
									<p class="text-muted-foreground">{order.address.nearbyPlaces}</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="px-3 p-2 bg-zinc-400 rounded-full text-sm">
										{order.user.type}
									</span>
								</div>
							</div>
						{:else}
							<p class="text-muted-foreground">Address not specified</p>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root class="mt-4 bg-zinc-100 border-blue-300 border-2 border-solid">
				<Card.Header>
					<Card.Title>Payment Information</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="font-semibold">Payment Method</p>
							<p>{order.paymentMethod ? order.paymentMethod : 'Not specified'}</p>
						</div>
						<div>
							<p class="font-semibold">Payment Status</p>
							<p class="capitalize">{order.paymentStatus}</p>
						</div>
						<div>
							<p class="font-semibold">Razor Pay Id</p>
							<p>{order.razorPayId ?? '-'}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<Card.Root class="bg-zinc-100 border-blue-300 border-2 border-solid">
			<Card.Header>
				<Card.Title>Order Items</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Sl No.</Table.Head>
							<Table.Head>Item</Table.Head>
							<Table.Head>Quantity</Table.Head>
							<Table.Head>Price</Table.Head>
							<Table.Head>Total</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if order.products && order.products.length > 0}
							{#each order.products as product, index}
								{#if product}
									<Table.Row>
										<Table.Cell>{index + 1}</Table.Cell>
										<Table.Cell>
											<p class="font-medium capitalize">{product.productId?.productName}</p>
										</Table.Cell>
										
								
										<Table.Cell>{product.quantity}</Table.Cell>
										<Table.Cell>₹{product.price||0}</Table.Cell>
										<Table.Cell>₹{product.totalAmount||0}</Table.Cell>
									</Table.Row>
								{/if}
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colSpan={7} class="text-center">No products found</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- <Card.Root class="bg-zinc-100 border-blue-300 border-2 border-solid">
			<Card.Header>
				<Card.Title>Order Summary</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span>Subtotal</span>
						<span>₹{order.subtotal}</span>
					</div>
					<div class="flex justify-between">
						<span>Delivery Fee</span>
						<span>₹{order.deliveryPrice}</span>
					</div>
					<div class="flex justify-between">
						<span>Tax</span>
						<span>₹{order.tax}</span>
					</div>
					{#if order.couponDiscount > 0}
						<div class="flex justify-between text-green-500">
							<span>Coupon Discount</span>
							<span>-{order.couponDiscount} ₹</span>
						</div>
					{/if}
					<div class="flex justify-between font-bold text-lg pt-2 border-t">
						<span>Total</span>
						<span>
							₹{order?.totalPrice -
							  (order?.couponDiscount > 0 ? order?.couponDiscount : 0) +
							  order?.deliveryPrice}
						  </span>
					</div>
				</div>
			</Card.Content>
		</Card.Root> -->
	{:else}
		<div class="text-center py-10"></div>
	{/if}

	<Dialog.Root onOpenChange={(e) => (preparationTimeModel = e)} open={preparationTimeModel}>
		<Dialog.Content>
			<Dialog.Header>
				{@const order = $query.data.order}
				<Dialog.Title>Order Items</Dialog.Title>
				<Dialog.Description>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Sl No.</Table.Head>
								<Table.Head>Item</Table.Head>
								<Table.Head>Quantity</Table.Head>
								<Table.Head class="text-center">Action</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#if order.products && order.products.length > 0}
								{#each order.products as product, index}
									{#if product}
										<Table.Row>
											<Table.Cell>{index + 1}</Table.Cell>
											<Table.Cell>
												<p class="font-medium capitalize">{product.productId?.productName}</p>
											</Table.Cell>
											<Table.Cell>
												<Input
													type="number"
													bind:value={product.quantity}
													class="w-16 px-1 py-1 border border-black rounded-md text-center"
													min="1"
													max={product.quantity}
													oninput={(e: Event) => {
														const target = e.target as HTMLInputElement;
														const newQuantity = parseInt(target.value, 10) || 1;
														handleQuantityChange(product.productId._id, newQuantity); // Update the quantity
													}}
													readonly={product.quantity === 1}
												/>
											</Table.Cell>
											<Table.Cell class="flex justify-center items-center">
												<Icon
													onclick={() => removeProduct(product.productId._id)}
													icon="gg:close-o"
													class="w-6 h-6 mt-2 text-red-500 cursor-pointer font-bold"
												/>
											</Table.Cell>
										</Table.Row>
									{/if}
								{/each}
							{:else}
								<Table.Row>
									<Table.Cell colSpan={4} class="text-center">No products found</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Header>
				<Dialog.Title>Dispatch Time</Dialog.Title>
				<Dialog.Description>
					<div class="flex flex-col gap-3 w-[300px] my-4">
						<Label for="preparationTime">Minutes</Label>
						<Input
							type="number"
							id="preparationTime"
							placeholder="1"
							step="5"
							bind:value={preparationTime}
							min="5"
							max="60"
						/>
					</div>

					<Button onclick={updateOrder} class="">Update</Button>
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
</div>
