import React, { useMemo, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useStore, calculateShiftHours } from '@/store/useStore';
import Tag from '@/components/Tag';
import { formatCurrency } from '@/utils';
import styles from './index.module.scss';

const JobDetailPage: React.FC = () => {
  const router = useRouter();
  const jobId = router.params.id || 'job_001';
  const getJobById = useStore(s => s.getJobById);
  const { isFavorite, toggleFavorite, currentRole, applyToJob } = useStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    setRefreshKey(k => k + 1);
  });

  const job = useMemo(() => getJobById(jobId), [jobId, getJobById, refreshKey]);

  if (!job) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>岗位不存在</Text>
        </View>
      </View>
    );
  }

  const favorited = isFavorite(job.id);
  const progress = Math.min(100, (job.appliedCount / job.headcount) * 100);
  const totalHours = job.shifts.reduce((sum, s) => sum + calculateShiftHours(s.startTime, s.endTime), 0);
  const estimatedSalary = totalHours * job.hourlyRate;

  const handleFavorite = () => {
    toggleFavorite(job.id);
    Taro.showToast({
      title: favorited ? '已取消收藏' : '已收藏岗位',
      icon: 'none'
    });
  };

  const handleApply = () => {
    if (currentRole === 'merchant') {
      Taro.showToast({ title: '商家端不能报名岗位', icon: 'none' });
      return;
    }
    if (job.status !== 'recruiting') {
      Taro.showToast({ title: '岗位已停止招聘', icon: 'none' });
      return;
    }
    if (job.appliedCount >= job.headcount) {
      Taro.showToast({ title: '岗位已招满', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认报名',
      content: `确定要报名"${job.title}"岗位吗？\n共${job.shifts.length}个班次，预计收入${formatCurrency(estimatedSalary)}`,
      confirmText: '立即报名',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          const result = applyToJob(job.id);
          if (result) {
            console.log('[JobDetail] apply success:', result.id);
            setRefreshKey(k => k + 1);
            Taro.showToast({ title: '报名成功，等待审核', icon: 'success' });
          } else {
            Taro.showToast({ title: '您已报名过该岗位', icon: 'none' });
          }
        }
      }
    });
  };

  const handleAudit = () => {
    Taro.navigateTo({ url: `/pages/audit-applicants/index?jobId=${job.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{job.title}</Text>
          <View className={styles.favoriteBtn} onClick={handleFavorite}>
            <Text className={favorited ? styles.favorited : styles.notFavorite}>
              {favorited ? '★' : '☆'}
            </Text>
          </View>
        </View>

        <View className={styles.salaryBox}>
          <Text className={styles.salary}>{job.hourlyRate}</Text>
          <Text className={styles.salaryUnit}>元/小时</Text>
          <Text className={styles.salaryNote}>{job.salaryNote}</Text>
        </View>

        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>🏷️</Text>
            <Text>{job.type}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>📅</Text>
            <Text>{job.shifts.length}个班次</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>📍</Text>
            <Text>{job.distance}</Text>
          </View>
        </View>

        <View className={styles.tagsRow}>
          {job.tags.map(t => <Tag key={t} text={t} type="default" />)}
          <Tag
            text={job.status === 'recruiting' ? '招聘中' : job.status === 'full' ? '已招满' : '已结束'}
            type={job.status === 'recruiting' ? 'success' : job.status === 'full' ? 'warning' : 'default'}
          />
        </View>
      </View>

      <View className={styles.progressCard}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressLabel}>报名进度</Text>
          <Text className={styles.progressText}>
            已报名 <Text className={styles.num}>{job.appliedCount}</Text> / {job.headcount} 人
          </Text>
        </View>
        <View className={styles.progressBarWrap}>
          <View className={styles.progressBar} style={{ width: `${progress}%` }} />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📝</Text>
          岗位说明
        </Text>
        <Text className={styles.descText}>{job.description}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>✅</Text>
          任职要求
        </Text>
        <View className={styles.reqList}>
          {job.requirements.map((req, i) => (
            <Text key={i} className={styles.reqItem}>{req}</Text>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🕐</Text>
          班次信息（共{job.shifts.length}个）
        </Text>
        <View className={styles.shiftList}>
          {job.shifts.map((shift, i) => {
            const hours = calculateShiftHours(shift.startTime, shift.endTime);
            const isOvernight = shift.startTime > shift.endTime;
            return (
              <View key={i} className={styles.shiftItem}>
                <View className={styles.shiftInfo}>
                  <Text className={styles.shiftDate}>{shift.date}</Text>
                  <Text className={styles.shiftTime}>
                    {shift.startTime} - {shift.endTime}
                    {isOvernight && '（跨天）'}
                    （{hours.toFixed(1)}小时）
                  </Text>
                </View>
                <Text className={styles.shiftSalary}>
                  {formatCurrency(hours * job.hourlyRate)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={{ marginTop: '24rpx', paddingTop: '24rpx', borderTop: '1rpx solid #F2F3F5' }}>
          <Text style={{ fontSize: '28rpx', color: '#FF6B35', fontWeight: 600 }}>
            预计总收入：{formatCurrency(estimatedSalary)}
          </Text>
          <Text style={{ fontSize: '24rpx', color: '#86909C', marginLeft: '12rpx' }}>
            共{totalHours.toFixed(1)}工时
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🏪</Text>
          商家信息
        </Text>
        <View className={styles.merchantRow}>
          <Image
            className={styles.merchantAvatar}
            src={job.merchantAvatar}
            mode="aspectFill"
          />
          <View className={styles.merchantInfo}>
            <Text className={styles.merchantName}>{job.merchantName}</Text>
            <View className={styles.merchantStats}>
              <Text className={styles.merchantRating}>★ 4.9</Text>
              <Text>发布岗位 156 个</Text>
              <Text>录用率 89%</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          工作地址
        </Text>
        <View className={styles.addressBox}>
          <Text className={styles.addressText}>{job.address}</Text>
          <View className={styles.mapTip}>
            🗺️ 点击查看地图导航（距离{job.distance}）
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnSecondary)} onClick={handleFavorite}>
          {favorited ? '★ 已收藏' : '☆ 收藏岗位'}
        </View>
        {currentRole === 'worker' ? (
          <View
            className={classnames(styles.btn, styles.btnPrimary, job.status !== 'recruiting' && styles.disabled)}
            onClick={handleApply}
          >
            {job.status === 'recruiting' ? '立即报名' : job.status === 'full' ? '已招满' : '已结束'}
          </View>
        ) : (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleAudit}>
            查看报名情况
          </View>
        )}
      </View>
    </View>
  );
};

export default JobDetailPage;
