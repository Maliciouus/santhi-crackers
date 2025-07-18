<script>
	import { Button } from '$lib/components/ui/button';
	import { queryClient } from '$lib/query-client';
	import BannerCreate from './banner-create.svelte';
	import BannerList from './banner-list.svelte';

	let create = $state(false);
</script>

<div class="w-full flex overflow-y-auto">
	<Button
		class="ml-auto"
		onclick={() => {
			create = !create;

			if (!create) {
				queryClient.refetchQueries({
					queryKey: ['banners fetch']
				});
			}
		}}>{!create ? 'Create' : 'View'}</Button
	>
</div>

{#if create}
	<BannerCreate />
{:else}
	<BannerList />
{/if}
