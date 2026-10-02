const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=5`, {
  headers: { authorization: auth }
});
const data = await response.json();
if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
console.log(JSON.stringify(data.messages.map(message => ({
  to: message.to,
  status: message.status,
  error_code: message.error_code,
  error_message: message.error_message,
  date_created: message.date_created
}))));
