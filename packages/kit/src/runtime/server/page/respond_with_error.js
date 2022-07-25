import { render_response } from './render.js';
import { load_node } from './load_node.js';
import { coalesce_to_error } from '../../../utils/error.js';
import { GENERIC_ERROR } from '../utils.js';

/**
 * @typedef {import('./types.js').Loaded} Loaded
 * @typedef {import('types').SSROptions} SSROptions
 * @typedef {import('types').SSRState} SSRState
 */

/**
 * @param {{
 *   event: import('types').RequestEvent;
 *   options: SSROptions;
 *   state: SSRState;
 *   $session: any;
 *   $env: any;
 *   status: number;
 *   error: Error;
 *   resolve_opts: import('types').RequiredResolveOptions;
 * }} opts
 */
export async function respond_with_error({
	event,
	options,
	state,
	$session,
	$env,
	status,
	error,
	resolve_opts
}) {
	try {
		const branch = [];
		let stuff = {};

		if (resolve_opts.ssr) {
			const default_layout = await options.manifest._.nodes[0](); // 0 is always the root layout
			const default_error = await options.manifest._.nodes[1](); // 1 is always the root error

			const layout_loaded = /** @type {Loaded} */ (
				await load_node({
					event,
					options,
					state,
					route: GENERIC_ERROR,
					node: default_layout,
					$session,
					$env,
					stuff: {},
					is_error: false,
					is_leaf: false
				})
			);

			if (layout_loaded.loaded.error) {
				throw layout_loaded.loaded.error;
			}

			const error_loaded = /** @type {Loaded} */ (
				await load_node({
					event,
					options,
					state,
					route: GENERIC_ERROR,
					node: default_error,
					$session,
					$env,
					stuff: layout_loaded ? layout_loaded.stuff : {},
					is_error: true,
					is_leaf: false,
					status,
					error
				})
			);

			branch.push(layout_loaded, error_loaded);
			stuff = error_loaded.stuff;
		}

		return await render_response({
			options,
			state,
			$session,
			$env,
			page_config: {
				hydrate: options.hydrate,
				router: options.router
			},
			stuff,
			status,
			error,
			branch,
			event,
			resolve_opts
		});
	} catch (err) {
		const error = coalesce_to_error(err);

		options.handle_error(error, event);

		return new Response(error.stack, {
			status: 500
		});
	}
}
