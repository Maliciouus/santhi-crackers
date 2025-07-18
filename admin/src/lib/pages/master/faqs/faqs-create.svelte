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
	import type { FaqStoreProps } from './faq-store';

	export const _faqSchema = z.object({
		question: z.string({ message: 'Question is required' }),
		answer: z.string({ message: 'Answer is required' })
	});

	let { faqStore }: FaqStoreProps = $props();
	let edit = $state(false);

	$effect(() => {
		edit = $faqStore.mode === 'edit' && !!$faqStore.id;
	});

	type CreateFAQData = z.infer<typeof _faqSchema>;


	const createFaqMutation = createMutation({
		mutationFn: (data: CreateFAQData) =>
			edit
				? _axios.patch(`/faqs/${$faqStore.id}`, data)
				: _axios.post('/faqs/create', data),
		onSuccess({ data }) {
			queryClient.refetchQueries({ queryKey: ['faqs fetch'] });
			if (data.status) {
				toast(edit ? 'FAQ Updated ✅' : 'FAQ Created ✅');
				reset();
				
				faqStore.update((store) => ({
					...store,
					mode: 'view',
					id: '',
					question: '',
					answer: ''
		}))
			} else {
				toast.error(data.message);
			}
		},
		onError(error, variables, context) {
			console.error('Error:', error, variables, context);
		}
	});

	
	const { form, errors, enhance, constraints, reset } = superForm(defaults(zod(_faqSchema)), {
		SPA: true,
		validationMethod: 'oninput',
		validators: zod(_faqSchema),
		clearOnSubmit: 'none',
		invalidateAll: false,
		resetForm: false,
		onSubmit() {
			const _data: CreateFAQData = {
				question: $form.question,
				answer: $form.answer
			};
			$createFaqMutation.mutate(_data);
		}
	});
	
	$effect(() => {
		if (edit) {
			$form.question = $faqStore.question || '';
			$form.answer = $faqStore.answer || '';
		} else {
			reset();
		}
	});
</script>

<div class="max-w-[80%] text-maintext pl-[10%]">
	<form method="POST" use:enhance class="grid gap-4 py-4">
		<div>
			<Label for="question">FAQ Question</Label>
			<Input
				id="question"
				autocomplete="on"
				class="pr-10 mt-1"
				placeholder="Ex: question"
				aria-invalid={$errors.question ? 'true' : undefined}
				bind:value={$form.question}
				{...$constraints.question}
			/>

			{#if $errors.question}
				<span class="invalid text-xs text-red-500">{$errors.question}</span>
			{/if}
		</div>

		<div>
			<Label for="answer">FAQ Answer</Label>
			<Textarea
				id="answer"
				class="pr-10 mt-1"
				placeholder="Answer"
				rows={5}
				aria-invalid={$errors.answer ? 'true' : undefined}
				bind:value={$form.answer}
				{...$constraints.answer}
			/>

			{#if $errors.answer}
				<span class="invalid text-xs text-red-500">{$errors.answer}</span>
			{/if}
		</div>

		<Button class="w-[100px]" type="submit">
			{edit ? 'Update' : 'Add'}
			<Icon icon="zondicons:add-outline" class="text-black" />
		</Button>
	</form>
</div>
