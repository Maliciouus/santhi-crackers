import { writable } from 'svelte/store';
import { z } from 'zod';

export const restaurentStore = writable({
	mode: 'list',
	id: ''
});

export type RestaurentProps = {
	restaurentStore: typeof restaurentStore;
};

export const restaurentSchema = z.object({
	restaurentName: z.string({
		message: 'Restaurent Name is required'
	}),
	restaurentAddress: z.string({
		message: 'Restaurent Address is required'
	}),
	restaurentPhone: z.string({
		message: 'Restaurent Phone is required'
	}),
	restaurentDescription: z.string({
		message: 'Restaurent Description is required'
	}),
	latitude: z
		.string({
			message: 'Latitude is required'
		})
		.refine((val) => /^-?\d+(\.\d+)?$/.test(val), {
			message: 'Latitude must be a valid number'
		}),
	longitude: z
		.string({
			message: 'Longitude is required'
		})
		.refine((val) => /^-?\d+(\.\d+)?$/.test(val), {
			message: 'Longitude must be a valid number'
		})
});
