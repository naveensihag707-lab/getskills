import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, MatchResult } from '../types';
import { getMatches } from '../services/geminiService';
import { 
  Sparkles, 
  Loader2, 
  Star, 
  MessageSquare, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  UserX,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, addDoc, collection } from 'firebase/firestore';

export default function Matches({ currentUser, allUsers }: { currentUser: User | null, allUsers: User[] }) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'city'>('all');
  const [reportingUser, setReportingUser] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
      handleFindMatches();
    }
  }, [currentUser, allUsers]);

  const handleFindMatches = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const results = await getMatches(currentUser, allUsers);
      setMatches(results.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(userId)
      });
      // Update local state or reload
      window.location.reload();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleReportUser = async (userId: string, reason: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: currentUser.id,
        reportedId: userId,
        reason,
        timestamp: new Date().toISOString()
      });
      setReportingUser(null);
      alert('User reported. Thank you for keeping SkillSwap safe.');
    } catch (error) {
      console.error('Error reporting user:', error);
    }
  };

  const filteredMatches = matches.filter(match => {
    const user = allUsers.find(u => u.id === match.userId);
    if (!user) return false;
    
    if (filter === 'nearby') return match.isNearby;
    if (filter === 'city') return user.location.city === currentUser?.location.city;
    return true;
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Find Your Match</h1>
          <p className="text-gray-500">AI-powered suggestions based on your skills, goals, and location.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
            <FilterButton active={filter === 'nearby'} onClick={() => setFilter('nearby')} label="Nearby" />
            <FilterButton active={filter === 'city'} onClick={() => setFilter('city')} label="Same City" />
          </div>
          <button 
            onClick={handleFindMatches}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">AI is analyzing compatibility and proximity...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMatches.map((match) => {
              const user = allUsers.find(u => u.id === match.userId);
              if (!user) return null;

              return (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-50" />
                          {user.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified Student">
                              <ShieldCheck size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-1">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-1 text-orange-500">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold">{user.rating}</span>
                            <span className="text-[10px] text-gray-400 font-normal">({user.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        match.score > 80 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {match.score}% Match
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
                        match.isNearby ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-500"
                      )}>
                        {match.isNearby ? <MapPin size={10} /> : <Globe size={10} />}
                        {user.location.city}, {user.location.state}
                      </div>
                      {match.isNearby && (
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">Nearby Match</span>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Can Teach</p>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsOffered.map(s => (
                            <span key={s} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Wants to Learn</p>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsWanted.map(s => (
                            <span key={s} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 italic leading-relaxed">
                        <Sparkles size={12} className="inline mr-1 text-orange-500" />
                        {match.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex gap-2">
                    <Link 
                      to={`/chat/${user.id}`}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                    >
                      <MessageSquare size={16} />
                      Connect
                    </Link>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        className={cn(
                          "p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-all",
                          activeMenu === user.id && "bg-gray-100 text-red-500"
                        )}
                      >
                        <AlertTriangle size={16} />
                      </button>
                      {activeMenu === user.id && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-100 rounded-xl shadow-xl p-2 min-w-[120px] z-20">
                          <button 
                            onClick={() => {
                              setReportingUser(user.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left p-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                          >
                            <AlertTriangle size={12} /> Report
                          </button>
                          <button 
                            onClick={() => {
                              handleBlockUser(user.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left p-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"
                          >
                            <UserX size={12} /> Block
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Report Modal */}
      {reportingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Report User</h2>
            <div className="space-y-3">
              {['Spam', 'Abuse', 'Fake Profile', 'Inappropriate Content'].map(reason => (
                <button 
                  key={reason}
                  onClick={() => handleReportUser(reportingUser, reason)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-2xl font-bold text-sm transition-all"
                >
                  {reason}
                </button>
              ))}
              <button 
                onClick={() => setReportingUser(null)}
                className="w-full p-4 text-center text-gray-400 font-bold text-sm hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-xs font-bold transition-all",
        active ? "bg-black text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
    </button>
  );
}

