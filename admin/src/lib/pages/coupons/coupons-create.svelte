<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { _couponsSchema, type CouponsStoreProps } from '$lib/pages/coupons/coupons-store';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	let { couponsStore }: CouponsStoreProps = $props();
	let edit = $state(false);

	$effect(() => {
		edit = $couponsStore.mode === 'create' && $couponsStore.id ? true : false;
	});

	const createCouponMutation = createMutation({
		mutationFn: (data: unknown) =>
			edit ? _axios.put(`/coupon/${$couponsStore.id}`, data) : _axios.post('/coupon/', data),
		onSuccess() {
			queryClient.refetchQueries({
				queryKey: ['coupons']
			});
			$couponsStore.mode = 'list';
			reset();
			toast(edit ? 'Coupon Updated ' : 'Coupon Created ');
		},
		onError(error) {
			console.error('Error:', error);
			toast.error('Failed to save coupon');
		}
	});

	const { form, errors, enhance, reset, constraints, validateForm } = superForm(
		defaults(zod(_couponsSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_couponsSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit() {
				const { valid } = await validateForm({
					focusOnError: true
				});
				if (!valid) return;

				$createCouponMutation.mutate($form);
			}
		}
	);

	$effect(() => {
		if (edit) {
			$form.code = $couponsStore.code;
			$form.description = $couponsStore.description;
			$form.minPrice = $couponsStore.minPrice;
			$form.maxPrice = $couponsStore.maxPrice;
			$form.discount = $couponsStore.discount;
			$form.numberOfDays = $couponsStore.numberOfDays;
		} else {
			reset();
		}
	});
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="code">Coupon Code</Label>
			<Input
				id="code"
				class="mt-1"
				placeholder="Enter coupon code"
				bind:value={$form.code}
				{...$constraints.code}
				aria-invalid={$errors.code ? 'true' : undefined}
			/>
			{#if $errors.code}<span class="invalid text-red-500 text-xs">{$errors.code}</span>{/if}
		</div>

		<div>
			<Label for="description">Description</Label>
			<Textarea
				id="description"
				class="mt-1"
				placeholder="Enter coupon description"
				rows={3}
				bind:value={$form.description}
				{...$constraints.description}
				aria-invalid={$errors.description ? 'true' : undefined}
			/>
			{#if $errors.description}<span class="invalid text-red-500 text-xs"
					>{$errors.description}</span
				>{/if}
		</div>

		<div>
			<Label for="discount">Discount (%)</Label>
			<Input
				id="discount"
				type="string"
				class="mt-1"
				placeholder="Enter discount in % (Ex : 2)"
				bind:value={$form.discount}
				{...$constraints.discount}
				aria-invalid={$errors.discount ? 'true' : undefined}
			/>
			{#if $errors.discount}<span class="invalid text-red-500 text-xs">{$errors.discount}</span
				>{/if}
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="minPrice">Minimum Price</Label>
				<Input
					id="minPrice"
					type="number"
					class="mt-1"
					placeholder="Enter minimum price"
					bind:value={$form.minPrice}
					{...$constraints.minPrice}
					aria-invalid={$errors.minPrice ? 'true' : undefined}
				/>
				{#if $errors.minPrice}<span class="invalid text-red-500 text-xs">{$errors.minPrice}</span
					>{/if}
			</div>

			<div>
				<Label for="maxPrice">Maximum Price</Label>
				<Input
					id="maxPrice"
					type="number"
					class="mt-1"
					placeholder="Enter maximum price"
					bind:value={$form.maxPrice}
					{...$constraints.maxPrice}
					aria-invalid={$errors.maxPrice ? 'true' : undefined}
				/>
				{#if $errors.maxPrice}<span class="invalid text-red-500 text-xs">{$errors.maxPrice}</span
					>{/if}
			</div>
		</div>

		<div>
			<Label for="numberOfDays">Number of Days</Label>
			<Input
				id="numberOfDays"
				type="number"
				class="mt-1"
				placeholder="Enter number of days the coupon will be active"
				bind:value={$form.numberOfDays}
				{...$constraints.numberOfDays}
				aria-invalid={$errors.numberOfDays ? 'true' : undefined}
			/>
			{#if $errors.numberOfDays}<span class="invalid text-red-500 text-xs"
					>{$errors.numberOfDays}</span
				>{/if}
		</div>

		<Button type="submit" class="w-[100px]" disabled={$createCouponMutation.isPending}>
			{edit ? 'Update' : 'Create'}
		</Button>
	</form>
</div>
