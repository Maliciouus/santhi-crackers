<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import ComboCreate from '$lib/pages/comboOffers/combo-create.svelte';
	import { comboStore } from '$lib/pages/comboOffers/combo-store';
	import ComboTable from '$lib/pages/comboOffers/combo-table.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Combo Offers</title>
	<meta name="description" content="dashboard for e-commerce" />
</svelte:head>

<Tabs.Root
	class="w-full p-4"
	value={$comboStore.mode}
	onValueChange={(value) => {
		$comboStore = {
			id: '',
			mode: value,
			comboName: '',
			comboDescription: '',
			comboPrice:0,
			strikePrice: 0,
			image: '',
			productsIncluded: []
		};
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="hugeicons:tags" />
			<span class="ml-2">Combo List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="oui:ml-create-single-metric-job" />
			<span class="ml-2">
				{$comboStore.mode == 'create' && $comboStore.id ? 'Edit' : 'Create'} Combo</span
			>
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list">
		<ComboTable {comboStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<ComboCreate {comboStore} />
	</Tabs.Content>
</Tabs.Root>