import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const deliveryAgentStore = writable({
	mode: 'list',
	name: '',
	phone: '',
	employeeId: '',
	password: '',
	id: ''
});

type StoreProps = {
	mode: string;
	id: string;
	name: string;
	phone: string;
	employeeId: string;
	password: string;
};

export type DeliveryAgentStore = Writable<StoreProps>;

export const _deliveryAgentSchema = z.object({
	name: z
		.string({
			message: 'Name is required'
		})
		.max(50),
	phone: z
		.string({
			message: 'Phone is required'
		})
		.refine((value) => /^[6-9]\d{9}$/.test(value), {
			message:
				'Phone must be a valid Indian mobile number starting with 6-9 and containing 10 digits'
		}),
	employeeId: z
		.string({
			message: 'Employee ID is required'
		})
		.max(50),
	password: z
		.string({
			message: 'Password is required'
		})
		.min(8, 'Password must be at least 8 characters')
});

export type DeliveryAgentStoreProps = {
	deliveryAgentStore: DeliveryAgentStore;
};

export type CreateDeliveryAgentData = z.infer<typeof _deliveryAgentSchema>;
