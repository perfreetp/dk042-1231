import { create } from 'zustand';
import type { UserRole, User } from '@/types';

interface AppState {
  currentRole: UserRole;
  user: User;
  favoriteJobIds: string[];
  setRole: (role: UserRole) => void;
  toggleFavorite: (jobId: string) => void;
  isFavorite: (jobId: string) => boolean;
}

const defaultUser: User = {
  id: 'u_001',
  name: '张小明',
  avatar: 'https://picsum.photos/id/64/200/200',
  phone: '138****8888',
  role: 'worker',
  rating: 4.8,
  completedJobs: 36
};

export const useStore = create<AppState>((set, get) => ({
  currentRole: 'worker',
  user: defaultUser,
  favoriteJobIds: ['job_002', 'job_005'],

  setRole: (role) => {
    console.log('[Store] setRole:', role);
    set({
      currentRole: role,
      user: { ...get().user, role }
    });
  },

  toggleFavorite: (jobId) => {
    const { favoriteJobIds } = get();
    const exists = favoriteJobIds.includes(jobId);
    console.log('[Store] toggleFavorite:', jobId, exists ? 'remove' : 'add');
    set({
      favoriteJobIds: exists
        ? favoriteJobIds.filter(id => id !== jobId)
        : [...favoriteJobIds, jobId]
    });
  },

  isFavorite: (jobId) => get().favoriteJobIds.includes(jobId)
}));
