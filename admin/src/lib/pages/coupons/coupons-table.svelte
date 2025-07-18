<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { CouponsStoreProps } from './coupons-store';

	let { couponsStore }: CouponsStoreProps = $props();

	let page = $state(1);
	let limit = $state(7);
	let search = $state('');

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await tick();
			page = 1;
			$query.refetch();
		}, 500);
	}

	async function fetchCoupons(limit: number, page: number, search: string) {
		const { data } = await _axios.get(`/coupon/?limit=${limit}&page=${page}&q=${search}`);
		return data;
	}

	const query = createQuery({
		queryKey: ['coupons'],
		queryFn: () => fetchCoupons(limit, page, search)
	});

	const deleteMutation = createMutation({
		mutationFn: (id: string) => _axios.delete(`/coupon/${id}`),
		onSuccess({ data }) {
			toast(data?.message || 'Coupon Deleted ✅');
			queryClient.refetchQueries();
		},
		onError(error) {
			console.error('Delete Error:', error);
		}
	});
</script>

<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto overflow-auto">
	<div class="w-[40%] ml-auto mb-4">
		<div class="grid gap-2 relative">
			<Input
				type="text"
				class="pr-10"
				placeholder="Search Coupon"
				bind:value={search}
				oninput={debounceSearch}
			/>
			{#if !search}
				<Icon
					icon="iconamoon:search"
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{:else}
				<Icon
					icon="mdi:clear-outline"
					on:click={() => {
						search = '';
						debounceSearch();
					}}
					class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
				/>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto">
		<Table.Root>
			{#if $query.isLoading}
				<Table.Caption>Loading...</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption>No Coupons Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Code</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head>Discount</Table.Head>
					<Table.Head>Price Range</Table.Head>
					<Table.Head>Valid Days</Table.Head>
					<Table.Head>Active</Table.Head>
					<!-- <Table.Head>Actions</Table.Head> -->
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query?.data?.data || [] as coupon, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell class="w-[200px]">{coupon.code}</Table.Cell>
						<Table.Cell class="w-[400px]">{coupon.description}</Table.Cell>
						<Table.Cell class="w-[200px]">{coupon.discount}%</Table.Cell>
						<Table.Cell>₹{coupon.minPrice} - ₹{coupon.maxPrice}</Table.Cell>
						<Table.Cell>{coupon.numberOfDays}</Table.Cell>
						<Table.Cell>
							<Switch
								checked={coupon.active}
								class="text-right"
								disabled={$deleteMutation.isPending}
								onclick={() => $deleteMutation.mutate(coupon._id)}
							/>
						</Table.Cell>
						<!-- <Table.Cell>
							<button
								onclick={() => {
									couponsStore = {
										mode: 'edit',
										...coupon
									};
								}}
							>
								<Icon icon="basil:edit-outline" class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell> -->
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		{#if !$query.isLoading && $query?.data?.total > 0}
			<Paginator
				total={$query?.data?.total || 0}
				{limit}
				{page}
				callback={(_page: number) => {
					if (_page === page) return;
					page = _page;
					$query.refetch();
				}}
			/>
		{/if}
	</div>
</div>
