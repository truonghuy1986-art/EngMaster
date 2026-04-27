import { useState, useEffect } from 'react';
import { Mic, RefreshCcw, Play, Loader2 } from 'lucide-react';
import { scorePronunciation, generatePracticeSentences } from '../lib/gemini';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export default function PracticeSession() {
  const [sentences, setSentences] = useState<{english: string, vietnamese: string, phonetic?: string}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingSentences, setIsLoadingSentences] = useState(true);
  
  const { addXp, vocabularyList, currentLevel } = useAppStore();

  useEffect(() => {
    async function loadSentences() {
      setIsLoadingSentences(true);
      const generated = await generatePracticeSentences(vocabularyList, currentLevel);
      setSentences(generated);
      setIsLoadingSentences(false);
    }
    loadSentences();
  }, [vocabularyList, currentLevel]);

  const currentSentence = sentences.length > 0 ? sentences[currentIndex] : null;

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!currentSentence) return;

    setResult(null);
    setTranscript('');
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsRecording(false);
        setIsEvaluating(true);
        
        const evalResult = await scorePronunciation(text, currentSentence.english);
        setResult(evalResult);
        
        if (evalResult.score > 80) {
            addXp(15);
        }
        
        setIsEvaluating(false);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setTranscript("Vui lòng cấp quyền truy cập micro để sử dụng tính năng này.");
        } else {
          setTranscript("Không thể nhận diện giọng nói. Vui lòng thử lại.");
        }
      };
      
      recognition.start();
    } else {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
    }
  };

  const nextSentence = async () => {
    if (sentences.length === 0) return;
    setResult(null);
    setTranscript('');
    
    if (currentIndex + 1 >= sentences.length) {
      setIsLoadingSentences(true);
      const more = await generatePracticeSentences(vocabularyList, currentLevel);
      if (more && more.length > 0) {
        setSentences(prev => [...prev, ...more]);
        setCurrentIndex(currentIndex + 1);
        speak(more[0].english);
      } else {
        setCurrentIndex(0);
        speak(sentences[0].english);
      }
      setIsLoadingSentences(false);
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      speak(sentences[nextIdx].english);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  const highlightVocabulary = (text: string) => {
    if (!vocabularyList || vocabularyList.length === 0) return text;
    const regex = new RegExp(`(\\b(?:${vocabularyList.join('|')})\\b)`, 'gi');
    return text.split(regex).map((part, i) => 
      part && typeof part === 'string' && vocabularyList.find(v => v?.toLowerCase() === part.toLowerCase()) 
        ? <span key={i} className="bg-indigo-200 text-indigo-900 rounded px-1 font-semibold">{part}</span> 
        : part
    );
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex flex-col mb-4 px-2">
         <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Khu vực luyện tập</h2>
         <p className="text-slate-500 text-sm">Cải thiện phát âm của bạn với phản hồi AI theo thời gian thực.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4">
        
        {/* Main interactive area */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          {isLoadingSentences ? (
            <div className="flex flex-col items-center justify-center text-indigo-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-medium text-slate-500">Đang chuẩn bị bài tập từ vựng...</p>
            </div>
          ) : currentSentence ? (
            <>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border border-slate-200 px-3 py-1 rounded-full bg-slate-50">
                Câu mẫu ({currentIndex + 1}/{sentences.length})
              </h3>
  
              <div className="flex items-start gap-4 mb-2 w-full max-w-lg">
                 <button 
                    onClick={() => speak(currentSentence.english)}
                    className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100"
                    title="Nghe phát âm chuẩn"
                 >
                    <Play className="w-5 h-5 ml-1 fill-current" />
                 </button>
                 <div className="flex flex-col gap-2">
                   <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                     "{highlightVocabulary(currentSentence.english)}"
                   </h3>
                   {currentSentence.phonetic && (
                     <p className="text-sm font-mono text-slate-400">
                       {currentSentence.phonetic}
                     </p>
                   )}
                   <p className="text-sm text-slate-500 italic">
                     {currentSentence.vietnamese}
                   </p>
                 </div>
              </div>
  
              <div className="relative mb-6 mt-8">
                {isEvaluating && (
                   <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-full backdrop-blur-sm">
                       <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                   </div>
                )}
                
                <button
                  onClick={handleRecordToggle}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 border-4",
                    isRecording 
                      ? "bg-rose-500 shadow-rose-200 border-rose-100 shadow-xl animate-pulse" 
                      : "bg-indigo-600 shadow-indigo-200 border-indigo-100"
                  )}
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              </div>
              
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center mt-2 h-4">
                  {isRecording ? "Đang ghi âm..." : isEvaluating ? "AI Đang đánh giá..." : "Nhấn để nói"}
              </div>
            </>
          ) : (
             <div className="text-slate-500 font-medium">Không thể tải bài tập.</div>
          )}
        </div>

        {/* Action & Result Side */}
        <div className="md:col-span-4 flex flex-col gap-4">
           {/* Top small card: Transcript */}
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bạn vừa nói</h3>
              {transcript ? (
                <p className="text-slate-700 italic text-sm p-4 bg-slate-50 rounded-2xl font-medium border border-slate-100">"{transcript}"</p>
              ) : (
                <div className="flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-bold uppercase">
                   Chưa có dữ liệu
                </div>
              )}
           </div>

           {/* Emerald card: Result */}
           {result && (
              <div className={cn(
                  "rounded-3xl p-6 shadow-sm flex flex-col text-white transition-all animate-in fade-in slide-in-from-bottom-2",
                  result.score >= 80 ? "bg-emerald-500" : 
                  result.score >= 50 ? "bg-amber-500" : "bg-rose-500"
              )}>
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-sm">Điểm phát âm</h3>
                 </div>
                 <div className="text-5xl font-bold mb-4">{result.score}<span className="text-xl opacity-80">/100</span></div>
                 <div className="w-full bg-white/20 h-1.5 rounded-full mb-4">
                    <div className="bg-white h-full rounded-full transition-all duration-1000" style={{width: `${result.score}%`}}></div>
                 </div>
                 <p className="text-sm font-medium leading-tight opacity-95">
                    {result.feedback.split(/('[\w\s-]+')/g).map((part, i) => {
                       if (part.startsWith("'") && part.endsWith("'")) {
                         const word = part.slice(1, -1);
                         return (
                            <span 
                              key={i} 
                              onClick={() => speak(word)} 
                              className="cursor-pointer font-bold bg-white/20 px-1.5 py-0.5 rounded-md hover:bg-white/40 transition-colors inline-block"
                              title="Nhấn để nghe phát âm"
                            >
                              {part}
                            </span>
                         )
                       }
                       return <span key={i}>{part}</span>
                    })}
                 </p>
              </div>
           )}

           {!result && !isEvaluating && (
             <div className="flex-1 hidden md:flex rounded-3xl border border-slate-200 p-6 shadow-sm bg-slate-50 flex-col items-center justify-center text-slate-400">
                <Mic className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase text-center">Kết quả sẽ hiển thị ở đây</p>
             </div>
           )}

           <button 
              onClick={nextSentence}
              disabled={isRecording || isEvaluating}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors disabled:opacity-50 border border-slate-200 shadow-sm"
           >
              Chuyển câu tiếp theo
           </button>
        </div>
        
      </div>
    </div>
  );
}
