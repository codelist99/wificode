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

export async function getTransactionDetails(transactionId) {
  const data = await request({ getTransactionDetailsRequest: {
    merchantAuthentication:authentication(), transId:String(transactionId)
  }});
  const tx=data.transaction || {};
  return {
    transactionId:String(tx.transId || transactionId),
    status:String(tx.transactionStatus || ''),
    amount:Number(tx.settleAmount ?? tx.authAmount ?? 0),
    cardLast4:String(tx.payment?.creditCard?.cardNumber || '').replace(/\D/g,'').slice(-4)
  };
}

export async function refundOrVoid({ transactionId, amount, invoice }) {
  const details=await getTransactionDetails(transactionId);
  const settled=new Set(['settledSuccessfully','refundSettledSuccessfully']);
  const voidable=new Set(['authorizedPendingCapture','capturedPendingSettlement','FDSPendingReview','FDSAuthorizedPendingReview','underReview']);
  let action,transactionRequest;
  if(settled.has(details.status)){
    if(!details.cardLast4)throw new Error('Authorize.Net did not return the card details required for this refund');
    action='refund';
    transactionRequest={transactionType:'refundTransaction',amount:Number(amount).toFixed(2),currencyCode:'USD',
      payment:{creditCard:{cardNumber:details.cardLast4,expirationDate:'XXXX'}},refTransId:String(transactionId)};
  }else if(voidable.has(details.status)){
    if(details.amount&&Number(amount)<details.amount-0.005)throw new Error('An unsettled transaction can only be voided in full; enter the full remaining amount');
    action='void';
    transactionRequest={transactionType:'voidTransaction',refTransId:String(transactionId)};
  }else{
    throw new Error(`Transaction cannot be refunded or voided while its status is ${details.status || 'unknown'}`);
  }
  const data=await request({createTransactionRequest:{merchantAuthentication:authentication(),refId:String(invoice).slice(-20),transactionRequest}});
  const payment=result(data);
  return {...payment,action,originalStatus:details.status};
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

export async function createProfileFromTransaction(transactionId) {
  const data = await request({ createCustomerProfileFromTransactionRequest: {
    merchantAuthentication:authentication(), transId:String(transactionId)
  }});
  const paymentIds = data.customerPaymentProfileIdList;
  return { customerProfileId:String(data.customerProfileId || ''),
    paymentProfileId:String(Array.isArray(paymentIds) ? paymentIds[0] : paymentIds?.numericString?.[0] || paymentIds?.numericString || '') };
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
  const payment=result(data);
  if(!payment.customerProfileId||!payment.paymentProfileId){try{Object.assign(payment,await createProfileFromTransaction(payment.transactionId))}catch(error){payment.profileError=error.message}}
  return payment;
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
