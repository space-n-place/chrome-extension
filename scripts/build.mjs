import { build, context } from 'esbuild';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const isWatch = process.argv.includes('--watch');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

function copyFile(srcRel, destRel) {
  const src = path.join(root, srcRel);
  const dest = path.join(distDir, destRel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

async function buildTailwind() {
  console.log('Building Tailwind CSS...');
  const inputCss = path.join(root, 'src/popup/popup-app.css');
  const outputCss = path.join(distDir, 'popup.css');
  
  try {
    const { stdout, stderr } = await execAsync(
      `./node_modules/.bin/tailwindcss --input ${inputCss} --output ${outputCss} --minify`,
      { cwd: root }
    );
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✓ Tailwind CSS built successfully');
  } catch (error) {
    console.error('✗ Error building Tailwind CSS:', error.message);
  }
}

function copyAssets() {
  copyFile('manifest.json', 'manifest.json');
  copyFile('src/popup/popup.html', 'popup.html');
  
  // Копируем иконки если они есть
  const iconsDir = path.join(root, 'public/icons');
  if (fs.existsSync(iconsDir)) {
    const files = fs.readdirSync(iconsDir);
    files.forEach(file => {
      copyFile(`public/icons/${file}`, `icons/${file}`);
    });
  }
}

async function run() {
  cleanDist();

  const entryPoints = [
    path.join(root, 'src/background.ts'),
    path.join(root, 'src/content-script.ts'),
    path.join(root, 'src/popup/popup.tsx')
  ];

  const options = {
    entryPoints,
    outdir: distDir,
    bundle: true,
    sourcemap: true,
    minify: false,
    target: ['chrome114'],
    format: 'esm',
    logLevel: 'info',
    entryNames: '[name]',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js',
    },
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  };

  if (isWatch) {
    const ctx = await context(options);
    await ctx.watch();
    copyAssets();
    await buildTailwind();
    // Simple file watchers for assets
    fs.watch(path.join(root, 'src/popup'), { recursive: true }, async () => {
      copyAssets();
      await buildTailwind();
    });
    fs.watch(path.join(root, 'manifest.json'), () => copyAssets());
    console.log('Watching for changes...');
  } else {
    await build(options);
    copyAssets();
    await buildTailwind();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


