"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

export default function ChatRoom({ room, title, theme = 'default', backLink = '/dashboard' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const router = useRouter();

  // Notification setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Ignore if audio fails or is blocked
    }
  };

  useEffect(() => {
    // Quick hack to get current user from localStorage or just create a new endpoint?
    // Let's just create a /api/auth/me route.
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then((data) => {
        if (data.user) setMe(data.user.username);
      })
      .catch(console.error);
  }, []);

  const fetchMessages = async (currentMessages = messages) => {
    try {
      const [res, typingRes] = await Promise.all([
        fetch(`/api/messages?room=${room}`),
        fetch(`/api/typing?room=${room}`)
      ]);

      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      
      if (typingRes.ok) {
        const typingData = await typingRes.json();
        if (typingData.typing) {
          setTypingUsers(typingData.typing);
        }
      }
      if (data.messages) {
        // Optimized Polling: Check if we have new messages
        const latestCurrent = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1] : null;
        const latestNew = data.messages.length > 0 ? data.messages[data.messages.length - 1] : null;

        if (!latestCurrent || !latestNew || latestCurrent._id !== latestNew._id || currentMessages.length !== data.messages.length) {
          setMessages(data.messages);
          
          // Check if the new message is from someone else to trigger notification
          if (latestNew && latestCurrent && latestNew.sender !== me && latestNew._id !== latestCurrent._id) {
            playNotificationSound();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`New message in ${title}`, { body: latestNew.message });
            }
            document.title = '(1) New Message - Our Space';
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(messages);
    const interval = setInterval(() => fetchMessages(messages), 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [room, messages, me]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset title on focus
    const handleFocus = () => {
      document.title = 'Our Space';
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const sendTypingState = async (isTyping) => {
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, isTyping }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    sendTypingState(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(false);
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const tempMsg = newMessage;
    setNewMessage(''); // optimistic clear
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingState(false);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, message: tempMsg }),
      });
      if (!res.ok) throw new Error('API failed');
      fetchMessages();
    } catch (error) {
      console.error('Send error:', error);
      setNewMessage(tempMsg); // restore on error
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isNaughty = theme === 'naughty';

  return (
    <div className={clsx(
      "h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-500 page-transition-enter",
      isNaughty ? "bg-[#0f172a]" : "bg-slate-50"
    )}>
      {/* Background gradient/blur effect */}
      <div className={clsx(
        "fixed inset-0 z-0 opacity-40 pointer-events-none transition-colors duration-1000",
        isNaughty ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-[#0f172a]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white"
      )}></div>

      {/* Header */}
      <header className={clsx(
        "flex-none h-16 px-4 md:px-8 border-b flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl shadow-sm",
        isNaughty ? "bg-[#0f172a]/80 border-slate-800 text-rose-100" : "bg-white/80 border-slate-200 text-slate-800"
      )}>
        <div className="flex items-center gap-4">
          <Link href={backLink} className={clsx(
            "p-2 rounded-full transition-colors",
            isNaughty ? "hover:bg-slate-800 text-rose-400" : "hover:bg-blue-50 text-slate-500 hover:text-blue-600"
          )}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-medium tracking-tight">{title}</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar relative z-10">
        {loading && messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className={clsx("w-8 h-8 animate-spin", isNaughty ? "text-rose-500" : "text-blue-500")} />
            <span className="text-sm text-slate-500 animate-pulse">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <p className="text-lg">No messages yet.</p>
            <p className="text-sm text-slate-400">Be the first to say hi!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender === me;
            const msgDate = new Date(msg.timestamp);
            const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={msg._id || i} 
                className={clsx("flex w-full page-transition-enter", isMe ? "justify-end" : "justify-start")}
              >
                <div className={clsx(
                  "max-w-[80%] md:max-w-[60%] flex flex-col",
                  isMe ? "items-end" : "items-start"
                )}>
                  <div className={clsx(
                    "px-5 py-3 relative group backdrop-blur-md shadow-sm transition-transform hover:scale-[1.01]",
                    isMe 
                      ? isNaughty 
                        ? "bg-rose-600/90 text-white rounded-2xl rounded-br-none chat-tail-right" 
                        : "bg-blue-600/90 text-white rounded-2xl rounded-br-none chat-tail-right"
                      : isNaughty
                        ? "bg-slate-800/90 text-rose-50 rounded-2xl rounded-bl-none border border-slate-700/50 chat-tail-left"
                        : "bg-white/90 text-slate-800 rounded-2xl rounded-bl-none border border-slate-200 chat-tail-left"
                  )}>
                    <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                    <span className={clsx(
                      "text-[10px] absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                      isMe ? "right-1 text-slate-400" : "left-1 text-slate-400"
                    )}>
                      {timeString}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Invisible div for smooth scrolling */}
        <div ref={messagesEndRef} className="h-1 w-full" />
      </div>

      {/* Input Area */}
      <div className={clsx(
        "flex-none p-4 md:p-6 border-t relative",
        isNaughty ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"
      )}>
        {/* Typing Indicator */}
        {typingUsers.filter(u => u !== me).length > 0 && (
          <div className="absolute -top-7 left-6 text-xs italic text-slate-500 animate-pulse page-transition-enter">
            {typingUsers.filter(u => u !== me).join(', ')} is typing...
          </div>
        )}
        
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            className={clsx(
              "flex-1 max-h-32 min-h-[52px] py-3.5 pl-5 pr-4 rounded-2xl resize-none outline-none transition-all shadow-sm",
              isNaughty 
                ? "bg-slate-800/80 backdrop-blur-md border border-slate-700 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 focus:shadow-[0_0_15px_rgba(225,29,72,0.15)] text-rose-50 placeholder:text-slate-500" 
                : "bg-slate-50/80 backdrop-blur-md border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] text-slate-800 placeholder:text-slate-400"
            )}
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={clsx(
              "flex-none h-[52px] w-[52px] rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm",
              isNaughty 
                ? "bg-rose-600 hover:bg-rose-500 text-white" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
