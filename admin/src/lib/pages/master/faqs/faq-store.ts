import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const faqStore = writable({
	mode: 'view',
	id: '',
	question: '',
	answer: ''
});

type StoreProps = {
	mode: string;
	id: string;
	question: string;
    answer: string;
};

export type FaqStore = Writable<StoreProps>;

export const _faqSchema = z.object({
	question: z
		.string({
			message: 'Name is required'
		}),
	answer: z
		.string({
			message: 'Description is required'
		}),
});

export type FaqStoreProps = {
	faqStore: FaqStore;
};

export type CreateFaqData = z.infer<typeof _faqSchema>;
