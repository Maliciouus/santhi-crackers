// src/lib/pages/group/group-store.ts
import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const groupStore = writable({
  mode: 'list',
  id: '',
  name: '',
  image: '',
  products: [] as string[],
});

type StoreProps = {
  mode: string;
  id: string;
  name: string;
  image: string;
  products: string[];
};

export type GroupStore = Writable<StoreProps>;

export const _groupSchema = z.object({
  name: z
    .string({
      message: 'Name is required',
    })
    .max(50, { message: 'Name must be 50 characters or less' }),
  image: z.string().optional(), // Image is optional for updates
  productIds: z.array(z.string()).optional(),
});

export type GroupStoreProps = {
  groupStore: GroupStore;
};

export type CreateGroupData = z.infer<typeof _groupSchema>;