<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateManager from '$lib/pages/manager/create-manager.svelte';
	import { managerStore } from '$lib/pages/manager/manager-store';
	import ManagerTable from '$lib/pages/manager/manager-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Manager</title>
	<meta name="description" content="dashboard for Ecommerce." />
</svelte:head>

<Tabs.Root
	value={$managerStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/managers?mode=${value}`);
		$managerStore = {
			mode: value,
			id: '',
			email: '',
			joinedAt: '',
			password: '',
			name: ''
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="tabler:table" />
			<span class="ml-2">Manager List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mi:user-add" />
			<span class="ml-2"> Create Manager</span>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<ManagerTable />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateManager />
	</Tabs.Content>
</Tabs.Root>
