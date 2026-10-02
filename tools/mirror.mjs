import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://getwificode.com';
const routes = [
  'vsl1', 'oto1', 'oto2', 'oto3', 'oto4', 'oto5', 'oto6', 'oto7',
  'terms', 'pp', 'refund', 'compliance', 'earnings', 'thankyou'
];

async function fetchPage(route) {
  const response = await fetch(`${origin}/${route}`, {
    headers: { 'user-agent': 'Mozilla/5.0 WifiCode authorized mirror' }
  });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  let html = await response.text();

  // This helper is the only same-origin relative asset in the hosted output.
  html = html.replaceAll(
    'src="/cdn-cgi/',
    `src="${origin}/cdn-cgi/`
  );

  const folder = join(process.cwd(), route);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'index.html'), html, 'utf8');
  return { route, bytes: Buffer.byteLength(html) };
}

const results = [];
for (const route of routes) results.push(await fetchPage(route));

// Make the primary offer available at both / and /vsl1.
const primary = await fetch(`${origin}/vsl1`).then(response => response.text());
await writeFile(join(process.cwd(), 'index.html'), primary.replaceAll('src="/cdn-cgi/', `src="${origin}/cdn-cgi/`), 'utf8');
await writeFile(
  join(process.cwd(), 'mirror-manifest.json'),
  JSON.stringify({ source: origin, generatedAt: new Date().toISOString(), pages: results }, null, 2),
  'utf8'
);

console.table(results);
