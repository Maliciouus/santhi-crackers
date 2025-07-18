<script lang="ts">
	import Sidebar from '$lib/components/sidebar.svelte';
	import Topbar from '$lib/components/topbar.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
    document.getElementById("autoClickButton")?.click();
  });

  function handleClick() {
    console.log("Button was clicked automatically!");
  }
  
	let { children } = $props();
</script>
<button id="autoClickButton" class="hidden" onclick={handleClick}>
	Click Me
  </button>
<div class="bg-zinc-100 flex w-screen">
	<Sidebar />
	<div class="flex flex-col w-full">
		<Topbar />
		{@render children()}
	</div>
</div>
