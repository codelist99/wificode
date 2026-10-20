const endpoint=()=>process.env.NMI_ENV==='sandbox'?'https://sandbox.nmi.com/api/transact.php':'https://secure.nmi.com/api/transact.php';

async function request(fields){
  if(!process.env.NMI_PRIVATE_KEY)throw new Error('NMI is not configured');
  // This processor rejects fully disabling duplicate checks. A one-second
  // window prevents double-clicks without blocking sequential funnel upsells.
  const payload=new URLSearchParams({security_key:process.env.NMI_PRIVATE_KEY,...fields,dup_seconds:'1'});
  const response=await fetch(endpoint(),{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:payload});
  const data=Object.fromEntries(new URLSearchParams(await response.text()));
  if(!response.ok||data.response!=='1'){
    const error=new Error(data.responsetext||`Gateway HTTP ${response.status}`);
    error.code=data.response_code||data.response||'declined';
    throw error;
  }
  return {transactionId:data.transactionid||'',authCode:data.authcode||'',responseCode:data.response_code||data.response,
    customerVaultId:data.customer_vault_id||'',raw:data};
}

const common=({product,invoice})=>({type:'sale',amount:product.amount.toFixed(2),currency:product.currency||'USD',orderid:String(invoice).slice(0,30),order_description:product.name.slice(0,255)});

export function chargeToken({product,paymentToken,customer,invoice}){
  return request({...common({product,invoice}),payment_token:paymentToken,customer_vault:'add_customer',firstname:customer.first_name,lastname:customer.last_name,
    email:customer.email,phone:customer.phone,address1:customer.address,city:customer.city,state:customer.state,zip:customer.zip,country:customer.country||'US'});
}

export function chargeVault({product,customerVaultId,initialTransactionId,invoice}){
  return request({...common({product,invoice}),customer_vault_id:String(customerVaultId),initiated_by:'customer',stored_credential_indicator:'used',
    initial_transaction_id:String(initialTransactionId||'')});
}
