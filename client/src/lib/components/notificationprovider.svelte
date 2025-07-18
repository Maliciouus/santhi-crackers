<script lang="ts">
	import { browser } from "$app/environment";
	import { onMount } from "svelte";

	onMount(async () => {
		if (browser) {
			try {
				if (typeof window !== "undefined") {
					import("$lib/firebase").then(
						async ({ onMessageListener,  requestForToken,  }) => {
                            console.log('Requesting FCM token...');
							const res = await requestForToken();
							console.log(res);
							onMessageListener().then((payload: any) => {
								console.log("Message received in foreground:", payload);
								if (Navigator) {
									navigator.serviceWorker.ready.then((registration) => {
										registration.showNotification(payload.data.title, {
											body: payload.data.message,
											icon: "/logo.png",
										});
									});
								} else {
									console.log("Notification not supported");
								}
							});
						}
					);
				}
			} catch (error) {
				console.error('Error initializing Firebase messaging:', error);
			}
		}
	});
</script>
