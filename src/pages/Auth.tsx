import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User } from '../types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import bcrypt from 'bcryptjs';
import { Loader2, Sparkles, ShieldCheck, Mail, Lock, User as UserIcon, MapPin } from 'lucide-react';

export default function Auth({ setCurrentUser }: { setCurrentUser: (user: User) => void }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    city: '',
    state: '',
    country: '',
    skillsOffered: '',
    skillsWanted: '',
    level: 'Intermediate',
    bio: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.email));
      const querySnapshot = await getDocs(q);

      if (isLogin) {
        if (querySnapshot.empty) {
          setError('User not found. Please sign up first.');
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data() as User;
        const isPasswordMatch = await bcrypt.compare(formData.password, userData.password || '');

        if (!isPasswordMatch) {
          setError('Invalid password.');
          setLoading(false);
          return;
        }

        // Update last login
        const lastLogin = new Date().toISOString();
        await updateDoc(doc(db, 'users', userData.id), { lastLogin });
        
        const updatedUser = { ...userData, lastLogin };
        localStorage.setItem('skillswap_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        navigate('/dashboard');
      } else {
        if (!querySnapshot.empty) {
          setError('User already exists. Please log in.');
          setLoading(false);
          return;
        }

        const hashedPassword = await bcrypt.hash(formData.password, 10);
        const userId = Math.random().toString(36).substr(2, 9);
        
        const newUser: User = {
          id: userId,
          name: formData.name,
          email: formData.email,
          password: hashedPassword,
          role: formData.email === 'naveensihag707@gmail.com' ? 'admin' : 'user',
          lastLogin: new Date().toISOString(),
          location: {
            city: formData.city,
            state: formData.state,
            country: formData.country
          },
          skillsOffered: formData.skillsOffered.split(',').map(s => s.trim()),
          skillsWanted: formData.skillsWanted.split(',').map(s => s.trim()),
          level: formData.level,
          bio: formData.bio,
          rating: 5.0,
          reviewCount: 0,
          avatar: `https://picsum.photos/seed/${formData.name}/200`,
          isVerified: true,
          blockedUsers: []
        };

        await setDoc(doc(db, 'users', userId), newUser);
        localStorage.setItem('skillswap_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-2/5 bg-orange-500 p-10 text-white flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-4">{isLogin ? 'Welcome Back!' : 'Join the Swap.'}</h2>
          <p className="opacity-80 leading-relaxed mb-8">
            {isLogin 
              ? 'Log in to continue your learning journey and connect with your matches.' 
              : 'Set up your profile to start matching with other students and exchange skills.'}
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} />
              <span className="text-sm font-medium">Secure Authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles size={20} />
              <span className="text-sm font-medium">AI-Powered Matching</span>
            </div>
          </div>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="mt-12 border-2 border-white/30 hover:border-white px-6 py-3 rounded-xl font-bold transition-all text-sm"
          >
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex-1 p-10 space-y-6 overflow-y-auto max-h-[90vh]">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">{isLogin ? 'Log In' : 'Create Account'}</h3>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="john@university.edu"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-gray-100"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required={!isLogin}
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">City</label>
                    <input 
                      required={!isLogin}
                      type="text" 
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="San Francisco"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">State</label>
                    <input 
                      required={!isLogin}
                      type="text" 
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="CA"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Country</label>
                    <input 
                      required={!isLogin}
                      type="text" 
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="USA"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Skills You Can Teach</label>
                  <input 
                    required={!isLogin}
                    type="text" 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="React, Piano, Cooking"
                    value={formData.skillsOffered}
                    onChange={e => setFormData({...formData, skillsOffered: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Skills You Want to Learn</label>
                  <input 
                    required={!isLogin}
                    type="text" 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Python, Guitar, Chess"
                    value={formData.skillsWanted}
                    onChange={e => setFormData({...formData, skillsWanted: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Short Bio</label>
                  <textarea 
                    required={!isLogin}
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
