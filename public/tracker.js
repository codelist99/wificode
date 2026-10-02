(() => {
  if (/^\/thankyou\/?$/.test(location.pathname)) {
    const callout = document.createElement('section');
    callout.className = 'wc-call-now';
    callout.innerHTML = '<div><strong>YOUR ORDER IS COMPLETE</strong><h2>Call In Now To Get Started</h2><a href="tel:+18582571162">(858) 257-1162</a><p>Tap the number or call now so we can help you get started.</p></div>';
    const style = document.createElement('style');
    style.textContent = '.wc-call-now{position:relative;z-index:99999;background:linear-gradient(135deg,#07152f,#0b4db8);color:#fff;text-align:center;padding:42px 18px;border-bottom:8px solid #ffd43b;box-shadow:0 10px 35px #0005}.wc-call-now div{max-width:900px;margin:auto}.wc-call-now strong{display:inline-block;background:#ffd43b;color:#111827;padding:8px 16px;border-radius:999px;font:800 15px/1.2 Arial,sans-serif;letter-spacing:.08em}.wc-call-now h2{margin:18px 0 8px;font:900 clamp(30px,5vw,58px)/1.05 Arial,sans-serif;text-transform:uppercase}.wc-call-now a{display:inline-block;margin:10px 0;padding:18px 30px;border-radius:14px;background:#22c55e;color:#fff!important;text-decoration:none;font:900 clamp(32px,6vw,68px)/1 Arial,sans-serif;box-shadow:0 8px 0 #147a38,0 14px 30px #0005}.wc-call-now a:hover{transform:translateY(-2px)}.wc-call-now p{margin:22px 0 0;font:700 20px/1.4 Arial,sans-serif}@media(max-width:600px){.wc-call-now{padding:28px 12px}.wc-call-now a{padding:16px 14px;width:100%}}';
    document.head.appendChild(style);
    document.body.prepend(callout);
    document.querySelectorAll('a[href*="perpetualincome365.convertri.com/7figure-everwebinar-registration"]').forEach(link=>{link.href='/webinar'});
  }
  const params = new URLSearchParams(location.search);
  const attribution = Object.fromEntries(['aid','tid','utm_source','utm_campaign'].map(key => [key, params.get(key) || localStorage.getItem(`wc_${key}`) || '']));
  Object.entries(attribution).forEach(([key,value]) => value && localStorage.setItem(`wc_${key}`, value));
  const send = (url, data) => fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(data), keepalive:true }).catch(()=>{});
  send('/api/events', { type:'page_view', page:location.pathname, ...attribution });
  document.addEventListener('submit', event => {
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const email = data.email || data.Email || form.querySelector('input[type=email]')?.value;
    const phone = data.phone || data.Phone || form.querySelector('input[type=tel]')?.value;
    if (!email && !phone) return;
    send('/api/leads', { ...data, email, phone, email_consent:Boolean(data.email_consent || form.querySelector('[name*=email_consent]:checked')),
      sms_consent:Boolean(data.sms_consent || form.querySelector('[name*=sms_consent]:checked')), landing_page:location.pathname, ...attribution });
  }, true);
  document.addEventListener('click', event => {
    const noThanks = event.target.closest('button');
    const currentOto = location.pathname.match(/^\/oto([1-7])\/?$/);
    if (noThanks && currentOto && noThanks.textContent.trim().toUpperCase().startsWith('NO THANKS')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const number = Number(currentOto[1]);
      location.href = number < 7 ? `/oto${number + 1}` : '/thankyou';
      return;
    }
    const link = event.target.closest('a[href*="jvzoo.com"],a[href*="/b/"]');
    if (!link) return;
    send('/api/events', { type:'checkout_click', page:location.pathname, product_id:link.href, ...attribution });
    const oto = location.pathname.match(/^\/oto([1-7])\/?$/);
    if (!oto) {
      event.preventDefault();
      location.href = '/checkout?product=front';
      return;
    }
    event.preventDefault();
    const discounted = new URL(link.href, location.href).searchParams.has('coupon');
    const product = `oto${oto[1]}${discounted ? '_downsell' : ''}`;
    const label = link.textContent;
    link.style.pointerEvents = 'none';
    link.textContent = 'Processing…';
    fetch('/api/purchase', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({product}) })
      .then(async response => { const data=await response.json(); if(!response.ok)throw Error(data.error||'Purchase failed'); location.href=data.next; })
      .catch(error => { link.style.pointerEvents=''; link.textContent=label; alert(error.message); });
  }, true);
})();
