import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const managerStore = writable({
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

export type ManagerStore = Writable<StoreProps>;

export const _managerSchema = z.object({
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

export type ManagerStoreProps = {
	managerStore: ManagerStore;
};

export type CreateManagerData = z.infer<typeof _managerSchema>;
