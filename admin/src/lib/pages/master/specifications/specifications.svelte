<script>
	import { Button } from '$lib/components/ui/button';
	import { queryClient } from '$lib/query-client';
	import { specificationStore } from './schema';
	import TimingList from './specification-list.svelte';
	import SpecificationsCreate from './specification-create.svelte';
	import SpecificationList from './specification-list.svelte';
	import { derived } from 'svelte/store';
	let create = $state(false);
	const edit = derived(specificationStore, ($specificationStore) => $specificationStore.mode === 'edit');
	function resetSpecificationStore() {
		specificationStore.update((store) => ({
            ...store,
			mode: 'list',
			id: '',
			question: '',
			answer: ''
		}));
	}
    $effect(() => {
		if ($specificationStore.mode==='list') {
			create = false;
		}
	});
	function setCreateMode() {
		specificationStore.update((store) => ({
			...store,
			mode: 'create',
			id: '',
			question: '',
			answer: ''
		}));
	}
</script>

<div class="w-full flex">
	<Button
		class="ml-auto"
		onclick={() => {
			if (create || $edit) {
				resetSpecificationStore();
				create = false;

				queryClient.refetchQueries({
					queryKey: ['specifications fetch']
				});
			} else {
				setCreateMode();
				create = true;
			}
		}}
		>{#if create || $edit}
		View
	{:else}
		Create
	{/if}</Button
	>
</div>

{#if create || $edit}
	<SpecificationsCreate {specificationStore} />
{:else}
	<SpecificationList />
{/if}
