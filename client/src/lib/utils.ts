import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function flyAndScale(node: HTMLElement, params: any) {
	// Your animation logic here
	return {
	  duration: 200,
	  css: (t: number) => {
		return `
		  transform: scale(${t}) translateY(${(1 - t) * 40}px);
		  opacity: ${t};
		`;
	  }
	};
  }