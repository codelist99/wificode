const endpoint = 'https://api.authorize.net/xml/v1/request.api';
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    authenticateTestRequest: {
      merchantAuthentication: {
        name: process.env.AUTHORIZE_NET_API_LOGIN_ID,
        transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY
      }
    }
  })
});
const data = JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
console.log(JSON.stringify({
  httpStatus: response.status,
  resultCode: data.messages?.resultCode,
  code: data.messages?.message?.[0]?.code,
  message: data.messages?.message?.[0]?.text
}));
