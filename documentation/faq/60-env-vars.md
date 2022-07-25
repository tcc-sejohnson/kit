---
title: How do I use environment variables?
---

Environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` during dev and build. These are available to your app via the [`$env/private`](/docs/modules#$env-private) and [`$env/public`](/docs/modules#$env-public) modules. Environment variables use a [prefix](/docs/configuration#env) to indicate when they are available to the app (buildtime vs. runtime) and whether they should be exposed to the client (public or private).
