<!-- src/routes/dashboard/groups/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import { imgUrl } from '$lib/config';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { groupStore } from './group-store';
  
	let page = $state(1);
	let limit = $state(5);
	let search = $state('');
	let modelOpen = $state(false);
	let selectedGroupId = $state('');
  
	async function fetchGroups(limit: number, page: number, search: string) {
	  const res = await _axios.get(`/group/all?limit=${limit}&page=${page}&q=${search}`);
	  return res.data;
	}
  
	const query = createQuery({
	  queryKey: ['group fetch', search, page, limit],
	  queryFn: () => fetchGroups(limit, page, search),
	  staleTime: 0
	});
  
	const deleteMutation = createMutation({
	  mutationFn: ({ id }: { id: string }) => _axios.delete(`/group/${id}`),
	  onSuccess({ data }) {
		queryClient.refetchQueries({ queryKey: ['group fetch'] });
		toast(data?.message ?? 'Group Deleted ✅');
		modelOpen = false;
		selectedGroupId = '';
	  },
	  onError(error) {
		console.error('Error:', error);
	  }
	});
  
	function debounceSearch() {
	  clearTimeout(debounceTimeout);
	  debounceTimeout = setTimeout(async () => {
		page = 1;
		$query.refetch();
	  }, 500);
	}
  
	let debounceTimeout: any;
  
	onMount(() => {
	  $query.refetch();
	});
  </script>
  
  <div class="mt-6 text-maintext">
	<div class="w-[50%] ml-auto mb-4 flex items-center gap-5">
	  <div class="grid gap-2 w-full relative">
		<Input
		  type="text"
		  required
		  class="pr-10"
		  placeholder="Search Groups"
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
		{:else if $query?.data?.groups?.length === 0}
		  <Table.Caption class="text-center w-full text-xs">No Groups Found!</Table.Caption>
		{/if}
		<Table.Header>
		  <Table.Row>
			<Table.Head class="w-[100px]">Sl.No</Table.Head>
			<Table.Head>Group Name</Table.Head>
			<Table.Head>Image</Table.Head>
			<Table.Head>Actions</Table.Head>
		  </Table.Row>
		</Table.Header>
		<Table.Body>
		  {#each $query.data?.groups || [] as group, i}
			<Table.Row>
			  <Table.Cell>{i + 1 + (page - 1) * limit}</Table.Cell>
			  <Table.Cell>{group.name}</Table.Cell>
			  <Table.Cell>
				{#if group.image}
				  <button onclick={() => {
					const newWindow = window.open();
					if (newWindow) {
					  const imageHTML = `<img src="${imgUrl}${group.image}" alt="${group.name}" />`;
					  newWindow.document.write(imageHTML);
					  newWindow.document.title = group.name;
					}
				  }}>
					<div class="p-4 shadow-lg rounded-lg border border-gray-100 w-[85px] flex justify-center items-center">
					  <img src={imgUrl + group.image} alt={group.name} class="h-[40px] rounded-sm cursor-pointer" />
					</div>
				  </button>
				{:else}
				  -
				{/if}
			  </Table.Cell>
			  <Table.Cell>
				<div class="flex items-center gap-4">
				  <button onclick={() => {
					$groupStore = {
					  ...$groupStore,
					  mode: 'create',
					  id: group._id,
					  name: group.name,
					  image: group.image,
					  products: group.products
					};
					goto(`/dashboard/group?mode=create&id=${group._id}`);
				  }}>
					<Icon icon="basil:edit-outline" class="hover:text-red-500 text-xl" />
				  </button>
				  <button onclick={() => ((modelOpen = true), (selectedGroupId = group._id))}>
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
			Do you want to delete this Group?
			<span class="text-sm font-semibold">This action cannot be undone.</span>
		  </Dialog.Title>
		</Dialog.Header>
		<div class="flex gap-4 justify-around">
		  <Button class="bg-red-500 text-white font-bold w-full hover:bg-red-400" onclick={() => {
			$deleteMutation.mutate({ id: selectedGroupId });
		  }}>Yes</Button>
		  <Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button>
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
  