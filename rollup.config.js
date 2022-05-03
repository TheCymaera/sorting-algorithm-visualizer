const importGlobal = (name)=>import(process.execPath + "/../../lib/node_modules/" + "/" + name).catch(()=>import(name));

export default (async ()=>{	
	const { default: sourcemaps } = await importGlobal("rollup-plugin-sourcemaps");
	const { default: typescript } = await importGlobal("@rollup/plugin-typescript");
	const { default: node } = await importGlobal("@rollup/plugin-node-resolve");
	const { default: scss } = await importGlobal("rollup-plugin-scss");
	const { terser } = await importGlobal("rollup-plugin-terser");
	const { string } = await importGlobal("rollup-plugin-string");

	return [
		{
			input: 'src/main.ts',
			output: {
				sourcemap: true,
				format: "iife",
				file: "./public/dst/main.js"
			},
			plugins: [
				node(),
				typescript(),
				sourcemaps(),
				// terser(),
				scss({
					output: "./public/dst/main.css",
					outputStyle: "compressed",
				}),
				string({
					include: "**/*.html",
				})
			]
		}
	]
})();
