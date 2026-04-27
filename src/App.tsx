/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Headphones, BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ChatSection from './pages/ChatSection';
import PracticeSession from './pages/PracticeSession';
import Vocabulary from './pages/Vocabulary';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Luyện giao tiếp', path: '/chat', icon: MessageSquare },
    { name: 'Bài tập', path: '/practice', icon: Headphones },
    { name: 'Kho từ vựng', path: '/vocabulary', icon: BookOpen },
  ];

  return (
    <>
      <div className="md:hidden p-4 flex justify-between items-center bg-white border-b border-slate-200 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg italic">E</span>
          </div>
          EngMaster
        </h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-slate-200 p-6 flex flex-col transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static z-50`}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl italic">E</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">EngMaster</h1>
        </div>

        <nav className="flex-1 space-y-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-bold text-sm ${
                  active 
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full md:max-w-[calc(100vw-16rem)] min-h-screen overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat/:topicId?" element={<ChatSection />} />
            <Route path="/practice" element={<PracticeSession />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

