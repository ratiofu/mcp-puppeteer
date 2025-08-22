import { build, context } from 'esbuild';

const isWatch = process.argv.includes('--watch');

const config = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: 'dist/index.js',
    external: [
        'puppeteer-core',
        '@modelcontextprotocol/sdk',
        'zod'
    ],
    logLevel: 'info',
    minify: !isWatch // Don't minify in watch mode for faster builds
};

if (isWatch) {
    const ctx = await context(config);
    await ctx.watch();
    console.log('Watching for changes...');
} else {
    await build(config);
}