<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateRestauremt from '$lib/pages/restaurents/create-restauremt.svelte';
	import RestaurentTable from '$lib/pages/restaurents/restaurent-table.svelte';
	import { restaurentStore } from '$lib/pages/restaurents/schema';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Restaurents</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	class="w-full p-4"
	value={$restaurentStore.mode}
	onValueChange={(value) => {
		$restaurentStore = {
			mode: value,
			id: ''
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="tabler:table" />
			<span class="ml-2">Restaurent List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create" class="flex items-center">
			<Icon class="w-4 h-4" icon="mingcute:building-3-line" />
			<span class="ml-2">Create Restaurent</span>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<RestaurentTable />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateRestauremt {restaurentStore} />
	</Tabs.Content>
</Tabs.Root>
