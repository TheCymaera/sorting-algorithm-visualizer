import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
	base: "./",
	build: {
		modulePreload: {
			polyfill: false,
		}
	},
	plugins: [
		solidPlugin(),
	]
});