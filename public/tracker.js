(() => {
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
