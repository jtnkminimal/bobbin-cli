import { createRequire } from "node:module"

// Resolves relative to dist/cli.js after bundling, src/ during development —
// package.json sits one level up in both cases.
const require = createRequire(import.meta.url)

export const VERSION: string = require("../package.json").version
