import axios from 'axios';
import { baseUrl } from './config';

export const _axios = axios.create({
	baseURL: baseUrl,
	withCredentials: true
});

_axios.interceptors.response.use(
	(response) => {
		return response;
	}
	// (error) => {
	// 	if (error.status === 401) {
	// 		window.location.href = '/hidden-admin-base-007';
	// 		return Promise.reject(error);
	// 	}

	// 	return Promise.reject(error);
	// }
);
