<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { _managerSchema, managerStore, type CreateManagerData } from './manager-store';

	let edit = $state(false);
	$effect(() => {
		edit = $managerStore.mode == 'create' && $managerStore.id ? true : false;
	});

	const createManagerMutation = createMutation({
		mutationFn: (data: CreateManagerData) =>
			edit
				? _axios.put(`/manager/${$managerStore.id}`, data)
				: _axios.post('/manager/create', data),
		onSuccess({}) {
			queryClient.refetchQueries({
				queryKey: ['manager fetch']
			});
			$managerStore.mode = 'list';
			toast(edit ? 'Manager Updated ✅' : 'Manager Created ✅');
			reset();
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});
	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(_managerSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_managerSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit({}) {
				let _data: CreateManagerData = {
					email: $form.email,
					password: $form.password == '********' ? '' : $form.password,
					username: $form.username
				};

				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;
				$createManagerMutation.mutate(_data);
			}
		}
	);

	$effect(() => {
		if (edit) {
			$form.email = $managerStore.email;
			$form.username = $managerStore.name;
			$form.password = '********';
		}
	});

	let passwordShown = $state(false);
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid gap-4 py-4 grid-cols-2">
		<div>
			<Label>Username</Label>
			<Input
				class="pr-10 mt-1"
				placeholder="Ex: John Doe"
				aria-invalid={$errors.username ? 'true' : undefined}
				bind:value={$form.username}
				{...$constraints.username}
			/>

			{#if $errors.username}<span class="invalid text-xs text-red-500">{$errors.username}</span
				>{/if}
		</div>
		<div>
			<Label>Email</Label>
			<Input
				class="pr-10 mt-1"
				placeholder="Ex: john@doe.com"
				autocomplete="username"
				aria-invalid={$errors.email ? 'true' : undefined}
				bind:value={$form.email}
				{...$constraints.email}
			/>

			{#if $errors.email}<span class="invalid text-xs text-red-500">{$errors.email}</span>{/if}
		</div>

		<div class="grid gap-2 relative">
			<div class="flex items-center">
				<Label for="password">Password</Label>
			</div>
			<Input
				class="pr-10 mt-1"
				autocomplete="new-password"
				placeholder="******"
				aria-invalid={$errors.password ? 'true' : undefined}
				type={passwordShown ? 'text' : 'password'}
				bind:value={$form.password}
				{...$constraints.password}
			/>
			<Icon
				onclick={() => {
					passwordShown = !passwordShown;
				}}
				icon={!passwordShown ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
				class="absolute right-2 bottom-2.5 cursor-pointer text-zinc-600 text-xl"
			/>
		</div>

		<div></div>

		<Button class="w-[40%]" type="submit">
			{edit ? 'Update' : $createManagerMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>
