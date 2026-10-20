import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'https://www.previewmake.com';
const sourcePath = '/watch1761931094420';
const destination = new URL('../webinar/index.html', import.meta.url);

const response = await fetch(`${origin}${sourcePath}`, {
  headers: {
    'user-agent': 'Mozilla/5.0 (compatible; WifiCodeMirror/1.0)',
    accept: 'text/html,application/xhtml+xml',
  },
});

if (!response.ok) {
  throw new Error(`Unable to mirror replacement lander: ${response.status} ${response.statusText}`);
}

let html = await response.text();

// Keep source-hosted assets and links working when this HTML is served at /webinar.
html = html
  .replace(/\b(src|href|action|poster)=(['"])\/(?!\/)/gi, `$1=$2${origin}/`)
  .replace(/\bsrcset=(['"])([^'"]+)\1/gi, (match, quote, value) => {
    const rewritten = value.replace(/(^|,\s*)\/(?!\/)/g, `$1${origin}/`);
    return `srcset=${quote}${rewritten}${quote}`;
  })
  .replace(/url\((['"]?)\/(?!\/)/gi, `url($1${origin}/`);

await mkdir(new URL('../webinar/', import.meta.url), { recursive: true });
await writeFile(destination, html, 'utf8');

console.log(`Mirrored ${origin}${sourcePath} to webinar/index.html (${html.length} characters).`);
