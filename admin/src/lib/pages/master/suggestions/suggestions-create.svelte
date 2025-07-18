<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let icon = $state(null);
	let elem = document.getElementById('icon') as HTMLInputElement | null;

	const _suggetionsSchema = z.object({
		name: z.string({
			message: 'Name is required'
		})
	});

	$effect(() => {
		elem = document.getElementById('icon') as HTMLInputElement | null;
	});

	const createSuggetionMutation = createMutation({
		mutationFn: (data: FormData) => _axios.post('/suggestions/create', data),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['suggestions fetch']
			});
			if (data.status) {
				toast.info(data?.message ?? 'Suggetion Created ✅');
				reset();
				if (elem) elem.value = '';
				icon = null;
			} else {
				toast.error(data.message);
			}
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	const { form, errors, enhance, constraints, reset } = superForm(
		defaults(zod(_suggetionsSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_suggetionsSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			onSubmit({}) {
				if (!icon) return;

				let formData = new FormData();
				formData.append('name', $form.name);
				formData.append('icon', icon);

				$createSuggetionMutation.mutate(formData);
			}
		}
	);

	function handleFileSelect(event: any) {
		const file = event.target.files[0];

		if (file.size > 51200) {
			toast.error('File size is too large! Max size is 50kb');
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

			icon = file;
		};

		icon = file;
	}
</script>

<div class="max-w-[60%] text-maintext pl-[10%]">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="name">Suggetion Name</Label>
			<Input
				id="name"
				autocomplete="on"
				class="pr-10 mt-1"
				placeholder="Ex: Extra Spicy, Extra sauce"
				aria-invalid={$errors.name ? 'true' : undefined}
				bind:value={$form.name}
				{...$constraints.name}
			/>

			{#if $errors.name}<span class="invalid text-xs text-red-500">{$errors.name}</span>{/if}
		</div>

		<div>
			<Label for="icon">Icon (35 X 35) ~ 50kb</Label>
			<Input
				id="icon"
				class="pr-10 mt-1"
				type="file"
				accept=".jpg, .jpeg, .png, .webp"
				onchange={handleFileSelect}
			/>
		</div>

		<Button class="w-[100px]" type="submit">Add</Button>
	</form>
</div>
