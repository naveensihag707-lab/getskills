import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Message } from '../types';
import { Send, Link as LinkIcon, Video, Calendar, ArrowLeft, MoreVertical, UserX, AlertTriangle, User as UserIcon } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';

export default function Chat({ currentUser }: { currentUser: User | null }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      const fetchChatUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'public_profiles', userId));
          if (userDoc.exists()) {
            setChatUser(userDoc.data() as User);
          }
        } catch (error) {
          console.error('Error fetching chat user:', error);
        }
      };
      fetchChatUser();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !currentUser) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Filter for the specific conversation
      const filtered = allMessages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === userId) ||
        (m.senderId === userId && m.receiverId === currentUser.id)
      );
      setMessages(filtered);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [userId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, isMeetingLink = false) => {
    e?.preventDefault();
    if (!inputText.trim() && !isMeetingLink) return;
    if (!currentUser || !userId) return;

    const text = isMeetingLink ? `Let's connect! Here's my Google Meet link: https://meet.google.com/abc-defg-hij` : inputText;

    const newMessage = {
      senderId: currentUser.id,
      receiverId: userId,
      participants: [currentUser.id, userId],
      text,
      isMeetingLink,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'messages'), newMessage);
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputText(`Attached file: ${file.name}`);
    }
  };

  if (!userId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-10">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <MessageSquare size={40} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
        <p className="text-gray-500 max-w-xs">Select a match from the sidebar or find new matches to start a conversation.</p>
        <button 
          onClick={() => navigate('/matches')}
          className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
        >
          Find Matches
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="md:hidden p-2 hover:bg-gray-50 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <img src={chatUser?.avatar} alt={chatUser?.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{chatUser?.name}</h3>
            <p className="text-xs text-gray-500 font-medium">
              {chatUser?.level} • Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage(undefined, true)}
            className="p-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all"
            title="Send Meeting Link"
          >
            <Video size={22} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/schedule')}
            className="p-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all"
            title="Schedule Session"
          >
            <Calendar size={22} />
          </motion.button>
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn("p-3 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all", showMoreMenu && "bg-gray-100 text-black")}
            >
              <MoreVertical size={22} />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 min-w-[200px] z-20"
                >
                  <button className="w-full text-left p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                    <UserIcon size={18} /> View Profile
                  </button>
                  <button className="w-full text-left p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                    <AlertTriangle size={18} /> Report User
                  </button>
                  <div className="my-2 border-t border-gray-50" />
                  <button className="w-full text-left p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                    <UserX size={18} /> Block User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#FAFAFA]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-sm font-medium">No messages yet.<br />Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
            
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {!isMe && (
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && <img src={chatUser?.avatar} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" />}
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] md:max-w-[60%] group relative",
                  isMe ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed transition-all",
                    isMe 
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-none hover:shadow-orange-200 hover:shadow-lg" 
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100 hover:shadow-md"
                  )}>
                    {msg.isMeetingLink ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", isMe ? "bg-white/20" : "bg-orange-100")}>
                            <Video size={18} className={isMe ? "text-white" : "text-orange-600"} />
                          </div>
                          <p className="font-bold">Meeting Invitation</p>
                        </div>
                        <p className="text-sm opacity-90">I'd like to schedule a skill swap session with you!</p>
                        <a 
                          href="https://meet.google.com/abc-defg-hij" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "block w-full text-center py-3 rounded-xl font-bold text-sm transition-all",
                            isMe ? "bg-white text-orange-600 hover:bg-gray-50" : "bg-orange-500 text-white hover:bg-orange-600"
                          )}
                        >
                          Join Meeting
                        </a>
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] mt-1.5 font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity",
                    isMe ? "text-right" : "text-left"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-white border-t border-gray-100">
        <form 
          onSubmit={handleSendMessage} 
          className="max-w-4xl mx-auto relative flex items-center gap-2 bg-gray-50 p-2 rounded-[24px] border border-gray-200 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            className="hidden" 
          />
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button" 
            onClick={handleFileAttach}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
          >
            <LinkIcon size={20} />
          </motion.button>
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 bg-transparent py-3 px-2 outline-none text-sm md:text-base"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputText.trim()}
            className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}

