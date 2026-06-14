import { create } from 'zustand';
import dayjs from 'dayjs';
import type { UserRole, User, Job, JobShift, Task, Application, JobType, JobStatus } from '@/types';
import { mockJobs } from '@/data/jobs';
import { mockTasks, mockApplications } from '@/data/tasks';
import { mockUsers } from '@/data/users';

const STORAGE_KEY = 'temporary_job_store_v1';

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

interface PersistState {
  currentRole: UserRole;
  favoriteJobIds: string[];
  jobs: Job[];
  tasks: Task[];
  applications: Application[];
}

const loadPersistedState = (): Partial<PersistState> => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistState;
    _idCounter = Math.max(
      _idCounter,
      ...parsed.jobs.map(j => Number(j.id.split('_')[1]) || 0),
      ...parsed.tasks.map(t => Number(t.id.split('_')[1]) || 0),
      ...parsed.applications.map(a => Number(a.id.split('_')[1]) || 0)
    );
    return parsed;
  } catch (e) {
    console.warn('[Store] failed to load persisted state:', e);
    return {};
  }
};

const persistState = (state: PersistState) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Store] failed to persist state:', e);
  }
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
  resetAll: () => void;
}

const defaultUser = mockUsers['u_001'];
const merchantUser = mockUsers['m_001'];
const persisted = loadPersistedState();

const initialState: Pick<AppState, keyof PersistState> = {
  currentRole: persisted.currentRole || 'worker',
  favoriteJobIds: persisted.favoriteJobIds || ['job_002', 'job_005'],
  jobs: persisted.jobs && persisted.jobs.length > 0 ? persisted.jobs : [...mockJobs],
  tasks: persisted.tasks && persisted.tasks.length > 0 ? persisted.tasks : [...mockTasks],
  applications: persisted.applications && persisted.applications.length > 0 ? persisted.applications : [...mockApplications]
};

const persist = (state: AppState) => {
  persistState({
    currentRole: state.currentRole,
    favoriteJobIds: state.favoriteJobIds,
    jobs: state.jobs,
    tasks: state.tasks,
    applications: state.applications
  });
};

export const useStore = create<AppState>((set, get) => ({
  currentRole: initialState.currentRole,
  user: initialState.currentRole === 'worker' ? defaultUser : merchantUser,
  merchantUser,
  favoriteJobIds: initialState.favoriteJobIds,
  jobs: initialState.jobs,
  tasks: initialState.tasks,
  applications: initialState.applications,

  setRole: (role) => {
    console.log('[Store] setRole:', role);
    set({
      currentRole: role,
      user: role === 'worker' ? defaultUser : merchantUser
    });
    persist(get());
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
    persist(get());
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
    persist(get());
    return newJob;
  },

  getJobById: (id) => get().jobs.find(j => j.id === id),

  getMyJobs: () => {
    const { merchantUser: m, jobs } = get();
    return jobs.filter(j => j.merchantId === m.id);
  },

  getMyFavoriteJobs: () => {
    const { favoriteJobIds, jobs } = get();
    return jobs.filter(j => favoriteJobIds.includes(j.id));
  },

  applyToJob: (jobId, message) => {
    const { user, applications, jobs } = get();
    const exists = applications.find(a => a.jobId === jobId && a.userId === user.id);
    if (exists) {
      console.log('[Store] applyToJob already applied:', jobId);
      return null;
    }
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

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
      jobs: state.jobs.map(j =>
        j.id === jobId ? { ...j, appliedCount: j.appliedCount + 1 } : j
      )
    }));
    console.log('[Store] applyToJob:', jobId, newApp.id);
    persist(get());
    return newApp;
  },

  getApplicationsByJobId: (jobId) => {
    return get().applications.filter(a => a.jobId === jobId);
  },

  getMyApplications: () => {
    const { user, applications } = get();
    return applications.filter(a => a.userId === user.id);
  },

  approveApplication: (appId) => {
    const app = get().applications.find(a => a.id === appId);
    if (!app) return;
    const job = get().jobs.find(j => j.id === app.jobId);
    if (!job) return;

    const firstShift = job.shifts[0];
    if (!firstShift) return;

    const hours = calculateShiftHours(firstShift.startTime, firstShift.endTime);
    const newTask: Task = {
      id: genId('task'),
      jobId: job.id,
      jobTitle: job.title,
      jobType: job.type,
      merchantName: job.merchantName,
      date: firstShift.date,
      startTime: firstShift.startTime,
      endTime: firstShift.endTime,
      address: job.address,
      hourlyRate: job.hourlyRate,
      estimatedHours: hours,
      status: 'pending'
    };
    set(state => ({
      applications: state.applications.map(a =>
        a.id === appId ? { ...a, status: 'approved' as const } : a
      ),
      tasks: [newTask, ...state.tasks]
    }));
    console.log('[Store] approveApplication:', appId, 'task:', newTask.id);
    persist(get());
  },

  rejectApplication: (appId) => {
    set(state => ({
      applications: state.applications.map(a =>
        a.id === appId ? { ...a, status: 'rejected' as const } : a
      )
    }));
    console.log('[Store] rejectApplication:', appId);
    persist(get());
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
    persist(get());
  },

  checkOutTask: (taskId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId || t.status !== 'ongoing') return t;
        const task = state.tasks.find(x => x.id === taskId);
        if (!task) return t;
        const start = task.checkInTime ? dayjs(task.checkInTime) : dayjs(`${task.date} ${task.startTime}`);
        const end = dayjs(now);
        const diffHours = Number(((end.valueOf() - start.valueOf()) / 3600000).toFixed(1));
        return {
          ...t,
          status: 'completed' as const,
          checkOutTime: now,
          actualHours: diffHours > 0 ? Math.max(diffHours, task.estimatedHours * 0.5) : task.estimatedHours
        };
      })
    }));
    console.log('[Store] checkOutTask:', taskId, now);
    persist(get());
  },

  applyLeave: (taskId, reason) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId && (t.status === 'pending' || t.status === 'ongoing')
          ? { ...t, status: 'leave' as const, leaveApplied: true, leaveReason: reason }
          : t
      )
    }));
    console.log('[Store] applyLeave:', taskId, reason);
    persist(get());
  },

  confirmTaskHours: (taskId, actualHours) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId && (t.status === 'completed' || t.status === 'ongoing')
          ? { ...t, status: 'hours_confirmed' as const, actualHours }
          : t
      )
    }));
    console.log('[Store] confirmTaskHours:', taskId, actualHours);
    persist(get());
  },

  submitAppeal: (taskId, reason) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId && (t.status === 'completed' || t.status === 'hours_confirmed')
          ? { ...t, status: 'appeal' as const, appealStatus: 'pending' as const, appealReason: reason }
          : t
      )
    }));
    console.log('[Store] submitAppeal:', taskId, reason);
    persist(get());
  },

  calculateTaskIncome: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return 0;
    const hours = task.actualHours || task.estimatedHours;
    return Number((hours * task.hourlyRate).toFixed(2));
  },

  resetAll: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({
      currentRole: 'worker',
      user: defaultUser,
      favoriteJobIds: ['job_002', 'job_005'],
      jobs: [...mockJobs],
      tasks: [...mockTasks],
      applications: [...mockApplications]
    });
    _idCounter = 1000;
    console.log('[Store] resetAll done');
  }
}));
