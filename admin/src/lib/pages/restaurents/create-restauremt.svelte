<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { restaurentSchema, type RestaurentProps } from './schema';

	let { restaurentStore }: RestaurentProps = $props();

	let edit = $state(false);
	let image = $state(null);

	$effect(() => {
		edit = $restaurentStore.mode == 'create' && $restaurentStore.id ? true : false;
	});

	const createRestaurentMutation = createMutation({
		mutationFn: (data: unknown) =>
			edit
				? _axios.put(`/restaurent/${$restaurentStore.id}`, data)
				: _axios.post('/restaurent/create', data),

		onSuccess() {
			queryClient.refetchQueries({
				queryKey: ['restaurent fetch']
			});
			$restaurentStore.mode = 'list';

			goto('/hidden-admin-base-007/dashboard/categories?mode=list');
			toast(edit ? 'Restaurent Updated ✅' : 'Restaurent Created ✅');
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(restaurentSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(restaurentSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit() {
				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;
				if (!edit && !image) {
					toast.error('Image is required when creating a new dipping');
					return;
				}

				let formData = new FormData();

				$createRestaurentMutation.mutate(formData);
			}
		}
	);

	$effect(() => {
		if (edit) {
			// $form.name = $restaurentStore.name;
			// $form.description = $restaurentStore.description;
			// $form.categoryNumber = $restaurentStore.categoryCode;
		} else {
			reset();
		}
	});

	function handleFileSelect(event: any) {
		const file = event.target.files[0];
		image = file;
	}
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid grid-cols-2 gap-4 py-4">
		<div class="">
			<Label for="restaurentName">Restaurent Name</Label>
			<Input
				id="restaurentName"
				class="pr-10 mt-1"
				placeholder="Ex: Pizza Hut"
				aria-invalid={$errors.restaurentName ? 'true' : undefined}
				bind:value={$form.restaurentName}
				{...$constraints.restaurentName}
			/>

			{#if $errors.restaurentName}<span class="invalid text-xs text-red-500"
					>{$errors.restaurentName}</span
				>{/if}
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex items-center">
				<Label for="restaurentPhone">Restaurent Phone</Label>
			</div>
			<Input
				id="restaurentPhone"
				class="pr-10 "
				aria-invalid={$errors.restaurentPhone ? 'true' : undefined}
				type={'number'}
				placeholder="Ex: 9988745678"
				bind:value={$form.restaurentPhone}
				{...$constraints.restaurentPhone}
			/>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex items-center">
				<Label for="latitude">Latitude</Label>
			</div>
			<Input
				id="latitude"
				class="pr-10"
				aria-invalid={$errors.latitude ? 'true' : undefined}
				type={'number'}
				placeholder="Ex: 8.709195408141927"
				bind:value={$form.latitude}
				{...$constraints.latitude}
			/>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex items-center">
				<Label for="longitude">Longitude</Label>
			</div>
			<Input
				id="longitude"
				class="pr-10"
				aria-invalid={$errors.longitude ? 'true' : undefined}
				type={'number'}
				placeholder="Ex: 77.74646376544815"
				bind:value={$form.longitude}
				{...$constraints.longitude}
			/>
		</div>

		<div class="col-span-2">
			<Label for="restaurentDescription">Restaurent Description</Label>
			<Textarea
				id="restaurentDescription"
				class="pr-10 mt-1"
				placeholder="Ex: Best Restaurent"
				rows={5}
				aria-invalid={$errors.restaurentDescription ? 'true' : undefined}
				bind:value={$form.restaurentDescription}
				{...$constraints.restaurentDescription}
			/>

			{#if $errors.restaurentDescription}<span class="invalid text-xs text-red-500"
					>{$errors.restaurentDescription}</span
				>{/if}
		</div>

		<div class="col-span-2">
			<Label for="address">Address</Label>
			<Textarea
				id="address"
				class="pr-10 mt-1"
				placeholder="Maharaja Nagar, Tirunelveli, Tamil Nadu 627011"
				rows={5}
				aria-invalid={$errors.restaurentAddress ? 'true' : undefined}
				bind:value={$form.restaurentAddress}
				{...$constraints.restaurentAddress}
			/>

			{#if $errors.restaurentAddress}<span class="invalid text-xs text-red-500"
					>{$errors.restaurentAddress}</span
				>{/if}
		</div>

		<Button class="w-[100px]" type="submit">
			{edit ? 'Update' : 'Add'}
		</Button>
	</form>
</div>
