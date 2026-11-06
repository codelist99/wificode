const baseUrl='https://zendashboard.com/api';

async function request(path){
  if(!process.env.ZEN_ACCESS_TOKEN)throw new Error('ZEN_ACCESS_TOKEN is not configured');
  const response=await fetch(`${baseUrl}${path}`,{headers:{authorization:`Bearer ${process.env.ZEN_ACCESS_TOKEN}`,accept:'application/json'}});
  const text=await response.text();
  let data;
  try{data=text?JSON.parse(text):{}}catch{throw new Error(`Zen returned an invalid response (${response.status})`)}
  if(!response.ok)throw new Error(data.message||data.error||`Zen HTTP ${response.status}`);
  return data;
}

export async function getAllChargebacks(){
  const items=[];
  for(let page=1;;page++){
    const data=await request(`/reporting/chargebacks?per-page=50&page=${page}`);
    items.push(...(Array.isArray(data.items)?data.items:[]));
    const pages=Number(data._meta?.pageCount||1);
    if(page>=pages)break;
  }
  const detailed=[];
  for(const item of new Map(items.map(item=>[String(item.id),item])).values())detailed.push(await request(`/reporting/chargeback/${encodeURIComponent(item.id)}`));
  return detailed;
}

// `posted` and `transaction.date` describe the original card transaction.
// `receivedDate` is the date the dispute reached the merchant and therefore
// the accounting period in which the chargeback belongs.
export function chargebackOccurredAt(record){
  return record?.date?.receivedDate||record?.date?.disputed||record?.date?.loaded||record?.date?.posted||new Date().toISOString();
}
