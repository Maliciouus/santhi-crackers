<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithElementRef<HTMLInputAttributes> = $props();
</script>

<input
	bind:this={ref}
	class={cn(
		'bg-background *:placeholder:text-zinc-700 placeholder:text-zinc-500 text-zinc-900 flex h-10 w-full rounded-md border-black border-[1px] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-600 focus-visible:outline-none focus-visible:ring-transparent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...restProps}
/>
