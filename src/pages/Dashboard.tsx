import { Flame, Star, Coffee, Plane, Briefcase, Play, Plus, MessageCircle, BookOpen, Paperclip, Trash2, X, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { extractVocabularyFromFile } from '../lib/gemini';

const TOPICS = [
  { id: 'coffee', title: 'Tại quán cà phê', description: 'Cách gọi món & trò chuyện', icon: Coffee, level: 'Beginner', badge: 'bg-amber-50 text-amber-600 border border-amber-100', iconBg: 'bg-amber-100 text-amber-700' },
  { id: 'travel', title: 'Sân bay & Du lịch', description: 'Thủ tục & nhận hành lý', icon: Plane, level: 'Intermediate', badge: 'bg-blue-50 text-blue-600 border border-blue-100', iconBg: 'bg-blue-100 text-blue-700' },
  { id: 'job', title: 'Phỏng vấn xin việc', description: 'Giới thiệu & trả lời', icon: Briefcase, level: 'Advanced', badge: 'bg-rose-50 text-rose-600 border border-rose-100', iconBg: 'bg-rose-100 text-rose-700' },
  { id: 'shopping', title: 'Mua sắm', description: 'Hỏi giá, mặc cả & thanh toán', icon: Star, level: 'Beginner', badge: 'bg-indigo-50 text-indigo-600 border border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700' },
  { id: 'health', title: 'Bệnh viện & Sức khỏe', description: 'Mô tả triệu chứng', icon: Flame, level: 'Intermediate', badge: 'bg-teal-50 text-teal-600 border border-teal-100', iconBg: 'bg-teal-100 text-teal-700' },
  { id: 'meeting', title: 'Thuyết trình cuộc họp', description: 'Dẫn dắt & thuyết phục', icon: Briefcase, level: 'Advanced', badge: 'bg-purple-50 text-purple-600 border border-purple-100', iconBg: 'bg-purple-100 text-purple-700' },
];

export default function Dashboard() {
  const { xp, streak, currentLevel, completedTopics, customTopics, addCustomTopic, vocabularyList, addVocabulary, removeVocabulary } = useAppStore();
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    
    const newId = `custom-${Date.now()}`;
    addCustomTopic({
      id: newId,
      title: newTopicName,
      description: 'Chủ đề học tự chọn'
    });
    
    navigate(`/chat/${newId}`);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file dưới 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await fileToBase64(file);
      const mimeType = file.type || 'application/octet-stream';
      const extractedWords = await extractVocabularyFromFile({ mimeType, data: base64Data });
      
      if (extractedWords && extractedWords.length > 0) {
        addVocabulary(extractedWords);
        alert(`Đã trích xuất thành công ${extractedWords.length} từ vựng!`);
      } else {
        alert("Không tìm thấy từ vựng nào hoặc có lỗi xảy ra.");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi phân tích file.");
    } finally {
      setIsUploading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-4 relative">
      {isVocabModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Kho từ vựng của bạn</h3>
                <p className="text-slate-500 text-sm">AI sẽ ưu tiên dùng các từ này để gợi ý.</p>
              </div>
              <button onClick={() => setIsVocabModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {vocabularyList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có từ vựng nào.</p>
                  <p className="text-sm">Hãy tải lên một tài liệu để trích xuất từ vựng mới!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vocabularyList.map((word, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <span>{word}</span>
                      <button onClick={() => removeVocabulary(word)} className="hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
              <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3 rounded-xl font-bold transition-colors cursor-pointer text-sm shadow-sm">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang phân tích tài liệu...
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4" />
                    Tải lên (PDF, Word, Excel, PNG)
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFileUpload} disabled={isUploading} />
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chào mừng trở lại! 👋</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200 shadow-sm">
            <span>🔥</span>
            <span className="text-sm font-bold">{streak} Ngày</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full shadow-sm border border-slate-200">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-bold">{xp} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4">
        
        {/* Next Lesson - Span 8 */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full items-start">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Bài học tiếp theo</h2>
            <h3 className="text-3xl font-bold text-slate-800 mb-2">Thuyết trình cuộc họp</h3>
            <p className="text-slate-500 mb-8 max-w-md text-sm leading-relaxed">Luyện tập cách mở đầu và dẫn dắt một cuộc họp hiệu quả bằng tiếng Anh cùng giáo viên AI.</p>
            <Link to="/chat/meeting" className="mt-auto items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex">
              <Play className="w-4 h-4 fill-current" />
              Bắt đầu học ngay
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 md:opacity-10 pointer-events-none transform translate-x-12 translate-y-12 transition-transform group-hover:scale-110">
            <Briefcase className="w-72 h-72" />
          </div>
        </div>

        {/* Level / Progress - Span 4 */}
        <div className="md:col-span-4 bg-indigo-900 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 blur-2xl opacity-50 bg-indigo-500 w-32 h-32 rounded-full transform -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="relative z-10">
             <h2 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">Cấp độ hiện tại</h2>
            <div className="text-4xl font-bold tracking-tight mb-2">{currentLevel}</div>
            <p className="text-sm text-indigo-200 opacity-90">15 / 20 bài học hoàn thành.</p>
          </div>
          <div className="relative z-10 mt-8">
            <div className="flex justify-between text-xs font-bold mb-2 text-indigo-100">
              <span className="uppercase tracking-widest">Tiến trình</span>
              <span>75%</span>
            </div>
            <div className="h-2.5 bg-indigo-950/50 rounded-full overflow-hidden border border-indigo-800">
              <div className="h-full bg-white w-[75%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </div>
        
        {/* Suggested Topics Heading - Span 12 */}
        <div className="md:col-span-12 flex flex-wrap items-center gap-4 mt-6 mb-2 px-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex-1">Chủ đề đề xuất</h3>
            <button 
              onClick={() => setIsVocabModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-full text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              Kho từ vựng ({vocabularyList.length})
            </button>
            <button 
              onClick={() => setIsCreatingTopic(!isCreatingTopic)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Tạo chủ đề
            </button>
        </div>

        {isCreatingTopic && (
          <div className="md:col-span-12 bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-sm flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-top-2">
             <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
             <h4 className="font-bold text-slate-800 mb-3 text-lg">Bạn muốn luyện nói về chủ đề gì?</h4>
             <form onSubmit={handleCreateTopic} className="flex flex-col sm:flex-row gap-3">
               <input 
                 autoFocus
                 type="text" 
                 value={newTopicName}
                 onChange={(e) => setNewTopicName(e.target.value)}
                 placeholder="VD: Sở thích âm nhạc, Bàn về bóng đá, Giải thích code..."
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 font-medium"
               />
               <button 
                 type="submit" 
                 disabled={!newTopicName.trim()}
                 className="bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
               >
                 <MessageCircle className="w-4 h-4" /> Bắt đầu
               </button>
             </form>
          </div>
        )}

        {/* Custom Topics List */}
        {customTopics.map((topic) => {
          const isCompleted = completedTopics.includes(topic.id);
          return (
            <Link to={`/chat/${topic.id}`} key={topic.id} className="md:col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col group relative">
              {isCompleted && (
                  <div className="absolute top-6 right-6 text-emerald-500 bg-emerald-50 p-1.5 rounded-full border border-emerald-100 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600`}>
                    <MessageCircle className="w-6 h-6" />
                 </div>
                 <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200`}>
                    Tự Chọn
                 </div>
              </div>
              <h4 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{topic.title}</h4>
              <p className="text-slate-500 text-sm mt-auto">{topic.description}</p>
            </Link>
          )
        })}

        {/* Topics List - 3 elements spanning 4 cols each */}
        {TOPICS.map((topic, idx) => {
          const Icon = topic.icon;
          const isCompleted = completedTopics.includes(topic.id);
          return (
            <Link to={`/chat/${topic.id}`} key={topic.id} className="md:col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col group relative">
              {isCompleted && (
                  <div className="absolute top-6 right-6 text-emerald-500 bg-emerald-50 p-1.5 rounded-full border border-emerald-100 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${topic.iconBg}`}>
                    <Icon className="w-6 h-6" />
                 </div>
                 <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${topic.badge}`}>
                    {topic.level}
                 </div>
              </div>
              <h4 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{topic.title}</h4>
              <p className="text-slate-500 text-sm mt-auto">{topic.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
