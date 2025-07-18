<script lang="ts">
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { queryClient } from '$lib/query-client';
	import Icon from '@iconify/svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { _quoteSchema, type QuoteStoreProps } from './quote-store';

	let { quoteStore }: QuoteStoreProps = $props();
	let edit = $state(false);
	let charCount = $state(0);

	$effect(() => {
		edit = $quoteStore.mode === 'edit' && !!$quoteStore.id;
	});

	type CreateFAQData = z.infer<typeof _quoteSchema>;

	const createFaqMutation = createMutation({
		mutationFn: (data: CreateFAQData) =>
			edit
				? _axios.put(`/quotes/${$quoteStore.id}`, data)
				: _axios.post('/faqs/create', data),
		onSuccess({ data }) {
			queryClient.refetchQueries({ queryKey: ['faqs fetch'] });
			if (data.status) {
				toast(edit ? 'Quote Updated ✅' : 'Quote Created ✅');
				reset();

				quoteStore.update((store: any) => ({
					...store,
					mode: 'view',
					id: '',
					question: '',
					answer: ''
				}));
			} else {
				toast.error(data.message);
			}
		},
		onError(error, variables, context) {
			console.error('Error:', error, variables, context);
		}
	});

	const { form, errors, enhance, constraints, reset } = superForm(defaults(zod(_quoteSchema)), {
		SPA: true,
		validationMethod: 'oninput',
		validators: zod(_quoteSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		onSubmit() {
			const _data: CreateFAQData = {
				quote: $form.quote
			};
			$createFaqMutation.mutate(_data);
		}
	});

	$effect(() => {
		if (edit) {
			$form.quote = $quoteStore.quote || '';
		} else {
			reset();
		}
	});

	$effect(() => {
		charCount = $form.quote.length;
	});
</script>

<div class="max-w-[80%] text-maintext pl-[10%]">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="question">Quote</Label>
			<Input
				id="question"
				autocomplete="on"
				class="pr-10 mt-1"
				placeholder="Ex: question"
				aria-invalid={$errors.quote ? 'true' : undefined}
				bind:value={$form.quote}
				maxlength="30"
				{...$constraints.quote}
			/>

			{#if $errors.quote}
				<span class="invalid text-xs text-red-500">{$errors.quote}</span>
			{/if}

			<div class="text-xs text-gray-500 mt-1">
				{charCount}/30
			</div>
		</div>

		<Button class="w-[100px]" type="submit">
			{edit ? 'Update' : 'Add'}
			<Icon icon="zondicons:add-outline" class="text-white" />
		</Button>
	</form>
</div>
