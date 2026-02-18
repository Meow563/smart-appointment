import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';

export function DashboardPage() {
  const [data, setData] = useState({ perDay: [], topTopic: [] });

  useEffect(() => {
    api.get('/admin/dashboard').then((response) => setData(response.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Queries per Day</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Most Asked Topics</h2>
          <ul className="space-y-2">
            {data.topTopic.map((item) => (
              <li key={item.topic} className="flex justify-between border-b pb-1">
                <span className="capitalize">{item.topic}</span>
                <span className="font-semibold">{item.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
