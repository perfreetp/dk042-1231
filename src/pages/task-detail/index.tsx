import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { formatCurrency, getStatusText } from '@/utils';
import type { Task } from '@/types';
import styles from './index.module.scss';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id || 'task_002';
  const { tasks, checkInTask, checkOutTask, applyLeave, confirmTaskHours, submitAppeal } = useStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    setRefreshKey(k => k + 1);
  });

  const task: Task | undefined = useMemo(() => {
    return tasks.find(t => t.id === taskId);
  }, [tasks, taskId, refreshKey]);

  if (!task) {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <Text className={styles.sectionTitle}>任务不存在</Text>
        </View>
      </View>
    );
  }

  const estimatedSalary = task.hourlyRate * (task.actualHours || task.estimatedHours);
  const deductions: { label: string; amount: number }[] = [];
  const bonuses: { label: string; amount: number }[] = [];
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
    },
    leave: {
      desc: '请假申请已提交，等待商家审核',
      actions: ['取消请假', '联系商家']
    },
    appeal: {
      desc: '申诉处理中，请耐心等待审核结果',
      actions: ['查看申诉', '联系商家']
    }
  };

  const statusInfo = statusDescriptions[task.status] || statusDescriptions.pending;

  const handleCheckIn = () => {
    Taro.showModal({
      title: '确认签到',
      content: `确定要签到「${task.jobTitle}」吗？\n当前时间将作为开始时间`,
      confirmText: '确认签到',
      confirmColor: '#2ECC71',
      success: (r) => {
        if (r.confirm) {
          checkInTask(task.id);
          setRefreshKey(k => k + 1);
          Taro.showToast({ title: '签到成功', icon: 'success' });
        }
      }
    });
  };

  const handleCheckOut = () => {
    Taro.showModal({
      title: '确认签退',
      content: `确定要签退「${task.jobTitle}」吗？\n当前时间将作为结束时间`,
      confirmText: '确认签退',
      confirmColor: '#FF6B35',
      success: (r) => {
        if (r.confirm) {
          checkOutTask(task.id);
          setRefreshKey(k => k + 1);
          Taro.showToast({ title: '签退成功', icon: 'success' });
        }
      }
    });
  };

  const handleLeave = () => {
    Taro.showModal({
      title: '请假申请',
      content: `确定要向「${task.jobTitle}」申请请假吗？\n申请后商家会进行审核`,
      confirmText: '确认申请',
      confirmColor: '#FF7D00',
      success: (r) => {
        if (r.confirm) {
          applyLeave(task.id, '临时有事');
          setRefreshKey(k => k + 1);
          Taro.showToast({ title: '请假申请已提交', icon: 'success' });
        }
      }
    });
  };

  const handleConfirmHours = () => {
    const hours = task.actualHours || task.estimatedHours;
    Taro.showModal({
      title: '确认工时',
      content: `「${task.jobTitle}」\n预计工时：${task.estimatedHours}小时\n实际工时：${hours}小时\n确认无误后提交？`,
      confirmText: '确认无误',
      confirmColor: '#2ECC71',
      success: (r) => {
        if (r.confirm) {
          confirmTaskHours(task.id, hours);
          setRefreshKey(k => k + 1);
          Taro.showToast({ title: '工时已确认，等待结算', icon: 'success' });
        }
      }
    });
  };

  const handleAppeal = () => {
    Taro.showModal({
      title: '异常申诉',
      content: '请描述您的申诉内容，我们会尽快核实处理：\n（示例：工时不对、考勤异常、薪资问题等）',
      confirmText: '提交申诉',
      confirmColor: '#FF6B35',
      success: (r) => {
        if (r.confirm) {
          submitAppeal(task.id, '工时计算有误');
          setRefreshKey(k => k + 1);
          Taro.showToast({ title: '申诉已提交，等待处理', icon: 'none' });
        }
      }
    });
  };

  const handleAction = (action: string) => {
    switch (action) {
      case '扫码签到':
        handleCheckIn();
        break;
      case '扫码签退':
        handleCheckOut();
        break;
      case '请假申请':
        handleLeave();
        break;
      case '确认工时':
        handleConfirmHours();
        break;
      case '异常申诉':
        handleAppeal();
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
      case '去评价':
      case '查看评价':
        Taro.navigateTo({
          url: `/pages/evaluation/index?taskId=${task.id}`
        }).catch(() => {});
        break;
      case '工时记录':
        Taro.showToast({ title: '工时记录功能', icon: 'none' });
        break;
      case '取消请假':
        Taro.showToast({ title: '取消请假功能', icon: 'none' });
        break;
      case '查看申诉':
        Taro.showToast({ title: '查看申诉功能', icon: 'none' });
        break;
      case '再次报名':
        Taro.switchTab({ url: '/pages/home/index' });
        break;
      default:
        Taro.showToast({ title: `${action}功能`, icon: 'none' });
    }
  };

  const renderTimeline = () => {
    const items: { dot: string; title: string; time: string; desc: string }[] = [];
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
    if (task.status === 'leave') {
      items.push({
        dot: 'active',
        title: '请假申请中',
        time: '等待审核',
        desc: '商家审核中，请耐心等待'
      });
    }
    if (task.status === 'appeal') {
      items.push({
        dot: 'active',
        title: '申诉处理中',
        time: '等待处理',
        desc: '申诉审核中，预计1-2个工作日'
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
        {task.checkInTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>签到时间</Text>
            <Text className={[styles.infoValue, styles.success].join(' ')}>{task.checkInTime}</Text>
          </View>
        )}
        {task.checkOutTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>签退时间</Text>
            <Text className={[styles.infoValue, styles.highlight].join(' ')}>{task.checkOutTime}</Text>
          </View>
        )}
        {task.appealReason && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申诉内容</Text>
            <Text className={[styles.infoValue, styles.warning].join(' ')}>{task.appealReason}</Text>
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
            onClick={handleCheckIn}
          >
            📱 扫码签到
          </View>
        )}
        {task.status === 'ongoing' && (
          <View
            className={classnames(styles.btn, styles.btnSuccess)}
            onClick={handleCheckOut}
          >
            ✅ 扫码签退
          </View>
        )}
        {task.status === 'completed' && (
          <>
            <View
              className={classnames(styles.btn, styles.btnSecondary)}
              onClick={handleAppeal}
            >
              申诉
            </View>
            <View
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={handleConfirmHours}
            >
              确认工时
            </View>
          </>
        )}
        {task.status === 'appeal' && (
          <View
            className={classnames(styles.btn, styles.btnSecondary)}
            onClick={() => Taro.showToast({ title: '申诉处理中', icon: 'none' })}
          >
            ⚠️ 申诉处理中
          </View>
        )}
        {task.status === 'leave' && (
          <View
            className={classnames(styles.btn, styles.btnSecondary)}
            onClick={() => Taro.showToast({ title: '请假审核中', icon: 'none' })}
          >
            📝 请假审核中
          </View>
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
