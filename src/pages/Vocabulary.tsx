import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BookOpen, Trash2, Volume2, Search, Loader2 } from 'lucide-react';
import { explainWord } from '../lib/gemini';

export default function Vocabulary() {
  const { vocabularyList, removeVocabulary, currentLevel } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{meaning: string, example: string, pronunciation: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredWords = vocabularyList.filter(word => 
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setExplanation(null);
    setIsLoading(true);
    
    try {
      const result = await explainWord(word, currentLevel);
      setExplanation(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* List Section */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kho từ vựng</h1>
            <p className="text-sm text-slate-500 font-medium">{vocabularyList.length} từ / cụm từ</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-2">
          {filteredWords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <BookOpen className="w-10 h-10 mb-3 opacity-20" />
              <p>Chưa có từ vựng nào.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredWords.map((word) => (
                <li key={word} className="flex space-x-2">
                  <button
                    onClick={() => handleWordClick(word)}
                    className={`flex-1 text-left px-4 py-3 rounded-2xl transition-colors font-medium ${selectedWord === word ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    {word}
                  </button>
                  <button
                    onClick={() => removeVocabulary(word)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                    title="Xóa từ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail Section */}
      <div className="w-full md:w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedWord ? (
          <div className="p-8 md:p-12 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">{selectedWord}</h2>
              <button 
                onClick={() => speakWord(selectedWord)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 p-4 rounded-2xl font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tra cứu nghĩa và ví dụ...
              </div>
            ) : explanation ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Phát âm (IPA)</p>
                  <p className="text-xl font-mono text-slate-700">{explanation.pronunciation}</p>
                </div>
                
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2">Ý nghĩa</p>
                  <p className="text-lg font-medium text-amber-900 leading-relaxed">{explanation.meaning}</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2">Ví dụ</p>
                  <div className="flex items-start gap-3">
                    <p className="text-lg text-emerald-900 italic flex-1 leading-relaxed">"{explanation.example}"</p>
                    <button 
                      onClick={() => speakWord(explanation.example)}
                      className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 transition-colors shrink-0 mt-1"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa chọn từ vựng</h3>
            <p>Chọn một từ trong danh sách bên trái để xem nghĩa và ví dụ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
