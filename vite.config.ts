import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

const page_url = "https://heledron.com/misc/sorting-algorithm-visualizer/";

const page_title					= "Sorting Algorithm Visualizer";
const page_description		= "Visualize Sorting Algorithms.";
const page_author					= "Morgan";
const page_keywords				= "Heledron, Cymaera";
const page_og_title 				= page_title;
const page_og_description 	= page_description;
const page_og_url 					= page_url;
const page_og_image 				= page_og_url + "thumbnail.webp";
const page_og_type 					= "website";

export default defineConfig({
	base: "./",
	build: {
		modulePreload: {
			polyfill: false,
		}
	},
	plugins: [
		createHtmlPlugin({
			minify: true,
			inject: {
				data: {
					page_url,
					page_title,
					page_description,
					page_author,
					page_keywords,
					page_og_title,
					page_og_description,
					page_og_url,
					page_og_image,
					page_og_type,
				}
			}
		}),
	],
});