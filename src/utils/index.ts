export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getAverageRating = (punctuality: number, cooperation: number, completion: number): number => {
  return Number(((punctuality + cooperation + completion) / 3).toFixed(1));
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    recruiting: '招聘中',
    full: '已招满',
    closed: '已结束',
    pending: '待上岗',
    ongoing: '进行中',
    completed: '待结算',
    hours_confirmed: '工时已确认',
    settled: '已结算',
    leave: '请假中',
    appeal: '申诉中',
    approved: '已通过',
    rejected: '已拒绝',
    paid: '已到账',
    success: '成功',
    failed: '失败'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    recruiting: '#2ECC71',
    full: '#FF7D00',
    closed: '#86909C',
    pending: '#3498DB',
    ongoing: '#FF6B35',
    completed: '#FF7D00',
    hours_confirmed: '#2ECC71',
    settled: '#2ECC71',
    leave: '#FF7D00',
    appeal: '#F53F3F',
    approved: '#2ECC71',
    rejected: '#F53F3F',
    paid: '#2ECC71',
    success: '#2ECC71',
    failed: '#F53F3F'
  };
  return map[status] || '#86909C';
};
