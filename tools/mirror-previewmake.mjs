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

const enrollmentUrl = 'https://makewellness.com/630BA81D95/Enrollment/Review';
const enrollmentCtas = `
<style>
  .wificode-enrollment-cta { box-sizing: border-box; width: 100%; padding: 42px 20px; text-align: center; background: linear-gradient(135deg, #061d44, #123c78); border-top: 3px solid #30d158; border-bottom: 3px solid #30d158; }
  .wificode-enrollment-cta h2 { margin: 0 0 12px; color: #fff; font: 800 clamp(25px, 4vw, 42px)/1.15 Arial, sans-serif; }
  .wificode-enrollment-cta p { margin: 0 0 22px; color: #e8f1ff; font: 600 clamp(16px, 2vw, 20px)/1.45 Arial, sans-serif; }
  .wificode-enrollment-button { display: inline-block; padding: 19px 38px; color: #fff !important; background: #20b94b; border-radius: 9px; box-shadow: 0 7px 0 #087829; font: 800 clamp(19px, 3vw, 28px)/1.15 Arial, sans-serif; text-decoration: none !important; text-transform: uppercase; transition: transform .15s ease, box-shadow .15s ease; }
  .wificode-enrollment-button:hover { transform: translateY(2px); box-shadow: 0 5px 0 #087829; background: #25c853; }
</style>
<section class="wificode-enrollment-cta" id="wificode-enrollment-bottom" aria-label="Enroll with MAKE">
  <h2>Ready To Get Started?</h2>
  <p>Click below to complete your enrollment with MAKE.</p>
  <a class="wificode-enrollment-button" href="${enrollmentUrl}" target="_blank" rel="noopener noreferrer">Enroll With MAKE Now</a>
</section>
<script>
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      var bottom = document.getElementById('wificode-enrollment-bottom');
      if (!bottom || document.getElementById('wificode-enrollment-middle')) return;
      var pageMiddle = document.documentElement.scrollHeight / 2;
      var sections = Array.from(document.querySelectorAll('body > .container, body > section, .container.fullContainer')).filter(function (section) {
        var style = window.getComputedStyle(section);
        return section !== bottom && style.display !== 'none' && style.visibility !== 'hidden' && section.offsetHeight > 80;
      });
      var anchor = sections.find(function (section) { return section.offsetTop >= pageMiddle; }) || bottom;
      var middle = bottom.cloneNode(true);
      middle.id = 'wificode-enrollment-middle';
      anchor.parentNode.insertBefore(middle, anchor);
    }, 700);
  });
</script>`;

html = html.replace(/<\/body>/i, `${enrollmentCtas}</body>`);

await mkdir(new URL('../webinar/', import.meta.url), { recursive: true });
await writeFile(destination, html, 'utf8');

console.log(`Mirrored ${origin}${sourcePath} to webinar/index.html (${html.length} characters).`);
