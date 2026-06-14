import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { mockEvaluations } from '@/data/settlements';
import { getAverageRating } from '@/utils';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { user, currentRole, setRole, favoriteJobIds } = useStore();

  const workerEvaluations = mockEvaluations.filter(e => e.toId === user.id);
  const avgPunctuality = workerEvaluations.length > 0
    ? workerEvaluations.reduce((s, e) => s + e.punctuality, 0) / workerEvaluations.length
    : 4.8;
  const avgCooperation = workerEvaluations.length > 0
    ? workerEvaluations.reduce((s, e) => s + e.cooperation, 0) / workerEvaluations.length
    : 4.6;
  const avgCompletion = workerEvaluations.length > 0
    ? workerEvaluations.reduce((s, e) => s + e.completion, 0) / workerEvaluations.length
    : 4.9;
  const overallRating = getAverageRating(avgPunctuality, avgCooperation, avgCompletion);

  const switchRole = (role: 'worker' | 'merchant') => {
    if (role === currentRole) return;
    console.log('[Mine] switch role:', role);
    setRole(role);
    Taro.showToast({
      title: `已切换为${role === 'worker' ? '工人' : '商家'}端`,
      icon: 'none'
    });
    Taro.switchTab({ url: '/pages/home/index' }).catch(() => {});
  };

  const goTo = (url: string) => {
    Taro.navigateTo({ url }).catch(err => {
      console.error('[Mine] navigate error:', err);
      Taro.showToast({ title: '页面开发中', icon: 'none' });
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.userCard}>
        <Image className={styles.avatar} src={user.avatar} mode="aspectFill" />
        <View className={styles.userInfo}>
          <Text className={styles.userName}>{user.name}</Text>
          <View className={styles.userMeta}>
            <Text className={styles.phone}>{user.phone}</Text>
            <Text className={styles.rating}>
              <Text className={styles.starIcon}>★</Text>
              {overallRating.toFixed(1)}
            </Text>
          </View>
          <View className={styles.roleSwitcher}>
            <View
              className={classnames(styles.roleBtn, currentRole === 'worker' && styles.active)}
              onClick={() => switchRole('worker')}
            >
              👷 我是工人
            </View>
            <View
              className={classnames(styles.roleBtn, currentRole === 'merchant' && styles.active)}
              onClick={() => switchRole('merchant')}
            >
              🏪 我是商家
            </View>
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statsCol}>
          <Text className={styles.statNumber}>{user.completedJobs}</Text>
          <Text className={styles.statLabel}>完成任务</Text>
        </View>
        <View className={styles.statsCol}>
          <Text className={styles.statNumber}>{workerEvaluations.length}</Text>
          <Text className={styles.statLabel}>累计评价</Text>
        </View>
        <View className={styles.statsCol}>
          <Text className={styles.statNumber}>{favoriteJobIds.length}</Text>
          <Text className={styles.statLabel}>收藏岗位</Text>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        {currentRole === 'worker' ? '👷 工人常用功能' : '🏪 商家常用功能'}
      </View>

      {currentRole === 'worker' ? (
        <View className={styles.menuSection}>
          <View className={styles.menuItem} onClick={() => goTo('/pages/my-favorites/index')}>
            <Text className={styles.menuIcon}>⭐</Text>
            <Text className={styles.menuText}>我的收藏</Text>
            {favoriteJobIds.length > 0 && (
              <Text className={styles.menuBadge}>{favoriteJobIds.length}</Text>
            )}
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/workbench/index' })}>
            <Text className={styles.menuIcon}>📋</Text>
            <Text className={styles.menuText}>我的任务</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/settlement/index' })}>
            <Text className={styles.menuIcon}>💰</Text>
            <Text className={styles.menuText}>工资结算</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => goTo('/pages/evaluation/index')}>
            <Text className={styles.menuIcon}>⭐</Text>
            <Text className={styles.menuText}>我的评价</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      ) : (
        <View className={styles.menuSection}>
          <View className={styles.menuItem} onClick={() => goTo('/pages/publish-job/index')}>
            <Text className={styles.menuIcon}>➕</Text>
            <Text className={styles.menuText}>发布岗位</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => goTo('/pages/my-jobs/index')}>
            <Text className={styles.menuIcon}>📋</Text>
            <Text className={styles.menuText}>我的岗位</Text>
            <Text className={styles.menuBadge}>3</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => goTo('/pages/audit-applicants/index')}>
            <Text className={styles.menuIcon}>👥</Text>
            <Text className={styles.menuText}>报名审核</Text>
            <Text className={styles.menuBadge}>6</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => goTo('/pages/evaluation/index')}>
            <Text className={styles.menuIcon}>⭐</Text>
            <Text className={styles.menuText}>评价管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      )}

      {currentRole === 'worker' && (
        <View className={styles.evaluationPreview}>
          <View className={styles.evalHeader}>
            <Text className={styles.evalTitle}>
              <Text className={styles.evalIcon}>⭐</Text>
              我的信誉评分
            </Text>
            <Text className={styles.evalAll} onClick={() => goTo('/pages/evaluation/index')}>
              查看全部 ›
            </Text>
          </View>
          <View className={styles.evalScoreRow}>
            <View className={styles.evalScoreItem}>
              <Text className={styles.evalScore}>{avgPunctuality.toFixed(1)}</Text>
              <Text className={styles.evalScoreLabel}>守时</Text>
            </View>
            <View className={styles.evalScoreItem}>
              <Text className={styles.evalScore}>{avgCooperation.toFixed(1)}</Text>
              <Text className={styles.evalScoreLabel}>配合度</Text>
            </View>
            <View className={styles.evalScoreItem}>
              <Text className={styles.evalScore}>{avgCompletion.toFixed(1)}</Text>
              <Text className={styles.evalScoreLabel}>完成度</Text>
            </View>
          </View>
          <View style={{ fontSize: '24rpx', color: '#86909C', lineHeight: 1.6 }}>
            综合信誉 {overallRating.toFixed(1)} 分，超过 {Math.round(overallRating * 18)}% 的工人
          </View>
        </View>
      )}

      <View className={styles.sectionTitle}>其他服务</View>

      <View className={styles.menuSection}>
        <View className={styles.menuItem}>
          <Text className={styles.menuIcon}>📞</Text>
          <Text className={styles.menuText}>客服中心</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem}>
          <Text className={styles.menuIcon}>📖</Text>
          <Text className={styles.menuText}>使用帮助</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem}>
          <Text className={styles.menuIcon}>🔒</Text>
          <Text className={styles.menuText}>隐私设置</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem}>
          <Text className={styles.menuIcon}>ℹ️</Text>
          <Text className={styles.menuText}>关于快工邦</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
