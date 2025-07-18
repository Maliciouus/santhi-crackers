import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const employeeStore = writable({
	mode: 'list',
	name: '',
	email: '',
	joinedAt: '',
	password: '',
	id: ''
});

type StoreProps = {
	mode: string;
	name: string;
	email: string;
	joinedAt: string;
	password: string;
	id: string;
};

export type EmployeeStore = Writable<StoreProps>;

export const _employeeSchema = z.object({
	username: z
		.string({
			message: 'Username is required'
		})
		.max(50),
	email: z
		.string({
			message: 'Email is required'
		})
		.email('Email is invalid')
		.max(50),
	password: z
		.string({
			message: 'Password is required'
		})
		.min(8, 'Password must be at least 8 characters')
});

export type EmployeeStoreProps = {
	employeeStore: EmployeeStore;
};

export type CreateEmployeeData = z.infer<typeof _employeeSchema>;
