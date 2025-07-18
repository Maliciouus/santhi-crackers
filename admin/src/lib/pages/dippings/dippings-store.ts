import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const dippingStore = writable({
	mode: 'list',
	id: '',
	name: '',
	price: '0'
});

type StoreProps = {
	mode: string;
	id: string;
	name: string;
	price: string;
};

export type DippingStore = Writable<StoreProps>;

export const _dippingSchema = z.object({
	name: z
		.string({
			message: 'Name is required'
		})
		.max(50),
	price: z.string().refine((val) => /^[0-9]+$/.test(val), {
		message: 'Price must be a numeric string'
	})
});

export type DippingStoreProps = {
	dippingStore: DippingStore;
};

export type CreateDippingData = z.infer<typeof _dippingSchema>;
