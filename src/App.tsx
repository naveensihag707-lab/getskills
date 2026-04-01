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
  ShieldCheck,
  Menu,
  X
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
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

import { cn } from './lib/utils';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            
            // Force admin role for the specific email
            if (user.email === 'naveensihag707@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              try {
                await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
              } catch (err) {
                console.error('Error updating admin role in Firestore:', err);
              }
            }
            
            setCurrentUser(userData);
            localStorage.setItem('skillswap_user', JSON.stringify(userData));
            
            // Fetch all users only if admin (for dashboard)
            if (userData.role === 'admin') {
              try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = querySnapshot.docs.map(doc => doc.data() as User);
                setAllUsers(usersList);
              } catch (error) {
                console.error('Error fetching all users in App.tsx:', error);
              }
            } else {
              // Fetch public profiles for matching
              try {
                const querySnapshot = await getDocs(collection(db, 'public_profiles'));
                const usersList = querySnapshot.docs.map(doc => doc.data() as User);
                setAllUsers(usersList);
              } catch (error) {
                console.error('Error fetching public profiles in App.tsx:', error);
              }
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
              <div className="flex flex-col md:flex-row min-h-screen relative">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-lg font-bold tracking-tight">SkillSwap</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Menu size={24} />
                  </button>
                </header>

                {/* Sidebar Backdrop */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSidebarOpen(false)}
                      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
                    />
                  )}
                </AnimatePresence>

                {/* Sidebar */}
                <aside className={cn(
                  "fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 p-6 flex flex-col z-[60] transition-transform duration-300 md:relative md:translate-x-0 md:w-64 md:z-auto",
                  isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                      <span className="text-xl font-bold tracking-tight">SkillSwap</span>
                    </div>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden p-2 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="flex-1 space-y-1">
                    <NavLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
                    <NavLink to="/matches" icon={<Users size={20} />} label="Find Matches" onClick={() => setIsSidebarOpen(false)} />
                    <NavLink to="/chat" icon={<MessageSquare size={20} />} label="Messages" onClick={() => setIsSidebarOpen(false)} />
                    <NavLink to="/schedule" icon={<Calendar size={20} />} label="Schedule" onClick={() => setIsSidebarOpen(false)} />
                    <NavLink to="/tracker" icon={<CheckCircle2 size={20} />} label="Progress" onClick={() => setIsSidebarOpen(false)} />
                    {(currentUser?.role === 'admin' || currentUser?.email === 'naveensihag707@gmail.com') && (
                      <NavLink to="/admin" icon={<ShieldCheck size={20} />} label="Admin Panel" onClick={() => setIsSidebarOpen(false)} />
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
                      onClick={() => {
                        handleLogout();
                        setIsSidebarOpen(false);
                      }}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors w-full p-2"
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-10 overflow-y-auto h-[calc(100vh-73px)] md:h-screen">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard currentUser={currentUser} allUsers={allUsers} />} />
                    <Route path="/matches" element={<Matches currentUser={currentUser} allUsers={allUsers} />} />
                    <Route path="/chat" element={<Chat currentUser={currentUser} />} />
                    <Route path="/chat/:userId" element={<Chat currentUser={currentUser} />} />
                    <Route path="/schedule" element={<Scheduler currentUser={currentUser} allUsers={allUsers} />} />
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

function NavLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      onClick={onClick}
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

