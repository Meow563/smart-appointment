import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [filters, setFilters] = useState({ platform: '', status: '', search: '', fromDate: '', toDate: '' });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.append(key, value));
    return params.toString();
  }, [filters]);

  useEffect(() => {
    api.get(`/admin/conversations?${query}`).then((response) => setConversations(response.data));
  }, [query]);

  async function exportCsv() {
    const response = await api.get(`/admin/conversations/export?${query}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conversations.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow grid md:grid-cols-6 gap-2">
        <input placeholder="Search name/phone" className="border rounded px-2 py-1" onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <select className="border rounded px-2 py-1" onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
          <option value="">All Platforms</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
        </select>
        <select className="border rounded px-2 py-1" onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="needs_review">Needs Review</option>
          <option value="resolved">Resolved</option>
        </select>
        <input type="date" className="border rounded px-2 py-1" onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))} />
        <input type="date" className="border rounded px-2 py-1" onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))} />
        <button className="bg-slate-800 text-white rounded px-2 py-1" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Platform</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Updated</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr key={conversation.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{conversation.students?.name}</div>
                  <div className="text-slate-500">{conversation.students?.phone}</div>
                </td>
                <td className="p-3 capitalize">{conversation.students?.platform}</td>
                <td className="p-3 capitalize">{conversation.status.replace('_', ' ')}</td>
                <td className="p-3">{new Date(conversation.updated_at).toLocaleString()}</td>
                <td className="p-3">
                  <Link className="text-blue-600" to={`/conversations/${conversation.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
