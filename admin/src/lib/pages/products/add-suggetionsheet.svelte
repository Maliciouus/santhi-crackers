<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';

	import { _axios } from '$lib/_axios';
	import { createQuery } from '@tanstack/svelte-query';
	import { productStore, type TSuggestion } from './schema';

	let {
		suggetions = $bindable([])
	}: {
		suggetions: TSuggestion[];
	} = $props();

	const suggetionsQuery = createQuery({
		queryKey: ['suggetions select'],
		queryFn: async () => {
			const res = await _axios.get('/suggestions/select');
			const data = await res.data;
			return data;
		}
	});

	function checkIfSuggetionExists(id: string) {
		return suggetions.some((suggetion) => suggetion.id === id);
	}
</script>

<Sheet.Root
	open={$productStore.suggestionSheetOpen}
	controlledOpen={true}
	onOpenChange={(val) => ($productStore.suggestionSheetOpen = val)}
>
	<Sheet.Content class="bg-zinc-200 border-none text-black">
		<Sheet.Header>
			<Sheet.Title class="text-zinc-900">Add Suggetions</Sheet.Title>
			<Sheet.Description>This added suggetions will show in users app.</Sheet.Description>
		</Sheet.Header>

		<div class="flex flex-col gap-4 p-2 text-zinc-800">
			<p>{suggetions.length} Items Selected</p>

			{#if $suggetionsQuery?.isLoading}
				<p class="text-zinc-600 text-sm">Loading...</p>
			{/if}

			<ScrollArea class="h-96">
				<div class="flex flex-wrap">
					{#each $suggetionsQuery.data?.suggetions || [] as suggetion}
						<button
							class={`m-1 p-2 px-4 font-bold  border-2 rounded-full ${checkIfSuggetionExists(suggetion._id) ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-800 border-zinc-600'} text-white text-xs`}
							onclick={() => {
								if (!checkIfSuggetionExists(suggetion._id)) {
									suggetions.push({
										name: suggetion.name,
										id: suggetion._id
									});
								} else {
									suggetions = suggetions.filter((current) => current.id !== suggetion._id);
								}
							}}
						>
							{suggetion.name}
						</button>
					{/each}
				</div>
			</ScrollArea>
		</div>
	</Sheet.Content>
</Sheet.Root>
