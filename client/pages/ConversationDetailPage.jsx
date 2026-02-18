import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

export function ConversationDetailPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);

  async function load() {
    const response = await api.get(`/admin/conversations/${id}`);
    setConversation(response.data);
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new?.conversation_id === id || payload.old?.conversation_id === id) {
            load();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function markResolved() {
    await api.patch(`/admin/conversations/${id}/resolve`, {});
    load();
  }

  if (!conversation) return <div>Loading conversation...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <h2 className="font-semibold">{conversation.students.name}</h2>
          <p className="text-slate-500">{conversation.students.phone} • {conversation.students.platform}</p>
          <p className="text-sm capitalize">Status: {conversation.status.replace('_', ' ')}</p>
        </div>
        <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={markResolved}>Mark Resolved</button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        {conversation.messages.map((message) => (
          <div key={message.id} className={`p-3 rounded max-w-3xl ${message.sender === 'student' ? 'bg-blue-50' : 'bg-slate-100 ml-auto'}`}>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{message.sender}</p>
            <p>{message.content}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(message.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
