import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  Mail, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Search, 
  Filter, 
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => doc.data() as User);
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users in AdminDashboard.tsx:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">You do not have permission to view this page. This area is reserved for administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-gray-500">Manage users and monitor platform activity.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 border-r border-gray-100">
            <Users size={18} className="text-gray-400" />
            <span className="text-sm font-bold">{users.length} Total Users</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <ShieldCheck size={18} className="text-blue-500" />
            <span className="text-sm font-bold">1 Admin</span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-600 transition-all">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin size={12} className="text-gray-400" />
                      {user.location.city}, {user.location.country}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.skillsOffered.slice(0, 2).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold">
                          {skill}
                        </span>
                      ))}
                      {user.skillsOffered.length > 2 && (
                        <span className="text-[10px] text-gray-400 font-bold">+{user.skillsOffered.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock size={12} className="text-gray-400" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      user.role === 'admin' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && !loading && (
          <div className="p-12 text-center">
            <p className="text-gray-400 font-medium">No users found matching your search.</p>
          </div>
        )}

        {loading && (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
