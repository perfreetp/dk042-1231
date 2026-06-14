import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { mockTasks } from '@/data/tasks';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import type { TaskStatus } from '@/types';
import styles from './index.module.scss';

const TABS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待上岗' },
  { key: 'ongoing', label: '进行中' },
  { key: 'completed', label: '待结算' }
];

const WorkbenchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return mockTasks;
    return mockTasks.filter(t => t.status === activeTab);
  }, [activeTab]);

  const stats = useMemo(() => ({
    pending: mockTasks.filter(t => t.status === 'pending').length,
    ongoing: mockTasks.filter(t => t.status === 'ongoing').length,
    completed: mockTasks.filter(t => t.status === 'completed').length
  }), []);

  const handleAction = (action: string) => {
    console.log('[Workbench] action:', action);
    switch (action) {
      case 'scan':
        Taro.showToast({ title: '扫码签到功能', icon: 'none' });
        break;
      case 'leave':
        Taro.showModal({
          title: '请假申请',
          content: '请假功能正在开发中，请联系商家负责人电话请假',
          showCancel: false,
          confirmText: '我知道了'
        });
        break;
      case 'confirm':
        setActiveTab('completed');
        Taro.showToast({ title: '切换到待结算列表', icon: 'none' });
        break;
      case 'appeal':
        Taro.showToast({ title: '异常申诉功能', icon: 'none' });
        break;
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsSection}>
        <Text className={styles.statsTitle}>今日任务概览</Text>
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
        <View className={styles.actionItem} onClick={() => handleAction('scan')}>
          <Text className={styles.actionIcon}>📱</Text>
          <Text className={styles.actionLabel}>扫码签到</Text>
        </View>
        <View className={styles.actionItem} onClick={() => handleAction('leave')}>
          <Text className={styles.actionIcon}>📝</Text>
          <Text className={styles.actionLabel}>请假申请</Text>
        </View>
        <View className={styles.actionItem} onClick={() => handleAction('confirm')}>
          <Text className={styles.actionIcon}>✅</Text>
          <Text className={styles.actionLabel}>工时确认</Text>
        </View>
        <View className={styles.actionItem} onClick={() => handleAction('appeal')}>
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
