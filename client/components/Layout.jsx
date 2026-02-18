import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export function Layout() {
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl">Student Helpdesk Admin</h1>
          <nav className="flex gap-4 items-center">
            <Link to="/" className="text-sm hover:text-blue-600">Dashboard</Link>
            <Link to="/conversations" className="text-sm hover:text-blue-600">Conversations</Link>
            <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={logout}>Logout</button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
