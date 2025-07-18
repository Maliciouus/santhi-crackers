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
	import { _brandSchema, type BrandStoreProps } from './brand-store';
	import { imgUrl } from '$lib/config'; // Import imgUrl for displaying existing images

	let { brandStore }: BrandStoreProps = $props();

	let edit = $state(false);
	let image = $state<File | null>(null);
	let existingImageUrl = $state<string | null>(null); // Track existing image URL
	let elem: HTMLInputElement | null = null;
	let homePageInput: HTMLInputElement | null = null;

	$effect(() => {
		edit = $brandStore.mode === 'create' && $brandStore.id ? true : false;

		// Set existing image URL in edit mode
		if (edit && $brandStore.image) {
			existingImageUrl = `${imgUrl}${$brandStore.image}`; // Use imgUrl to construct the full URL
		}
        else if(!edit){
            existingImageUrl = null;
            image = null;
			// Reset the file input value
			resetFileInput();
        }

		elem = document.getElementById('image') as HTMLInputElement | null;
		homePageInput = elem; // Store reference to the file input
	});

	// Function to reset file input
	function resetFileInput() {
		if (elem) {
			elem.value = '';
		}
	}

	const createBrandMutation = createMutation({
		mutationFn: (data: FormData) =>
			edit
				? _axios.put(`/brands/${$brandStore.id}`, data)
				: _axios.post('/brands/create', data),

		onSuccess() {
			reset();
			image = null;
			existingImageUrl = null; 
			// Reset the file input value
			resetFileInput();
			
			queryClient.refetchQueries({
				queryKey: ['brand fetch']
			});
			$brandStore.mode = 'list';

			goto('/dashboard/brands?mode=list');
			toast(edit ? 'Brand Updated ✅' : 'Brand Created ✅');
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
	
	function cleanImage(type: string) {
		if (type === 'home') {
			image = null;
			existingImageUrl = null; // Clear existing image URL
			if (homePageInput) homePageInput.value = '';
		}
	}
	
	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(_brandSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_brandSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit({}) {
				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;
				if (!edit && !image) {
					toast.error('Image is required when creating a new brand');
					return;
				}

				let formData = new FormData();

				formData.append('name', $form.name);
				if (image) {
					formData.append('image', image);
				}

				$createBrandMutation.mutate(formData);
			}
		}
	);

	$effect(() => {
		if (edit) {
			$form.name = $brandStore.name;
            $form.image = $brandStore.image;
		} else {
			reset();
			// Also reset the file input when form is reset
			resetFileInput();
		}
	});

	function handleFileSelect(event: Event, type: string) {
		const target = event.target as HTMLInputElement;
		let file = target.files?.[0];

		if (!file) return;

		if (file.size > 51200) {
			toast.error('File size is too large! Max size is 50KB');
			cleanImage(type);
			return;
		}

		const img = new Image();
		img.src = URL.createObjectURL(file);

		img.onload = () => {
			const { width, height } = img;

			// if (type==='home'&&(width < 100 || height < 100)) {
			// 	toast.error('Image dimensions must be below 35x35 pixels.');
            //     cleanImage(type);
			// 	return;
			// }

			if (type === 'home') {
				image = file;
				existingImageUrl = null; // Clear existing image URL when a new image is uploaded
			}
		};

		img.onerror = () => {
			cleanImage(type);
			toast.error('Invalid image file.');
		};
	}

	function removeImage() {
		image = null;
		existingImageUrl = null; // Clear existing image URL
		resetFileInput(); // Reset the file input value
	}
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="name">Brand Name</Label>
			<Input
				id="name"
				autocomplete='off'
				class="pr-10 mt-1"
				placeholder="Ex: XY Brand"
				aria-invalid={$errors.name ? 'true' : undefined}
				bind:value={$form.name}
				{...$constraints.name}
			/>

			{#if $errors.name}<span class="invalid text-xs text-red-500">{$errors.name}</span>{/if}
		</div>

		<div>
			<Label for="image">Image (35 X 35) ~ 50kb</Label>
			<Input
				id="image"
				required={edit ? false : true}
				class="pr-10 mt-1"
				type="file"
				accept=".jpg, .jpeg, .png, .webp"
				onchange={(event) => handleFileSelect(event, 'home')}
			/>
		</div>

		{#if image || existingImageUrl}
			<p class="text-xs text-zinc-500">* Click to remove image</p>
		{/if}

		<div class="flex gap-4">
			{#if image || existingImageUrl}
				<div class="flex flex-col justify-center items-start gap-2 mt-2 hover:cursor-pointer hover:shadow-lg">
					<button type="button" onclick={removeImage}>
						<!-- svelte-ignore a11y_img_redundant_alt -->
						<img
							class="w-[35px] h-[35px] object-cover rounded-md"
							src={image ? URL.createObjectURL(image) : existingImageUrl}
							alt="Brand Image"
						/>
					</button>
				</div>
			{/if}
		</div>

		<Button class="w-[100px]" type="submit">
			{edit ? 'Update' : $createBrandMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>