<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import Banners from '$lib/pages/master/banner/banners.svelte';
	import FAQ from '$lib/pages/master/faqs/faqs.svelte';
	import Suggestions from '$lib/pages/master/suggestions/suggestions.svelte';
	import Specifications from '$lib/pages/master/specifications/specifications.svelte';
	import Icon from '@iconify/svelte';
	import Quotes from '$lib/pages/master/quotes/quotes.svelte';
</script>

<svelte:head>
	<title>Dashboard | JME</title>
	<meta name="description" content="dashboard for Ecommerce" />
</svelte:head>

<Tabs.Root value={'specification'} class="w-[90%] p-4">
	<div>
		<Tabs.List >
			<Tabs.Trigger value="specification" class="flex items-center">
				<Icon class="w-4 h-4" icon="material-symbols:splitscreen-add-outline-rounded" />
				<span class="ml-2">Specifications</span>
			</Tabs.Trigger>
			<!-- <Tabs.Trigger value="suggestions" class="flex items-center">
				<Icon class="w-4 h-4" icon="fluent:food-pizza-20-regular" />
				<span class="ml-2">Suggestions</span>
			</Tabs.Trigger> -->
			<Tabs.Trigger value="quotes" class="flex items-center">
				<Icon class="w-5 h-5" icon="ic:outline-format-quote" />
				<span class="ml-2">Quotes</span>
			</Tabs.Trigger>
			<!-- <Tabs.Trigger value="faqs" class="flex items-center">
				<Icon class="w-4 h-4" icon="qlementine-icons:faq-16" />
				<span class="ml-2">FAQS</span>
			</Tabs.Trigger> -->
			<Tabs.Trigger value="banner" class="flex items-center">
				<Icon class="w-5 h-5" icon="material-symbols-light:planner-banner-ad-pt-outline-rounded" />
				<span class="ml-2">Banner</span>
			</Tabs.Trigger>
		</Tabs.List>
	</div>

	<Tabs.Content value="info">
		<div class="flex flex-col justify-center items-center text-center text-white"></div>
	</Tabs.Content>
	<Tabs.Content value="specification">
		<Specifications />
	</Tabs.Content>
	<Tabs.Content value="quotes">
	<Quotes />
	</Tabs.Content>
	<!-- <Tabs.Content value="suggestions">
		<Suggestions />
	</Tabs.Content> -->
	<!-- <Tabs.Content value="faqs">
		<FAQ />
	</Tabs.Content> -->
	<Tabs.Content value="banner">
		<Banners />
	</Tabs.Content>
</Tabs.Root>
