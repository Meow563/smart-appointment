import { Parser } from 'json2csv';
import {
  getConversationById,
  getDashboardAnalytics,
  listConversations,
  updateConversationStatus
} from '../services/supabaseService.js';

export async function getDashboard(req, res, next) {
  try {
    const analytics = await getDashboardAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getConversations(req, res, next) {
  try {
    const conversations = await listConversations(req.query);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await getConversationById(req.params.id);
    res.json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function resolveConversation(req, res, next) {
  try {
    await updateConversationStatus(req.params.id, 'resolved');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function exportConversations(req, res, next) {
  try {
    const data = await listConversations(req.query);
    const flattened = data.map((row) => ({
      id: row.id,
      status: row.status,
      student_name: row.students?.name,
      student_phone: row.students?.phone,
      platform: row.students?.platform,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const parser = new Parser();
    const csv = parser.parse(flattened);
    res.header('Content-Type', 'text/csv');
    res.attachment('conversations.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
