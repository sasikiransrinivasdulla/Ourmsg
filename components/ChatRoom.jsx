"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, LogOut, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
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
  const [otherUserState, setOtherUserState] = useState(null); // { username: string, lastSeen: number }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Notification and SW setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      const [res, typingRes, onlineRes] = await Promise.all([
        fetch(`/api/messages?room=${room}`),
        fetch(`/api/typing?room=${room}`),
        fetch(`/api/online`)
      ]);

      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      
      if (typingRes.ok) {
        const typingData = await typingRes.json();
        if (typingData.typing) {
          setTypingUsers(typingData.typing);
        }
      }

      if (onlineRes.ok) {
        const onlineData = await onlineRes.json();
        if (onlineData.onlineState && me) {
          // Find the other user from the online state map
          const others = Object.entries(onlineData.onlineState).filter(([u]) => u !== me);
          if (others.length > 0) {
            setOtherUserState({ username: others[0][0], lastSeen: others[0][1] });
          } else {
             // If they aren't in the online state map, try to infer from messages
             const otherMsg = data.messages?.find(m => m.sender !== me);
             if (otherMsg) {
               setOtherUserState(prev => prev ? prev : { username: otherMsg.sender, lastSeen: 0 });
             }
          }
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
            
            // Only play sound or show notification if tab is hidden/inactive to avoid spamming active users
            if (document.hidden) {
              playNotificationSound();
              
              if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(`New message from ${latestNew.sender}`, {
                    body: latestNew.message,
                    vibrate: [200, 100, 200]
                  });
                });
              } else if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${latestNew.sender}`, { body: latestNew.message });
              }
              document.title = '(1) New Message - Our Space';
            }
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

  // Heartbeat
  useEffect(() => {
    if (!me) return;
    const sendHeartbeat = () => {
      fetch('/api/online', { method: 'POST' }).catch(console.error);
    };
    sendHeartbeat(); // immediate
    const interval = setInterval(sendHeartbeat, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [me]);

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

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
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
      const payload = { room, sender: me, message: tempMsg };
      console.log('Sending message:', payload);
      
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('API failed');
      
      const jsonRes = await res.json();
      console.log('Message sent response:', jsonRes);
      
      fetchMessages();
    } catch (error) {
      console.error('Send error:', error);
      setNewMessage(tempMsg); // restore on error
    } finally {
      setSending(false);
      // Keep input focused after sending
      setTimeout(() => inputRef.current?.focus(), 0);
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
        "fixed inset-0 z-0 pointer-events-none transition-colors duration-1000",
        isNaughty 
          ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-[#0f172a] opacity-40" 
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100 opacity-80"
      )}>
        {!isNaughty && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </>
        )}
      </div>

      {/* Header */}
      <header className={clsx(
        "flex-none h-[72px] px-4 md:px-6 border-b flex items-center justify-between sticky top-0 z-50 transition-all shadow-sm",
        isNaughty ? "bg-[#0f172a]/80 backdrop-blur-xl border-slate-800 text-rose-100" : "bg-white/80 backdrop-blur-xl border-white/50 text-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
      )}>
        <div className="flex items-center gap-4">
          <Link href={backLink} className={clsx(
            "p-2 rounded-full transition-colors",
            isNaughty ? "hover:bg-slate-800 text-rose-400" : "hover:bg-blue-50 text-slate-500 hover:text-blue-600"
          )}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-medium tracking-tight leading-tight">{title}</h1>
            {otherUserState && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={clsx(
                  "w-2 h-2 rounded-full",
                  Date.now() - otherUserState.lastSeen < 10000 ? "bg-green-500 animate-pulse" : "bg-slate-400"
                )}></span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {Date.now() - otherUserState.lastSeen < 10000 
                    ? `${otherUserState.username} is Online` 
                    : `Last seen ${Math.floor((Date.now() - otherUserState.lastSeen) / 1000)}s ago`}
                </span>
              </div>
            )}
          </div>
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar relative z-10 w-full flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col">
          {loading && messages.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 className={clsx("w-8 h-8 animate-spin", isNaughty ? "text-rose-500" : "text-blue-500")} />
              <span className="text-sm text-slate-500 animate-pulse">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full mt-32 flex flex-col items-center justify-center text-slate-500 gap-3">
              <p className="text-lg">No messages yet.</p>
              <p className="text-sm text-slate-400">Be the first to say hi!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender === me;
              const msgDate = new Date(msg.timestamp);
              const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Group messages logically to reduce vertical spacing
              const isPrevSame = i > 0 && messages[i-1].sender === msg.sender;
              const isNextSame = i < messages.length - 1 && messages[i+1].sender === msg.sender;

              return (
                <div 
                  key={msg._id || i} 
                  className={clsx(
                    "flex w-full page-transition-enter transition-all duration-300", 
                    isMe ? "justify-end" : "justify-start",
                    isPrevSame ? "mt-1.5" : "mt-6"
                  )}
                >
                  <div className={clsx(
                    "max-w-[85%] md:max-w-[70%] flex flex-col",
                    isMe ? "items-end" : "items-start"
                  )}>
                    <div className={clsx(
                      "px-4 md:px-5 py-2.5 md:py-3 relative group transition-transform hover:scale-[1.01] hover:shadow-md",
                      isMe 
                        ? isNaughty 
                          ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm" 
                          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                        : isNaughty
                          ? "bg-slate-800/90 text-rose-50 border border-slate-700/50 shadow-sm"
                          : "bg-white text-slate-800 border border-slate-100 shadow-sm",
                      // Smart Border Radius for grouping (WhatsApp style)
                      "rounded-2xl",
                      isMe && isNextSame ? "rounded-br-sm" : "",
                      isMe && isPrevSame ? "rounded-tr-sm" : "",
                      !isMe && isNextSame ? "rounded-bl-sm" : "",
                      !isMe && isPrevSame ? "rounded-tl-sm" : "",
                      // Tail styling on the last message of a group
                      isMe && !isNextSame ? "chat-tail-right" : "",
                      !isMe && !isNextSame ? "chat-tail-left" : ""
                    )}>
                      <p className="leading-relaxed break-words whitespace-pre-wrap text-[15px]">{msg.message}</p>
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
          <div ref={messagesEndRef} className="h-1 w-full mt-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className={clsx(
        "flex-none p-3 md:p-5 relative z-20 transition-all",
        isNaughty 
          ? "bg-[#0f172a]/80 backdrop-blur-2xl border-t border-slate-800" 
          : "bg-white/70 backdrop-blur-2xl border-t border-white/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]"
      )}>
        {/* Typing Indicator */}
        {typingUsers.filter(u => u !== me).length > 0 && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-wide bg-black/5 backdrop-blur-md px-3 py-1 rounded-full italic text-slate-500 animate-pulse page-transition-enter shadow-sm">
            {typingUsers.filter(u => u !== me).join(', ')} is typing...
          </div>
        )}
        
        <form onSubmit={handleSend} className="max-w-3xl mx-auto w-full relative flex items-end gap-2 md:gap-3">
          
          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-[70px] left-0 md:-left-4 z-50 shadow-2xl rounded-3xl overflow-hidden page-transition-enter ring-1 ring-black/5">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme={isNaughty ? "dark" : "light"}
                lazyLoadEmojis={true}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={clsx(
              "flex-none h-[48px] w-[48px] md:h-[52px] md:w-[52px] rounded-full flex items-center justify-center transition-all group shadow-sm",
              isNaughty 
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700" 
                : "bg-white hover:bg-slate-50 text-slate-400 hover:text-blue-500 border border-slate-100"
            )}
          >
            <Smile className="w-[22px] h-[22px] md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </button>

          <textarea
            ref={inputRef}
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
              "flex-1 max-h-32 min-h-[48px] md:min-h-[52px] py-3.5 pl-6 pr-4 rounded-full resize-none outline-none transition-all shadow-sm",
              isNaughty 
                ? "bg-slate-800/60 backdrop-blur-md border border-slate-700 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 focus:shadow-[0_0_20px_rgba(225,29,72,0.15)] text-rose-50 placeholder:text-slate-500" 
                : "bg-white/80 backdrop-blur-md border border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] text-slate-800 placeholder:text-slate-400"
            )}
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={clsx(
              "flex-none h-[48px] w-[48px] md:h-[52px] md:w-[52px] rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md",
              isNaughty 
                ? "bg-gradient-to-br from-rose-500 to-rose-600 hover:to-rose-500 text-white shadow-rose-500/20" 
                : "bg-gradient-to-br from-blue-500 to-blue-600 hover:to-blue-500 text-white shadow-blue-500/20"
            )}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-[20px] h-[20px] md:w-5 md:h-5 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
