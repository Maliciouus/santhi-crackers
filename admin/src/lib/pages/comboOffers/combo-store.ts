import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const comboStore = writable({
	mode: 'list',
	id: '',
	comboName: '',
	comboDescription: '',
	comboPrice: 0,
	strikePrice: 0,
	image: '',
	productsIncluded: []
});

type StoreProps = {
	mode: string;
	id: string;
	comboName: string;
	comboDescription: string;
	comboPrice: number;
	strikePrice: number;
	image: string;
	productsIncluded: Array<{productId: string, quantity: number}>;
};

export type ComboStore = Writable<StoreProps>;

export const _comboSchema = z.object({
	comboName: z
		.string({
			message: 'Combo name is required'
		})
		.max(50),
	comboDescription: z.string({
		message: 'Description is required'
	}),
	comboPrice: z.number({
		message: 'Combo price is required'
	}),
	strikePrice: z.number({
		message: 'Strike price is required'
	}),
	image: z.string({
		message: 'Image is required'
	}).optional()
});

export type ComboStoreProps = {
	comboStore: ComboStore;
};

export type CreateComboData = z.infer<typeof _comboSchema>;