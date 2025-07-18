<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import DippingsCreate from '$lib/pages/dippings/dippings-create.svelte';
	import { dippingStore } from '$lib/pages/dippings/dippings-store';
	import DippingsTable from '$lib/pages/dippings/dippings-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Manager - Manage Dippings</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$dippingStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/dippings?mode=${value}`);
		$dippingStore = {
			name: '',
			id: '',
			price: '0',
			mode: value
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="fluent:food-pizza-20-filled" />
			<span class="ml-2">Dippings List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="fluent:square-add-16-regular" />
			<span class="ml-2">
				{$dippingStore.mode == 'create' && $dippingStore.id ? 'Edit' : 'Create'} Dipping</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<DippingsTable {dippingStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<DippingsCreate {dippingStore} />
	</Tabs.Content>
</Tabs.Root>
