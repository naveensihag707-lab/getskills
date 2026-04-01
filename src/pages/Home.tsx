import { Link } from 'react-router-dom';
import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Users, Zap } from 'lucide-react';
import { User } from '../types';

export default function Home({ currentUser }: { currentUser: User | null }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <nav className="flex justify-between items-center mb-24">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="text-2xl font-bold tracking-tight">SkillSwap</span>
            </div>
            <div className="flex items-center gap-6">
              {currentUser ? (
                <Link to="/dashboard" className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="text-gray-600 font-medium hover:text-black">Login</Link>
                  <Link to="/auth" className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-bold tracking-tight leading-[0.9] mb-8"
            >
              Learn skills by <span className="text-orange-500">teaching</span> others.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-500 mb-10 leading-relaxed max-w-xl"
            >
              The most practical platform for students to exchange expertise. No money involved, just pure knowledge sharing.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Link to="/auth" className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-all flex items-center gap-2 group">
                Start Swapping <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://picsum.photos/seed/${i+10}/100`} className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="User" />
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+500</div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="text-orange-500" />}
              title="Smart Matching"
              description="Our AI finds the perfect partner based on your skills and learning goals."
            />
            <FeatureCard 
              icon={<BookOpen className="text-blue-500" />}
              title="Learning Plans"
              description="Get AI-generated session plans to ensure you actually learn the skill."
            />
            <FeatureCard 
              icon={<Users className="text-green-500" />}
              title="Student Network"
              description="Connect with thousands of students from different universities worldwide."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
