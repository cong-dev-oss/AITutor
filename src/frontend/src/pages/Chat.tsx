import { useState, useEffect, useRef } from 'react';
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
  const [topic, setTopic] = useState('Grammar: Present Simple');
  const [isTyping, setIsTyping] = useState(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { text: "Chào mừng bạn! Hôm nay chúng ta sẽ học về Hiện tại đơn. Bạn có thắc mắc gì không?", isUser: false, timestamp: new Date() }
    ]);

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
    if (!input.trim() || !connection || connection.state !== signalR.HubConnectionState.Connected) return;

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
    <div className="h-full flex flex-col py-4 max-w-4xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-serif text-primary font-bold italic flex items-center gap-2">
            Học cùng AI Tutor
            <Sparkles className="w-5 h-5 text-stone-400" />
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mt-1 font-serif">
            Hội thoại thực hành
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select 
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setMessages([{ text: `Đã chuyển sang chủ đề: ${e.target.value}. Bắt đầu thôi!`, isUser: false, timestamp: new Date() }]);
            }}
            className="w-full sm:w-64 border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm shadow-sm transition-colors text-primary font-medium"
          >
            <option value="Grammar: Present Simple">Hiện tại đơn</option>
            <option value="Vocab: Restaurant">Từ vựng Nhà hàng</option>
            <option value="Grammar: Passive Voice">Bị động</option>
            <option value="Conversation: Travel">Hội thoại Du lịch</option>
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-sm border border-border bg-card/60 shadow-inner scroll-smooth">
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border
                  ${msg.isUser ? 'bg-primary text-primary-foreground border-primary' : 'bg-[#f0ece1] text-primary border-[#e6dfd1]'}
                `}>
                  {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`px-5 py-3.5 shadow-sm 
                  ${msg.isUser 
                    ? 'bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-2xl border border-primary/90' 
                    : 'bg-white text-primary rounded-tr-2xl rounded-tl-sm rounded-br-2xl rounded-bl-2xl border border-border'}
                `}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium font-sans">
                    {msg.text}
                  </p>
                  <span className={`text-[10px] uppercase font-serif tracking-widest block mt-2 opacity-60
                    ${msg.isUser ? 'text-right' : 'text-left'}
                  `}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%] flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border bg-[#f0ece1] text-primary border-[#e6dfd1]">
                  <Bot className="w-5 h-5 opacity-70" />
                </div>
                <div className="px-5 py-3.5 shadow-sm bg-white text-primary rounded-tr-2xl rounded-tl-sm rounded-br-2xl rounded-bl-2xl border border-border flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                  <span className="text-sm font-serif italic text-muted-foreground">Tutor đang soạn câu phản hồi...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-2 bg-card border border-border shadow-sm rounded-sm flex items-end gap-2 transition-shadow focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập nội dung hội thoại..."
          className="w-full bg-transparent px-3 py-3 max-h-32 min-h-12 resize-none outline-none leading-relaxed text-[15px]"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping || !connection || connection.state !== signalR.HubConnectionState.Connected}
          className="p-3 mb-1 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0 ml-2 shadow-inner"
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest font-serif mt-2">
        Nhấn Enter để gửi phản hồi, Shift + Enter để xuống dòng
      </p>

    </div>
  );
}
