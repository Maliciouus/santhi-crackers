import { writable } from 'svelte/store';

type userDetails = {
    profileImage: string;
    userName: string;
    mobile:string;
};

export type GlobalStore = {
    userDetails: userDetails;
    isLogedIn: boolean;
    cartCount: number;
};

// Initialize from localStorage if available
const getInitialState = (): GlobalStore => {
    if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('userData');
        const token = localStorage.getItem('userToken');
        
        return {
            userDetails: userData ? JSON.parse(userData) : {
                profileImage: '',
                userName: '',
                mobile:'',
            },
            isLogedIn: !!token,
            cartCount: 0
        };
    }
    return {
        userDetails: {
            profileImage: '',
            userName: '',
            mobile:'',
        },
        isLogedIn: false,
        cartCount: 0
    };
};

export const writableGlobalStore = writable<GlobalStore>(getInitialState());

// Subscribe to store changes to persist them
if (typeof window !== 'undefined') {
    writableGlobalStore.subscribe((state) => {
        if (state.isLogedIn) {
            localStorage.setItem('userData', JSON.stringify(state.userDetails));
            localStorage.setItem('userToken', 'true'); // Or your actual token
        } else {
            localStorage.removeItem('userData');
            localStorage.removeItem('userToken');
        }
    });
}