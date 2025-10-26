import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/functions/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'lib/index.js',
  external: ['firebase-admin', 'firebase-functions'],
  sourcemap: true,
  packages: 'external', // Don't bundle node_modules
};

if (watch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  await esbuild.build(config);
  console.log('✅ Backend built successfully');
}
