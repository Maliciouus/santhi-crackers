import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const categoryStore = writable({
	mode: 'list',
	id: '',
	name: '',
	description: '',
	code: 0,
	image:''

});

type StoreProps = {
	mode: string;
	id: string;
	name: string;
	description: string;
	code: number;
	image:string;
};

export type CategoryStore = Writable<StoreProps>;

export const _categorySchema = z.object({
	name: z
		.string({
			message: 'Name is required'
		})
		.max(50),
	description: z.string({
		message: 'Description is required'
	}),	
	code: z.number({
		message: 'Code is required'
	}),
	image:z.string({
		message:'Image is required'
	})
});

export type CategoryStoreProps = {
	categoryStore: CategoryStore;
};

export type CreateCategoryData = z.infer<typeof _categorySchema>;
