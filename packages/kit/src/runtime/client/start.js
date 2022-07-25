import { create_client } from './client.js';
import { init } from './singletons.js';
import { set_paths } from '../paths.js';
import { set_runtime_env } from '../env.js';

/**
 * @param {{
 *   paths: {
 *     assets: string;
 *     base: string;
 *   },
 *   target: Element;
 *   session: any;
 *   env: any;
 *   route: boolean;
 *   spa: boolean;
 *   trailing_slash: import('types').TrailingSlash;
 *   hydrate: {
 *     status: number;
 *     error: Error;
 *     nodes: number[];
 *     params: Record<string, string>;
 *     routeId: string | null;
 *   };
 * }} opts
 */
export async function start({ paths, target, session, env, route, spa, trailing_slash, hydrate }) {
	set_runtime_env(env);
	const client = create_client({
		target,
		session,
		base: paths.base,
		trailing_slash
	});

	init({ client });
	set_paths(paths);

	if (hydrate) {
		await client._hydrate(hydrate);
	}

	if (route) {
		if (spa) client.goto(location.href, { replaceState: true });
		client._start_router();
	}

	dispatchEvent(new CustomEvent('sveltekit:start'));
}
