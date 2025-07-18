<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import ConfigSettings from '$lib/pages/settings/config-settings.svelte';
	import ProfileSettings from '$lib/pages/settings/profile-settings.svelte';
	import StoreDetails from '$lib/pages/settings/store-details.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Settings</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root value={'create'} class="w-full p-4">
	<Tabs.List>
		<!-- <Tabs.Trigger value="list" class="flex items-center">
			<Icon class="w-4 h-4" icon="uil:setting" />
			<span class="ml-2">Profile Settings</span>
		</Tabs.Trigger> -->

		<Tabs.Trigger value="create">
			<Icon class="w-4 h-4" icon="mingcute:hotel-line" />
			<span class="ml-2">Entity Details</span>
		</Tabs.Trigger>

		<!-- <Tabs.Trigger value="config">
			<Icon class="w-4 h-4" icon="material-symbols:settings-outline-rounded" />
			<span class="ml-2">Configs</span>
		</Tabs.Trigger> -->
	</Tabs.List>
	<!-- <Tabs.Content value="list">
		<ProfileSettings />
	</Tabs.Content> -->
	<Tabs.Content value="create">
		<StoreDetails />
	</Tabs.Content>
	<!-- <Tabs.Content value="config">
		<ConfigSettings />
	</Tabs.Content> -->
</Tabs.Root>
