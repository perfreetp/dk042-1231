import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { mockJobs } from '@/data/jobs';
import { useStore } from '@/store/useStore';
import { formatCurrency, getStatusText } from '@/utils';
import EmptyState from '@/components/EmptyState';
import type { Job } from '@/types';
import styles from './index.module.scss';

type SortType = 'default' | 'salary' | 'distance' | 'latest';

const SORTS: { key: SortType; label: string }[] = [
  { key: 'default', label: '默认' },
  { key: 'salary', label: '薪资最高' },
  { key: 'distance', label: '距离最近' },
  { key: 'latest', label: '最新发布' }
];

const MyFavoritesPage: React.FC = () => {
  const { favoriteJobIds, toggleFavorite, isFavorite } = useStore();
  const [sort, setSort] = useState<SortType>('default');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[MyFavorites] did show, count:', favoriteJobIds.length);
  });

  const favoriteJobs = useMemo(() => {
    let list = mockJobs.filter(j => isFavorite(j.id));

    switch (sort) {
      case 'salary':
        list = list.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'distance':
        list = list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'latest':
        list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        break;
    }

    return list;
  }, [favoriteJobIds, sort, isFavorite]);

  const stats = useMemo(() => {
    const recruiting = favoriteJobs.filter(j => j.status === 'recruiting').length;
    const avgSalary = favoriteJobs.length > 0
      ? favoriteJobs.reduce((sum, j) => sum + j.hourlyRate, 0) / favoriteJobs.length
      : 0;
    return { recruiting, avgSalary: avgSalary.toFixed(1) };
  }, [favoriteJobs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
    Taro.stopPullDownRefresh();
  };

  const handleRemove = (job: Job) => {
    Taro.showModal({
      title: '取消收藏',
      content: `确定要取消收藏「${job.title}」吗？`,
      confirmText: '取消收藏',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          toggleFavorite(job.id);
          Taro.showToast({ title: '已取消收藏', icon: 'none' });
        }
      }
    });
  };

  const goDetail = (jobId: string) => {
    Taro.navigateTo({ url: `/pages/job-detail/index?id=${jobId}` });
  };

  const handleApply = (job: Job) => {
    if (job.status !== 'recruiting') {
      Taro.showToast({ title: '该岗位已停止招聘', icon: 'none' });
      return;
    }
    if (job.appliedCount >= job.headcount) {
      Taro.showToast({ title: '该岗位已招满', icon: 'none' });
      return;
    }
    goDetail(job.id);
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
        <Text className={styles.headerTitle}>
          <Text className={styles.titleIcon}>❤️</Text>
          我的收藏
        </Text>
        <Text className={styles.headerDesc}>
          收藏心仪岗位，不错过任何好机会
        </Text>
      </View>

      <View className={styles.statBar}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{favoriteJobs.length}</Text>
          <Text className={styles.statLabel}>收藏岗位</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.recruiting}</Text>
          <Text className={styles.statLabel}>招聘中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{favoriteJobs.length > 0 ? `¥${stats.avgSalary}` : '-'}</Text>
          <Text className={styles.statLabel}>平均时薪</Text>
        </View>
      </View>

      {favoriteJobs.length > 0 && (
        <View className={styles.sortSection}>
          <Text className={styles.sortLabel}>
            <Text className={styles.sortTitle}>排序方式</Text>
          </Text>
          <View className={styles.sortBtns}>
            {SORTS.map(s => (
              <View
                key={s.key}
                className={[styles.sortBtn, sort === s.key ? styles.active : ''].join(' ')}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.jobList}>
        {favoriteJobs.length > 0 ? (
          favoriteJobs.map(job => {
            const progress = (job.appliedCount / job.headcount) * 100;
            const canApply = job.status === 'recruiting' && job.appliedCount < job.headcount;

            return (
              <View key={job.id} className={styles.jobCard} onClick={() => goDetail(job.id)}>
                <View
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(job);
                  }}
                >
                  <Text className={styles.icon}>✕</Text>
                </View>

                <View className={styles.jobHeader}>
                  <View className={styles.jobInfo}>
                    <Text className={styles.jobTitle}>{job.title}</Text>
                    <View className={styles.jobSubMeta}>
                      <View className={styles.subMetaItem}>
                        <Text className={styles.icon}>🏷️</Text>
                        {job.type}
                      </View>
                      <View className={styles.subMetaItem}>
                        <Text className={styles.icon}>📅</Text>
                        {job.shifts.length}个班次
                      </View>
                    </View>
                  </View>
                </View>

                <View className={styles.jobBody}>
                  <View className={styles.salaryBlock}>
                    <Text className={styles.salaryValue}>{formatCurrency(job.hourlyRate)}</Text>
                    <Text className={styles.salaryUnit}>/ 小时</Text>
                  </View>
                  <View className={styles.jobMeta}>
                    <Text className={styles.metaLine}>
                      距离 <Text className={styles.highlight}>{job.distance}</Text>
                    </Text>
                    <Text className={styles.metaLine}>
                      进度 <Text className={styles.highlight}>{job.appliedCount}/{job.headcount}</Text>
                      <Text style={{ display: 'inline-block', width: '200rpx', height: '16rpx', background: '#F2F3F5', borderRadius: '8rpx', marginLeft: '16rpx', overflow: 'hidden', verticalAlign: 'middle' }}>
                        <Text style={{ display: 'block', width: `${Math.min(progress, 100)}%`, height: '100%', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)' }} />
                      </Text>
                    </Text>
                  </View>
                </View>

                {job.tags.length > 0 && (
                  <View className={styles.tagsRow}>
                    {job.tags.slice(0, 4).map(t => (
                      <Text key={t} className={styles.jobTag}>{t}</Text>
                    ))}
                  </View>
                )}

                <View className={styles.merchantRow}>
                  <View className={styles.merchantAvatar}>
                    <Image className={styles.merchantAvatarImg} src={job.merchantAvatar} mode='aspectFill' />
                  </View>
                  <View className={styles.merchantInfo}>
                    <Text className={styles.name}>{job.merchantName}</Text>
                    <Text className={styles.addr}>📍 {job.address}</Text>
                  </View>
                  <Text className={[styles.statusBadge, job.status].join(' ')}>
                    {getStatusText(job.status)}
                  </Text>
                </View>

                <View className={styles.jobFooter}>
                  <View
                    className={styles.footerBtn + ' ' + styles.secondary}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(job);
                    }}
                  >
                    取消收藏
                  </View>
                  <View
                    className={[
                      styles.footerBtn,
                      styles.primary,
                      !canApply ? 'disabled' : ''
                    ].join(' ')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(job);
                    }}
                  >
                    {job.status === 'closed'
                      ? '已结束'
                      : job.appliedCount >= job.headcount
                        ? '已招满'
                        : '立即报名'}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View>
            <EmptyState
              icon='💔'
              title='还没有收藏的岗位'
              description='在岗位大厅看到喜欢的工作，点击❤️收藏起来吧'
            />
            <View className={styles.emptyTips}>
              <Text className={styles.tipsIcon}>💡</Text>
              <Text className={styles.tipsTitle}>如何找到好工作？</Text>
              <Text className={styles.tipsDesc}>
                1. 打开首页浏览附近岗位{'\n'}
                2. 点击❤️收藏心仪岗位{'\n'}
                3. 在这里一键快速报名
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MyFavoritesPage;
