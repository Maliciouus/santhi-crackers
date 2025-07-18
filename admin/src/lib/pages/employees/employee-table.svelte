<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import Paginator from '$lib/components/paginator.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import TableCaption from '$lib/components/ui/table/table-caption.svelte';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { employeeStore } from './employee-store';
	async function fetchEmployees(limit = 10, page = 1, search = '') {
		const res = await _axios.get(`/employee/all?limit=${limit}&page=${page}&q=${search}`);
		const data = await res.data;
		return data;
	}

	let page = $state(1);
	let limit = $state(10);
	let modelOpen = $state(false);
	let selectedEmployeeId = $state('');
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

	const query = createQuery({
		queryKey: ['employee fetch'],
		queryFn: () => fetchEmployees(limit, page, search)
	});

	const deleteMutation = createMutation({
		mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
			_axios.delete(`/employee/${id}?permanent=${permanent}`),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['employee fetch']
			});
			goto('/dashboard/employees?mode=list');
			toast(data?.message ?? 'Employee Edited');
			modelOpen = false;
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		}).format(date);
	}
</script>

<div>
	<div class="mt-6 text-maintext w-[calc(100vw-420px)] font-pt mx-auto">
		<div class="w-[40%] ml-auto">
			<div class="grid gap-2 relative">
				<Input
					type={'text'}
					required
					class="pr-10"
					placeholder={'Search Employee'}
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
				<TableCaption class="text-center w-full text-xs">No Employees Found!</TableCaption>
			{/if}
			<Table.Header>
				<Table.Row class="">
					<Table.Head class="w-[100px]">Sl.No</Table.Head>
					<Table.Head>Username</Table.Head>
					<Table.Head>Email</Table.Head>
					<Table.Head class="">Joined At</Table.Head>
					<Table.Head class="">Active</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $query.data?.employees || [] as employee, i}
					<Table.Row>
						<Table.Cell>{i + 1}</Table.Cell>
						<Table.Cell>{employee.name}</Table.Cell>
						<Table.Cell>{employee.email}</Table.Cell>
						<Table.Cell class="flex items-center"
							>{formatDate(new Date(employee.createdAt))}</Table.Cell
						>
						<Table.Cell>
							<Switch
								class="text-right"
								disabled={$deleteMutation.isPending}
								checked={employee.active}
								onclick={() =>
									$deleteMutation.mutate({
										id: employee._id,
										permanent: false
									})}
							/>
						</Table.Cell>
						<Table.Cell class="flex gap-2">
							<button
								onclick={() => {
									$employeeStore = {
										id: employee._id,
										name: employee.name,
										email: employee.email,
										mode: 'create',
										password: employee.password,
										joinedAt: formatDate(new Date(employee.createdAt))
									};
								}}
							>
								<Icon icon={'basil:edit-outline'} class="hover:text-red-500 text-xl" />
							</button>

							<button onclick={() => ((modelOpen = true), (selectedEmployeeId = employee._id))}>
								<Icon icon={'mingcute:delete-2-fill'} class="hover:text-red-500 text-xl" />
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<Dialog.Root controlledOpen={true} open={modelOpen} onOpenChange={(e) => (modelOpen = e)}>
			<Dialog.Content class="p-6">
				<Dialog.Header class="text-center">
					<Dialog.Title class="text-center">Do you want to delete this Employee ?</Dialog.Title>
				</Dialog.Header>

				<div class="flex gap-4 justify-around">
					<Button
						class="bg-red-500 text-white font-bold w-full hover:bg-red-400"
						onclick={() => $deleteMutation.mutate({ id: selectedEmployeeId, permanent: true })}
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
			<p class="text-center text-xs">No Employee's Found!</p> -->
		{/if}
	</div>
</div>
