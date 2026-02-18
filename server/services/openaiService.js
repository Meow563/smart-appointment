import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT =
  'You are a helpful university student support assistant. Answer clearly, professionally, and concisely.';

const escalationKeywords = ['complaint', 'human', 'issue', 'talk to advisor'];

export function shouldEscalateByKeyword(message = '') {
  const normalized = message.toLowerCase();
  return escalationKeywords.some((keyword) => normalized.includes(keyword));
}

function isLowConfidence(answer = '') {
  const uncertaintyPhrases = [
    'i am not sure',
    'i do not know',
    'cannot help',
    'contact support',
    'unclear',
    'as an ai'
  ];

  const normalized = answer.toLowerCase();
  return uncertaintyPhrases.some((phrase) => normalized.includes(phrase));
}

export function detectTopic(text = '') {
  const normalized = text.toLowerCase();
  if (/admission|apply|enroll|application/.test(normalized)) return 'admission';
  if (/fee|tuition|payment|scholarship/.test(normalized)) return 'fees';
  if (/exam|test|grade|result/.test(normalized)) return 'exams';
  return 'general';
}

export async function generateAIResponse(contextMessages) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMessages.map((message) => ({
        role: message.sender === 'student' ? 'user' : 'assistant',
        content: message.content
      }))
    ]
  });

  const content = completion.choices?.[0]?.message?.content?.trim() ||
    'Thanks for your message. A student advisor will follow up soon.';

  return {
    content,
    lowConfidence: isLowConfidence(content)
  };
}
