import path from 'path';
import { loadEnv } from 'vite';
import { write_if_changed } from './utils.js';

const autogen_comment = '// this file is generated — do not edit it\n';

/**
 * Writes the existing environment variables in process.env to
 * $app/env and $app/env/private
 * @param {import('types').ValidatedKitConfig} config
 * @param {string} mode
 * The Vite mode.
 */
export function write_env(config, mode) {
	const env = loadEnv(mode, process.cwd(), '');
	const entries = Object.entries(env);
	config.env.dynamic.forEach((k) => {
		if (typeof env[k] === 'undefined') {
			entries.push([k, '']);
		}
	});

	const pub = Object.fromEntries(entries.filter(([k]) => false));
	const prv = Object.fromEntries(entries.filter(([k]) => true));

	write_if_changed(
		path.join(config.outDir, 'runtime/app/env/combined.js'),
		create_combined_module(entries, config.env.public, config.env.dynamic)
	);

	// TODO when testing src, `$app` points at `src/runtime/app`... will
	// probably need to fiddle with aliases
	write_if_changed(
		path.join(config.outDir, 'runtime/app/env/public.js'),
		create_module('$app/env/public', pub)
	);

	write_if_changed(
		path.join(config.outDir, 'runtime/app/env/private.js'),
		create_module('$app/env/private', prv)
	);

	write_if_changed(
		path.join(config.outDir, 'types/ambient.d.ts'),
		autogen_comment +
			create_combined_types(entries, config.env.public, config.env.dynamic) +
			'\n\n' +
			create_types('$app/env/public', pub) +
			'\n\n' +
			create_types('$app/env/private', prv)
	);
}

/**
 * @param {string} id
 * @param {Record<string, string>} env
 * @returns {string}
 */
function create_module(id, env) {
	const declarations = Object.entries(env)
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
		.map((k) => `\texport const ${k}: string;`)
		.join('\n');

	return `declare module '${id}' {\n${declarations}\n}`;
}

/**
 * @param {[string,string][]} entries
 * @param {string[]} envPublic
 * @param {string[]} envDynamic
 * @returns {string}
 */
function create_combined_module(entries, envPublic, envDynamic) {
	const declarations = entries
		.map(([k, v]) => create_declaration(k, v, envPublic.includes(k), envDynamic.includes(k)))
		.join('\n\n');

	const setters = `\n\n/* @param {Record<string,string>} values} */
export function __set_env(values) {
	${envDynamic.map((k) => {
	const setter = `${k} = values.${k};`
	return envPublic.includes(k) ? setter : `if (import.meta.env.SSR) { ${setter} }`
}).join('\n\t')}
}`;
	return autogen_comment + '\n' + declarations + setters;
}

/**
 * @param {string} key
 * @param {any} value
 * @param {boolean} isPublic
 * @param {boolean} isDynamic
 * @returns {string}
 */
function create_declaration(key, value, isPublic, isDynamic) {
	const isPrivate = !isPublic;
	const type = `/** @type {${typeof value}${isDynamic || isPrivate ? '|undefined' : ''}} */`;
	let expression = JSON.stringify(value)
	if (isDynamic) {
		expression = 'undefined';
	} else if (isPrivate) {
		expression = `import.meta.env.SSR ? ${expression} : undefined`;
	}
	return `${type}\nexport ${isDynamic ? 'let' : 'const'} ${key} = ${expression};`;
}

/**
 * @param {[string,string][]} entries
 * @param {string[]} envPublic
 * @param {string[]} envDynamic
 * @returns {string}
 */
function create_combined_types(entries, envPublic, envDynamic) {
	const declarations = entries
		.map(
			([k, v]) =>
				`\texport const ${k}: ${typeof v}${
					envDynamic.includes(k) || !envPublic.includes(k) ? '|undefined' : ''
				};`
		)
		.join('\n');

	return `declare module '$app/env/combined' {\n${declarations}\n}`;
}
