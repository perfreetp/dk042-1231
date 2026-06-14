import type { Task, Application } from '@/types';

export const mockTasks: Task[] = [
  {
    id: 'task_001',
    jobId: 'job_001',
    jobTitle: '餐厅传菜员',
    jobType: '餐饮',
    merchantName: '海底捞火锅（朝阳大悦城店）',
    date: '2026-06-15',
    startTime: '17:00',
    endTime: '22:00',
    address: '北京市朝阳区朝阳北路101号大悦城6层',
    hourlyRate: 28,
    estimatedHours: 5,
    status: 'pending',
    appealStatus: 'none'
  },
  {
    id: 'task_002',
    jobId: 'job_008',
    jobTitle: '甜品店兼职服务员',
    jobType: '餐饮',
    merchantName: '满记甜品（三里屯店）',
    date: '2026-06-14',
    startTime: '12:00',
    endTime: '20:00',
    address: '北京市朝阳区三里屯太古里南区',
    hourlyRate: 26,
    estimatedHours: 8,
    status: 'ongoing',
    checkInTime: '2026-06-14 11:55',
    appealStatus: 'none'
  },
  {
    id: 'task_003',
    jobId: 'job_004',
    jobTitle: '超市理货员',
    jobType: '零售',
    merchantName: '永辉超市（望京店）',
    date: '2026-06-13',
    startTime: '08:00',
    endTime: '16:00',
    address: '北京市朝阳区望京西园二区',
    hourlyRate: 25,
    estimatedHours: 8,
    actualHours: 8,
    checkInTime: '2026-06-13 07:52',
    checkOutTime: '2026-06-13 16:05',
    status: 'completed',
    appealStatus: 'none'
  },
  {
    id: 'task_004',
    jobId: 'job_002',
    jobTitle: '会展中心展位协助',
    jobType: '会展',
    merchantName: '国家会议中心',
    date: '2026-06-10',
    startTime: '08:30',
    endTime: '18:00',
    address: '北京市朝阳区天辰东路7号国家会议中心',
    hourlyRate: 35,
    estimatedHours: 9.5,
    actualHours: 9.5,
    checkInTime: '2026-06-10 08:20',
    checkOutTime: '2026-06-10 18:10',
    status: 'settled',
    appealStatus: 'none'
  },
  {
    id: 'task_005',
    jobId: 'job_005',
    jobTitle: '写字楼保洁阿姨',
    jobType: '保洁',
    merchantName: '国贸物业',
    date: '2026-06-12',
    startTime: '06:00',
    endTime: '14:00',
    address: '北京市朝阳区建国门外大街1号国贸三期',
    hourlyRate: 22,
    estimatedHours: 8,
    actualHours: 7.5,
    checkInTime: '2026-06-12 06:15',
    checkOutTime: '2026-06-12 14:00',
    status: 'completed',
    leaveApplied: false,
    appealStatus: 'pending'
  },
  {
    id: 'task_006',
    jobId: 'job_009',
    jobTitle: '618家电临时促销员',
    jobType: '零售',
    merchantName: '国美电器（安贞店）',
    date: '2026-06-16',
    startTime: '09:30',
    endTime: '21:30',
    address: '北京市朝阳区安贞里二区国美电器',
    hourlyRate: 30,
    estimatedHours: 12,
    status: 'pending',
    appealStatus: 'none'
  }
];

export const mockApplications: Application[] = [
  {
    id: 'app_001',
    jobId: 'job_001',
    userId: 'u_002',
    userName: '李大强',
    userAvatar: 'https://picsum.photos/id/91/200/200',
    status: 'pending',
    appliedAt: '2026-06-14 10:20'
  },
  {
    id: 'app_002',
    jobId: 'job_001',
    userId: 'u_003',
    userName: '王小芳',
    userAvatar: 'https://picsum.photos/id/338/200/200',
    status: 'pending',
    appliedAt: '2026-06-14 09:50',
    message: '有3年餐饮经验，可长期做'
  },
  {
    id: 'app_003',
    jobId: 'job_001',
    userId: 'u_004',
    userName: '赵铁柱',
    userAvatar: 'https://picsum.photos/id/1027/200/200',
    status: 'approved',
    appliedAt: '2026-06-13 16:30'
  },
  {
    id: 'app_004',
    jobId: 'job_007',
    userId: 'u_005',
    userName: '孙大力',
    userAvatar: 'https://picsum.photos/id/177/200/200',
    status: 'pending',
    appliedAt: '2026-06-14 08:10'
  },
  {
    id: 'app_005',
    jobId: 'job_007',
    userId: 'u_006',
    userName: '周小虎',
    userAvatar: 'https://picsum.photos/id/64/200/200',
    status: 'pending',
    appliedAt: '2026-06-14 07:45',
    message: '长期做夜班，体力没问题'
  },
  {
    id: 'app_006',
    jobId: 'job_008',
    userId: 'u_007',
    userName: '林小美',
    userAvatar: 'https://picsum.photos/id/64/200/200',
    status: 'pending',
    appliedAt: '2026-06-14 11:30'
  }
];

export const getTasksByStatus = (status: Task['status']): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

export const getApplicationsByJobId = (jobId: string): Application[] => {
  return mockApplications.filter(app => app.jobId === jobId);
};
