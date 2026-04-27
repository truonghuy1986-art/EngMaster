import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mic, Send, Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { sendMessageToAI } from '../lib/gemini';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function ChatSection() {
  const { topicId } = useParams();
  const { currentLevel, addXp, markTopicComplete, customTopics, vocabularyList } = useAppStore();
  
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string, translation?: string, feedback?: string, suggestedResponses?: string[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  let topicTitle = '';
  if (topicId === 'coffee') topicTitle = 'Tại quán cà phê';
  else if (topicId === 'travel') topicTitle = 'Sân bay & Du lịch';
  else if (topicId === 'job') topicTitle = 'Phỏng vấn xin việc';
  else if (topicId === 'shopping') topicTitle = 'Mua sắm';
  else if (topicId === 'health') topicTitle = 'Bệnh viện & Sức khỏe';
  else if (topicId === 'meeting') topicTitle = 'Thuyết trình cuộc họp';
  else {
    const customMatch = customTopics.find(t => t.id === topicId);
    if (customMatch) topicTitle = customMatch.title;
    else topicTitle = 'Giao tiếp cơ bản';
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  }, [topicId]);

  const startConversation = async () => {
    setIsLoading(true);
    setMessages([]);
    
    const initialPrompt = [{ role: 'user' as const, content: 'Bắt đầu cuộc hội thoại.' }];
    const response = await sendMessageToAI(initialPrompt, topicTitle, currentLevel, vocabularyList);
    
    setMessages([{ role: 'model', content: response.reply, translation: response.translation, suggestedResponses: response.suggestedResponses }]);
    setIsLoading(false);
    speak(response.reply);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const newMessage: any = { role: 'user', content: userMessage };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);

    const aiRes = await sendMessageToAI(newMessages, topicTitle, currentLevel, vocabularyList);
    
    const finalMessages = [...newMessages];
    
    if (aiRes.feedback && finalMessages[finalMessages.length - 1].role === 'user') {
        finalMessages[finalMessages.length - 1].feedback = aiRes.feedback;
    }
    
    setMessages([
      ...finalMessages, 
      { role: 'model', content: aiRes.reply, translation: aiRes.translation, suggestedResponses: aiRes.suggestedResponses }
    ]);
    
    addXp(10);
    setIsLoading(false);
    speak(aiRes.reply);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert('Vui lòng cấp quyền truy cập micro để sử dụng tính năng này.');
        }
        setIsRecording(false);
      };
      
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } else {
        alert("Browser does not support Speech Recognition. Try Chrome.");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen p-4 md:p-8 flex flex-col md:flex-row gap-4 max-w-7xl mx-auto w-full">
      
      {/* Side Details (Bento Grid Style) */}
      <div className="hidden md:flex flex-col gap-4 w-72 shrink-0">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col mb-4">
          <Link to="/" className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mẹo giao tiếp</h3>
           
           {messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].suggestedResponses && messages[messages.length - 1].suggestedResponses!.length > 0 ? (
             <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-3 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Gợi ý trả lời</p>
                {messages[messages.length - 1].suggestedResponses!.map((suggestion, idx) => (
                  <div key={idx} className="flex flex-col items-start gap-1 p-2 bg-amber-100/50 rounded-lg">
                    <p className="text-xs font-medium text-amber-800">
                      {!vocabularyList || vocabularyList.length === 0 ? suggestion : suggestion.split(new RegExp(`(\\b(?:${vocabularyList.join('|')})\\b)`, 'gi')).map((part, i) => 
                        part && vocabularyList.find(v => v?.toLowerCase() === part.toLowerCase()) 
                          ? <span key={i} className="bg-indigo-200 text-indigo-900 rounded px-0.5">{part}</span> 
                          : part
                      )}
                    </p>
                    <button 
                      onClick={() => speak(suggestion)}
                      className="text-[10px] flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold transition-colors"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Nghe
                    </button>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-3">
                <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Mẹo</p>
                <p className="text-xs font-medium text-amber-800">Nhấn Enter để gửi tin nhắn. Hãy cố gắng dùng câu hoàn chỉnh.</p>
             </div>
           )}

           {messages.some(m => m.feedback) && (
              <div className="mt-auto bg-slate-50 rounded-2xl border border-slate-100 p-4">
                 <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ghi nhận lỗi</p>
                 <p className="text-xs font-medium text-slate-800">AI vừa sửa lỗi ngữ pháp cho bạn. Đừng lo lắng, hãy tiếp tục luyện tập!</p>
              </div>
           )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
              <Link to="/" className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="font-bold text-sm text-slate-800">{topicTitle}</span>
           </div>
           <button 
             onClick={() => markTopicComplete(topicId || '')}
             className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-widest"
           >
             Xong
           </button>
        </div>

        {/* Chat Status Header */}
        <div className="hidden md:flex p-4 border-b border-slate-100 justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-indigo-500 animate-pulse" : "bg-emerald-500")} />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {isLoading ? "AI đang phản hồi..." : "AI Đang lắng nghe..."}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded uppercase tracking-widest">EN-US</span>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm",
                  msg.role === 'user' ? "bg-slate-800 text-white" : "bg-indigo-100 text-indigo-700 font-bold italic"
              )}>
                  {msg.role === 'user' ? 'ME' : 'E'}
              </div>
              <div className={cn("max-w-[85%] md:max-w-[80%]", msg.role === 'user' ? "flex flex-col items-end" : "flex flex-col items-start")}>
                <div className={cn(
                  "p-3.5 rounded-2xl text-sm shadow-sm relative group text-slate-800 flex flex-col",
                  msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-100 rounded-tl-none"
                )}>
                  <div className="markdown-body leading-relaxed">
                      <ReactMarkdown components={{
                        p: ({node, ...props}) => {
                           if (msg.role !== 'model' || !vocabularyList || vocabularyList.length === 0) return <p {...props} />;
                           const regex = new RegExp(`(\\b(?:${vocabularyList.join('|')})\\b)`, 'gi');
                           return <p {...props}>
                             {Array.isArray(props.children) 
                               ? props.children.map((child, i) => {
                                   if (typeof child === 'string') {
                                     return child.split(regex).map((part, j) => 
                                       part && vocabularyList.find(v => v?.toLowerCase() === part.toLowerCase()) 
                                         ? <span key={`${i}-${j}`} className="bg-indigo-300 text-indigo-900 rounded px-1 font-semibold">{part}</span> 
                                         : part
                                     );
                                   }
                                   return child;
                                 })
                               : typeof props.children === 'string'
                                 ? props.children.split(regex).map((part, i) => 
                                     part && vocabularyList.find(v => v?.toLowerCase() === part.toLowerCase()) 
                                       ? <span key={i} className="bg-indigo-300 text-indigo-900 rounded px-1 font-semibold">{part}</span> 
                                       : part
                                   )
                                 : props.children
                             }
                           </p>;
                        }
                      }}>
                        {msg.content}
                      </ReactMarkdown>
                  </div>
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => speak(msg.content)}
                      className="absolute -right-8 top-1 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100 bg-white"
                      title="Nghe phát âm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  )}
                </div>

                {msg.translation && (
                  <div className="mt-1.5 text-[11px] text-slate-500 px-1 font-medium italic">
                    {msg.translation}
                  </div>
                )}
                
                {msg.feedback && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2 shadow-sm w-full md:min-w-[300px]">
                    <span className="text-amber-500 font-bold shrink-0">💡</span>
                    <div className="text-xs text-amber-800 font-medium">
                      <span className="block mb-1 text-[10px] uppercase font-bold tracking-widest text-amber-600/70">Mẹo Ngữ Pháp</span>
                      {msg.feedback}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm text-indigo-700 italic">
                  E
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center justify-center">
                 <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 md:rounded-b-3xl">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
             <div className="flex-grow bg-white rounded-full border border-slate-200 px-4 py-2 flex items-center shadow-sm relative focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Gõ tin nhắn bằng tiếng Anh..."
                  className="w-full bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400 font-medium h-8"
                />
             </div>
             
             <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm",
                  isRecording 
                    ? "bg-rose-100 text-rose-500 border border-rose-200 animate-pulse" 
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
             >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
             </button>

             <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:shadow-none"
             >
                <Send className="w-5 h-5 ml-1" />
             </button>
          </form>
        </div>
      </div>
    </div>
  );
}
