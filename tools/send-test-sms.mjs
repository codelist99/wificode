const [to] = process.argv.slice(2);
if (!/^\+[1-9]\d{7,14}$/.test(to || '')) throw new Error('Pass the recipient in E.164 format');

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM;
if (!sid || !token || !from) throw new Error('Twilio is not configured');

const form = new URLSearchParams({
  To: to,
  From: from,
  Body: 'WifiCode SMS integration test — your Twilio connection is working.'
});
const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
  method: 'POST',
  headers: {
    authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
    'content-type': 'application/x-www-form-urlencoded'
  },
  body: form
});
const data = await response.json();
if (!response.ok) throw new Error(`Twilio send failed (${response.status}): ${data.message || 'Unknown error'}`);
console.log(JSON.stringify({ sid: data.sid, status: data.status, to: data.to, from: data.from }));
