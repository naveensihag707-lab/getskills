import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar, 
  UserCircle, 
  LogOut,
  Search,
  Plus,
  CheckCircle2,
  Star,
  ArrowRight,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { User, Session, Message } from './types';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Scheduler from './pages/Scheduler';
import Tracker from './pages/Tracker';
import AdminDashboard from './pages/AdminDashboard';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

import { cn } from './lib/utils';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser(userData);
            localStorage.setItem('skillswap_user', JSON.stringify(userData));
            
            // Fetch all users once authenticated
            try {
              const querySnapshot = await getDocs(collection(db, 'users'));
              const usersList = querySnapshot.docs.map(doc => doc.data() as User);
              setAllUsers(usersList);
            } catch (error) {
              console.error('Error fetching all users in App.tsx:', error);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setAllUsers([]);
        localStorage.removeItem('skillswap_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home currentUser={currentUser} />} />
            <Route path="/auth" element={<Auth setCurrentUser={setCurrentUser} />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <div className="flex flex-col md:flex-row min-h-screen">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold tracking-tight">SkillSwap</span>
                  </div>

                  <nav className="flex-1 space-y-1">
                    <NavLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavLink to="/matches" icon={<Users size={20} />} label="Find Matches" />
                    <NavLink to="/chat" icon={<MessageSquare size={20} />} label="Messages" />
                    <NavLink to="/schedule" icon={<Calendar size={20} />} label="Schedule" />
                    <NavLink to="/tracker" icon={<CheckCircle2 size={20} />} label="Progress" />
                    {currentUser?.role === 'admin' && (
                      <NavLink to="/admin" icon={<ShieldCheck size={20} />} label="Admin Panel" />
                    )}
                  </nav>

                  <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-gray-50">
                      <img src={currentUser?.avatar || 'https://picsum.photos/seed/user/100'} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{currentUser?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.level || 'Beginner'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors w-full p-2"
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-10 overflow-y-auto">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
                    <Route path="/matches" element={<Matches currentUser={currentUser} allUsers={allUsers} />} />
                    <Route path="/chat" element={<Chat currentUser={currentUser} />} />
                    <Route path="/chat/:userId" element={<Chat currentUser={currentUser} />} />
                    <Route path="/schedule" element={<Scheduler currentUser={currentUser} />} />
                    <Route path="/tracker" element={<Tracker currentUser={currentUser} />} />
                    <Route path="/admin" element={<AdminDashboard currentUser={currentUser} />} />
                  </Routes>
                </main>
              </div>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-orange-50 text-orange-600 font-semibold shadow-sm" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span className={cn("transition-transform duration-200 group-hover:scale-110", isActive ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600")}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

