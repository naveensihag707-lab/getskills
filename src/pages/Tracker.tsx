import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Session } from '../types';
import { generateLearningPlan } from '../services/geminiService';
import { CheckCircle2, Star, MessageSquare, Loader2, Sparkles, Trophy } from 'lucide-react';

import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';

import { db } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

export default function Tracker({ currentUser }: { currentUser: User | null }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ id: string, skill: string } | null>(null);
  const [detailsModal, setDetailsModal] = useState<Session | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
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
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentUser]);

  const handleComplete = async () => {
    if (!ratingModal || !currentUser) return;
    try {
      const sessionRef = doc(db, 'sessions', ratingModal.id);
      const updateData = {
        status: 'completed',
        rating,
        feedback
      };
      await updateDoc(sessionRef, updateData);
      
      setSessions(prev => prev.map(s => s.id === ratingModal.id ? { ...s, ...updateData } as Session : s));
      setRatingModal(null);
      setRating(5);
      setFeedback('');
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleGeneratePlan = async (skill: string) => {
    setGeneratingPlan(true);
    try {
      const p = await generateLearningPlan(skill, currentUser?.level || 'Beginner');
      setPlan(p);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const pending = sessions.filter(s => s.status === 'pending');
  const completed = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Progress Tracker</h1>
        <p className="text-gray-500">Track your learning journey and session completions.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" /> Active Exchanges
            </h2>
            <div className="space-y-4">
              {pending.map(session => (
                <div key={session.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Learning {session.skillLearned}</h3>
                    <p className="text-sm text-gray-500">Scheduled for {session.date} at {session.time}</p>
                    <button 
                      onClick={() => handleGeneratePlan(session.skillLearned)}
                      className="mt-3 text-xs font-bold text-orange-500 flex items-center gap-1 hover:underline"
                    >
                      <Sparkles size={12} /> Generate AI Learning Plan
                    </button>
                  </div>
                  <button 
                    onClick={() => setRatingModal({ id: session.id, skill: session.skillLearned })}
                    className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Mark Complete
                  </button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-gray-400 italic">No active exchanges.</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" /> Completed Swaps
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {completed.map(session => (
                <div key={session.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold">{session.skillLearned}</h3>
                      <div className="flex items-center gap-1 text-orange-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{session.rating || '5.0'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Completed on {session.date}</p>
                    {session.feedback && (
                      <p className="text-xs text-gray-400 mt-2 italic">"{session.feedback}"</p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400">Feedback Sent</span>
                    <button 
                      onClick={() => setDetailsModal(session)}
                      className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              {completed.length === 0 && <p className="text-gray-400 italic">No completed sessions yet.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="p-8 bg-white rounded-3xl border border-gray-100 min-h-[400px]">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" /> AI Learning Plan
            </h3>
            {generatingPlan ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-orange-500" />
                <p className="text-xs text-gray-400 font-medium">Crafting your roadmap...</p>
              </div>
            ) : plan ? (
              <div className="prose prose-sm prose-orange">
                <div className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
                  {plan}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-sm text-gray-400">Select an active exchange to generate a personalized learning plan.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-2">Complete Session</h2>
            <p className="text-gray-500 text-sm mb-6">How was your session learning {ratingModal.skill}?</p>
            
            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      rating >= s ? "text-orange-500" : "text-gray-200"
                    )}
                  >
                    <Star size={32} fill={rating >= s ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Feedback (Optional)</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                  rows={3}
                  placeholder="Share your experience..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setRatingModal(null)}
                  className="flex-1 p-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleComplete}
                  className="flex-1 bg-orange-500 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 transition-all"
                >
                  Submit & Complete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">Swap Details</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Skill Learned</p>
                <p className="font-bold">{detailsModal.skillLearned}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Skill Taught</p>
                <p className="font-bold">{detailsModal.skillTaught}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
                  <p className="font-bold">{detailsModal.date}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rating</p>
                  <div className="flex items-center gap-1 text-orange-500 font-bold">
                    <Star size={14} fill="currentColor" /> {detailsModal.rating || '5.0'}
                  </div>
                </div>
              </div>
              {detailsModal.feedback && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Feedback</p>
                  <p className="text-sm text-gray-600 italic">"{detailsModal.feedback}"</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setDetailsModal(null)}
              className="w-full mt-6 p-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

