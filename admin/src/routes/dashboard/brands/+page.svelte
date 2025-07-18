<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import { brandStore } from '$lib/pages/brand/brand-store';
	import BrandsCreate from '$lib/pages/brand/create-brand.svelte';
	import BrandsTable from '$lib/pages/brand/brand-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Brands</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$brandStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/brands?mode=${value}`);
		$brandStore = {
			name: '',
			id: '',
			mode: value,
			image:''
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="material-symbols:fluid-med" />
			<span class="ml-2">Brands List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="fluent:square-add-16-regular" />
			<span class="ml-2">
				{$brandStore.mode == 'create' && $brandStore.id ? 'Edit' : 'Create'} Brand</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<BrandsTable {brandStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<BrandsCreate {brandStore} />
	</Tabs.Content>
</Tabs.Root>
