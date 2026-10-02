const endpoint = () => process.env.AUTHORIZE_NET_ENV === 'sandbox'
  ? 'https://apitest.authorize.net/xml/v1/request.api'
  : 'https://api.authorize.net/xml/v1/request.api';
const authentication = () => ({ name: process.env.AUTHORIZE_NET_API_LOGIN_ID, transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY });

async function request(payload) {
  const response = await fetch(endpoint(), { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
  const data = JSON.parse((await response.text()).replace(/^\uFEFF/,''));
  if (!response.ok || data.messages?.resultCode !== 'Ok') throw new Error(data.messages?.message?.[0]?.text || `Gateway HTTP ${response.status}`);
  return data;
}

function result(data) {
  const tx = data.transactionResponse;
  if (!tx || tx.responseCode !== '1') {
    const message = tx?.errors?.[0]?.errorText || tx?.messages?.[0]?.description || data.messages?.message?.[0]?.text || 'Payment declined';
    const error = new Error(message); error.code = tx?.responseCode || 'declined'; throw error;
  }
  const profile = data.profileResponse;
  const paymentIds = profile?.customerPaymentProfileIdList?.numericString;
  return { transactionId: tx.transId, authCode: tx.authCode, responseCode: tx.responseCode,
    customerProfileId: profile?.customerProfileId || '', paymentProfileId: Array.isArray(paymentIds) ? paymentIds[0] : paymentIds || '' };
}

export async function chargeOpaque({ product, opaqueData, customer, invoice }) {
  const data = await request({ createTransactionRequest: { merchantAuthentication:authentication(), refId:String(invoice).slice(-20),
    transactionRequest: { transactionType:'authCaptureTransaction', amount:product.amount.toFixed(2), currencyCode:'USD',
      payment:{ opaqueData:{ dataDescriptor:opaqueData.dataDescriptor, dataValue:opaqueData.dataValue } },
      profile:{ createProfile:true },
      order:{ invoiceNumber:String(invoice).slice(0,20), description:product.name.slice(0,255) },
      customer:{ email:customer.email },
      billTo:{ firstName:customer.first_name, lastName:customer.last_name, address:customer.address, city:customer.city,
        state:customer.state, zip:customer.zip, country:customer.country || 'US' }
    }
  }});
  return result(data);
}

export async function chargeProfile({ product, customerProfileId, paymentProfileId, invoice }) {
  const data = await request({ createTransactionRequest: { merchantAuthentication:authentication(), refId:String(invoice).slice(-20),
    transactionRequest:{ transactionType:'authCaptureTransaction', amount:product.amount.toFixed(2), currencyCode:'USD',
      profile:{ customerProfileId:String(customerProfileId), paymentProfile:{ paymentProfileId:String(paymentProfileId) } },
      order:{ invoiceNumber:String(invoice).slice(0,20), description:product.name.slice(0,255) }
    }
  }});
  return result(data);
}
