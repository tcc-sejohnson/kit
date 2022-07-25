import path from 'path';
import { loadEnv } from 'vite';
import { write_if_changed } from './utils.js';

const autogen_comment = '// this file is generated — do not edit it\n';

/**
 * Writes the existing environment variables in process.env to
 * $env/public and $env/private
 * @param {import('types').ValidatedKitConfig} config
 * @param {string} mode
 * The Vite mode.
 */
export function write_env(config, mode) {
	const entries = Object.entries(loadEnv(mode, process.cwd(), ''));
	const rt_pub = Object.fromEntries(
		entries.filter(([k]) => k.startsWith(config.env.runtimePublicPrefix))
	);
	const rt_prv = Object.fromEntries(
		entries.filter(([k]) => k.startsWith(config.env.runtimePrivatePrefix))
	);
	const bt_pub = Object.fromEntries(
		entries.filter(([k]) => k.startsWith(config.env.buildtimePublicPrefix))
	);
	const bt_prv = Object.fromEntries(
		entries.filter(([k]) => k.startsWith(config.env.buildtimePrivatePrefix))
	);

	write_if_changed(
		path.join(config.outDir, 'env/public.js'),
		autogen_comment +
			create_const_module('$env/public', bt_pub) +
			'\n\n' +
			create_mut_module('$env/public', rt_pub)
	);

	write_if_changed(
		path.join(config.outDir, 'env/private.js'),
		autogen_comment +
			create_const_module('$env/private', bt_prv) +
			'\n\n' +
			create_mut_module('$env/private', rt_prv)
	);

	write_if_changed(
		path.join(config.outDir, 'types/ambient.d.ts'),
		autogen_comment +
			create_types('$env/public', bt_pub, rt_pub) +
			'\n\n' +
			create_types('$env/private', bt_prv, rt_prv)
	);
}

/**
 * @param {string} id
 * @param {Record<string, string>} env
 * @returns {string}
 */
function create_const_module(id, env) {
	const declarations = Object.entries(env)
		.map(
			([k, v]) => `/** @type {import('${id}').${k}} */\nexport const ${k} = ${JSON.stringify(v)};`
		)
		.join('\n\n');

	return declarations;
}

/**
 * @param {string} id
 * @param {Record<string, string>} env
 * @returns {string}
 */
function create_mut_module(id, env) {
	const keys = Object.keys(env);
	const declarations = keys
		.map((k) => `/** @type {import('${id}').${k}} */\nexport let ${k} = undefined;`)
		.join('\n\n');

	const setters = `export default {\n${keys
		.map((k) => `\t'__set_${k.toLowerCase()}': (val) => { ${k} = val },`)
		.join('\n')}\n}`;

	return declarations + '\n\n' + setters;
}

/**
 * @param {string} id
 * @param {Record<string, string>} bt_env
 * @param {Record<string, string>} rt_env
 * @returns {string}
 */
function create_types(id, bt_env, rt_env) {
	const bt_declarations = Object.keys(bt_env)
		.map((k) => `\texport const ${k}: string;`)
		.join('\n');

	const rt_declarations = Object.keys(rt_env)
		.map((k) => `\texport const ${k}: string | undefined;`)
		.join('\n');

	const setters = `\tlet setters: { [k: string]: (val: string) => void }\n\texport default setters;`;

	return `declare module '${id}' {\n${bt_declarations}\n${rt_declarations}\n\n${setters}\n}`;
}
