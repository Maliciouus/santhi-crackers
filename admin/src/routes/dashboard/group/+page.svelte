<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import { groupStore } from '$lib/pages/group/group-store';
	import groupTable from '$lib/pages/group/group-table.svelte';
	import Creategroup from '$lib/pages/group/create-group.svelte';
	import Icon from '@iconify/svelte';
	import GroupTable from '$lib/pages/group/group-table.svelte';
</script>

<svelte:head>
	<title>Dashboard | Manager</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$groupStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/group?mode=${value}`);
		$groupStore = {
			mode: value,
  id: '',
  name: '',
  image: '',
  products: [] as string[],
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="tabler:table" />
			<span class="ml-2">Group List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mi:user-add" />
			<span class="ml-2">
				{$groupStore.mode == 'create' && $groupStore.id ? 'Edit' : 'Create'} Group</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<GroupTable {groupStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<Creategroup {groupStore} />
	</Tabs.Content>
</Tabs.Root>
