import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

// Define the store type
type StoreProps = {
    mode: 'list' | 'edit' | 'create'; // Modes for listing, editing, or creating specifications
    id: string; // ID of the specification (for editing)
    name: string; // Name of the specification category
    fields: string[]; // List of fields in the specification
};

// Create the store
export const specificationStore = writable<StoreProps>({
    mode: 'list',
    id: '',
    name: '',
    fields: []
});

// Define the schema for validation
export const _specificationSchema = z.object({
    name: z.string({
        message: 'Specification name is required'
    }),
    fields: z.array(z.string({
        message: 'Field is required'
    }))
});

// Define the type for the store
export type SpecificationStore = Writable<StoreProps>;

// Define the type for the store props (used in components)
export type SpecificationStoreProps = {
    specificationStore: SpecificationStore;
};

// Define the type for the data used in mutations
export type CreateSpecificationData = z.infer<typeof _specificationSchema>;