<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { queryClient } from '$lib/query-client';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	async function fetchConfig() {
		const res = await _axios.get('/config');
		const data = await res.data;
		return data;
	}

	const query = createQuery({
		queryKey: ['config fetch'],
		queryFn: () => fetchConfig()
	});

	export const _settingsSchema = z.object({
		deliveryCharge: z.string().refine((val) => /^[0-9]+$/.test(val), {
			message: 'Delivery Charge must be a valid number'
		}),
		platformFee: z.string().refine((val) => /^[0-9]+$/.test(val), {
			message: 'Platform Fee must be a valid number'
		}),
		freeDeliveryMinDistance: z.string().refine((val) => /^[0-9]+$/.test(val), {
			message: 'Free Delivery Min Distance must be a valid number'
		}),
		deliveryFreeAfter: z.string().refine((val) => /^[0-9]+$/.test(val), {
			message: 'Amount need to be a valid number'
		})
	});

	const createConfigMutation = createMutation({
		mutationFn: (data: unknown) => _axios.post('/config/', data),
		onSuccess({ data }) {
			toast('Config Updated ✅');
			queryClient.refetchQueries({
				queryKey: ['config fetch']
			});
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
		}
	});

	type CreateSettingsData = z.infer<typeof _settingsSchema>;

	const { form, errors, enhance, constraints, reset } = superForm(defaults(zod(_settingsSchema)), {
		SPA: true,
		validationMethod: 'oninput',
		validators: zod(_settingsSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		onSubmit() {
			let _data: CreateSettingsData = {
				deliveryCharge: $form.deliveryCharge,
				platformFee: $form.platformFee,
				freeDeliveryMinDistance: $form.freeDeliveryMinDistance,
				deliveryFreeAfter: $form.deliveryFreeAfter
			};

			$createConfigMutation.mutate(_data);
		}
	});

	$effect(() => {
		if ($query.data) {
			$form.deliveryCharge = $query.data.data.deliveryCharge.toString();
			$form.platformFee = $query.data.data.platformFee.toString();
			$form.freeDeliveryMinDistance = $query.data.data.freeDeliveryMinDistance.toString();
			$form.deliveryFreeAfter = $query.data.data.deliveryFreeAfter.toString();
		}
	});
</script>

<div class="max-w-[50%] text-maintext pl-[10%] m-auto">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="deliveryCharge">Delivery Charge (₹/km)</Label>
			<Input
				id="deliveryCharge"
				class="pr-10 mt-1"
				placeholder="Ex: 5"
				aria-invalid={$errors.deliveryCharge ? 'true' : undefined}
				bind:value={$form.deliveryCharge}
				{...$constraints.deliveryCharge}
			/>

			{#if $errors.deliveryCharge}<span class="invalid text-xs text-red-500"
					>{$errors.deliveryCharge}</span
				>{/if}
		</div>

		<div>
			<Label for="platformFee">Platform Fee</Label>
			<Input
				id="platformFee"
				class="pr-10 mt-1"
				placeholder="Ex: 5"
				aria-invalid={$errors.platformFee ? 'true' : undefined}
				bind:value={$form.platformFee}
				{...$constraints.platformFee}
			/>

			{#if $errors.platformFee}<span class="invalid text-xs text-red-500"
					>{$errors.platformFee}</span
				>{/if}
		</div>

		<div>
			<Label for="freeDeliveryMinDistance">Free Delivery Min Distance (km)</Label>
			<Input
				id="freeDeliveryMinDistance"
				class="pr-10 mt-1"
				placeholder="2"
				aria-invalid={$errors.freeDeliveryMinDistance ? 'true' : undefined}
				bind:value={$form.freeDeliveryMinDistance}
				{...$constraints.freeDeliveryMinDistance}
			/>

			{#if $errors.freeDeliveryMinDistance}<span class="invalid text-xs text-red-500"
					>{$errors.freeDeliveryMinDistance}</span
				>{/if}
		</div>

		<div>
			<Label for="deliveryFreeAfter">Delivery Free After (₹)</Label>
			<Input
				id="deliveryFreeAfter"
				class="pr-10 mt-1"
				placeholder="2"
				aria-invalid={$errors.deliveryFreeAfter ? 'true' : undefined}
				bind:value={$form.deliveryFreeAfter}
				{...$constraints.deliveryFreeAfter}
			/>

			{#if $errors.deliveryFreeAfter}<span class="invalid text-xs text-red-500"
					>{$errors.deliveryFreeAfter}</span
				>{/if}
		</div>

		<Button class="w-[100px]" type="submit" disabled={$createConfigMutation.isPending}>Save</Button>
	</form>
</div>
