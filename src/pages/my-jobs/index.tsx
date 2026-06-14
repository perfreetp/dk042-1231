import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { mockJobs } from '@/data/jobs';
import { mockApplications } from '@/data/tasks';
import { formatCurrency, getStatusText } from '@/utils';
import EmptyState from '@/components/EmptyState';
import type { Job, JobStatus } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | JobStatus;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recruiting', label: '招聘中' },
  { key: 'full', label: '已招满' },
  { key: 'closed', label: '已结束' }
];

const MyJobsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[MyJobs] did show');
  });

  const stats = useMemo(() => {
    const recruiting = mockJobs.filter(j => j.status === 'recruiting').length;
    const pending = mockApplications.filter(a => a.status === 'pending').length;
    const total = mockJobs.reduce((sum, j) => sum + j.headcount, 0);
    return { recruiting, pending, total };
  }, []);

  const filteredJobs = useMemo(() => {
    let list = [...mockJobs];
    if (filter !== 'all') {
      list = list.filter(j => j.status === filter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter]);

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockApplications
      .filter(a => a.status === 'pending')
      .forEach(a => {
        counts[a.jobId] = (counts[a.jobId] || 0) + 1;
      });
    return counts;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
    Taro.stopPullDownRefresh();
    Taro.showToast({ title: '刷新成功', icon: 'none' });
  };

  const goAudit = (jobId: string) => {
    Taro.navigateTo({ url: `/pages/audit-applicants/index?id=${jobId}` });
  };

  const goDetail = (jobId: string) => {
    Taro.navigateTo({ url: `/pages/job-detail/index?id=${jobId}` });
  };

  const goPublish = () => {
    Taro.navigateTo({ url: '/pages/publish-job/index' });
  };

  const handleClose = (job: Job) => {
    Taro.showModal({
      title: '确认关闭',
      content: `确定要关闭「${job.title}」吗？关闭后将不再接收新报名。`,
      confirmText: '确认关闭',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '岗位已关闭', icon: 'success' });
        }
      }
    });
  };

  const handleEdit = (job: Job) => {
    Taro.showToast({ title: `编辑「${job.title}」`, icon: 'none' });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <Text className={styles.headerTitle}>我的岗位管理</Text>
        <View className={styles.statRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.recruiting}</Text>
            <Text className={styles.statLabel}>招聘中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待审核</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总招人数</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        {FILTERS.map(f => (
          <View
            key={f.key}
            className={[styles.filterTab, filter === f.key ? styles.active : ''].join(' ')}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'all' && stats.pending > 0 && (
              <View className={styles.tabBadge}>{stats.pending}</View>
            )}
          </View>
        ))}
      </View>

      <View className={styles.jobList}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => {
            const pendingCount = pendingCounts[job.id] || 0;
            const progress = (job.appliedCount / job.headcount) * 100;

            return (
              <View key={job.id} className={styles.jobCard}>
                <View className={styles.jobHeader}>
                  <Text className={styles.jobTitle}>{job.title}</Text>
                  <Text className={[styles.jobStatus, job.status].join(' ')}>
                    {getStatusText(job.status)}
                  </Text>
                </View>

                <View className={styles.jobMeta}>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>🏷️</Text>
                    {job.type}
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>📍</Text>
                    {job.distance}
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>📅</Text>
                    {job.shifts.length}个班次
                  </View>
                </View>

                <View className={styles.salaryRow}>
                  <View className={styles.salaryInfo}>
                    <Text className={styles.salaryValue}>{formatCurrency(job.hourlyRate)}</Text>
                    <Text className={styles.salaryUnit}>/时</Text>
                  </View>
                  <View className={styles.progressInfo}>
                    <Text className={styles.progressText}>
                      已报名 <Text className={styles.highlight}>{job.appliedCount}</Text>/{job.headcount}
                      {pendingCount > 0 && <Text className={styles.highlight}> · {pendingCount}待审</Text>}
                    </Text>
                    <View className={styles.progressBar}>
                      <View
                        className={styles.progressFill}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </View>
                  </View>
                </View>

                {job.tags.length > 0 && (
                  <View className={styles.tagsRow}>
                    {job.tags.map(t => (
                      <Text key={t} className={styles.jobTag}>{t}</Text>
                    ))}
                  </View>
                )}

                <View className={styles.shiftsPreview}>
                  {job.shifts.slice(0, 3).map((s, i) => (
                    <Text key={i} className={styles.shiftItem}>
                      <Text className={styles.shiftDate}>{s.date}</Text> {s.startTime}-{s.endTime}
                    </Text>
                  ))}
                  {job.shifts.length > 3 && (
                    <Text className={styles.shiftItem}>+{job.shifts.length - 3}个班次</Text>
                  )}
                </View>

                <View className={styles.jobFooter}>
                  <View
                    className={[styles.actionBtn, styles.secondary].join(' ')}
                    onClick={() => goDetail(job.id)}
                  >
                    查看详情
                  </View>
                  {job.status !== 'closed' && (
                    <View
                      className={[styles.actionBtn, styles.outline].join(' ')}
                      onClick={() => handleEdit(job)}
                    >
                      编辑
                    </View>
                  )}
                  <View
                    className={[styles.actionBtn, styles.primary].join(' ')}
                    onClick={() => {
                      if (job.status !== 'closed') {
                        if (pendingCount > 0 || job.appliedCount > 0) {
                          goAudit(job.id);
                        } else {
                          handleClose(job);
                        }
                      } else {
                        goAudit(job.id);
                      }
                    }}
                  >
                    {job.status === 'closed'
                      ? '查看名单'
                      : pendingCount > 0
                        ? `审核(${pendingCount})`
                        : job.appliedCount > 0
                          ? '报名管理'
                          : '关闭岗位'}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            icon='📋'
            title={filter === 'all' ? '暂无岗位' : `暂无${getStatusText(filter)}的岗位`}
            description={filter === 'all' ? '点击右下角按钮，快速发布第一个岗位' : '切换其他筛选条件试试'}
          />
        )}
      </View>

      <View className={styles.publishBtn} onClick={goPublish}>
        <Text className={styles.icon}>＋</Text>
        <Text className={styles.text}>发岗位</Text>
      </View>
    </ScrollView>
  );
};

export default MyJobsPage;
