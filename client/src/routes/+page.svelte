<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { createQuery } from '@tanstack/svelte-query';
	import Hero from '$lib/components/pages/home/hero.svelte';
	import NewProducts from '$lib/components/pages/home/newProducts.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';
	import { requestPermissionAndToken } from '$lib/firebase/messaging';
	import { toast } from 'svelte-sonner';
	import { onMessageListener } from '$lib/firebase';
	// Fetch banners from the API
	const fetchBanners = async () => {
		const res = await _axios.get('/banner/all');
		return res.data; // { banners: [], status: boolean, total: number }
	};

	// Create query to fetch banners
	const bannerQuery = createQuery({
		queryKey: ['banners'],
		queryFn: fetchBanners
	});

	// Reactive variables
	$: banners = $bannerQuery.data?.banners || [];
	$: totalBanners = $bannerQuery.data?.total || 0;

	onMount(async () => {
		if (typeof window === 'undefined') return;

		const { onMessage, getMessaging } = await import('firebase/messaging');
		const { firebaseApp } = await import('$lib/firebase/firebase');

		if (!firebaseApp) return;

		const messaging = getMessaging(firebaseApp);

		// onMessage(messaging, (payload) => {
		// 	console.log('Foreground message:', payload);
		// 	toast(payload.notification?.title);
		// });
		onMessageListener().then((payload: any) => {
			console.log('Message received in foreground:', payload);
		});

		await requestPermissionAndToken();
	});
</script>

<div>
	<Hero />
	<!-- <Quote /> -->
	<!-- <OfferProducts /> -->
	<!-- <NewProducts /> -->
	<!-- <DemandBox /> -->
	<NewProducts />
	<Footer />
</div>
