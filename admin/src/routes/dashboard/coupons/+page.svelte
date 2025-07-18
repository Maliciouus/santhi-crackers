<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import CouponsCreate from '$lib/pages/coupons/coupons-create.svelte';
	import { couponsStore } from '$lib/pages/coupons/coupons-store';
	import CouponsTable from '$lib/pages/coupons/coupons-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Coupons</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	class="w-full p-4"
	value={$couponsStore.mode}
	onValueChange={(value) => {
		$couponsStore = {
			id: '',
			mode: value,
			code: '',
			description: '',
			discount: '',
			minPrice: 0,
			maxPrice: 0,
			numberOfDays: 0
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="ic:outline-local-offer" />
			<span class="ml-2">Coupon List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="oui:ml-create-single-metric-job" />
			<span class="ml-2">
				{$couponsStore.mode == 'create' && $couponsStore.id ? 'Edit' : 'Create'} Coupon</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<CouponsTable {couponsStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CouponsCreate {couponsStore} />
	</Tabs.Content>
</Tabs.Root>
