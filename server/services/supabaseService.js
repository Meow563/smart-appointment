import { supabaseAdmin } from '../supabaseClient.js';

export async function upsertStudent({ name, phone, platform }) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('phone', phone)
    .eq('platform', platform)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('students')
    .insert({ name: name || 'Student', phone, platform })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateConversation(studentId) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('student_id', studentId)
    .in('status', ['open', 'needs_review'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ student_id: studentId, status: 'open' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function saveMessage({ conversationId, sender, content, topic }) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversationId, sender, content, topic })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchConversationContext(conversationId, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('sender, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse();
}

export async function updateConversationStatus(conversationId, status) {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ status })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function listConversations({ platform, status, fromDate, toDate, search }) {
  let studentIdSet = null;

  if (platform || search) {
    let studentsQuery = supabaseAdmin.from('students').select('id,name,phone,platform');

    if (platform) studentsQuery = studentsQuery.eq('platform', platform);

    if (search) {
      const sanitized = search.replace(/,/g, ' ').trim();
      studentsQuery = studentsQuery.or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    studentIdSet = new Set((students || []).map((student) => student.id));
    if (studentIdSet.size === 0) return [];
  }

  let conversationsQuery = supabaseAdmin
    .from('conversations')
    .select('id,status,created_at,updated_at,student_id')
    .order('updated_at', { ascending: false });

  if (status) conversationsQuery = conversationsQuery.eq('status', status);
  if (fromDate) conversationsQuery = conversationsQuery.gte('created_at', fromDate);
  if (toDate) conversationsQuery = conversationsQuery.lte('created_at', toDate);
  if (studentIdSet) conversationsQuery = conversationsQuery.in('student_id', [...studentIdSet]);

  const { data: conversations, error: conversationsError } = await conversationsQuery;
  if (conversationsError) throw conversationsError;

  if (!conversations?.length) return [];

  const studentIds = [...new Set(conversations.map((conversation) => conversation.student_id))];
  const { data: students, error: studentsError } = await supabaseAdmin
    .from('students')
    .select('id,name,phone,platform')
    .in('id', studentIds);

  if (studentsError) throw studentsError;

  const studentMap = new Map((students || []).map((student) => [student.id, student]));

  return conversations.map((conversation) => ({
    id: conversation.id,
    status: conversation.status,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    students: studentMap.get(conversation.student_id) || null
  }));
}

export async function getConversationById(id) {
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('conversations')
    .select('id,status,created_at,updated_at,student_id')
    .eq('id', id)
    .single();

  if (conversationError) throw conversationError;

  const [{ data: student, error: studentError }, { data: messages, error: messagesError }] = await Promise.all([
    supabaseAdmin.from('students').select('*').eq('id', conversation.student_id).single(),
    supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
  ]);

  if (studentError) throw studentError;
  if (messagesError) throw messagesError;

  return {
    ...conversation,
    students: student,
    messages: messages || []
  };
}

export async function getDashboardAnalytics() {
  const { data: perDay, error: perDayError } = await supabaseAdmin.rpc('queries_per_day');
  if (perDayError) throw perDayError;

  const { data: topTopic, error: topicError } = await supabaseAdmin.rpc('most_asked_topic');
  if (topicError) throw topicError;

  return { perDay: perDay || [], topTopic: topTopic || [] };
}
