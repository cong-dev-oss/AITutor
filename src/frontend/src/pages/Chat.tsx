import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import * as signalR from '@microsoft/signalr';
import { SendHorizonal, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await api.get('/documents');
        const topics = Array.from(new Set(data.map((d: any) => d.topic))) as string[];
        setAvailableTopics(topics);
        if (topics.length > 0) {
          setTopic(topics[0]);
          setMessages([
            { text: `Chào mừng bạn! Hôm nay chúng ta sẽ cùng học về chủ đề "${topics[0]}". Bạn muốn bắt đầu từ đâu?`, isUser: false, timestamp: new Date() }
          ]);
        } else {
          setMessages([
            { text: "Chào mừng bạn! Thư viện hiện chưa có tài liệu. Vui lòng tải lên tài liệu để bắt đầu học tập.", isUser: false, timestamp: new Date() }
          ]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách chủ đề:", err);
      }
    };
    fetchTopics();

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const newConn = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/chat", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConn.on("ReceiveMessageChunk", (chunk: string) => {
      if (chunk === "[START]") {
        setIsTyping(false);
        setMessages(prev => [...prev, { text: "", isUser: false, timestamp: new Date() }]);
      } else if (chunk === "[END]") {
        // stream ended
      } else {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (!last || last.isUser) {
            return [...prev, { text: chunk, isUser: false, timestamp: new Date() }];
          }
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, text: last.text + chunk };
          return updated;
        });
      }
    });

    newConn.start().catch(err => console.error("SignalR Connection Error: ", err));
    setConnection(newConn);

    return () => {
      newConn.stop();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || !connection || connection.state !== signalR.HubConnectionState.Connected || !topic) return;

    const messageText = input;
    setInput('');
    setMessages(prev => [...prev, { text: messageText, isUser: true, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      await connection.invoke("SendMessage", topic, messageText);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col w-full animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between py-3 px-4 md:px-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {availableTopics.length > 0 ? (
            <select 
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setMessages(prev => [...prev, { text: `💻 Hệ thống: Đã chuyển ngữ cảnh sang chủ đề "${e.target.value}".`, isUser: false, timestamp: new Date() }]);
              }}
              className="w-auto border-none bg-transparent py-1 text-sm focus-visible:outline-none focus-visible:ring-0 font-semibold cursor-pointer text-foreground hover:bg-secondary rounded px-2 transition-colors uppercase tracking-tight"
            >
              {availableTopics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-medium text-muted-foreground px-2">Chưa có tài liệu học tập</span>
          )}
        </div>
        <div>
          {/* Action buttons could go here */}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth pb-32 pt-8">
        <div className="flex flex-col space-y-8 w-full">
          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 ease-out`}>
              <div className={`flex gap-4 max-w-[85%] lg:max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 border mt-0.5
                  ${msg.isUser ? 'bg-secondary text-secondary-foreground border-border' : 'bg-primary text-primary-foreground border-primary'}
                `}>
                  {msg.isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble (Flat style like ChatGPT/Platform) */}
                <div className={`py-1.5 flex flex-col gap-1
                  ${msg.isUser 
                    ? 'items-end' 
                    : 'items-start'}
                `}>
                  <p className={`text-base leading-relaxed whitespace-pre-wrap ${msg.isUser ? 'text-right' : 'text-left'}`}>
                    {msg.text}
                  </p>
                  
                </div>

              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-300">
               <div className="flex gap-4 max-w-[80%] flex-row items-start">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 border bg-primary text-primary-foreground border-primary">
                    <Sparkles className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full left-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-6 px-4 md:px-0 z-20">
        <div className="max-w-3xl mx-auto w-full relative">
          <div className="flex items-end bg-card border border-border shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
            <textarea
              ref={(el) => {
                if (el) {
                  el.style.height = '0px';
                  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                }
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Gửi tin nhắn cho AI Tutor..."
              className="flex-1 bg-transparent px-4 py-3.5 max-h-[200px] min-h-[52px] resize-none outline-none leading-relaxed text-base placeholder:text-muted-foreground/60 text-foreground"
              rows={1}
            />
            <div className="pr-2 pb-2">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping || !connection || connection.state !== signalR.HubConnectionState.Connected}
                className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-20 transition-all flex items-center justify-center shadow-sm"
              >
                <SendHorizonal className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-[11px] text-muted-foreground font-medium opacity-60">AI Tutor có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
