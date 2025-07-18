<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateEmployee from '$lib/pages/employees/create-employee.svelte';
	import { employeeStore } from '$lib/pages/employees/employee-store';
	import EmployeeTable from '$lib/pages/employees/employee-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Employees</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$employeeStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/employees?mode=${value}`);
		$employeeStore = {
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
			<span class="ml-2">Employees List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mi:user-add" />
			<span class="ml-2"> Create Employees</span>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<EmployeeTable />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateEmployee />
	</Tabs.Content>
</Tabs.Root>
