<!-- src/routes/dashboard/groups/create.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { imgUrl } from '$lib/config';
	import { _groupSchema, type GroupStoreProps } from '$lib/pages/group/group-store';
	import { queryClient } from '$lib/query-client';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
  
	let { groupStore }: GroupStoreProps = $props();
  
	let edit = $state(false);
	let image = $state<File | null>(null);
	let existingImageUrl = $state<string | null>(null);
	let homePageInput: HTMLInputElement | null = null;
  
	$effect(() => {
	  edit = $groupStore.mode === 'create' && $groupStore.id ? true : false;
	  if (edit && $groupStore.image) {
		existingImageUrl = $groupStore.image;
	  } else if (!edit) {
		existingImageUrl = null;
		image = null;
	  }
	  homePageInput = document.getElementById('image') as HTMLInputElement;
	});
  
	const createGroupMutation = createMutation({
	  mutationFn: (data: FormData) =>
		edit
		  ? _axios.put(`/group/${$groupStore.id}`, data, {
			  headers: { 'Content-Type': 'multipart/form-data' },
			})
		  : _axios.post('/group/create', data, {
			  headers: { 'Content-Type': 'multipart/form-data' },
			}),
	  onSuccess({ data }) {
		queryClient.refetchQueries({
		  queryKey: ['group fetch'],
		});
		if (data.status) {
		  $groupStore.mode = 'list';
		  reset();
		  image = null;
		  existingImageUrl = null;
		  cleanImage('home');
		  goto('/dashboard/group?mode=list');
		  toast(edit ? 'Group Updated ✅' : 'Group Created ✅');
		} else {
		  toast.error(data.message);
		}
	  },
	  onError(error) {
		console.error('Error:', error);
		toast.error('An error occurred while processing your request.');
	  },
	});
  
	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
	  defaults(zod(_groupSchema)),
	  {
		SPA: true,
		validationMethod: 'oninput',
		validators: zod(_groupSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		async onSubmit() {
		  const { valid } = await validateForm({
			focusOnError: true,
		  });
		  if (!valid) return;
		  if (!edit && !image) {
			toast.error('Image is required when creating a new group');
			return;
		  }
		  let formData = new FormData();
		  formData.append('name', $form.name);
		  if (image) formData.append('image', image);
		  $createGroupMutation.mutate(formData);
		},
	  }
	);
  
	$effect(() => {
	  if (edit) {
		$form.name = $groupStore.name;
	  } else {
		reset();
	  }
	});
  
	function cleanImage(type: string) {
	  if (type === 'home') {
		image = null;
		existingImageUrl = null;
		if (homePageInput) homePageInput.value = '';
	  }
	}
  
	function handleImageUpload(event: Event, type: string) {
	  const target = event.target as HTMLInputElement;
	  const file = target.files?.[0];
	  if (!file) return;
	  if (file.size > 200000) {
		cleanImage(type);
		toast.error('Image size is too large! Max size is 200kb');
		return;
	  }
	  const img = new Image();
	  img.src = URL.createObjectURL(file);
	  img.onload = () => {
		const { width, height } = img;
		// if (type === 'home' && (width < 69 || height < 69)) {
		//   toast.error('Image dimensions must be at least 69x69 pixels.');
		//   cleanImage(type);
		//   return;
		// }
		if (type === 'home') {
		  image = file;
		  existingImageUrl = null;
		}
	  };
	  img.onerror = () => {
		cleanImage(type);
		toast.error('Invalid image file.');
	  };
	}
  </script>
  
  <div class="max-w-[80%] mx-auto text-maintext h-[calc(100vh-120px)] overflow-y-auto hidescrollbarthumb">
	<form method="POST" use:enhance class="grid gap-4 py-4">
	  <div>
		<Label for="name">Group Name</Label>
		<Input
		  id="name"
		  autocomplete="off"
		  class="pr-10 mt-1"
		  placeholder="Ex: Sky shots..."
		  aria-invalid={$errors.name ? 'true' : undefined}
		  bind:value={$form.name}
		  {...$constraints.name}
		/>
		{#if $errors.name}<span class="invalid text-xs text-red-500">{$errors.name}</span>{/if}
	  </div>
  
	  <div>
		<Label for="image">Group Image <span class="text-gray-500 text-xs">(69 x 69) ~ 200kb</span></Label>
		<Input
		  id="image"
		  autocomplete="off"
		  required={!edit}
		  class="pr-10 mt-1"
		  type="file"
		  accept=".jpg, .jpeg, .png, .webp"
		  onchange={(event) => handleImageUpload(event, 'home')}
		/>
	  </div>
  
	  {#if image || existingImageUrl}
		<p class="text-xs text-zinc-500">* Click to remove image</p>
	  {/if}
	  <div class="flex gap-4">
		{#if image || existingImageUrl}
		  <div class="flex flex-col justify-center items-start gap-2 mt-2 hover:cursor-pointer hover:shadow-lg">
			<button onclick={() => cleanImage('home')}>
			  <img
				class="w-[100px] h-[100px] object-cover rounded-md"
				src={image ? URL.createObjectURL(image) : `${imgUrl}${existingImageUrl}`}
				alt="Group Image"
			  />
			</button>
		  </div>
		{/if}
	  </div>
  
	  <Button class="w-[100px]" type="submit" disabled={$createGroupMutation.isPending}>
		{edit ? 'Update' : $createGroupMutation.isPending ? 'Creating...' : 'Create'}
	  </Button>
	</form>
  </div>