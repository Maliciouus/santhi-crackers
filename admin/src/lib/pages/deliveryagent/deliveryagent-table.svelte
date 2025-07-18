<script lang="ts">
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import * as Table from '$lib/components/ui/table';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { deliveryAgentStore } from './deliveryagent-store';

	async function fetchDeliveryAgent(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/deliveryagent/all?limit=${limit}&page=${page}&q=${search}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);

	let search = $state('');
	let modelOpen = $state(false);
	let selectedAgentId = $state('');
	let debounceTimeout: any;

	function debounceSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await tick();
			page = 1;
			$query.refetch();
		}, 500);
	}

	const query = createQuery({
		queryKey: ['deliveryagent fetch'],
		queryFn: () => fetchDeliveryAgent(limit, page, search)
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/deliveryagent/${id}?permanent=${permanent}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['deliveryagent fetch']
			});
			toast(data?.message ?? 'Delivery Agent Edited');
			modelOpen = false;
			selectedAgentId = '';
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
</script>

<div>
	<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
		<div class="w-[40%] ml-auto">
			<div class="grid gap-2 relative">
				<Input
					type={'text'}
					required
					class="pr-10"
					placeholder={'Search Delivery Agent'}
					bind:value={search}
					oninput={debounceSearch}
				/>
				{#if !search}
					<Icon
						icon={'iconamoon:search'}
						class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
					/>
				{:else}
					<Icon
						icon={'mdi:clear-outline'}
						onclick={() => {
							search = '';
							debounceSearch();
						}}
						class="absolute right-2 bottom-2.5 cursor-pointer text-gray-400 text-xl"
					/>
				{/if}
			</div>
		</div>

		<Table.Root class="">
			{#if $query.isLoading}
				<Table.Caption>Loading....</Table.Caption>
			{:else if $query?.data?.total === 0}
				<Table.Caption class="text-center w-full text-xs">No Delivery Agents Found!</Table.Caption>
			{/if}
			<Table.Header>
				<Table.Row class="">
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Username</Table.Head>
					<Table.Head>Employee ID</Table.Head>
					<Table.Head>Phone</Table.Head>
					<Table.Head>Active</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.agents || [] as agent, i}
					<Table.Row>
						<Table.Cell>{i + 1}</Table.Cell>
						<Table.Cell>{agent.name}</Table.Cell>
						<Table.Cell>{agent.employeeId}</Table.Cell>
						<Table.Cell>{agent.phone}</Table.Cell>
						<Table.Cell>
							<Switch
								class="text-right"
								disabled={$deleteMutation.isPending}
								checked={agent.active}
								onclick={() =>
									$deleteMutation.mutate({
										id: agent._id,
										permanent: false
									})}
							/>
						</Table.Cell>
						<Table.Cell class="flex gap-2">
							<button
								onclick={() => {
									$deliveryAgentStore = {
										id: agent._id,
										name: agent.name,
										employeeId: agent.employeeId,
										mode: 'create',
										password: '',
										phone: agent.phone.toString()
									};
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>

							<button onclick={() => ((modelOpen = true), (selectedAgentId = agent._id))}>
								<Icon icon={'mingcute:delete-2-fill'} class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<Dialog.Root open={modelOpen} onOpenChange={(e) => (modelOpen = e)}>
			<Dialog.Content class="p-6">
				<Dialog.Header class="text-center">
					<Dialog.Title class="text-center"
						>Do you want to delete this Delivery Agent ?</Dialog.Title
					>
				</Dialog.Header>

				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => $deleteMutation.mutate({ id: selectedAgentId, permanent: true })}
						>Yes</Button
					>
					<Button class="text-white font-bold w-full" onclick={() => (modelOpen = false)}>No</Button
					>
				</div>
			</Dialog.Content>
		</Dialog.Root>

		{#if !$query.isLoading && $query?.data?.total > 0}
			<Paginator
				total={$query?.data?.total || 0}
				{limit}
				{page}
				callback={(_page: any) => {
					if (_page === page) return;
					page = _page;
					$query.refetch();
				}}
			/>
			<!-- {:else}
			<p class="text-center text-xs">No Managers Found!</p> -->
		{/if}
	</div>
</div>
