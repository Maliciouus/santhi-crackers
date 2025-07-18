<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { imgUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import { hexToRgba } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { TimePicker } from 'svelte-time-picker';
	import { derived } from 'svelte/store';
	import type { CategoryStoreProps } from './category-store';

	let { categoryStore }: CategoryStoreProps = $props();

	async function fetchCategories(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/productcategory/all?limit=${limit}&page=${page}&q=${search}`);
		return res.data;
	}

	async function fetchStatus() {
		const res = await _axios.get(`/productcategory/activeStatus`);
		return res.data;
	}

	onMount(() => {
		fetchStatus();
	});

	let page = $state(1);
	let limit = $state(5);
	let search = $state('');
	let modelOpen = $state(false);
	let selectedCategoryId = $state('');

	let disableModelOpen = $state(false);
	let disableAllModelOpen = $state(false);
	let disableReason = $state('');
	let disableType = $state('date');
	let disabledUntil = $state(disableType === 'date' ? 2 : '12:00');

	$effect(() => {
		if (disableType === 'date') {
			disabledUntil = 2;
		} else {
			disabledUntil = '12:00';
		}
	});
	async function toggleStatus(id: string, active: boolean) {
		try {
			await _axios.delete(`/productcategory/${id}`, {
				params: { permanent: false }
			});
			toast.success(`Category ${active ? 'deactivated' : 'activated'} successfully`);
			$query.refetch();
		} catch (error) {
			toast.error('Failed to update Category status');
		}
	}

	let debounceTimeout: any;
	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			page = 1;
			$query.refetch();
		}, 500);
	}

	const statusQuery = createQuery({
		queryKey: ['Status fetch'],
		queryFn: () => fetchStatus()
	});

	const query = createQuery({
		queryKey: ['category fetch', debounceSearch],
		queryFn: () => fetchCategories(limit, page, search),
		staleTime: 0
	});

	const majorityActive = derived(query, ($query) => {
		if (!$query?.data?.categories || $query.data.categories.length === 0) {
			return false;
		}

		const activeCount = $query.data.categories.filter((cat: { active: boolean }) => cat.active).length;
		return activeCount > $query.data.categories.length - activeCount;
	});

	const toggleActiveMutation = createMutation({
		mutationFn: ({ active, reason }: { active: boolean; reason: string }) =>
			_axios.delete(`/productcategory/activeStatus?active=${active}&reason=${reason}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['category fetch']
			});
			if (data?.status) {
				toast(data?.message ?? 'Category status updated ✅');
				disableAllModelOpen = false;
			}
		},
		onError(error) {
			console.error('Error updating category status:', error);
		}
	});

	const disableMutation = createMutation({
		mutationFn: ({ id, permanent, disabledUntil }: { id: string; permanent: boolean; disabledUntil: any }) =>
			_axios.delete(`/productcategory/${id}?permanent=${permanent}&reEnable=${disabledUntil}&type=${disableType}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['category fetch']
			});
			if (data?.status) {
				toast(data?.message ?? 'Category Updated ✅');
				disableModelOpen = false;
				selectedCategoryId = '';
			}
		},
		onError(error) {
			console.error('Error:', error);
		}
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/productcategory/permanent/${id}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['category fetch']
			});
			toast(data?.message ?? 'Category Deleted ✅');
			modelOpen = false;
			selectedCategoryId = '';
		},
		onError(error) {
			console.error('Error:', error);
		}
	});

	function formatTo12Hour(time: string) {
		const [hours, minutes] = time.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const formattedHours = hours % 12 || 12;
		return `${formattedHours}:${String(minutes).padStart(2, '0')} ${period}`;
	}
</script>

<div class="mt-6 text-maintext">
	<div class="w-[50%] ml-auto mb-4 flex items-center gap-5">
		<!-- <div class="flex items-center gap-2">
			<Button
				size="sm"
				onclick={() => {
					disableReason = '';
					if ($majorityActive) {
						disableAllModelOpen = true;
					} else {
						$toggleActiveMutation.mutate({ active: true, reason: '' });
					}
				}}
			>
				{$majorityActive ? 'Disable' : 'Enable'}
			</Button>
		</div> -->
		<div class="grid gap-2 w-full relative">
			<Input
				type="text"
				required
				class="pr-10"
				placeholder="Search Category"
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

	<div class="overflow-x-auto h-[calc(100vh-300px)] overflow-y-auto hidescrollbarthumb">
		<Table.Root>
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Products Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Category Name</Table.Head>
					<Table.Head>Code</Table.Head>
					<Table.Head>Image</Table.Head>
					<Table.Head>Active</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.categories || [] as category, i}
					<Table.Row>
						<Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
						<Table.Cell>{category.name}</Table.Cell>
						<Table.Cell>{category.code}</Table.Cell>
				
						<Table.Cell>
							{#if category.image}
								<button
									onclick={() => {
										const newWindow = window.open();
										if (newWindow) {
											const imageHTML = `<img src="${imgUrl}${category.image}" alt="${category.name}" />`;
											newWindow.document.write(imageHTML);
											newWindow.document.title = category.name;
										}
									}}
								>
									<div
										class="p-4 shadow-lg rounded-lg border border-gray-100 w-[85px] flex justify-center items-center"
									>
										<img
											src={imgUrl + category.image}
											alt={category.name}
											class="h-[40px] rounded-sm cursor-pointer"
										/>
									</div>
								</button>
							{:else}
								-
							{/if}
						</Table.Cell>
						<Table.Cell><Switch
							class="text-right"
							checked={category.active}
							onCheckedChange={() => toggleStatus(category._id, category.active)}
						/></Table.Cell>
						<!-- <Table.Cell>
							<Switch
								class="text-right"
								disabled={$deleteMutation.isPending}
								checked={category.active}
								on:checkedChange={(e) => {
									if (category.active) {
										disableModelOpen = true;
										selectedCategoryId = category._id;
									} else {
										$disableMutation.mutate({
											id: category._id,
											permanent: false,
											disabledUntil: 0
										});
										invalidateAll();
									}
								}}
							/>
						</Table.Cell> -->
						<Table.Cell>
							<div class="flex items-center gap-4">
								<button
									onclick={() => {
										$categoryStore = {
											...$categoryStore,
											mode: 'create',
											id: category._id,
											name: category.name,
											code:category.code,
											description: category.description,
											image:category.image
										};
										goto(`/dashboard/categories?mode=create&id=${category._id}`);
									}}
								>
									<Icon icon="basil:edit-outline" class="hover:text-red-500 text-xl" />
								</button>

								<button onclick={() => ((modelOpen = true), (selectedCategoryId = category._id))}>
									<Icon icon="mingcute:delete-2-fill" class="hover:text-red-500 text-xl" />
								</button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<Dialog.Root open={modelOpen} on:openChange={(e) => (modelOpen = e)}>
		<Dialog.Content>
			<Dialog.Header class="text-center">
				<div class="flex justify-center items-center">
					<Icon icon="jam:triangle-danger-f" class="text-red-500 text-6xl" />
				</div>

				<Dialog.Title class="flex flex-col gap-2 justify-center items-center text-center">
					Do you want to delete this Category?

					<span class="text-sm font-semibold"> This action cannot be undone. </span>
				</Dialog.Title>
			</Dialog.Header>

			<div class="flex gap-4 justify-around">
				<Button
					class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
					onclick={() => {
						$deleteMutation.mutate({ id: selectedCategoryId, permanent: true });
					}}>Yes</Button
				>
				<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root
		open={disableAllModelOpen}
		on:openChange={(e) => {
			disableReason = '';
			disableAllModelOpen = e;
		}}
	>
		<Dialog.Content>
			<Dialog.Header class="text-center">
				<Dialog.Title class="flex flex-col gap-2 justify-center items-center text-center">
					Reason
				</Dialog.Title>
			</Dialog.Header>

			<div>
				<Input placeholder="Reason for disabling all categories" bind:value={disableReason} />
			</div>

			<div class="flex gap-4 justify-end">
				<Button
					onclick={() => {
						$toggleActiveMutation.mutate({ active: false, reason: disableReason });
					}}
					class="text-white bg-green-700 w-[100px] hover:bg-green-800 font-bold">Save</Button
				>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root
		open={disableModelOpen}
		on:openChange={async (e) => {
			disableModelOpen = e;
			if (!e) {
				window.location.reload();
			}
			await invalidateAll();
		}}
	>
		<Dialog.Content class="max-w-[400px]">
			<Dialog.Header class="text-center">
				<Dialog.Title class="flex flex-col gap-2 justify-center items-center text-center">
					{#if disableType === 'date'}
						This Category will be disabled for {disabledUntil ?? 2} days.
					{:else}
						This Category will be disabled until {formatTo12Hour(disabledUntil)}.
					{/if}
				</Dialog.Title>
			</Dialog.Header>

			<form class="my-6">
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="Type">Type</Label>
						<Select.Root
							name="type"
							type="single"
							bind:value={disableType}
							on:valueChange={(value) => (disableType = value)}
						>
							<Select.Trigger class="">
								<span class="capitalize">{disableType ? disableType : 'Select Type'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Item value="date" class="capitalize">Date</Select.Item>
									<Select.Item value="time" class="capitalize">Time</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="grid gap-4 mt-4">
					<div class="flex flex-col gap-2">
						<Label for="disabledUntil">Disabled Until</Label>
						{#if disableType === 'date'}
							<Input
								id="disabledUntil"
								type="number"
								min="2"
								max="14"
								placeholder="2 days"
								required
								bind:value={disabledUntil}
							/>
						{:else}
							<div class="">
								<TimePicker on:change={(e) => (disabledUntil = e.detail)} />
							</div>
						{/if}
					</div>
				</div>
			</form>

			<div class="flex gap-4 justify-around">
				<Button
					class="bg-white text-black font-bold w-full border-2 border-red-500 hover:bg-white"
					onclick={() => {
						$disableMutation.mutate({
							id: selectedCategoryId,
							permanent: false,
							disabledUntil: disabledUntil
						});
						invalidateAll();
					}}>Yes</Button
				>
				<Button
					class="text-white font-bold w-full"
					onclick={() => {
						disableModelOpen = false;
						window.location.reload();
					}}>No</Button
				>
			</div>
		</Dialog.Content>
	</Dialog.Root>

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