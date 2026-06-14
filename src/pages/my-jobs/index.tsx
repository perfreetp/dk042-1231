import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { formatCurrency, getStatusText } from '@/utils';
import EmptyState from '@/components/EmptyState';
import type { JobStatus } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | JobStatus;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recruiting', label: '招聘中' },
  { key: 'full', label: '已招满' },
  { key: 'closed', label: '已结束' }
];

const MyJobsPage: React.FC = () => {
  const getMyJobs = useStore(s => s.getMyJobs);
  const getApplicationsByJobId = useStore(s => s.getApplicationsByJobId);

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    console.log('[MyJobs] did show');
    setRefreshKey(k => k + 1);
  });

  const myJobs = useMemo(() => getMyJobs(), [getMyJobs, refreshKey]);

  const stats = useMemo(() => {
    const recruiting = myJobs.filter(j => j.status === 'recruiting').length;
    let pending = 0;
    let total = 0;
    myJobs.forEach(j => {
      const apps = getApplicationsByJobId(j.id);
      pending += apps.filter(a => a.status === 'pending').length;
      total += j.headcount;
    });
    return { recruiting, pending, total };
  }, [myJobs, getApplicationsByJobId]);

  const filteredJobs = useMemo(() => {
    let list = [...myJobs];
    if (filter !== 'all') {
      list = list.filter(j => j.status === filter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myJobs, filter]);

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    myJobs.forEach(j => {
      const apps = getApplicationsByJobId(j.id);
      counts[j.id] = apps.filter(a => a.status === 'pending').length;
    });
    return counts;
  }, [myJobs, getApplicationsByJobId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(k => k + 1);
    setRefreshing(false);
    Taro.stopPullDownRefresh();
    Taro.showToast({ title: '刷新成功', icon: 'none' });
  };

  const goAudit = (jobId: string) => {
    Taro.navigateTo({ url: `/pages/audit-applicants/index?jobId=${jobId}` });
  };

  const goDetail = (jobId: string) => {
    Taro.navigateTo({ url: `/pages/job-detail/index?id=${jobId}` });
  };

  const goPublish = () => {
    Taro.navigateTo({ url: '/pages/publish-job/index' });
  };

  const handleClose = (jobId: string) => {
    Taro.showModal({
      title: '确认关闭',
      content: '确定要关闭该岗位吗？关闭后将不再接收新报名。',
      confirmText: '确认关闭',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '岗位已关闭', icon: 'success' });
        }
      }
    });
  };

  const handleEdit = (jobId: string) => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' });
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
                      onClick={() => handleEdit(job.id)}
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
                          handleClose(job.id);
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
