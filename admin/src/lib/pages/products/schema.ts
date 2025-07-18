import { writable } from 'svelte/store';
import { z } from 'zod';

// Define the schema for options
export const optionSchema = z.object({
  title: z.string({ message: 'Option title is required' }),
  values: z.array(z.string({ message: 'Option values are required' })),
});

// Define the schema for specifications
export const specificationSchema = z.object({
  name: z.string({ message: 'Specification name is required' }),
  fields: z.record(z.string(), z.string()),
});
export const groupSchema = z.object({
  _id: z.string(),
  name: z.string(),
});
// Define the main product schema
export const _productsSchema = z.object({
  productName: z
    .string({ message: 'Name is required' })
    .max(50),
    ytLink: z.string().optional(),
    occasions: z // Change from occasion to occasions
    .array(z.string()).min(1, { message: 'At least one occasion is required' }),
  ageGroup: z
    .array(z.string()).min(1, { message: 'At least one age group is required' }),

    group: z
    .array(z.string()).min(1, { message: 'At least one group is required' }),
    
  category: z
    .string({ message: 'Category is required' })
    .min(1),
  brand: z
    .string({ message: 'Brand is required' })
    .min(1),
    unit: z
    .string({ message: 'Unit is required' })
    .min(1),
  price: z
    .string()
    .refine((val) => /^[0-9]+$/.test(val), {
      message: 'Price must be a numeric string',
    }),
  stock: z
    .string({ message: 'Stock is required' })
    .min(1, { message: 'Stock cannot be empty' })
    .refine((val) => /^[0-9]+$/.test(val), {
      message: 'Stock must contain only digits',
    }),
    discount: z.string().refine((val) => /^[0-9]+$/.test(val), {
        message: 'Discount must be a numeric string'
      }),
  // negotiationLimit: z.string({ message: 'Limit must be a numeric string' }),
  // strikePrice: z.string().refine((val) => /^[0-9]+$/.test(val), {
  //   message: 'strikePrice must be a numeric string'
  // }),
  // HSNCode: z
  //   .string({ message: 'HSN Code is required' }),
  productCode: z
    .string(),
  description: z
    .string({ message: 'Description is required' }),
  images: z.any(),
  topSeller: z
    .boolean(),
  gst: z
    .string()
    .refine((val) => /^[0-9]+$/.test(val), {
      message: 'GST must be a numeric string',
    }),
  active: z
    .boolean(),
  // options: z
  //   .array(optionSchema)
  //   .optional(),
  specifications: z
    .array(specificationSchema)
    .optional(),
});

// Store for managing product edit state
export const productEditStore = writable({
  mode: 'list',
  id: '',
  category: {} as TCategory,
ytLink: '',
  description: '',
  productName: '',
  group: [] as TGroup[],
  brand: {} as TBrand,
  unit: {} as TUnit,
  price: '',
  discount: '',
  // strikePrice: '',
  HSNCode: '',
  productCode: '',
  topSeller: null as boolean | null,
  images: '',
  gst: '',
  occations: [] as string[],
  ageGroup: [] as string[],
  stock: '',
  active: true,
  options: [] as Option[],
  specifications: [] as Specifications[],
});

// Type definitions
export type productCreateProps = {
  productEditStore: typeof productEditStore;
};

export type TCategory = {
  categoryNumber: number;
  _id: string;
  name: string;
};

export type TBrand = {
  _id: string;
  name: string;
};
export type TGroup = {
  _id: string;
  name: string;
};
export type TUnit = {
  _id: string;
  name: string;
};

export type Option = {
  title: string;
  values: string[];
};

export type Specifications = {
  name: string;
  fields: string[];
};