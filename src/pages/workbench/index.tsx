import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import type { TaskStatus, Task } from '@/types';
import styles from './index.module.scss';

const TABS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待上岗' },
  { key: 'ongoing', label: '进行中' },
  { key: 'completed', label: '待结算' }
];

const WorkbenchPage: React.FC = () => {
  const { tasks, checkInTask, checkOutTask, applyLeave, confirmTaskHours, submitAppeal } = useStore();
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    setRefreshKey(k => k + 1);
  });

  const allTasks = useMemo(() => tasks, [tasks, refreshKey]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return allTasks;
    if (activeTab === 'completed') return allTasks.filter(t => t.status === 'completed' || t.status === 'hours_confirmed');
    return allTasks.filter(t => t.status === activeTab);
  }, [allTasks, activeTab]);

  const stats = useMemo(() => ({
    pending: allTasks.filter(t => t.status === 'pending').length,
    ongoing: allTasks.filter(t => t.status === 'ongoing').length,
    completed: allTasks.filter(t => t.status === 'completed' || t.status === 'hours_confirmed').length
  }), [allTasks]);

  const pendingTasks = useMemo(() => allTasks.filter(t => t.status === 'pending'), [allTasks]);
  const ongoingTasks = useMemo(() => allTasks.filter(t => t.status === 'ongoing'), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.status === 'completed'), [allTasks]);
  const hoursConfirmedTasks = useMemo(() => allTasks.filter(t => t.status === 'hours_confirmed'), [allTasks]);

  const handleScan = () => {
    if (pendingTasks.length === 0 && ongoingTasks.length === 0) {
      Taro.showToast({ title: '暂无需要签到的任务', icon: 'none' });
      return;
    }

    if (ongoingTasks.length > 0) {
      const taskList = ongoingTasks.map(t => `${t.jobTitle}（${t.date}）`);
      Taro.showActionSheet({
        itemList: taskList,
        success: (res) => {
          const task = ongoingTasks[res.tapIndex];
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
        }
      });
      return;
    }

    const taskList = pendingTasks.map(t => `${t.jobTitle}（${t.date}）`);
    Taro.showActionSheet({
      itemList: taskList,
      success: (res) => {
        const task = pendingTasks[res.tapIndex];
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
      }
    });
  };

  const handleLeave = () => {
    if (pendingTasks.length === 0 && ongoingTasks.length === 0) {
      Taro.showToast({ title: '暂无可请假的任务', icon: 'none' });
      return;
    }
    const available = [...pendingTasks, ...ongoingTasks];
    const taskList = available.map(t => `${t.jobTitle}（${t.date}）`);
    Taro.showActionSheet({
      itemList: taskList,
      success: (res) => {
        const task = available[res.tapIndex];
        const reasonList = ['身体不适', '家中有事', '临时有事', '交通不便', '其他原因'];
        Taro.showActionSheet({
          itemList: reasonList,
          success: (r2) => {
            const reason = reasonList[r2.tapIndex];
            Taro.showModal({
              title: '确认请假',
              content: `向「${task.jobTitle}」申请请假\n请假原因：${reason}\n确定提交？`,
              confirmText: '确认申请',
              confirmColor: '#FF7D00',
              success: (r) => {
                if (r.confirm) {
                  applyLeave(task.id, reason);
                  setRefreshKey(k => k + 1);
                  Taro.showToast({ title: '请假申请已提交', icon: 'success' });
                }
              }
            });
          }
        });
      }
    });
  };

  const handleConfirm = () => {
    const pendingConfirm = completedTasks;
    if (pendingConfirm.length === 0 && hoursConfirmedTasks.length > 0) {
      Taro.showToast({ title: '所有任务工时已确认，等待结算', icon: 'none' });
      return;
    }
    if (pendingConfirm.length === 0) {
      Taro.showToast({ title: '暂无可确认的工时', icon: 'none' });
      return;
    }
    const taskList = pendingConfirm.map(t => `${t.jobTitle}（${t.date}）· ${t.actualHours || t.estimatedHours}小时`);
    Taro.showActionSheet({
      itemList: taskList,
      success: (res) => {
        const task = pendingConfirm[res.tapIndex];
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
      }
    });
  };

  const handleAppeal = () => {
    const appealable = allTasks.filter(t => t.status === 'completed' || t.status === 'hours_confirmed');
    if (appealable.length === 0) {
      Taro.showToast({ title: '暂无任务可申诉', icon: 'none' });
      return;
    }
    const taskList = appealable.map(t => `${t.jobTitle}（${t.date}）`);
    Taro.showActionSheet({
      itemList: taskList,
      success: (res) => {
        const task = appealable[res.tapIndex];
        const reasonList = ['工时计算有误', '考勤异常', '薪资不对', '工作内容不符', '其他问题'];
        Taro.showActionSheet({
          itemList: reasonList,
          success: (r2) => {
            const reason = reasonList[r2.tapIndex];
            Taro.showModal({
              title: '提交申诉',
              content: `向「${task.jobTitle}」提交申诉\n申诉内容：${reason}\n确定提交？`,
              confirmText: '提交申诉',
              confirmColor: '#FF6B35',
              success: (r) => {
                if (r.confirm) {
                  submitAppeal(task.id, reason);
                  setRefreshKey(k => k + 1);
                  Taro.showToast({ title: '申诉已提交，等待处理', icon: 'none' });
                }
              }
            });
          }
        });
      }
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsSection}>
        <Text className={styles.statsTitle}>任务概览</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待上岗</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.ongoing}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.completed}</Text>
            <Text className={styles.statLabel}>待结算</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <View className={styles.actionItem} onClick={handleScan}>
          <Text className={styles.actionIcon}>📱</Text>
          <Text className={styles.actionLabel}>扫码签到</Text>
        </View>
        <View className={styles.actionItem} onClick={handleLeave}>
          <Text className={styles.actionIcon}>📝</Text>
          <Text className={styles.actionLabel}>请假申请</Text>
        </View>
        <View className={styles.actionItem} onClick={handleConfirm}>
          <Text className={styles.actionIcon}>✅</Text>
          <Text className={styles.actionLabel}>工时确认</Text>
        </View>
        <View className={styles.actionItem} onClick={handleAppeal}>
          <Text className={styles.actionIcon}>⚠️</Text>
          <Text className={styles.actionLabel}>异常申诉</Text>
        </View>
      </View>

      {stats.ongoing > 0 && (
        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>🔔 温馨提示</Text>
          <Text className={styles.tipText}>
            您有 {stats.ongoing} 个任务正在进行中，记得按时签到签退哦~
          </Text>
          <View className={styles.tipSteps}>
            <Text className={styles.tipStep}>到达工作地点后，点击"扫码签到"扫描商家二维码</Text>
            <Text className={styles.tipStep}>工作完成后，记得点击"签退"记录结束时间</Text>
            <Text className={styles.tipStep}>工时确认无误后，等待商家结算即可</Text>
          </View>
        </View>
      )}

      <View className={styles.tabs}>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.taskList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <EmptyState
            icon="📋"
            title={activeTab === 'all' ? '暂无任务' : `暂无${TABS.find(t => t.key === activeTab)?.label}任务`}
            description={activeTab === 'pending' ? '快去首页报名岗位吧！' : '完成的任务会出现在这里'}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default WorkbenchPage;
