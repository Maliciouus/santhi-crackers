<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	export const _settingsSchema = z.object({
		username: z.string({
			message: 'Username is required'
		})
	});

	// let restaurentData: any = localStorage.getItem('restaurent');
	// if (restaurentData) {
	// 	restaurentData = JSON.parse(restaurentData) || {};
	// 	writableGlobalStore.update((prevState) => ({
	// 		...prevState,
	// 		...restaurentData
	// 	}));
	// }

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
				username: $form.username
			};
		}
	});

	$form.username = 'Admin';
</script>

<div class="max-w-[50%] text-maintext pl-[10%] m-auto">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="username">Admin Name</Label>
			<Input
				id="username"
				autocomplete="username"
				class="pr-10 mt-1"
				placeholder="Ex: Admin"
				aria-invalid={$errors.username ? 'true' : undefined}
				bind:value={$form.username}
				{...$constraints.username}
			/>

			{#if $errors.username}<span class="invalid text-xs text-red-500">{$errors.username}</span
				>{/if}
		</div>

		<Button class="w-[100px]" type="submit">Save</Button>
	</form>
</div>
