import typescript from "@rollup/plugin-typescript";
import node from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import scss from 'rollup-plugin-scss';
import { string } from "rollup-plugin-string";

const dst = "./public/dst";

export default [
	{
		input: 'src/main.ts',
		output: {
			format: "es",
			file: dst + "/main.js",
			assetFileNames: '[name][extname]'
		},
		plugins: [
			node(),
			string({ include: "**/*.html" }),
			typescript(),
			scss({
				outputStyle: "compressed",
				fileName: "main.css"
			}),
			terser(),
		]
	}
];
