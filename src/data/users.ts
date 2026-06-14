import type { User } from '@/types';

export const mockUsers: Record<string, User> = {
  'u_001': {
    id: 'u_001',
    name: '张小明',
    avatar: 'https://picsum.photos/id/64/200/200',
    phone: '138****8888',
    role: 'worker',
    rating: 4.8,
    completedJobs: 36
  },
  'm_001': {
    id: 'm_001',
    name: '海底捞餐饮管理有限公司',
    avatar: 'https://picsum.photos/id/292/200/200',
    phone: '010-****8888',
    role: 'merchant',
    rating: 4.9,
    completedJobs: 156
  }
};
