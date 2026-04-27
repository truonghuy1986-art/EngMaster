import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  translation?: string;
  feedback?: string; // Grammar/vocab feedback on this message
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
};

export type CustomTopic = {
  id: string;
  title: string;
  description: string;
};

interface AppState {
  xp: number;
  streak: number;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  userInterests: string[];
  completedTopics: string[];
  customTopics: CustomTopic[];
  vocabularyList: string[];
  addXp: (amount: number) => void;
  markTopicComplete: (topicId: string) => void;
  updateLevel: (level: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  addCustomTopic: (topic: CustomTopic) => void;
  addVocabulary: (words: string[]) => void;
  removeVocabulary: (word: string) => void;
  clearVocabulary: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      xp: 0,
      streak: 1,
      currentLevel: 'Beginner',
      userInterests: ['Travel', 'Business', 'Daily Life'],
      completedTopics: [],
      customTopics: [],
      vocabularyList: [],
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      markTopicComplete: (topicId) =>
        set((state) => ({
          completedTopics: state.completedTopics.includes(topicId)
            ? state.completedTopics
            : [...state.completedTopics, topicId],
        })),
      updateLevel: (level) => set({ currentLevel: level }),
      addCustomTopic: (topic) => set((state) => ({ customTopics: [...state.customTopics, topic] })),
      addVocabulary: (words) => set((state) => {
        const newSet = new Set([...state.vocabularyList, ...words]);
        return { vocabularyList: Array.from(newSet) };
      }),
      removeVocabulary: (word) => set((state) => ({
        vocabularyList: state.vocabularyList.filter(w => w !== word)
      })),
      clearVocabulary: () => set({ vocabularyList: [] }),
    }),
    {
      name: 'english-learning-storage',
    }
  )
);
