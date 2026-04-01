import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
          const userDoc = await getDoc(doc(db, 'users', userId));
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
      <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="md:hidden p-2 hover:bg-gray-50 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <img src={chatUser?.avatar} alt={chatUser?.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-bold leading-tight">{chatUser?.name}</h3>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleSendMessage(undefined, true)}
            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
            title="Send Meeting Link"
          >
            <Video size={20} />
          </button>
          <button 
            onClick={() => navigate('/schedule')}
            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
            title="Schedule Session"
          >
            <Calendar size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn("p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all", showMoreMenu && "bg-gray-100 text-black")}
            >
              <MoreVertical size={20} />
            </button>
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 min-w-[160px] z-20">
                <button className="w-full text-left p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                  <UserIcon size={16} /> View Profile
                </button>
                <button className="w-full text-left p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} /> Report
                </button>
                <button className="w-full text-left p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-2">
                  <UserX size={16} /> Block
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] p-4 rounded-2xl shadow-sm",
                isMe ? "bg-black text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
              )}>
                {msg.isMeetingLink ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium opacity-90">Meeting Invitation</p>
                    <div className={cn("p-3 rounded-xl flex items-center gap-3", isMe ? "bg-white/10" : "bg-orange-50")}>
                      <Video size={18} className={isMe ? "text-white" : "text-orange-500"} />
                      <a href="https://meet.google.com/abc-defg-hij" target="_blank" className="text-sm underline truncate">meet.google.com/abc-defg-hij</a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
                <p className={cn("text-[10px] mt-2 opacity-50", isMe ? "text-right" : "text-left")}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          className="hidden" 
        />
        <button 
          type="button" 
          onClick={handleFileAttach}
          className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
        >
          <LinkIcon size={20} />
        </button>
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="flex-1 bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

