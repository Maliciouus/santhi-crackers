<script lang="ts">
	import { _axios } from '$lib/_axios';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { createQuery } from '@tanstack/svelte-query';
	import { Chart } from 'chart.js/auto';

	let selectedFilter = $state('month');
	let selectedYear = new Date().getFullYear();
	let selectedMonth = $state((new Date().getMonth() + 1).toString());
	let selectedDay = $state(new Date().getDate().toString());
	let days = Array.from({ length: 31 }, (_, i) => ({ label: `Day ${i + 1}`, value: i + 1 }));
	let months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	].map((month, i) => ({ label: month, value: i + 1 }));

	async function getData() {
		const response = await _axios.get(
			`/dashboard/overviewchart?filter=${selectedFilter}&year=${selectedYear}&month=${selectedMonth}&day=${selectedDay}`
		);
		return response.data;
	}

	const dataQuery = createQuery({
		queryKey: ['overview chart data', selectedYear],
		queryFn: getData,
		select(data) {
			return data;
		}
	});

	let chart: Chart | null = null;

	$effect(() => {
		const ctx: any = document.querySelector('#overview');
		let labels: any = [];
		let data = $dataQuery.data || [];

		if (selectedFilter === 'day') {
			labels = [`Day ${selectedDay}: ${data[0]} orders`];
		} else if (selectedFilter === 'week') {
			labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(
				(week, index) => `${week}: ${data[index] || 0} orders`
			);
		} else if (selectedFilter === 'month') {
			const daysInMonth = new Date(selectedYear, +selectedMonth, 0).getDate();
			labels = Array.from(
				{ length: daysInMonth },
				(_, i) => `Day ${i + 1}: ${data[i] || 0} orders`
			);
		} else if (selectedFilter === 'year') {
			labels = months.map((m, index) => `${m.label}: ${data[index] || 0} orders`);
		}

		const totalOrders = data.reduce((sum: number, current: number) => sum + current, 0);

		if (ctx && !$dataQuery.isLoading) {
			if (chart) {
				chart.destroy();
			}

			ctx.width = ctx.offsetWidth;
			ctx.height = ctx.offsetHeight;

			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: labels,
					datasets: [
						{
							label: `Overview (${selectedFilter}): ${totalOrders} orders`,
							data: data,
							borderColor: 'rgb(138, 90, 200)'
						}
					]
				},
				options: {
					scales: {
						y: {
							beginAtZero: true,
							suggestedMax: Math.max(...data) < 10 ? 10 : undefined
						}
					},
					responsive: true,
					maintainAspectRatio: false
				}
			});
		}
	});
</script>
<style>
	.SelectItem[data-highlighted],
.SelectItem[data-state="checked"] {
  background-color: #6db9ef !important; /* Highlight color */
  color: white !important;
}
</style>
<div class="px-4 w-full max-w-[900px] mx-auto">
	<Card.Root class="bg-zinc-100 border-primary border-2 border-solid">
		<Card.Header class="flex justify-between">
			<Card.Title class="flex text-3xl justify-between text-zinc-700">
				<div class="flex gap-2 items-center">Overview</div>

				<div class="flex gap-2">
					<Select.Root
						type="single"
						bind:value={selectedFilter}
						onValueChange={(value) => {
							selectedFilter = value;
							$dataQuery.refetch();
						}}
					>
						<Select.Trigger class="w-[120px]">
							<span class="capitalize">{selectedFilter}</span>
						</Select.Trigger>
						<Select.Content class=''>
							<Select.Group>
								<Select.Item class="SelectItem" value="day">Day</Select.Item>
								<Select.Item  class="SelectItem" value="week">Week</Select.Item>
								<Select.Item class="SelectItem" value="month">Month</Select.Item>
								<Select.Item class="SelectItem" value="year">Year</Select.Item>
							</Select.Group>
						</Select.Content>
					</Select.Root>

					{#if selectedFilter !== 'year'}
						<Select.Root
							type="single"
							bind:value={selectedMonth}
							onValueChange={(value) => {
								selectedMonth = value;
								$dataQuery.refetch();
							}}
						>
							<Select.Trigger class="w-[120px] ">
								<span class="capitalize">
									{months.find((m: any) => m.value === selectedMonth)?.label || 'January'}
								</span>
							</Select.Trigger>
							<Select.Content class=''>
								<Select.Group>
									{#each months as month}
										<Select.Item value={month.value.toString()}>{month.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/if}

					{#if selectedFilter === 'day'}
						<Select.Root
							type="single"
							bind:value={selectedDay}
							onValueChange={(value) => {
								selectedDay = value;
								$dataQuery.refetch();
							}}
						>
							<Select.Trigger class="w-[120px]">
								<span class="capitalize">Day {selectedDay}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each days as day}
										<Select.Item value={day.value.toString()}>{day.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/if}
				</div>
			</Card.Title>
		</Card.Header>

		<Card.Content class="h-[360px]">
			<canvas id="overview" class="w-full h-full"></canvas>
		</Card.Content>
	</Card.Root>
</div>
