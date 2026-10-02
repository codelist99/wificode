export const products = Object.freeze({
  front: { name: 'WifiCode', amount: 47, next: '/oto1' },
  oto1: { name: 'WifiCode Unlimited', amount: 197, next: '/oto2' },
  oto1_downsell: { name: 'WifiCode Unlimited — Discount', amount: 97, next: '/oto2' },
  oto2: { name: 'WifiCode Done-For-You', amount: 197, next: '/oto3' },
  oto2_downsell: { name: 'WifiCode Done-For-You — Discount', amount: 97, next: '/oto3' },
  oto3: { name: 'WifiCode Cyber Security', amount: 127, next: '/oto4' },
  oto3_downsell: { name: 'WifiCode Cyber Security — Discount', amount: 97, next: '/oto4' },
  oto4: { name: 'WifiCode Instant Income', amount: 97, next: '/oto5' },
  oto4_downsell: { name: 'WifiCode Instant Income — Discount', amount: 67, next: '/oto5' },
  oto5: { name: 'WifiCode Autopilot Earnings', amount: 147, next: '/oto6' },
  oto5_downsell: { name: 'WifiCode Autopilot Earnings — Discount', amount: 47, next: '/oto6' },
  oto6: { name: 'WifiCode High Ticket Payouts', amount: 97, next: '/oto7' },
  oto6_downsell: { name: 'WifiCode High Ticket Payouts — Discount', amount: 47, next: '/oto7' },
  oto7: { name: 'WifiCode License Rights', amount: 167, next: '/thankyou' },
  oto7_downsell: { name: 'WifiCode License Rights — Discount', amount: 67, next: '/thankyou' }
});

export function getProduct(id) {
  const product = products[id];
  if (!product) throw new Error('Unknown product');
  return { id, ...product, currency: 'USD' };
}
