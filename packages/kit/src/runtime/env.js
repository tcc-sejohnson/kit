export let prerendering = false;

/** @param {boolean} value */
export function set_prerendering(value) {
	prerendering = value;
}
export let runtimeEnv = {};

/** @param {Record<string,string|undefined>} value */
export function set_runtime_env(value) {
	runtimeEnv = value;
}
