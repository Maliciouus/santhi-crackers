<script lang="ts">
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
	import { z } from 'zod';

	let image = $state(null);
	let elem = document.getElementById('image') as HTMLInputElement | null;

	const _bannerSchema = z.object({
		bannerTitle: z.string({
			message: 'Banner Title is required'
		}),
		bannerDescription: z.string({
			message: 'Banner Description is required'
		})
	});

	const createBannerMutation = createMutation({
		mutationFn: (data: FormData) => _axios.post('/banner/create', data),
		onSuccess({ data }) {
			queryClient.refetchQueries({
				queryKey: ['banners fetch']
			});

			reset();
			if (data.status) {
				toast('Banner Created ✅');

				// Reset the image state
				image = null;
				if (elem) elem.value = '';
			} else {
				toast.error(data.message);
			}
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(_bannerSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_bannerSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit({}) {
				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;
				if (!image) {
					toast.error('Image is required when creating a new banner');
					return;
				}

				let formData = new FormData();
				formData.append('bannerTitle', $form.bannerTitle);
				formData.append('bannerDescription', $form.bannerDescription);

				if (image) formData.append('bannerImage', image);

				$createBannerMutation.mutate(formData);
			}
		}
	);

	function cleanImage() {
		image = null;
		if (elem) elem.value = '';
	}

	function handleFileSelect(event: any) {
		const file = event.target.files[0];
		image = file ? file : null;
	}
</script>

<div class="max-w-[80%] text-maintext pl-[10%] h-[80vh] pb-20 overflow-y-auto hidescrollbarthumb">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="bannerTitle">Banner Title</Label>
			<Input
				id="bannerTitle"
				autocomplete="on"
				class="pr-10 mt-1"
				placeholder="Ex: Offer 30% off"
				aria-invalid={$errors.bannerTitle ? 'true' : undefined}
				bind:value={$form.bannerTitle}
				{...$constraints.bannerTitle}
			/>

			{#if $errors.bannerTitle}
				<span class="invalid text-xs text-red-500">{$errors.bannerTitle}</span>
			{/if}
		</div>

		<div>
			<Label for="bannerDescription">Description</Label>
			<Textarea
				id="bannerDescription"
				class="pr-10 mt-1"
				placeholder="Description"
				rows={5}
				aria-invalid={$errors.bannerDescription ? 'true' : undefined}
				bind:value={$form.bannerDescription}
				{...$constraints.bannerDescription}
			/>

			{#if $errors.bannerDescription}
				<span class="invalid text-xs text-red-500">{$errors.bannerDescription}</span>
			{/if}
		</div>

		<div>
			<Label for="image">Banner Image</Label>
			<Input
				id="image"
				required={true}
				class="pr-10 mt-1"
				type="file"
				accept=".jpg, .jpeg, .png, .webp"
				onchange={handleFileSelect}
			/>
		</div>

		{#if image}
			<p class="text-xs text-zinc-500">* Click to remove image</p>
		{/if}
		<div class="flex gap-4">
			{#if image}
				<div class="flex flex-col justify-center items-start gap-2 mt-2 hover:cursor-pointer">
					<button onclick={() => cleanImage()}>
						<img
							class="w-[100px] h-[100px] object-cover rounded-md"
							src={URL.createObjectURL(image)}
							alt="New upload"
						/>
					</button>
					<p>Home image</p>
				</div>
			{/if}
		</div>

		<Button class="w-[100px]" type="submit">
			{$createBannerMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>