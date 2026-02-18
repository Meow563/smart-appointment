import axios from 'axios';

export async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

export async function sendFacebookMessage(recipientId, message) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${token}`;

  await axios.post(url, {
    recipient: { id: recipientId },
    message: { text: message }
  });
}
