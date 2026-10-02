const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const headers = { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` };

const servicesResponse = await fetch('https://messaging.twilio.com/v1/Services?PageSize=50', { headers });
const servicesData = await servicesResponse.json();
if (!servicesResponse.ok) throw new Error(servicesData.message || `Services HTTP ${servicesResponse.status}`);
const services = servicesData.services || [];

for (const service of services) {
  const sendersResponse = await fetch(`https://messaging.twilio.com/v1/Services/${service.sid}/PhoneNumbers?PageSize=50`, { headers });
  const sendersData = await sendersResponse.json();
  const response = await fetch(`https://messaging.twilio.com/v1/Services/${service.sid}/Compliance/Usa2p`, { headers });
  const data = await response.json();
  console.log(JSON.stringify({
    service: service.friendly_name,
    service_sid: service.sid,
    senders: (sendersData.phone_numbers || []).map(sender => ({ sid: sender.sid, phone_number: sender.phone_number })),
    http_status: response.status,
    campaigns: (data.us_app_to_person || []).map(campaign => ({
      campaign_status: campaign.campaign_status,
      campaign_id: campaign.campaign_id,
      failure_reason: campaign.failure_reason
    })),
    message: response.ok ? undefined : data.message
  }));
}
