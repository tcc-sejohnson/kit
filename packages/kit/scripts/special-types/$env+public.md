Similar to [`$env/private`](https://kit.svelte.dev/docs/modules#$app-env-private), except that it only includes environment variables that begin with [public prefixes](https://kit.svelte.dev/docs/configuration#env) (which default to `BT_PUB_` and `RT_PUB_` for buildtime and runtime values, respectively), and can therefore safely be exposed to client-side code.

Values are replaced statically at build time.

```ts
// matches buildtime public prefix, statically replaced at buildtime
import { BT_PUB_API_KEY } from '$env/private';

// matches runtime public prefix, not statically replaced at buildtime
import { RT_PUB_API_KEY } from '$env/private';
```
