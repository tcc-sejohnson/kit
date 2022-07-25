import path from 'path';
import colors from 'kleur';
import { fileURLToPath } from 'url';

/**
 * Get the prefix for the `runtime` directory, for use with import declarations
 * @param {import('types').ValidatedKitConfig} config
 */
export function get_runtime_prefix(config) {
	if (process.env.BUNDLED) {
		return posixify_path(path.join(config.outDir, 'runtime'));
	}

	return posixify_path(fileURLToPath(new URL('../runtime', import.meta.url)));
}

/**
 * Get the prefix for the `runtime` directory, for use with import declarations
 * @param {import('types').ValidatedKitConfig} config
 */
export function get_env_prefix(config) {
	if (process.env.BUNDLED) {
		return posixify_path(path.join(config.outDir, 'env'));
	}

	return posixify_path(fileURLToPath(new URL('../env', import.meta.url)));
}

/**
 * Get the resolved path of the `runtime` directory
 * @param {import('types').ValidatedKitConfig} config
 */
export function get_runtime_directory(config) {
	if (process.env.BUNDLED) {
		return path.join(config.outDir, 'runtime');
	}

	return fileURLToPath(new URL('../runtime', import.meta.url));
}

/**
 * Get the resolved path of the `runtime` directory
 * @param {import('types').ValidatedKitConfig} config
 */
export function get_env_directory(config) {
	if (process.env.BUNDLED) {
		return path.join(config.outDir, 'env');
	}

	return fileURLToPath(new URL('../env', import.meta.url));
}

/** @param {string} str */
function posixify_path(str) {
	const parsed = path.parse(str);
	return `/${parsed.dir.slice(parsed.root.length).split(path.sep).join('/')}/${parsed.base}`;
}

function noop() {}

/** @param {{ verbose: boolean }} opts */
export function logger({ verbose }) {
	/** @type {import('types').Logger} */
	const log = (msg) => console.log(msg.replace(/^/gm, '  '));

	/** @param {string} msg */
	const err = (msg) => console.error(msg.replace(/^/gm, '  '));

	log.success = (msg) => log(colors.green(`✔ ${msg}`));
	log.error = (msg) => err(colors.bold().red(msg));
	log.warn = (msg) => log(colors.bold().yellow(msg));

	log.minor = verbose ? (msg) => log(colors.grey(msg)) : noop;
	log.info = verbose ? log : noop;

	return log;
}

/** @param {import('types').ManifestData} manifest_data */
export function get_mime_lookup(manifest_data) {
	/** @type {Record<string, string>} */
	const mime = {};

	manifest_data.assets.forEach((asset) => {
		if (asset.type) {
			const ext = path.extname(asset.file);
			mime[ext] = asset.type;
		}
	});

	return mime;
}
