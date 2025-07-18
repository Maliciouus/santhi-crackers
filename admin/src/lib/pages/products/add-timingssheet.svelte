<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';

	import { _axios } from '$lib/_axios';
	import { createQuery } from '@tanstack/svelte-query';
	import { productStore, type TTimings } from './schema';

	let {
		timings = $bindable([])
	}: {
		timings: TTimings[];
	} = $props();

	const timingsQuery = createQuery({
		queryKey: ['timings select'],
		queryFn: async () => {
			const res = await _axios.get('/timings/select');
			const data = await res.data;
			return data;
		}
	});

	function checkIfTimingsExists(id: string) {
		return timings.some((timing) => timing.id === id);
	}
</script>

<Sheet.Root
	open={$productStore.timingsSheetOpen}
	controlledOpen={true}
	onOpenChange={(val) => ($productStore.timingsSheetOpen = val)}
>
	<Sheet.Content class="bg-zinc-100 border-none text-black">
		<Sheet.Header>
			<Sheet.Title class="text-zinc-900">Add Timings</Sheet.Title>
			<Sheet.Description>
				Set specific timings to control when your products are available for customers.
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex flex-col gap-4 p-2 text-zinc-800">
			<p>{timings.length} Items Selected</p>

			{#if $timingsQuery?.isLoading}
				<p class="text-zinc-600 text-sm">Loading...</p>
			{/if}

			<ScrollArea class="h-96">
				<div class="flex flex-wrap gap-2">
					{#each $timingsQuery.data?.timings || [] as timing}
						<button
							class={`m-1 p-2 px-4 font-bold  border-2 rounded-full ${checkIfTimingsExists(timing._id) ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-800 border-zinc-600'} text-white text-xs`}
							onclick={() => {
								if (!checkIfTimingsExists(timing._id)) {
									timings.push({
										name: timing.name,
										id: timing._id
									});
								} else {
									timings = timings.filter((_timing) => _timing.id !== timing._id);
								}
							}}
						>
							{timing.name} - {timing.startTime} to {timing.endTime}
						</button>
					{/each}
				</div>
			</ScrollArea>
		</div>
	</Sheet.Content>
</Sheet.Root>
