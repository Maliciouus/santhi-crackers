<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	let { children } = $props();
	import { queryClient } from '$lib/query-client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import Topbar from '$lib/components/topbar.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import Notificationprovider from '$lib/components/notificationprovider.svelte';

	onMount(async () => {
		if (browser) {
			try {
				if (typeof window !== 'undefined') {
					import('$lib/firebase').then(async ({ onMessageListener, requestForToken }) => {
						console.log('Requesting FCM token...');
						const res = await requestForToken();
						// console.log(res);
					});
				}
				if ('serviceWorker' in navigator) {
					navigator.serviceWorker
						.register('/firebase-messaging-sw.js')
						.then((registration) => {
							console.log('Service Worker registered:', registration);
						})
						.catch((err) => {
							console.log('Service Worker registration failed:', err);
						});
				}
			} catch (error) {
				console.error('Error initializing Firebase messaging:', error);
			}
		}
	});
</script>

<Toaster position="top-center" />
<QueryClientProvider client={queryClient}>
	<div class="fixed z-50">
		<Navbar />
		<Topbar />
	</div>

	<div class="scrollbar-hide pt-[150px]">
		{@render children()}
	</div>
</QueryClientProvider>
