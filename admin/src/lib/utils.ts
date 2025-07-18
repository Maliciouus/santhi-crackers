import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const hexToRgba = (code: string) => {
	const hex = code.toString().padStart(8, '0');
	const a = parseInt(hex.slice(0, 2), 16) / 255;
	const r = parseInt(hex.slice(2, 4), 16);
	const g = parseInt(hex.slice(4, 6), 16);
	const b = parseInt(hex.slice(6, 8), 16);
	return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

export function parseTime(time: string): Date {
	if (!time) return new Date(1970, 0, 1, 0, 0);
	const [timePart, modifier] = time.split(' ');
	let [hours, minutes] = timePart.split(':').map(Number);

	if (modifier.toLowerCase() === 'pm' && hours !== 12) {
		hours += 12;
	} else if (modifier.toLowerCase() === 'am' && hours === 12) {
		hours = 0;
	}

	return new Date(1970, 0, 1, hours, minutes);
}

export function formatDate(isoDate: string) {
	if (!isoDate) {
		console.error('Invalid date input:', isoDate);
		return 'Invalid Date';
	}

	const date = new Date(isoDate);

	if (isNaN(date.getTime())) {
		console.error('Failed to parse date:', isoDate);
		return 'Invalid Date';
	}

	const options = {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	};

	// @ts-ignore
	return date.toLocaleString('en-US', options).replace(',', '');
}

export function setBadgeColor(status: string) {
	switch (status) {
		case 'pending':
			return 'bg-[#FFB74D] text-zinc-800';
		case 'accepted':
			return 'bg-[#66BB6A]';
		case 'rejected':
			return 'bg-[#EF5350]';
		case 'dispatched':
			return 'bg-[#26C6DA]'
		case 'delivered':
			return 'bg-[#388E3C]';
		case 'cancelled':
			return 'bg-[#DC143C]';
		default:
			return 'bg-gray-500';
	}
}

export const orderStatuses = [
	'pending',
	'accepted',
	'rejected',
	'dispatched',
	'cancelled',
	'delivered'
];
