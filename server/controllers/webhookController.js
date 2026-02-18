import {
  fetchConversationContext,
  getOrCreateConversation,
  saveMessage,
  updateConversationStatus,
  upsertStudent
} from '../services/supabaseService.js';
import {
  detectTopic,
  generateAIResponse,
  shouldEscalateByKeyword
} from '../services/openaiService.js';
import { sendFacebookMessage, sendWhatsAppMessage } from '../services/messagingService.js';

function verificationHandler(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function processInboundMessage({ platform, studentPayload, messageText, responder }) {
  const normalizedMessage = (messageText || '').trim();
  if (!normalizedMessage) return;

  const student = await upsertStudent({
    name: studentPayload.name,
    phone: studentPayload.identifier,
    platform
  });

  const conversation = await getOrCreateConversation(student.id);
  const topic = detectTopic(normalizedMessage);

  await saveMessage({
    conversationId: conversation.id,
    sender: 'student',
    content: normalizedMessage,
    topic
  });

  const context = await fetchConversationContext(conversation.id, 10);
  const ai = await generateAIResponse(context);

  await saveMessage({
    conversationId: conversation.id,
    sender: 'bot',
    content: ai.content,
    topic
  });

  const needsReview = shouldEscalateByKeyword(normalizedMessage) || ai.lowConfidence;
  if (needsReview) {
    await updateConversationStatus(conversation.id, 'needs_review');
    console.warn(`[ALERT] Conversation ${conversation.id} marked needs_review`);
  }

  await responder(ai.content);
}

export const whatsappVerification = verificationHandler;
export const facebookVerification = verificationHandler;

export async function whatsappWebhook(req, res, next) {
  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const changeWrapper of changes) {
        const change = changeWrapper?.value;
        const messages = change?.messages || [];

        for (const message of messages) {
          if (message?.type !== 'text') continue;

          await processInboundMessage({
            platform: 'whatsapp',
            studentPayload: {
              name: change?.contacts?.[0]?.profile?.name,
              identifier: message.from
            },
            messageText: message?.text?.body,
            responder: (response) => sendWhatsAppMessage(message.from, response)
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export async function facebookWebhook(req, res, next) {
  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const events = entry?.messaging || [];

      for (const event of events) {
        const text = event?.message?.text;
        const senderId = event?.sender?.id;
        if (!text || !senderId) continue;

        await processInboundMessage({
          platform: 'facebook',
          studentPayload: { name: `FB-${senderId}`, identifier: senderId },
          messageText: text,
          responder: (response) => sendFacebookMessage(senderId, response)
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
