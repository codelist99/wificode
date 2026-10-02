const endpoint = process.env.AUTHORIZE_NET_ENV === 'production'
  ? 'https://api.authorize.net/xml/v1/request.api'
  : 'https://apitest.authorize.net/xml/v1/request.api';
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    getMerchantDetailsRequest: {
      merchantAuthentication: {
        name: process.env.AUTHORIZE_NET_API_LOGIN_ID,
        transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY
      }
    }
  })
});
const text = (await response.text()).replace(/^\uFEFF/, '');
const data = JSON.parse(text);
if (!response.ok || data.messages?.resultCode !== 'Ok') {
  throw new Error(`Authorize.Net validation failed: ${data.messages?.message?.[0]?.text || `HTTP ${response.status}`}`);
}
const expected = process.env.AUTHORIZE_NET_PUBLIC_CLIENT_KEY;
if (expected && data.publicClientKey !== expected) throw new Error('The supplied Public Client Key does not match this merchant account');
console.log(JSON.stringify({ connected: true, environment: process.env.AUTHORIZE_NET_ENV, merchantName: data.merchantName, testMode: data.isTestMode, currencies: data.currencies, cardTypes: data.cardTypes }));
