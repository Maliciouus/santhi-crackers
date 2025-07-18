import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const quoteStore = writable({
	mode: 'view',
	id: '',
	quote: '',
});

type StoreProps = {
	mode: string;
	id: string;
	quote: string;
};

export type QuoteStore = Writable<StoreProps>;

export const _quoteSchema = z.object({
	quote: z
		.string({
			message: 'Quote is required'
		})
});

export type QuoteStoreProps = {
	quoteStore: QuoteStore;
};

export type CreateQuoteData = z.infer<typeof _quoteSchema>;
