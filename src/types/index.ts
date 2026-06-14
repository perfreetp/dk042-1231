export type UserRole = 'worker' | 'merchant';

export type JobType = '餐饮' | '会展' | '仓储' | '物流' | '零售' | '保洁' | '安保' | '其他';

export type JobStatus = 'recruiting' | 'full' | 'closed';

export type TaskStatus = 'pending' | 'ongoing' | 'completed' | 'settled' | 'leave' | 'appeal';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  role: UserRole;
  rating: number;
  completedJobs: number;
}

export interface JobShift {
  date: string;
  startTime: string;
  endTime: string;
}

export interface Job {
  id: string;
  title: string;
  type: JobType;
  merchantId: string;
  merchantName: string;
  merchantAvatar: string;
  description: string;
  requirements: string[];
  shifts: JobShift[];
  headcount: number;
  appliedCount: number;
  hourlyRate: number;
  salaryNote: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  status: JobStatus;
  tags: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: ApplicationStatus;
  appliedAt: string;
  message?: string;
}

export interface Task {
  id: string;
  jobId: string;
  jobTitle: string;
  jobType: JobType;
  merchantName: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  hourlyRate: number;
  estimatedHours: number;
  status: TaskStatus;
  checkInTime?: string;
  checkOutTime?: string;
  actualHours?: number;
  leaveApplied?: boolean;
  leaveReason?: string;
  appealStatus?: 'none' | 'pending' | 'resolved';
  appealReason?: string;
}

export interface SettlementItem {
  id: string;
  taskId: string;
  jobTitle: string;
  date: string;
  baseAmount: number;
  deductions: { label: string; amount: number }[];
  bonus: { label: string; amount: number }[];
  netAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

export interface WithdrawRecord {
  id: string;
  amount: number;
  method: '微信' | '支付宝' | '银行卡';
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface Evaluation {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  taskId: string;
  jobTitle: string;
  punctuality: number;
  cooperation: number;
  completion: number;
  comment: string;
  tags: string[];
  createdAt: string;
}
