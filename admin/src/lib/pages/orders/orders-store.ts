import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const categoryStore = writable({
	mode: 'list',
	id: '',
	name: '',
	description: '',
	categoryCode: 0
});

type StoreProps = {
	mode: string;
	id: string;
	name: string;
	description: string;
	categoryCode: number;
};

export type CategoryStore = Writable<StoreProps>;

export const _categorySchema = z.object({
	name: z
		.string({
			message: 'Name is required'
		})
		.max(50),
	description: z
		.string({
			message: 'Description is required'
		})
		.max(50),
	categoryNumber: z.number({
		message: 'Category Number is required'
	})
});

export type CategoryStoreProps = {
	categoryStore: CategoryStore;
};

export type CreateCategoryData = z.infer<typeof _categorySchema>;
