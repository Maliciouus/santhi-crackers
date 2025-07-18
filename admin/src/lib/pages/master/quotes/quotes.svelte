<script>
	import { Button } from '$lib/components/ui/button';
	import { queryClient } from '$lib/query-client';
	import { derived } from 'svelte/store';
	import { quoteStore } from './quote-store';
	import QuoteCreate from './quote-create.svelte';
	import QuoteList from './quote-list.svelte';


	let create = $state(false);

	const edit = derived(quoteStore, ($quoteStore) => $quoteStore.mode === 'edit');
	function resetQuoteStore() {
		quoteStore.update((/** @type {any} */ store) => ({
            ...store,
			mode: 'view',
			id: '',
			quote: ''
		}));
	}
    $effect(() => {
		if ($quoteStore.mode==='view') {
			create = false;
		}
	});
	function setCreateMode() {
		quoteStore.update((store) => ({
			...store,
			mode: 'create',
			id: '',
			quote: ''
		}));
	}
</script>

<div class="w-full flex">
	{#if create || $edit}
		<Button
			class="ml-auto"
			onclick={() => {
				resetQuoteStore();
				create = false;

				queryClient.refetchQueries({
					queryKey: ['quotes fetch']
				});
			}}
		>
			View
		</Button>
	{/if}
</div>

{#if create || $edit}
	<QuoteCreate {quoteStore} />
{:else}
	<QuoteList />
{/if}
