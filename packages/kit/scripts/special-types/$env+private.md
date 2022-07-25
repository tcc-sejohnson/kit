Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. This module cannot be imported into client-side code. The values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination. Only environment variables whose names begin with [private prefixes](https://kit.svelte.dev/docs/configuration#env) (which default to `BT_PRIV_` and `RT_PRIV_` for buildtime and runtime values, respectively) are included.

```ts
// matches buildtime private prefix, statically replaced at buildtime
import { BT_PRIV_API_KEY } from '$env/private';

// matches runtime private prefix, not statically replaced at buildtime
import { RT_PRIV_API_KEY } from '$env/private';
```
