import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const brandStore = writable({
	mode: 'list',
	id: '',
	name: '',
    image:''
});

type StoreProps = {
	mode: string;
	id: string;
	name: string;
    image:string;
};

export type BrandStore = Writable<StoreProps>;

export const _brandSchema = z.object({
	name: z
		.string({
			message: 'Name is required'
		})
		.max(50),
        image:z.string({
            message:'Image is required'
        })
});

export type BrandStoreProps = {
	brandStore: BrandStore;
};

export type CreateDippingData = z.infer<typeof _brandSchema>;
