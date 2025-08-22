import { build } from 'esbuild';

await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: 'dist/index.js',
    minify: true,
    external: [
        'puppeteer-core',
        '@modelcontextprotocol/sdk',
        'zod'
    ],
    logLevel: 'info'
});