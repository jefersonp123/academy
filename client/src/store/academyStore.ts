import { create } from 'zustand';
import type { Academy, AcademySettings, Category } from '@/types';

interface AcademyState {
  academy: Academy | null;
  settings: AcademySettings | null;
  categories: Category[];
  isLoading: boolean;
}

interface AcademyActions {
  setAcademy: (academy: Academy) => void;
  setSettings: (settings: AcademySettings) => void;
  setCategories: (categories: Category[]) => void;
  clear: () => void;
}

export const useAcademyStore = create<AcademyState & AcademyActions>((set) => ({
  academy: null,
  settings: null,
  categories: [],
  isLoading: false,

  setAcademy: (academy) => set({ academy }),
  setSettings: (settings) => set({ settings }),
  setCategories: (categories) => set({ categories }),
  clear: () => set({ academy: null, settings: null, categories: [] }),
}));
