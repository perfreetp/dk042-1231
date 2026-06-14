import { create } from 'zustand';
import dayjs from 'dayjs';
import type { UserRole, User, Job, JobShift, Task, Application, JobType, JobStatus } from '@/types';
import { mockJobs } from '@/data/jobs';
import { mockTasks, mockApplications } from '@/data/tasks';
import { mockUsers } from '@/data/users';

let _idCounter = 1000;
const genId = (prefix: string) => {
  _idCounter += 1;
  return `${prefix}_${_idCounter}`;
};

export const calculateShiftHours = (startTime: string, endTime: string): number => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  return Number(((endMinutes - startMinutes) / 60).toFixed(1));
};

interface AppState {
  currentRole: UserRole;
  user: User;
  merchantUser: User;
  favoriteJobIds: string[];
  jobs: Job[];
  tasks: Task[];
  applications: Application[];

  setRole: (role: UserRole) => void;
  toggleFavorite: (jobId: string) => void;
  isFavorite: (jobId: string) => boolean;

  addJob: (jobData: Omit<Job, 'id' | 'merchantId' | 'merchantName' | 'merchantAvatar' | 'appliedCount' | 'status' | 'createdAt'>) => Job;
  getJobById: (id: string) => Job | undefined;
  getMyJobs: () => Job[];
  getMyFavoriteJobs: () => Job[];

  applyToJob: (jobId: string, message?: string) => Application | null;
  getApplicationsByJobId: (jobId: string) => Application[];
  getMyApplications: () => Application[];
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;

  getTasksByStatus: (status: Task['status']) => Task[];
  getMyTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  checkInTask: (taskId: string) => void;
  checkOutTask: (taskId: string) => void;
  applyLeave: (taskId: string, reason?: string) => void;
  confirmTaskHours: (taskId: string, actualHours: number) => void;
  submitAppeal: (taskId: string, reason: string) => void;

  calculateTaskIncome: (taskId: string) => number;
}

const defaultUser = mockUsers['u_001'];
const merchantUser = mockUsers['m_001'];

export const useStore = create<AppState>((set, get) => ({
  currentRole: 'worker',
  user: defaultUser,
  merchantUser,
  favoriteJobIds: ['job_002', 'job_005'],
  jobs: [...mockJobs],
  tasks: [...mockTasks],
  applications: [...mockApplications],

  setRole: (role) => {
    console.log('[Store] setRole:', role);
    set({
      currentRole: role,
      user: role === 'worker' ? defaultUser : merchantUser
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

  isFavorite: (jobId) => get().favoriteJobIds.includes(jobId),

  addJob: (jobData) => {
    const { merchantUser: m } = get();
    const newJob: Job = {
      ...jobData,
      id: genId('job'),
      merchantId: m.id,
      merchantName: m.name,
      merchantAvatar: m.avatar,
      appliedCount: 0,
      status: 'recruiting' as JobStatus,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };
    console.log('[Store] addJob:', newJob.id, newJob.title);
    set(state => ({ jobs: [newJob, ...state.jobs] }));
    return newJob;
  },

  getJobById: (id) => get().jobs.find(j => j.id === id),

  getMyJobs: () => {
    const { merchantUser: m } = get();
    return get().jobs.filter(j => j.merchantId === m.id);
  },

  getMyFavoriteJobs: () => {
    const { favoriteJobIds, jobs } = get();
    return jobs.filter(j => favoriteJobIds.includes(j.id));
  },

  applyToJob: (jobId, message) => {
    const { user, jobs, applications } = get();
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'recruiting' || job.appliedCount >= job.headcount) {
      return null;
    }
    const alreadyApplied = applications.some(a => a.jobId === jobId && a.userId === user.id);
    if (alreadyApplied) return null;

    const newApp: Application = {
      id: genId('app'),
      jobId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      status: 'pending',
      appliedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      message
    };

    set(state => ({
      applications: [newApp, ...state.applications],
      jobs: state.jobs.map(j => j.id === jobId ? { ...j, appliedCount: j.appliedCount + 1 } : j)
    }));
    console.log('[Store] applyToJob:', newApp.id, jobId);
    return newApp;
  },

  getApplicationsByJobId: (jobId) => get().applications.filter(a => a.jobId === jobId),

  getMyApplications: () => {
    const { user } = get();
    return get().applications.filter(a => a.userId === user.id);
  },

  approveApplication: (appId) => {
    const { applications, jobs, tasks, user } = get();
    const app = applications.find(a => a.id === appId);
    if (!app || app.status !== 'pending') return;

    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return;

    const newTasks: Task[] = job.shifts.map(shift => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      return {
        id: genId('task'),
        jobId: job.id,
        jobTitle: job.title,
        jobType: job.type,
        merchantName: job.merchantName,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        address: job.address,
        hourlyRate: job.hourlyRate,
        estimatedHours: hours,
        status: 'pending' as const,
        appealStatus: 'none' as const
      };
    });

    set(state => ({
      applications: state.applications.map(a => a.id === appId ? { ...a, status: 'approved' as const } : a),
      tasks: [...state.tasks, ...newTasks]
    }));
    console.log('[Store] approveApplication:', appId, '生成', newTasks.length, '个任务');
  },

  rejectApplication: (appId) => {
    set(state => ({
      applications: state.applications.map(a => a.id === appId ? { ...a, status: 'rejected' as const } : a)
    }));
    console.log('[Store] rejectApplication:', appId);
  },

  getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),

  getMyTasks: () => get().tasks,

  getTaskById: (id) => get().tasks.find(t => t.id === id),

  checkInTask: (taskId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId && t.status === 'pending'
          ? { ...t, status: 'ongoing' as const, checkInTime: now }
          : t
      )
    }));
    console.log('[Store] checkInTask:', taskId, now);
  },

  checkOutTask: (taskId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    set(state => {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || task.status !== 'ongoing') return state;
      const hours = task.estimatedHours;
      return {
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: 'completed' as const, checkOutTime: now, actualHours: hours }
            : t
        )
      };
    });
    console.log('[Store] checkOutTask:', taskId, now);
  },

  applyLeave: (taskId, reason) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, leaveApplied: true } : t
      )
    }));
    console.log('[Store] applyLeave:', taskId, reason);
  },

  confirmTaskHours: (taskId, actualHours) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId && (t.status === 'completed' || t.status === 'ongoing')
          ? { ...t, status: 'completed' as const, actualHours }
          : t
      )
    }));
    console.log('[Store] confirmTaskHours:', taskId, actualHours);
  },

  submitAppeal: (taskId, reason) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, appealStatus: 'pending' as const } : t
      )
    }));
    console.log('[Store] submitAppeal:', taskId, reason);
  },

  calculateTaskIncome: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return 0;
    const hours = task.actualHours || task.estimatedHours;
    return Number((hours * task.hourlyRate).toFixed(2));
  }
}));
