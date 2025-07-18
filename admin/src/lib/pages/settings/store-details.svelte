<script lang="ts">
	import { _axios } from '$lib/_axios';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { imgUrl } from '$lib/config';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let avatarImage = $state<null | File>(null);
		let storeId = null;
		onMount(() => {
		if (typeof window !== 'undefined') {
			storeId = localStorage.getItem('storeId');
		}
	});

	export const _settingsSchema = z.object({
		storeName: z.string({
			message: 'Entity Name is required'
		}),
		storeAddress: z.string({
			message: 'Entity Address is required'
		}),

		latitude: z
			.string({
				message: 'Latitude is required'
			})
			.refine((val) => /^-?\d+(\.\d+)?$/.test(val), {
				message: 'Latitude must be a valid number'
			}),

		longitude: z
			.string({
				message: 'Longitude is required'
			})
			.refine((val) => /^-?\d+(\.\d+)?$/.test(val), {
				message: 'Longitude must be a valid number'
			}),

		storePhone: z.string({
			message: 'Entity Phone is required'
		}),
		storeDescription: z.string({
			message: 'Entity Description is required'
		}),
		gstNumber: z.string({
			message: 'GST Number is required'
		}),
		legalEntityName: z.string({
			message: 'Legal Entity Name is required'
		}),
		regulationNumber: z.string({
			message: 'Regulation Number is required'
		}),
		storeEmail: z.string({
			message: 'Entity Email is required'
		})
	});

	const { form, errors, enhance, constraints, validateForm } = superForm(
		defaults(zod(_settingsSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_settingsSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit() {
				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return toast.error('Please fill all the fields');
				if (!$query.data?.store?.storeImage && !avatarImage)
					return toast.error('Please upload store image');

				let _data: any = new FormData();
				_data.append('storeName', $form.storeName);
				_data.append('storeAddress', $form.storeAddress);

				_data.append('storePhone', $form.storePhone);
				_data.append('storeDescription', $form.storeDescription);

				_data.append('latitude', $form.latitude);
				_data.append('longitude', $form.longitude);

				_data.append('gstNumber', $form.gstNumber);
				_data.append('legalEntityName', $form.legalEntityName);
				_data.append('regulationNumber', $form.regulationNumber);

				_data.append('storeEmail', $form.storeEmail);

				if (avatarImage) _data.append('storeImage', avatarImage);

				$storeUpdateMutation.mutate(_data);
			}
		}
	);

	const query = createQuery({
		queryKey: ['store fetch'],
		queryFn: () => _axios.get(`/store/67ecbdcf9caf259ca5a81b8b`),
		select(data) {
			return data.data;
		}
	});

	const storeUpdateMutation = createMutation({
		mutationFn: (data: any) => _axios.put('/store/update/67ecbdcf9caf259ca5a81b8b', data),
		onSuccess({}) {
			toast('Store Details Updated ✅');
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	$effect(() => {
		$form.storeName =
			$query.data?.store?.storeName || 'Store Enterprises';
		$form.storeAddress =
			$query.data?.store?.storeAddress ||
			'No 111, xy Rd, y city,  600000';
		$form.storePhone = $query.data?.store?.storePhone || '9994433764';
		$form.storeEmail = $query.data?.store?.storeEmail || 'test@gmail.com';
		$form.storeDescription =
			$query.data?.store?.storeDescription ||
			`Description.................`;
		$form.latitude = $query.data?.store?.latitude || '8.734295046362766';
		$form.longitude = $query.data?.store?.longitude || '77.72244331166014';
		$form.gstNumber = $query.data?.store?.gstNumber || '33AAABC1234D';
		// $form.fssaiNumber = $query.data?.store?.fssaiNumber || '12345678901234';
		$form.legalEntityName =
			$query.data?.store?.legalEntityName || 'Store Enterprises';
			$form.regulationNumber =
			$query.data?.store?.regulationNumber || '03434992321';
	});
</script>

<div
	class="w-[80%] text-maintext pl-[10%] m-auto h-[calc(100vh-120px)] overflow-y-auto hidescrollbarthumb"
>
	<form method="POST" use:enhance class="grid gap-4 my-4 grid-cols-2">
		<div class="flex justify-center items-center col-span-2">
			<Avatar.Root
				class="w-[100px] h-[100px] rounded-full cursor-pointer"
				onclick={() => {
					let avatar = document.getElementById('avatar');
					avatar?.click();
				}}
			>
				<Avatar.Image
					src={avatarImage
						? URL.createObjectURL(avatarImage)
						: $query.data?.store?.storeImage
							? `${imgUrl + $query.data.store.storeImage}`
							: 'https://github.com/shadcn.png'}
					alt="Restaurant Avatar"
					class="w-[100px] h-[100px] border rounded-full cursor-pointer object-cover"
				/>
				<Avatar.Fallback class="text-white text-2xl"
					>{$form.storeName
						? $form.storeName.charAt(0).toUpperCase()
						: 'KC'}</Avatar.Fallback
				>
			</Avatar.Root>
		</div>
		<div>
			<Label for="storeName">Entity Name</Label>
			<Input
				id="storeName"
				class="pr-10 mt-1"
				placeholder="Store Enterprises"
				aria-invalid={$errors.storeName ? 'true' : undefined}
				bind:value={$form.storeName}
				{...$constraints.storeName}
			/>

			{#if $errors.storeName}<span class="invalid text-xs text-red-500"
					>{$errors.storeName}</span
				>{/if}
		</div>

		<div>
			<Label for="storePhone">Entity Phone</Label>
			<Input
				id="storePhone"
				class="pr-10 mt-1"
				placeholder="Ex: 0000999988"
				aria-invalid={$errors.storePhone ? 'true' : undefined}
				bind:value={$form.storePhone}
				{...$constraints.storePhone}
			/>

			{#if $errors.storePhone}<span class="invalid text-xs text-red-500"
					>{$errors.storePhone}</span
				>{/if}
		</div>

		<div>
			<Label for="storeEmail">Entity Email</Label>
			<Input
				id="storeEmail"
				class="pr-10 mt-1"
				type="email"
				placeholder="Ex: 0000999988"
				aria-invalid={$errors.storeEmail ? 'true' : undefined}
				bind:value={$form.storeEmail}
				{...$constraints.storeEmail}
			/>

			{#if $errors.storeEmail}<span class="invalid text-xs text-red-500"
					>{$errors.storeEmail}</span
				>{/if}
		</div>

		<div>
			<Label for="latitude">Latitude</Label>
			<Input
				id="latitude"
				class="pr-10 mt-1"
				placeholder="Ex: 8.176368054991757"
				aria-invalid={$errors.latitude ? 'true' : undefined}
				bind:value={$form.latitude}
				{...$constraints.latitude}
			/>

			{#if $errors.latitude}<span class="invalid text-xs text-red-500">{$errors.latitude}</span
				>{/if}
		</div>

		<div>
			<Label for="longitude">Longitude</Label>
			<Input
				id="longitude"
				class="pr-10 mt-1"
				placeholder="Ex: 77.42883217933648"
				aria-invalid={$errors.longitude ? 'true' : undefined}
				bind:value={$form.longitude}
				{...$constraints.longitude}
			/>

			{#if $errors.longitude}<span class="invalid text-xs text-red-500">{$errors.longitude}</span
				>{/if}
		</div>

		<div>
			<Label for="gstNumber">GST Number</Label>
			<Input
				id="gstNumber"
				class="pr-10 mt-1"
				placeholder="Ex: 33AAJJKDHFDJFHJD"
				aria-invalid={$errors.gstNumber ? 'true' : undefined}
				bind:value={$form.gstNumber}
				{...$constraints.gstNumber}
			/>

			{#if $errors.gstNumber}<span class="invalid text-xs text-red-500">{$errors.gstNumber}</span
				>{/if}
		</div>

		

		<div class="">
			<Label for="legalEntityName">Legal Entity Name</Label>
			<Input
				id="legalEntityName"
				class="pr-10 mt-1"
				placeholder="Ex: Store name"
				aria-invalid={$errors.legalEntityName ? 'true' : undefined}
				bind:value={$form.legalEntityName}
				{...$constraints.legalEntityName}
			/>

			{#if $errors.legalEntityName}<span class="invalid text-xs text-red-500"
					>{$errors.legalEntityName}</span
				>{/if}
		</div>
		<div class="">
			<Label for="regulationNumber">Regulation Number</Label>
			<Input
				id="regulationNumber"
				class="pr-10 mt-1"
				placeholder="Ex: 100190110000123"
				aria-invalid={$errors.regulationNumber ? 'true' : undefined}
				bind:value={$form.regulationNumber}
				{...$constraints.regulationNumber}
			/>

			{#if $errors.regulationNumber}<span class="invalid text-xs text-red-500"
					>{$errors.regulationNumber}</span
				>{/if}
		</div>

		<div class="col-span-2">
			<Label for="storeAddress">Entity Address</Label>
			<Textarea
				id="storeAddress"
				class="pr-10 mt-1"
				placeholder="No 147, Kottar-Parvathipuram Rd, Ramavarmapuram, Nagercoil, Tamil Nadu 629001"
				aria-invalid={$errors.storeAddress ? 'true' : undefined}
				bind:value={$form.storeAddress}
				{...$constraints.storeAddress}
			/>

			{#if $errors.storeAddress}<span class="invalid text-xs text-red-500"
					>{$errors.storeAddress}</span
				>{/if}
		</div>

		<div class="col-span-2">
			<Label for="storeDescription">Description</Label>
			<Textarea
				id="storeDescription"
				class="pr-10 mt-1"
				placeholder="Ex: New York"
				aria-invalid={$errors.storeDescription ? 'true' : undefined}
				bind:value={$form.storeDescription}
				{...$constraints.storeDescription}
			/>

			{#if $errors.storeDescription}<span class="invalid text-xs text-red-500"
					>{$errors.storeDescription}</span
				>{/if}
		</div>

		<Button disabled={$storeUpdateMutation.isPending} class="w-[100px]" type="submit"
			>{$storeUpdateMutation.isPending ? 'Updating...' : 'Update'}</Button
		>
	</form>

	<input
		id="avatar"
		type="file"
		accept=".jpg, .jpeg, .png, .webp"
		style="display: none;"
		onchange={(event: Event) => {
			if (event.target) {
				avatarImage = (event.target as HTMLInputElement).files?.[0] as File;
			}
		}}
	/>
</div>
