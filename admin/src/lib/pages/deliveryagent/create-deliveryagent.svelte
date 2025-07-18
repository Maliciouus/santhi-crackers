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
	import {
		_deliveryAgentSchema,
		deliveryAgentStore,
		type CreateDeliveryAgentData
	} from './deliveryagent-store';

	let edit = $state(false);

	$effect(() => {
		edit = $deliveryAgentStore.mode == 'create' && $deliveryAgentStore.id ? true : false;
	});

	function createEmployeeId() {
		return 'KC-ST' + Math.floor(Math.random() * 1000000);
	}

	const createDeliveryAgentMutation = createMutation({
		mutationFn: (data: CreateDeliveryAgentData) =>
			edit
				? _axios.put(`/deliveryagent/${$deliveryAgentStore.id}`, data)
				: _axios.post('/deliveryagent/create', data),
		onSuccess({}) {
			queryClient.refetchQueries({
				queryKey: ['deliveryagent fetch']
			});
			toast(edit ? 'Delivery Agent Updated ✅' : 'Delivery Agent Created ✅');
			reset();
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	let employeeId = $state(createEmployeeId());

	const { form, errors, enhance, constraints, reset, validateForm } = superForm(
		defaults(zod(_deliveryAgentSchema)),
		{
			SPA: true,
			validationMethod: 'oninput',
			validators: zod(_deliveryAgentSchema),
			clearOnSubmit: 'none',
			invalidateAll: false,
			resetForm: false,
			async onSubmit() {
				let _data: CreateDeliveryAgentData = {
					name: $form.name,
					password: $form.password == '********' ? '' : $form.password,
					phone: $form.phone,
					employeeId: employeeId
				};

				const { valid } = await validateForm({
					focusOnError: true
				});

				if (!valid) return;

				$createDeliveryAgentMutation.mutate(_data);
			}
		}
	);

	$effect(() => {
		if (edit) {
			$form.name = $deliveryAgentStore.name;
			$form.phone = $deliveryAgentStore.phone;
			$form.employeeId = $deliveryAgentStore.employeeId;
			$form.password = '********';
		}

		$form.employeeId = employeeId;
	});

	let passwordShown = $state(false);
</script>

<div class="max-w-[80%] mx-auto text-maintext">
	<form method="POST" use:enhance class="grid gap-4 py-4 grid-cols-2">
		<div>
			<Label>Name</Label>
			<Input
				class="pr-10 mt-1"
				placeholder="Ex: John Doe"
				aria-invalid={$errors.name ? 'true' : undefined}
				bind:value={$form.name}
				{...$constraints.name}
			/>

			{#if $errors.name}<span class="invalid text-xs text-red-500">{$errors.name}</span>{/if}
		</div>
		<div>
			<Label>Phone</Label>
			<Input
				class="pr-10 mt-1"
				placeholder="Ex: 1234567890"
				autocomplete="username"
				aria-invalid={$errors.phone ? 'true' : undefined}
				bind:value={$form.phone}
				{...$constraints.phone}
			/>

			{#if $errors.phone}<span class="invalid text-xs text-red-500">{$errors.phone}</span>{/if}
		</div>

		<div>
			<Label>Employee ID</Label>
			<Input
				class="pr-10 mt-1"
				readonly
				placeholder="Ex: DS123456"
				aria-invalid={$errors.employeeId ? 'true' : undefined}
				bind:value={$form.employeeId}
				{...$constraints.employeeId}
			/>

			{#if $errors.employeeId}<span class="invalid text-xs text-red-500">{$errors.employeeId}</span
				>{/if}
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

			<!-- <Icon
				onclick={() => {
					passwordShown = !passwordShown;
				}}
				icon={!passwordShown ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
				class="absolute right-2 bottom-2.5 cursor-pointer text-maintext text-xl"
			/> -->
		</div>

		<Button class="w-[40%]" type="submit">
			{edit ? 'Update' : $createDeliveryAgentMutation.isPending ? 'Creating...' : 'Create'}
		</Button>
	</form>
</div>
