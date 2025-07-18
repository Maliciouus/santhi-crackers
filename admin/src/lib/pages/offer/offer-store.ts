import { writable, type Writable, get } from 'svelte/store';
import { z } from 'zod';
import { _axios } from '$lib/_axios';

// Define the schema for the offer store
export const offerSchema = z.object({
  mode: z.enum(['flat', 'negotiate', 'discount', 'mrp']),
  data: z.object({
    _id: z.string().optional(),
    failurePercentage: z.number().optional(),
    successPercentage: z.number().optional(),
    percentage: z.number().optional(),
    minPrd: z.number().optional(),
    noOfAttempts: z.number().optional(),
    items: z.array(
      z.object({
        productId: z.string(),
        discount: z.number().optional(), // For discount mode
        mrpReduction: z.number().optional(), // For MRP mode
      })
    ).optional(),
    isActive: z.boolean().optional(),
  }).optional(),
});

export type OfferStoreProps = z.infer<typeof offerSchema>;

// Initialize the store with default values
export const offerStore = writable<OfferStoreProps>({
  mode: "flat",
  data: {},
});

// Helper function to map API data to store data based on mode
function mapApiDataToStoreData(item: any, mode: string) {
  if (!item) return {};

  switch (mode) {
    case 'flat':
      return {
        _id: item._id,
        percentage: item.percentage,
        minPrd: item.minPrd,
        items: item.items?.map((i: any) => ({
          productId: i.productId,
          active:i.active
        })) || [],
        isActive: item.isActive !== undefined ? item.isActive : true,
      };
    case 'negotiate':
      return {
        _id: item._id,
        items: item.items?.map((i: any) => ({
        productId: i.productId,
        successPercentage: i.successPercentage,
        failurePercentage:i.failurePercentage,
        active:i.active,
        MOQ:i.MOQ
        })) || [],
        isActive: item.isActive !== undefined ? item.isActive : true,
      };
    case 'discount':
      return {
        _id: item._id,
        items: item.items?.map((i: any) => ({
          productId: i.productId,
          discount: i.discount,
          active:i.active,
        })) || [],
        isActive: item.isActive !== undefined ? item.isActive : true,
      };
    case 'mrp':
      return {
        _id: item._id,
        items: item.items?.map((i: any) => ({
          productId: i.productId,
          mrpReduction: i.mrpReduction,
          active:i.active,
        })) || [],
        isActive: item.isActive !== undefined ? item.isActive : true,
      };
    default:
      return {};
  }
}

// Function to fetch all offers and update the store
export async function fetchAndUpdateOffers() {
  try {
    const currentMode = get(offerStore).mode;
    const response = await _axios.get(`/offer/?type=${currentMode}`);

    if (response.data && response.data.status) {
      if (response.data.data && response.data.data.length > 0) {
        const offer = response.data.data[0];
        const mappedData = mapApiDataToStoreData(offer, currentMode);

        offerStore.update((store) => ({
          ...store,
          data: mappedData,
        }));

        return mappedData;
      } else {
        // Reset data if no offers are found
        offerStore.update((store) => ({
          ...store,
          data: {},
        }));
        return null;
      }
    } else {
      console.error('Failed to fetch offers:', response.data?.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching offers:', error);
    return null;
  }
}

// Function to handle mode change
export async function changeOfferMode(mode: 'flat' | 'negotiate' | 'discount' | 'mrp') {
  offerStore.update((store) => ({
    ...store,
    mode,
  }));

  // Fetch data for the new mode
  return fetchAndUpdateOffers();
}

// Function to save offer data based on current mode
export async function saveOfferData() {
  const currentStore = get(offerStore);
  const { mode, data } = currentStore;

  if (!data) {
    console.error('No data found in the store');
    return null;
  }

  try {
    let endpoint;
    let payload;

    if (data._id) {
      endpoint = `/offer/update/${data._id}`;
    } else {
      endpoint = `/offer/create`;
    }

    switch (mode) {
      case 'flat':
        if (!data.percentage || !data.minPrd) {
          console.error('Missing required fields for flat offer');
          return null;
        }
        payload = {
          type: mode,
          percentage: data.percentage,
          minPrd: data.minPrd,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        break;

      case 'negotiate':
        if (!data.successPercentage||!data.failurePercentage || !data.noOfAttempts) {
          console.error('Missing required fields for negotiate offer');
          return null;
        }
        payload = {
          type: mode,
          items:data.items,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        break;

      case 'discount':
      case 'mrp':
        if (!data.items || data.items.length === 0) {
          console.error('No items found for discount/mrp offer');
          return null;
        }
        payload = {
          type: mode,
          items: data.items,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        break;

      default:
        console.error('Invalid offer mode');
        return null;
    }

    const response = data._id
      ? await _axios.patch(endpoint, payload)
      : await _axios.post(endpoint, payload);

    if (response.data && response.data.status && response.data.data) {
      offerStore.update((store) => ({
        ...store,
        data: {
          ...store.data,
          _id: response.data.data._id,
        },
      }));
    }

    return response.data;
  } catch (error) {
    console.error('Error saving offer data:', error);
    return null;
  }
}

// Function to update a specific field in the offer data
export function updateOfferField(field: string, value: any) {
  offerStore.update((store) => ({
    ...store,
    data: {
      ...store.data,
      [field]: value,
    },
  }));
}

// Function to initialize the store when the component mounts
export async function initializeOfferStore() {
  await fetchAndUpdateOffers();
}