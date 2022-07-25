import path from 'path';
import { loadEnv } from 'vite';
import { write_if_changed, is_valid_js_identifier } from './utils.js';

const autogen_comment = '// this file is generated — do not edit it\n';

/**
 * Writes the existing environment variables in process.env to
 * $env/static/private and $env/static/public
 * @param {import('types').ValidatedKitConfig} config
 * @param {string} mode
 * The Vite mode.
 */
export function write_env(config, mode) {
	const entries = Object.entries(loadEnv(mode, process.cwd(), ''));
	const pub = Object.fromEntries(entries.filter(([k]) => k.startsWith(config.env.publicPrefix)));
	const prv = Object.fromEntries(entries.filter(([k]) => !k.startsWith(config.env.publicPrefix)));

	// TODO when testing src, `$app` points at `src/runtime/app`... will
	// probably need to fiddle with aliases
	write_if_changed(
		path.join(config.outDir, 'runtime/env/static/public.js'),
		create_module('$env/static/public', pub)
	);

	write_if_changed(
		path.join(config.outDir, 'runtime/env/static/private.js'),
		create_module('$env/static/private', prv)
	);

	write_if_changed(
		path.join(config.outDir, 'types/ambient.d.ts'),
		autogen_comment +
			create_types('$env/static/public', pub) +
			'\n\n' +
			create_types('$env/static/private', prv)
	);
}

/**
 * @param {string} id
 * @param {Record<string, string>} env
 * @returns {string}
 */
function create_module(id, env) {
	const declarations = Object.entries(env)
		.filter(([k]) => is_valid_js_identifier(k))
		.map(
			([k, v]) => `/** @type {import('${id}'}').${k}} */\nexport const ${k} = ${JSON.stringify(v)};`
		)
		.join('\n\n');

	return autogen_comment + declarations;
}

/**
 * @param {string} id
 * @param {Record<string, string>} env
 * @returns {string}
 */
function create_types(id, env) {
	const declarations = Object.keys(env)
		.filter((k) => is_valid_js_identifier(k))
		.map((k) => `\texport const ${k}: string;`)
		.join('\n');

	return `declare module '${id}' {\n${declarations}\n}`;
}
