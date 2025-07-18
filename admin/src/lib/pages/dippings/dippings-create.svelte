<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { _dippingSchema, type DippingStoreProps } from './dippings-store';

	let { dippingStore }: DippingStoreProps = $props();

	let edit = $state(false);
	let image = $state(null);
	let elem: any = null;

	$effect(() => {
		edit = $dippingStore.mode == 'create' && $dippingStore.id ? true : false;

		elem = document.getElementById('image') as HTMLInputElement | null;
	});

	const createDippingMutation = createMutation({
		mutationFn: (data: FormData) =>
			edit
				? _axios.put(`/dippings/${$dippingStore.id}`, data)
				: _axios.post('/dippings/create', data),

		onSuccess() {
			queryClient.refetchQueries({
				queryKey: ['dipping fetch']
			});
			$dippingStore.mode = 'list';

			reset();

			goto('/hidden-admin-base-007/dashboard/dippings?mode=list');
			toast(edit ? 'Dipping Updated ✅' : 'Dipping Created ✅');
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(_dippingSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_dippingSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit({}) {
				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;
				if (!edit && !image) {
					toast.error('Image is required when creating a new dipping');
					return;
				}

				let formData = new FormData();

				formData.append('name', $form.name);
				formData.append('price', $form.price.toString());
				if (image) {
					formData.append('image', image);
				}

				$createDippingMutation.mutate(formData);
			}
		}
	);

	$effect(() => {
		if (edit) {
			$form.name = $dippingStore.name;
			$form.price = $dippingStore.price;
		} else {
			reset();
		}
	});

	function handleFileSelect(event: any) {
		const file = event.target.files[0];

		if (file.size > 51200) {
			toast.error('File size is too large! Max size is 50KB');

			if (elem) elem.value = '';

			return;
		}

		const img = new Image();
		img.src = URL.createObjectURL(file);

		img.onload = () => {
			const { width, height } = img;

			if (width > 35 || height > 35) {
				toast.error('image dimensions must below 35x35 pixels.');
				if (elem) elem.value = '';
				return;
			}

			image = file;
		};

		image = file;
	}
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="name">Dipping Name</Label>
			<Input
				id="name"
				class="pr-10 mt-1"
				placeholder="Ex: Mayonnaise, Ketchup"
				aria-invalid={$errors.name ? 'true' : undefined}
				bind:value={$form.name}
				{...$constraints.name}
			/>

			{#if $errors.name}<span class="invalid text-xs text-red-500">{$errors.name}</span>{/if}
		</div>
		<div></div>

		<div class="grid gap-2 relative">
			<div class="flex items-center">
				<Label for="price">Price</Label>
			</div>
			<Input
				id="price"
				class="pr-10 mt-1"
				aria-invalid={$errors.price ? 'true' : undefined}
				type={'string'}
				placeholder="Ex: 1000"
				bind:value={$form.price}
				{...$constraints.price}
			/>

			{#if $errors.price}<span class="invalid text-xs text-red-500">{$errors.price}</span>{/if}
		</div>

		<div>
			<Label for="image">Image (35 X 35) ~ 50kb</Label>
			<Input
				id="image"
				required={edit ? false : true}
				class="pr-10 mt-1"
				type="file"
				accept=".jpg, .jpeg, .png, .webp"
				onchange={handleFileSelect}
			/>
		</div>

		<Button class="w-[100px]" type="submit">
			{edit ? 'Update' : $createDippingMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>
