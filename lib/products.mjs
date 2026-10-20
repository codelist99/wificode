export const products = Object.freeze({
  // Temporary live-gateway test prices. Each amount is deliberately unique so
  // every funnel step can be identified and cannot look like a duplicate sale.
  front: { name: 'WifiCode', amount: 1.01, next: '/oto1' },
  oto1: { name: 'WifiCode Unlimited', amount: 1.19, next: '/oto2' },
  oto1_downsell: { name: 'WifiCode Unlimited — Discount', amount: 1.09, next: '/oto2' },
  oto2: { name: 'WifiCode Done-For-You', amount: 1.29, next: '/oto3' },
  oto2_downsell: { name: 'WifiCode Done-For-You — Discount', amount: 1.11, next: '/oto3' },
  oto3: { name: 'WifiCode Cyber Security', amount: 1.39, next: '/oto4' },
  oto3_downsell: { name: 'WifiCode Cyber Security — Discount', amount: 1.13, next: '/oto4' },
  oto4: { name: 'WifiCode Instant Income', amount: 1.49, next: '/oto5' },
  oto4_downsell: { name: 'WifiCode Instant Income — Discount', amount: 1.15, next: '/oto5' },
  oto5: { name: 'WifiCode Autopilot Earnings', amount: 1.59, next: '/oto6' },
  oto5_downsell: { name: 'WifiCode Autopilot Earnings — Discount', amount: 1.17, next: '/oto6' },
  oto6: { name: 'WifiCode High Ticket Payouts', amount: 1.69, next: '/oto7' },
  oto6_downsell: { name: 'WifiCode High Ticket Payouts — Discount', amount: 1.21, next: '/oto7' },
  oto7: { name: 'WifiCode License Rights', amount: 1.79, next: '/thankyou' },
  oto7_downsell: { name: 'WifiCode License Rights — Discount', amount: 1.23, next: '/thankyou' }
});

export function getProduct(id) {
  const product = products[id];
  if (!product) throw new Error('Unknown product');
  return { id, ...product, currency: 'USD' };
}
