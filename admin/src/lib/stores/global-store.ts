import { writable } from 'svelte/store';

type adminDetails = {
	restaurentImage: string;
	restaurentName: string;
};

export type GlobalStore = {
	adminDetails: adminDetails;
	isManager: boolean;
};

export const writableGlobalStore = writable<GlobalStore>({
	adminDetails: {
		restaurentImage: '',
		restaurentName: ''
	},
	isManager: false
});
