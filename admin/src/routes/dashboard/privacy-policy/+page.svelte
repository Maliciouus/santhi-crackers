<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Button from '$lib/components/ui/button/button.svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';

	async function fetchPrivacyPolicy() {
		const res = await _axios.get('/ppolicy');
		const data = await res.data;
		return data;
	}

	const query = createQuery({
		queryKey: ['ppolicy fetch'],
		queryFn: () => fetchPrivacyPolicy()
	});

	const updatePrivacyPolicy = createMutation({
		mutationFn: (data: any) => _axios.post('/ppolicy/update', data)
	});

	let quill = $state<any>(null);
	let loading = $state<boolean>(true);

	onMount(() => {
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
		loading = false;
		script.onload = () => {
			quill = new (window as any).Quill('#editor', {
				theme: 'snow'
			});
		};
		document.body.appendChild(script);
	});

	function handleSave() {
		if (quill) {
			const content = quill.root.innerHTML;
			const delta = JSON.stringify(quill.getContents());

			$updatePrivacyPolicy.mutate({ content, delta });
		}
	}

	$effect(() => {
		if (quill && $query.data) {
			if ($query.data?.data?.delta) {
				quill.setContents(JSON.parse($query.data.data.delta));
			}
		}
	});
</script>

<svelte:head>
	<title>Dashboard | Manager - Manage Privacy Policy</title>
	<meta name="description" content="dashboard for Ecommerce" />
	<link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet" />
</svelte:head>

<div class="">
	<div class="w-[80%] mx-auto text-zinc-800 my-8 !font-pt">
		<h1 class="text-3xl font-bold py-3">Manage Privacy Policy</h1>
		{#if !loading}
			<div id="editor" class="overflow-y-auto"></div>

			<Button class="mt-4" disabled={$updatePrivacyPolicy.isPending} onclick={handleSave}>
				{#if !$updatePrivacyPolicy.isPending}
					<span>Save</span>
				{:else}
					<span>Updating...</span>
				{/if}
			</Button>
		{/if}
	</div>
</div>

<style>
	#editor {
		height: 500px;
		overflow: hidden;
	}

	#editor .ql-editor {
		height: 100%;
		overflow-y: auto;
	}
</style>
