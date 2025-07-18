import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const couponsStore = writable({
	mode: 'list',
	id: '',
	code: '',
	description: '',
	discount: '',
	minPrice: 0,
	maxPrice: 0,
	numberOfDays: 0
});

type StoreProps = {
	mode: string;
	id: string;
	code: string;
	description: string;
	discount: string;
	minPrice: number;
	maxPrice: number;
	numberOfDays: number;
};

export type CouponsStore = Writable<StoreProps>;

export const _couponsSchema = z
	.object({
		code: z
			.string({
				required_error: 'Coupon code is required'
			})
			.max(50, 'Coupon code cannot exceed 50 characters')
			.min(1, 'Coupon code is required'),

		description: z
			.string({
				required_error: 'Description is required'
			})
			.min(1, 'Description is required'),

		discount: z.string().refine((val) => /^[0-9]+$/.test(val), {
			message: 'Servings must be a numeric string'
		}),
		active: z.boolean().default(true),

		minPrice: z
			.number({
				required_error: 'Minimum price is required',
				invalid_type_error: 'Minimum price must be a number'
			})
			.min(1, 'Minimum price must be at least 1'),

		maxPrice: z
			.number({
				required_error: 'Maximum price is required',
				invalid_type_error: 'Maximum price must be a number'
			})
			.min(1, 'Maximum price must be at least 1'),

		numberOfDays: z
			.number({
				required_error: 'Number of days is required',
				invalid_type_error: 'Number of days must be a number'
			})
			.min(1, 'Number of days must be at least 1')
			.int('Number of days must be a whole number')
	})
	.refine((data) => data.maxPrice >= data.minPrice, {
		message: 'Maximum price must be greater than minimum price',
		path: ['maxPrice']
	});

export type CouponsStoreProps = {
	couponsStore: CouponsStore;
};

export type CreateCouponsData = z.infer<typeof _couponsSchema>;
