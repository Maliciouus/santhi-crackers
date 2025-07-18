<script>
	import { Button } from '$lib/components/ui/button';
	import { queryClient } from '$lib/query-client';
	import FAQList from './faq-list.svelte';
	import FAQCreate from './faqs-create.svelte';
	import { faqStore } from './faq-store'; 
	import { derived } from 'svelte/store';

	let create = $state(false);

	const edit = derived(faqStore, ($faqStore) => $faqStore.mode === 'edit');
	function resetFaqStore() {
		faqStore.update((store) => ({
            ...store,
			mode: 'view',
			id: '',
			question: '',
			answer: ''
		}));
	}
    $effect(() => {
		if ($faqStore.mode==='view') {
			create = false;
		}
	});
	function setCreateMode() {
		faqStore.update((store) => ({
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
				resetFaqStore();
				create = false;

				queryClient.refetchQueries({
					queryKey: ['faqs fetch']
				});
			} else {
				setCreateMode();
				create = true;
			}
		}}
	>
		{#if create || $edit}
			View
		{:else}
			Create
		{/if}
	</Button>
</div>

{#if create || $edit}
	<FAQCreate {faqStore} />
{:else}
	<FAQList />
{/if}
