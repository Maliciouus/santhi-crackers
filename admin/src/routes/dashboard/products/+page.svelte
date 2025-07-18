<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import BulkUpload from '$lib/pages/products/bulk-upload.svelte';
	import BulkImageUpload from '$lib/pages/products/bulkImage-upload.svelte';
	import CreateProducts from '$lib/pages/products/create-products.svelte';
	import ProductsTable from '$lib/pages/products/products-table.svelte';
	import { productEditStore } from '$lib/pages/products/schema';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Dashboard | Products</title>
	<meta name="description" content="dashboard for E-commerce" />
</svelte:head>

<Tabs.Root
	value={$productEditStore.mode}
	class="w-full p-4"
	onValueChange={(value) => {
		$productEditStore.mode = value;

		const doc = document.querySelector('#productformcreate');

		setTimeout(() => {
			if (doc) {
				doc.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 500);

		if (value === 'list') {
			$productEditStore.id = '';
			$productEditStore.category = {
				categoryNumber: 0,
				_id: '',
				name: ''
			};
			$productEditStore.group = [];
			$productEditStore.ageGroup = [];
			$productEditStore.occations = [];
			$productEditStore.description = '';
			$productEditStore.productName = '';
			$productEditStore.price = '';
			// $productEditStore.rating = '';
			$productEditStore.productCode = '';
			$productEditStore.topSeller = null;
			$productEditStore.images = '';
			$productEditStore.gst = '';
		}
		goto(`/dashboard/products?mode=${value}`, { replaceState: true });
	}}
>
	<Tabs.List>
		<Tabs.Trigger value="list" class="flex items-center gap-2">
			<Icon class="w-4 h-4" icon="tabler:table" />
			<span>Product List</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="create" class="flex items-center gap-2">
			<Icon class="w-4 h-4" icon="mdi:syringe" />
			<span>{$productEditStore.id ? 'Edit' : 'Create'} Product</span>
		</Tabs.Trigger>
		<!-- <Tabs.Trigger value="bulkUpload" class="flex items-center gap-2">
			<Icon class="w-4 h-4" icon="line-md:uploading" />
			<span>Bulk Upload</span>
		</Tabs.Trigger>
		<Tabs.Trigger value="bulkImageUpload" class="flex items-center gap-2">
			<Icon class="w-4 h-4" icon="majesticons:image-plus-line" />
			<span>Bulk Image Upload</span>
		</Tabs.Trigger> -->
	</Tabs.List>
	<Tabs.Content value="list">
		<ProductsTable {productEditStore} />
	</Tabs.Content>
	<Tabs.Content value="create">
		<CreateProducts />
	</Tabs.Content>
	<!-- <Tabs.Content value="bulkUpload">
		<BulkUpload />
	</Tabs.Content>
	<Tabs.Content value="bulkImageUpload">
		<BulkImageUpload />
	</Tabs.Content> -->
</Tabs.Root>
