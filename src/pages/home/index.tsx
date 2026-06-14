import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import JobCard from '@/components/JobCard';
import EmptyState from '@/components/EmptyState';
import type { JobType } from '@/types';
import styles from './index.module.scss';

const JOB_TYPES: (JobType | '全部')[] = ['全部', '餐饮', '会展', '仓储', '物流', '零售', '保洁', '安保', '其他'];

const HomePage: React.FC = () => {
  const { currentRole, setRole, jobs } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeType, setActiveType] = useState<JobType | '全部'>('全部');
  const [activeSort, setActiveSort] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    console.log('[HomePage] page show, role:', currentRole);
    setRefreshKey(k => k + 1);
  });

  const toggleRole = () => {
    const newRole = currentRole === 'worker' ? 'merchant' : 'worker';
    setRole(newRole);
    Taro.showToast({
      title: `已切换为${newRole === 'worker' ? '工人' : '商家'}端`,
      icon: 'none'
    });
  };

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (activeType !== '全部') {
      list = list.filter(j => j.type === activeType);
    }
    if (searchText) {
      const keyword = searchText.toLowerCase();
      list = list.filter(j =>
        j.title.toLowerCase().includes(keyword) ||
        j.merchantName.toLowerCase().includes(keyword) ||
        j.address.toLowerCase().includes(keyword)
      );
    }
    if (activeSort === 'salary') {
      list.sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (activeSort === 'distance') {
      list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (activeSort === 'nearest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [jobs, activeType, searchText, activeSort, refreshKey]);

  const onRefresh = () => {
    setIsRefreshing(true);
    console.log('[HomePage] pull down refresh');
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  };

  const goPublish = () => {
    Taro.navigateTo({ url: '/pages/publish-job/index' });
  };

  const goMyJobs = () => {
    Taro.navigateTo({ url: '/pages/my-jobs/index' });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={onRefresh}
    >
      <View className={styles.header}>
        <View className={styles.topBar}>
          <View className={styles.logoArea}>
            <Text className={styles.logo}>🔥 快工邦</Text>
            <View className={styles.roleTag} onClick={toggleRole}>
              {currentRole === 'worker' ? '👷 工人端' : '🏪 商家端'}
            </View>
          </View>
          <View className={styles.location}>
            <Text className={styles.locationIcon}>📍</Text>
            <Text>北京·朝阳区</Text>
          </View>
        </View>

        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索岗位、商家、地址"
            placeholderClass={styles.searchPlaceholder}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            confirmType="search"
          />
        </View>

        {currentRole === 'merchant' ? (
          <View className={styles.merchantAction} onClick={goPublish}>
            ➕ 立即发布岗位
          </View>
        ) : null}
      </View>

      <View className={styles.filterSection}>
        <ScrollView scrollX className={styles.typeScroll} enhanced showScrollbar={false}>
          <View className={styles.typeList}>
            {JOB_TYPES.map(type => (
              <View
                key={type}
                className={classnames(styles.typeItem, activeType === type && styles.active)}
                onClick={() => setActiveType(type)}
              >
                {type}
              </View>
            ))}
          </View>
        </ScrollView>

        <View className={styles.quickFilters}>
          <View
            className={classnames(styles.quickFilter, activeSort === 'salary' && styles.active)}
            onClick={() => setActiveSort(activeSort === 'salary' ? '' : 'salary')}
          >
            💰 薪资最高
          </View>
          <View
            className={classnames(styles.quickFilter, activeSort === 'distance' && styles.active)}
            onClick={() => setActiveSort(activeSort === 'distance' ? '' : 'distance')}
          >
            📍 距离最近
          </View>
          <View
            className={classnames(styles.quickFilter, activeSort === 'nearest' && styles.active)}
            onClick={() => setActiveSort(activeSort === 'nearest' ? '' : 'nearest')}
          >
            🕐 最新发布
          </View>
        </View>
      </View>

      {currentRole === 'merchant' && (
        <View className={styles.bannerTips} onClick={goMyJobs}>
          <Text className={styles.bannerTitle}>🏪 商家工作台</Text>
          <Text className={styles.bannerDesc}>
            点击查看我发布的岗位、管理报名人员，快速找到合适的零工 →
          </Text>
        </View>
      )}

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          {currentRole === 'worker' ? '🔥 附近好岗位' : '📋 岗位管理'}
        </Text>
        <Text className={styles.sectionAction}>
          共 {filteredJobs.length} 个
        </Text>
      </View>

      <View className={styles.jobList}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => <JobCard key={job.id} job={job} />)
        ) : (
          <EmptyState
            icon="🔍"
            title="暂无匹配岗位"
            description="换个筛选条件试试，或稍后再来看看"
          />
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
