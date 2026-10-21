import { writeFile } from 'node:fs/promises';

const source = 'https://scripts.converteai.net/e9cd97bc-7bc8-4a23-bb2f-224a56a84d6b/players/6aacca50be3ce1c9800ece41/v4/player.js';
const response = await fetch(source, { headers: { 'user-agent': 'Mozilla/5.0 WifiCode player mirror' } });
if (!response.ok) throw new Error(`Unable to load VTurb player: ${response.status}`);

let script = await response.text();
script = script
  .replace('play:"Continuar assistindo?"', 'play:"Continue watching?"')
  .replace(/replay:"Assistir do in[^"]*"/, 'replay:"Watch from the beginning?"')
  .replace(/title:"Voc[^"]*"/, 'title:"You\'ve already started watching this video"');

for (const expected of ['Continue watching?', 'Watch from the beginning?', "You've already started watching this video"]) {
  if (!script.includes(expected)) throw new Error(`English player copy was not applied: ${expected}`);
}

await writeFile(new URL('../public/vturb-player.js', import.meta.url), script, 'utf8');
console.log(`Saved English VTurb player (${script.length} characters).`);
