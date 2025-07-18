<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateDeliveryagent from '$lib/pages/deliveryagent/create-deliveryagent.svelte';
	import { deliveryAgentStore } from '$lib/pages/deliveryagent/deliveryagent-store';
	import DeliveryagentTable from '$lib/pages/deliveryagent/deliveryagent-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Delivery Agent</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root
	value={$deliveryAgentStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		goto(`/dashboard/deliveryagent?mode=${value}`);
		$deliveryAgentStore = {
			mode: value,
			id: '',
			employeeId: '',
			name: '',
			phone: '',
			password: ''
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="mage:users" />
			<span class="ml-2">Delivery Agent List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mi:user-add" />
			<span class="ml-2">
				{$deliveryAgentStore.mode == 'create' && $deliveryAgentStore.id ? 'Update' : 'Create'} Delivery
				Agent
			</span>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<DeliveryagentTable />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateDeliveryagent />
	</Tabs.Content>
</Tabs.Root>
