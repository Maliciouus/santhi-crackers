<script>
	import { Button } from '$lib/components/ui/button';
	import { queryClient } from '$lib/query-client';
	import SuggestionsCreate from './suggestions-create.svelte';
	import SuggetionsList from './suggetions-list.svelte';

	let create = $state(false);
</script>

<div class="w-full flex">
	<Button
		class="ml-auto"
		onclick={() => {
			create = !create;

			if (!create) {
				queryClient.refetchQueries({
					queryKey: ['suggestions fetch']
				});
			}
		}}>{!create ? 'Create' : 'View'}</Button
	>
</div>

{#if create}
	<SuggestionsCreate />
{:else}
	<SuggetionsList />
{/if}
