import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Session } from '../types';
import { Calendar as CalendarIcon, Clock, Video, Plus, Loader2, CheckCircle2 } from 'lucide-react';

import { cn } from '../lib/utils';

import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export default function Scheduler({ currentUser, allUsers }: { currentUser: User | null, allUsers: User[] }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [matches, setMatches] = useState<User[]>([]);
  const [newSession, setNewSession] = useState({
    partnerId: '',
    skill: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('users', 'array-contains', currentUser.id)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionsList = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        setSessions(sessionsList);

        setMatches(allUsers.filter((u: User) => u.id !== currentUser.id));
      } catch (error) {
        console.error('Error fetching scheduler data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, allUsers]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const sessionData = {
      users: [currentUser.id, newSession.partnerId],
      skillTaught: currentUser.skillsOffered[0] || 'Skill',
      skillLearned: newSession.skill,
      date: newSession.date,
      time: newSession.time,
      status: 'pending',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    };

    try {
      const docRef = await addDoc(collection(db, 'sessions'), sessionData);
      const saved = { id: docRef.id, ...sessionData } as Session;
      setSessions(prev => [...prev, saved]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Session Scheduler</h1>
          <p className="text-gray-500">Manage your upcoming learning exchanges.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Schedule Session
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.filter(s => s.status === 'pending').map(session => (
                <div key={session.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-600">
                    <span className="text-xs font-bold uppercase">{session.date.split('-')[1]}/{session.date.split('-')[2]}</span>
                    <span className="text-xl font-black">{session.date.split('-')[0].slice(2)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Learning {session.skillLearned}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={14} /> {session.time}</span>
                      <a href={session.meetingLink} target="_blank" className="flex items-center gap-1 text-blue-500 hover:underline"><Video size={14} /> Join Meet</a>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">Confirmed</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-400">No sessions scheduled.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white rounded-3xl border border-gray-100">
            <h3 className="font-bold mb-4">Calendar View</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs font-medium",
                  i + 1 === 15 ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-400"
                )}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Schedule Session</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Partner</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                  value={newSession.partnerId}
                  onChange={e => setNewSession({...newSession, partnerId: e.target.value})}
                >
                  <option value="">Select a match</option>
                  {matches.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Skill to Learn</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                  placeholder="e.g. React"
                  value={newSession.skill}
                  onChange={e => setNewSession({...newSession, skill: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                    value={newSession.date}
                    onChange={e => setNewSession({...newSession, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Time</label>
                  <input 
                    required
                    type="time" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                    value={newSession.time}
                    onChange={e => setNewSession({...newSession, time: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 p-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-orange-500 text-white p-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
                >
                  Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

