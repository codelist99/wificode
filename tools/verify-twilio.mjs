const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
if (!sid || !token) throw new Error('Twilio credentials are missing');

const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
  headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` }
});
const data = await response.json();
if (!response.ok) throw new Error(`Twilio authentication failed (${response.status}): ${data.message || 'Unknown error'}`);
console.log(`Twilio connected: ${data.status} ${data.type} account`);
