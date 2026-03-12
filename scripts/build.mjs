import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const target = process.argv[2] ?? 'all';
const root = process.cwd();

async function buildExtension() {
  const outdir = path.join(root, 'dist', 'extension');
  await mkdir(outdir, { recursive: true });

  await build({
    entryPoints: {
      content: path.join(root, 'src', 'extension', 'content.ts')
    },
    outdir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'chrome120'
  });

  await cp(path.join(root, 'src', 'extension', 'manifest.json'), path.join(outdir, 'manifest.json'));
}

async function main() {
  if (target === 'all' || target === 'extension') {
    await buildExtension();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
