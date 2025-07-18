<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';

	import { _axios } from '$lib/_axios';
	import { createQuery } from '@tanstack/svelte-query';
	import { productStore, type TDippings } from './schema';

	let {
		dippings = $bindable([])
	}: {
		dippings: TDippings[];
	} = $props();

	const suggetionsQuery = createQuery({
		queryKey: ['dippings select'],
		queryFn: async () => {
			const res = await _axios.get('/dippings/select');
			const data = await res.data;
			return data;
		}
	});

	function checkIfDippingsExists(id: string) {
		return dippings.some((dipping) => dipping.id === id);
	}
</script>

<Sheet.Root
	open={$productStore.dippingsSheetOpen}
	onOpenChange={(val) => ($productStore.dippingsSheetOpen = val)}
>
	<Sheet.Content class="bg-zinc-200 border-none text-black">
		<Sheet.Header>
			<Sheet.Title class="text-zinc-900">Add Dippings</Sheet.Title>
			<Sheet.Description>This added dippings will show in users app.</Sheet.Description>
		</Sheet.Header>

		<div class="flex flex-col gap-4 p-2 text-zinc-800">
			<p>{dippings.length} Items Selected</p>

			{#if $suggetionsQuery?.isLoading}
				<p class="text-zinc-600 text-sm">Loading...</p>
			{/if}

			<ScrollArea class="h-96">
				<div class="flex flex-wrap gap-2">
					{#each $suggetionsQuery.data?.dippings || [] as dipping}
						<button
							class={`m-1 p-2 px-4 font-bold  border-2 rounded-full ${checkIfDippingsExists(dipping._id) ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-800 border-zinc-600'} text-xs`}
							onclick={() => {
								if (!checkIfDippingsExists(dipping._id)) {
									dippings.push({
										name: dipping.name,
										id: dipping._id
									});
								} else {
									dippings = dippings.filter((current) => current.id !== dipping._id);
								}
							}}
						>
							{dipping.name} - {dipping.price} Rs
						</button>
					{/each}
				</div>
			</ScrollArea>
		</div>
	</Sheet.Content>
</Sheet.Root>
