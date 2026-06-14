import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockTasks } from '@/data/tasks';
import { formatCurrency, getStatusText } from '@/utils';
import type { Task } from '@/types';
import styles from './index.module.scss';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id || 'task_002';

  const task: Task = useMemo(() => {
    return mockTasks.find(t => t.id === taskId) || mockTasks[1];
  }, [taskId]);

  const estimatedSalary = task.hourlyRate * (task.actualHours || task.estimatedHours);
  const deductions = task.id === 'task_005' ? [{ label: '迟到扣款', amount: 11 }] : [];
  const bonuses = [];
  const netSalary = estimatedSalary - deductions.reduce((s, d) => s + d.amount, 0) + bonuses.reduce((s, b) => s + b.amount, 0);

  const statusDescriptions: Record<string, { desc: string; actions: string[] }> = {
    pending: {
      desc: '请准时到达工作地点，点击"扫码签到"开始工作',
      actions: ['扫码签到', '请假申请', '联系商家']
    },
    ongoing: {
      desc: '工作进行中，注意安全，完工后记得"签退"',
      actions: ['扫码签退', '工时记录', '联系商家']
    },
    completed: {
      desc: '工作已完成，等待商家确认工时和结算',
      actions: ['确认工时', '异常申诉', '去评价']
    },
    settled: {
      desc: '工资已结算，期待继续合作！',
      actions: ['查看评价', '再次报名', '联系商家']
    }
  };

  const statusInfo = statusDescriptions[task.status] || statusDescriptions.pending;

  const handleAction = (action: string) => {
    console.log('[TaskDetail] action:', action);
    switch (action) {
      case '扫码签到':
      case '扫码签退':
        Taro.showToast({ title: `${action}功能（扫描商家二维码）`, icon: 'none' });
        break;
      case '请假申请':
        Taro.showModal({
          title: '请假申请',
          content: '请至少提前2小时请假，紧急情况请电话联系商家负责人',
          confirmText: '我已知晓',
          showCancel: true,
          cancelText: '取消请假'
        });
        break;
      case '联系商家':
        Taro.showModal({
          title: '联系方式',
          content: '商家电话：138****8888\n工作时间拨打',
          confirmText: '拨打',
          success: (res) => {
            if (res.confirm) {
              Taro.showToast({ title: '拨打电话功能', icon: 'none' });
            }
          }
        });
        break;
      case '确认工时':
        Taro.showModal({
          title: '确认工时',
          content: `确认以下工时无误吗？\n实际工时：${task.actualHours || task.estimatedHours}小时\n预计收入：${formatCurrency(netSalary)}`,
          confirmText: '确认无误',
          confirmColor: '#2ECC71',
          success: (res) => {
            if (res.confirm) {
              Taro.showToast({ title: '已确认工时', icon: 'success' });
            }
          }
        });
        break;
      case '异常申诉':
        Taro.navigateTo({
          url: '/pages/evaluation/index?mode=appeal'
        }).catch(() => {
          Taro.showToast({ title: '申诉功能开发中', icon: 'none' });
        });
        break;
      case '去评价':
      case '查看评价':
        Taro.navigateTo({
          url: `/pages/evaluation/index?taskId=${task.id}`
        }).catch(() => {});
        break;
      default:
        Taro.showToast({ title: `${action}功能`, icon: 'none' });
    }
  };

  const renderTimeline = () => {
    const items = [];
    items.push({
      dot: 'done',
      title: '报名成功',
      time: '2026-06-13 16:30',
      desc: '商家已录用，等待上岗'
    });
    if (task.checkInTime) {
      items.push({
        dot: 'done',
        title: '已签到',
        time: task.checkInTime,
        desc: '按时到达工作地点'
      });
    }
    if (task.status === 'ongoing') {
      items.push({
        dot: 'active',
        title: '工作进行中',
        time: '进行中...',
        desc: '记得签退哦'
      });
    }
    if (task.checkOutTime || task.status === 'completed' || task.status === 'settled') {
      items.push({
        dot: task.status !== 'ongoing' ? 'done' : '',
        title: '已签退',
        time: task.checkOutTime || '待签退',
        desc: task.checkOutTime ? `实际工时 ${task.actualHours || task.estimatedHours} 小时` : ''
      });
    }
    if (task.status === 'settled') {
      items.push({
        dot: 'done',
        title: '工资已结算',
        time: '2026-06-14 10:15',
        desc: formatCurrency(netSalary) + ' 已到账'
      });
    } else if (task.status === 'completed') {
      items.push({
        dot: 'active',
        title: '待结算',
        time: '商家确认中',
        desc: '预计1-2个工作日到账'
      });
    }
    return items;
  };

  return (
    <View className={styles.page}>
      <View className={[styles.statusHeader, styles[task.status]].join(' ')}>
        <View className={styles.statusBadge}>
          {getStatusText(task.status)}
        </View>
        <Text className={styles.statusTitle}>{task.jobTitle}</Text>
        <Text className={styles.statusDesc}>{statusInfo.desc}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          任务信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>工作日期</Text>
          <Text className={styles.infoValue}>{task.date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>工作时间</Text>
          <Text className={styles.infoValue}>{task.startTime} - {task.endTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预计工时</Text>
          <Text className={[styles.infoValue, styles.highlight].join(' ')}>{task.estimatedHours} 小时</Text>
        </View>
        {task.actualHours !== undefined && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>实际工时</Text>
            <Text className={[styles.infoValue, styles.success].join(' ')}>{task.actualHours} 小时</Text>
          </View>
        )}
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>工作类型</Text>
          <Text className={styles.infoValue}>{task.jobType}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>商家名称</Text>
          <Text className={styles.infoValue}>{task.merchantName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>工作地点</Text>
          <Text className={styles.infoValue}>{task.address}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🕐</Text>
          任务进度
        </Text>
        <View className={styles.timeline}>
          {renderTimeline().map((item, i) => (
            <View key={i} className={styles.timelineItem}>
              <View className={[styles.timelineDot, styles[item.dot]].join(' ')} />
              <Text className={styles.timelineTitle}>{item.title}</Text>
              <Text className={styles.timelineTime}>{item.time}</Text>
              {item.desc && <Text className={styles.timelineDesc}>{item.desc}</Text>}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💰</Text>
          收入明细
        </Text>
        <View className={styles.salaryBox}>
          <View className={styles.salaryRow}>
            <Text className={styles.salaryLeft}>基础薪资</Text>
            <Text className={styles.salaryRight}>
              {task.hourlyRate} × {task.actualHours || task.estimatedHours}h = {formatCurrency(estimatedSalary)}
            </Text>
          </View>
          {bonuses.map((b, i) => (
            <View key={`b-${i}`} className={styles.salaryRow}>
              <Text className={styles.salaryLeft}>➕ {b.label}</Text>
              <Text className={[styles.salaryRight, styles.positive].join(' ')}>
                +{formatCurrency(b.amount)}
              </Text>
            </View>
          ))}
          {deductions.map((d, i) => (
            <View key={`d-${i}`} className={styles.salaryRow}>
              <Text className={styles.salaryLeft}>➖ {d.label}</Text>
              <Text className={[styles.salaryRight, styles.negative].join(' ')}>
                -{formatCurrency(d.amount)}
              </Text>
            </View>
          ))}
          <View className={[styles.salaryRow, styles.total].join(' ')}>
            <Text className={styles.salaryLeft}>实收工资</Text>
            <Text className={[styles.salaryRight, styles.total].join(' ')}>
              {formatCurrency(netSalary)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⚡</Text>
          快捷操作
        </Text>
        <View className={styles.actionGrid}>
          {statusInfo.actions.map(action => (
            <View
              key={action}
              className={styles.actionItem}
              onClick={() => handleAction(action)}
            >
              <Text className={styles.actionItemIcon}>
                {action.includes('扫码') ? '📱' :
                 action.includes('请假') ? '📝' :
                 action.includes('联系') ? '📞' :
                 action.includes('确认') ? '✅' :
                 action.includes('申诉') ? '⚠️' :
                 action.includes('评价') ? '⭐' :
                 action.includes('工时') ? '⏱️' :
                 action.includes('报名') ? '🔁' : '🔔'}
              </Text>
              <Text className={styles.actionItemLabel}>{action}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        {task.status === 'pending' && (
          <View
            className={classnames(styles.btn, styles.btnSuccess)}
            onClick={() => handleAction('扫码签到')}
          >
            📱 扫码签到
          </View>
        )}
        {task.status === 'ongoing' && (
          <View
            className={classnames(styles.btn, styles.btnSuccess)}
            onClick={() => handleAction('扫码签退')}
          >
            ✅ 扫码签退
          </View>
        )}
        {task.status === 'completed' && (
          <>
            <View
              className={classnames(styles.btn, styles.btnSecondary)}
              onClick={() => handleAction('异常申诉')}
            >
              申诉
            </View>
            <View
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={() => handleAction('确认工时')}
            >
              确认工时
            </View>
          </>
        )}
        {task.status === 'settled' && (
          <View
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => handleAction('去评价')}
          >
            ⭐ 去评价
          </View>
        )}
      </View>
    </View>
  );
};

export default TaskDetailPage;
