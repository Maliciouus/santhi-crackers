<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import { categoryStore } from '$lib/pages/category/category-store';
	import CategoryTable from '$lib/pages/category/category-table.svelte';
	import CreateCategory from '$lib/pages/category/create-category.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Manager</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$categoryStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/categories?mode=${value}`);
		$categoryStore = {
			code: 0,
			name: '',
			description: '',
			id: '',
			mode: value,
			image:'',
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="tabler:table" />
			<span class="ml-2">Category List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mi:user-add" />
			<span class="ml-2">
				{$categoryStore.mode == 'create' && $categoryStore.id ? 'Edit' : 'Create'} Category</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<CategoryTable {categoryStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateCategory {categoryStore} />
	</Tabs.Content>
</Tabs.Root>
