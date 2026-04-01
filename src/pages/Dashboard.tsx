import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Session } from '../types';
import { 
  Star, 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  History 
} from 'lucide-react';
import { cn } from '../lib/utils';

import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Dashboard({ currentUser }: { currentUser: User | null }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch sessions where currentUser is a participant
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('users', 'array-contains', currentUser.id)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionsList = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        setSessions(sessionsList);

        // Fetch all users for matching and partner details
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => doc.data() as User);
        setAllUsers(usersList);
        
        // Simple matching logic for dashboard
        setMatches(usersList.filter(u => u.id !== currentUser.id).slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [currentUser]);

  const upcomingSessions = sessions.filter(s => s.status === 'pending');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">Welcome back, {currentUser?.name.split(' ')[0]}!</h1>
            {currentUser?.isVerified && <ShieldCheck className="text-blue-500" size={24} />}
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {currentUser?.location.city}, {currentUser?.location.country}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <p className="text-sm">You have {upcomingSessions.length} sessions scheduled this week.</p>
          </div>
        </div>
        <Link to="/matches" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2">
          Find New Matches <ArrowRight size={18} />
        </Link>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Upcoming Sessions */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Upcoming Sessions</h2>
              <Link to="/schedule" className="text-sm font-semibold text-orange-500 hover:underline">View Calendar</Link>
            </div>
            
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map(session => {
                  const partnerId = session.users.find(id => id !== currentUser?.id);
                  const partner = allUsers.find(u => u.id === partnerId);
                  return <SessionCard key={session.id} session={session} partner={partner} />;
                })}
              </div>
            ) : (
              <div className="p-10 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No sessions scheduled yet.</p>
                <Link to="/matches" className="text-orange-500 text-sm font-bold mt-2 hover:underline">Match with someone to start</Link>
              </div>
            )}
          </section>

          {/* Swap History */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History size={20} className="text-gray-400" /> My Swap History
            </h2>
            {completedSessions.length > 0 ? (
              <div className="space-y-4">
                {completedSessions.map(session => {
                  const partnerId = session.users.find(id => id !== currentUser?.id);
                  const partner = allUsers.find(u => u.id === partnerId);
                  return (
                    <div key={session.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-6">
                      <img src={partner?.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold">Swapped with {partner?.name}</h3>
                          <div className="flex items-center gap-1 text-orange-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-bold">{session.rating || '5.0'}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Taught: <span className="text-gray-700 font-medium">{session.skillTaught}</span> • 
                          Learned: <span className="text-gray-700 font-medium">{session.skillLearned}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400">{session.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">No completed swaps yet. Complete your first session to build your history!</p>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-6">Recommended Matches</h2>
            <div className="space-y-4">
              {matches.map(user => (
                <Link key={user.id} to={`/chat/${user.id}`} className="block p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                      {user.isVerified && <ShieldCheck className="absolute -bottom-1 -right-1 text-blue-500 bg-white rounded-full p-0.5" size={12} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold truncate group-hover:text-orange-500 transition-colors">{user.name}</h3>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10} /> {user.location.city}</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Link to="/matches" className="block text-center p-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                View all matches
              </Link>
            </div>
          </section>

          <section className="p-6 bg-black rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Trust Score</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%]"></div>
                </div>
                <span className="text-xs font-bold">85%</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Complete more swaps and get verified to reach 100% trust score.
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500 rounded-full blur-2xl opacity-20"></div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, partner }: { session: Session, partner?: User, key?: string }) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
      <div className="w-14 h-14 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-600">
        <span className="text-xs font-bold uppercase">{session.date.split(' ')[0]}</span>
        <span className="text-xl font-black">{session.date.split(' ')[1]}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">Swap with {partner?.name}</h3>
        <p className="text-xs text-gray-500 mb-2">Learning: {session.skillLearned}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Clock size={14} /> {session.time}</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Confirmed</span>
        </div>
      </div>
      <Link to={partner ? `/chat/${partner.id}` : "/chat"} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors">
        Message
      </Link>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

