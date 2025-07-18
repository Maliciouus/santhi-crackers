import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	base: '/', // ✅ Ensures correct paths for JS files
	build: {
		outDir: "build"
	}
});
