import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockApplications, getApplicationsByJobId } from '@/data/tasks';
import { getJobById } from '@/data/jobs';
import EmptyState from '@/components/EmptyState';
import type { ApplicationStatus } from '@/types';
import styles from './index.module.scss';

const STATUS_TABS: { key: 'all' | ApplicationStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' }
];

const AuditApplicantsPage: React.FC = () => {
  const router = useRouter();
  const jobId = router.params.jobId || 'job_001';
  const [activeTab, setActiveTab] = useState<'all' | ApplicationStatus>('pending');
  const [applications, setApplications] = useState(() => {
    const jobApps = getApplicationsByJobId(jobId);
    return jobApps.length > 0 ? jobApps : mockApplications;
  });

  const job = getJobById(jobId);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length
  }), [applications]);

  const filteredList = useMemo(() => {
    if (activeTab === 'all') return applications;
    return applications.filter(a => a.status === activeTab);
  }, [applications, activeTab]);

  const handleApprove = (id: string) => {
    console.log('[Audit] approve:', id);
    Taro.showModal({
      title: '确认录用',
      content: '确认录用该求职者？录用后将发送通知短信',
      confirmText: '确认录用',
      confirmColor: '#2ECC71',
      success: (res) => {
        if (res.confirm) {
          setApplications(prev =>
            prev.map(a => a.id === id ? { ...a, status: 'approved' } : a)
          );
          Taro.showToast({ title: '已发送录用通知', icon: 'success' });
        }
      }
    });
  };

  const handleReject = (id: string) => {
    console.log('[Audit] reject:', id);
    Taro.showActionSheet({
      itemList: ['不符合岗位要求', '已招满', '条件不合适', '其他原因'],
      success: () => {
        setApplications(prev =>
          prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a)
        );
        Taro.showToast({ title: '已拒绝', icon: 'none' });
      }
    });
  };

  const getStatusClass = (status: ApplicationStatus) => {
    const map: Record<ApplicationStatus, string> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected'
    };
    return map[status];
  };

  const getStatusText = (status: ApplicationStatus) => {
    const map: Record<ApplicationStatus, string> = {
      pending: '待审核',
      approved: '已录用',
      rejected: '已拒绝'
    };
    return map[status];
  };

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.jobTitle}>
          {job ? job.title : '报名审核管理'}
        </Text>
        <View className={styles.statsRow}>
          <View className={styles.stat}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>人报名</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statNum}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待审核</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statNum}>{stats.approved}</Text>
            <Text className={styles.statLabel}>已录用</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'all'
            ? applications.length
            : applications.filter(a => a.status === tab.key).length;
          return (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && activeTab !== tab.key && tab.key === 'pending' && (
                <Text className={styles.tabBadge}>{count}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.list}>
        {filteredList.length > 0 ? (
          filteredList.map(app => (
            <View key={app.id} className={styles.applicantCard}>
              <View className={styles.applicantHeader}>
                <Image
                  className={styles.avatar}
                  src={app.userAvatar}
                  mode="aspectFill"
                />
                <View className={styles.applicantInfo}>
                  <View className={styles.nameRow}>
                    <Text className={styles.name}>{app.userName}</Text>
                    <View className={[styles.statusTag, styles[getStatusClass(app.status)]].join(' ')}>
                      {getStatusText(app.status)}
                    </View>
                  </View>
                  <View className={styles.meta}>
                    <Text>完成订单 28 单</Text>
                    <Text>评分 4.8 ★</Text>
                  </View>
                </View>
              </View>

              <Text className={styles.applyTime}>报名时间：{app.appliedAt}</Text>

              {app.message && (
                <View className={styles.message}>💬 {app.message}</View>
              )}

              <View className={styles.actionRow}>
                {app.status === 'pending' ? (
                  <>
                    <View
                      className={[styles.actionBtn, styles.btnReject].join(' ')}
                      onClick={() => handleReject(app.id)}
                    >
                      拒绝
                    </View>
                    <View
                      className={[styles.actionBtn, styles.btnApprove].join(' ')}
                      onClick={() => handleApprove(app.id)}
                    >
                      ✔ 录用
                    </View>
                  </>
                ) : (
                  <View className={[styles.actionBtn, styles.btnDetail].join(' ')}>
                    查看详情
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="👥"
            title={`暂无${STATUS_TABS.find(t => t.key === activeTab)?.label}人员`}
            description="耐心等待，很快就会有合适的零工报名~"
          />
        )}
      </View>
    </View>
  );
};

export default AuditApplicantsPage;
