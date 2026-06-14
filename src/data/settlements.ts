import type { SettlementItem, WithdrawRecord, Evaluation } from '@/types';

export const mockSettlements: SettlementItem[] = [
  {
    id: 's_001',
    taskId: 'task_004',
    jobTitle: '会展中心展位协助',
    date: '2026-06-10',
    baseAmount: 332.5,
    deductions: [
      { label: '保险费', amount: 3 }
    ],
    bonus: [
      { label: '全勤奖', amount: 20 }
    ],
    netAmount: 349.5,
    status: 'paid',
    paidAt: '2026-06-13 10:15'
  },
  {
    id: 's_002',
    taskId: 'task_003',
    jobTitle: '超市理货员',
    date: '2026-06-13',
    baseAmount: 200,
    deductions: [],
    bonus: [],
    netAmount: 200,
    status: 'pending'
  },
  {
    id: 's_003',
    taskId: 'task_005',
    jobTitle: '写字楼保洁阿姨',
    date: '2026-06-12',
    baseAmount: 165,
    deductions: [
      { label: '迟到扣款', amount: 11 }
    ],
    bonus: [],
    netAmount: 154,
    status: 'pending'
  },
  {
    id: 's_004',
    taskId: 'task_006',
    jobTitle: '餐饮传菜员',
    date: '2026-06-09',
    baseAmount: 140,
    deductions: [],
    bonus: [
      { label: '加班补贴', amount: 28 }
    ],
    netAmount: 168,
    status: 'paid',
    paidAt: '2026-06-11 09:00'
  },
  {
    id: 's_005',
    taskId: 'task_007',
    jobTitle: '快递分拣员',
    date: '2026-06-08',
    baseAmount: 380,
    deductions: [
      { label: '餐费', amount: 15 }
    ],
    bonus: [
      { label: '夜班补贴', amount: 50 }
    ],
    netAmount: 415,
    status: 'paid',
    paidAt: '2026-06-09 15:30'
  }
];

export const mockWithdrawRecords: WithdrawRecord[] = [
  {
    id: 'w_001',
    amount: 500,
    method: '微信',
    status: 'success',
    createdAt: '2026-06-13 14:20',
    completedAt: '2026-06-13 14:22'
  },
  {
    id: 'w_002',
    amount: 300,
    method: '支付宝',
    status: 'success',
    createdAt: '2026-06-08 10:00',
    completedAt: '2026-06-08 10:03'
  },
  {
    id: 'w_003',
    amount: 800,
    method: '银行卡',
    status: 'pending',
    createdAt: '2026-06-14 09:30'
  },
  {
    id: 'w_004',
    amount: 200,
    method: '微信',
    status: 'success',
    createdAt: '2026-06-01 18:45',
    completedAt: '2026-06-01 18:46'
  }
];

export const mockEvaluations: Evaluation[] = [
  {
    id: 'e_001',
    fromId: 'm_004',
    fromName: '永辉超市（望京店）',
    fromAvatar: 'https://picsum.photos/id/220/200/200',
    toId: 'u_001',
    taskId: 'task_003',
    jobTitle: '超市理货员',
    punctuality: 5,
    cooperation: 5,
    completion: 5,
    comment: '小伙子干活非常麻利，货架整理得很整齐，和同事配合也很融洽，下次有需要还会找他！',
    tags: ['准时到岗', '手脚麻利', '配合默契'],
    createdAt: '2026-06-13 18:10'
  },
  {
    id: 'e_002',
    fromId: 'm_002',
    fromName: '国家会议中心',
    fromAvatar: 'https://picsum.photos/id/1082/200/200',
    toId: 'u_001',
    taskId: 'task_004',
    jobTitle: '会展中心展位协助',
    punctuality: 5,
    cooperation: 4,
    completion: 5,
    comment: '展会期间表现很好，接待观众很热情，就是有时候沟通可以更主动一点。总体很满意！',
    tags: ['守时', '工作认真', '服务热情'],
    createdAt: '2026-06-11 09:30'
  },
  {
    id: 'e_003',
    fromId: 'u_001',
    fromName: '张小明',
    fromAvatar: 'https://picsum.photos/id/64/200/200',
    toId: 'm_002',
    taskId: 'task_004',
    jobTitle: '会展中心展位协助',
    punctuality: 5,
    cooperation: 5,
    completion: 5,
    comment: '会展主办方安排得很有条理，现场负责人沟通顺畅，午餐也不错，下次还来！',
    tags: ['安排合理', '沟通顺畅', '包吃满意'],
    createdAt: '2026-06-11 10:00'
  }
];

export const totalPendingIncome = mockSettlements
  .filter(s => s.status === 'pending')
  .reduce((sum, s) => sum + s.netAmount, 0);

export const totalBalance = 353.5;
