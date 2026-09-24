import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  Search,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  Ticket,
  Mail,
  X,
  ExternalLink,
} from 'lucide-react';

interface UserRecord {
  userId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt?: string;
  profileImage?: string;
  bookingCount?: number;
}

export const AdminUsers: React.FC = () => {
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const token = await getIdToken();
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error('Error fetching admin users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [getIdToken]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity & Access Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              User Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized directory of registered attendees and system administrators.
            </p>
          </div>

          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Total Registered: <strong className="text-white">{users.length}</strong></span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                roleFilter === 'all'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                roleFilter === 'user'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Attendees ({users.filter((u) => u.role === 'user').length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                roleFilter === 'admin'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Admins ({users.filter((u) => u.role === 'admin').length})
            </button>
          </div>
        </div>

        {/* User Directory Table */}
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">User / Identity</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Authorization Role</th>
                  <th className="py-4 px-6">Registered On</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Loading user directory from Firestore...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-cyan text-white font-bold flex items-center justify-center shrink-0">
                            {u.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{u.name || 'Anonymous User'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[150px]">
                              {u.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {u.email}
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={u.role === 'admin' ? 'cyan' : 'slate'} size="sm">
                          {u.role === 'admin' ? 'Administrator' : 'Attendee'}
                        </Badge>
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition"
                        >
                          Inspect Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Detail Drawer / Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 relative shadow-soft-lg">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold font-heading text-white">Attendee Profile</h3>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">User ID</span>
                    <span className="text-xs font-mono text-cyan-400">{selectedUser.userId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Name</span>
                    <span className="text-xs font-bold text-white">{selectedUser.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email</span>
                    <span className="text-xs text-slate-300">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Role</span>
                    <Badge variant={selectedUser.role === 'admin' ? 'cyan' : 'slate'} size="sm">
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Joined</span>
                    <span className="text-xs text-slate-300">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/40 text-xs text-violet-200 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Server-Side Role Immutability</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Roles are cryptographically enforced in Cloud Firestore security rules and cannot be elevated from the client.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
