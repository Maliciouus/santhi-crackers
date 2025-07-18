<script lang="ts">
	import '../app.css';
	let { children } = $props();

	import { goto } from '$app/navigation';
	import { Toaster } from '$lib/components/ui/sonner';
	import { baseUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';

	const customSound = new Audio('/tone.wav');

	let ws: any;

	const connectWebSocket = () => {
		ws = new WebSocket(`${baseUrl}/ws`);

		ws.onmessage = (event: any) => {
			const data = JSON.parse(event.data);

			if (data.type === 'order') {
				localStorage.setItem('hasUnreadNotification', 'true');

				queryClient.invalidateQueries({
					queryKey: ['orders fetch']
				});

				const playNotification = () => {
					if (localStorage.getItem('hasUnreadNotification') === 'true') {
						customSound.play().catch((error) => console.error('Error playing sound:', error));
						setTimeout(playNotification, 3000);
					}
				};

				playNotification();

				navigator.serviceWorker.ready.then((registration) => {
					registration.showNotification(data.message, {
						body: data.body
					});
				});
			}
		};

		ws.onclose = () => {
			console.log('WebSocket connection closed. Reconnecting...');
			setTimeout(connectWebSocket, 5000);
		};

		ws.onerror = (error: any) => {
			console.error('WebSocket error:', error);
			ws.close();
		};
	};

	onMount(() => {
		// if (!localStorage.getItem('restaurent')) {
		// 	goto('/hidden-admin-base-007');
		// }
		// $writableGlobalStore.adminDetails = JSON.parse(localStorage.getItem('restaurent') || '{}');
		// $writableGlobalStore.isManager = JSON.parse(localStorage.getItem('isManager') || 'false');

		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
				console.log('Service Worker registered with scope:', registration.scope);
				return Notification.requestPermission();
			})
			.then((permission) => {
				if (permission === 'granted') {
					console.log('Notification permission granted.');
				} else {
					alert("Notification permission not granted! You won't receive notifications.");
				}
			})
			.catch((error) => console.error('Service Worker registration failed:', error));

		connectWebSocket();
	});
</script>

<Toaster position="top-right" />
<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
