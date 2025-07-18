<script lang="ts">
	import { cn } from '$lib/utils.js';
	import Icon from '@iconify/svelte';
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		'border-black border-[1px] bg-background text-zinc-700 ring-offset-background data-[placeholder]:text-muted-foreground focus:ring-transparent flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<Icon icon="entypo:chevron-down" class="size-4 opacity-50 text-black" />
</SelectPrimitive.Trigger>
