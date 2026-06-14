import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Tag from '../Tag';
import { useStore } from '@/store/useStore';
import { getStatusText, getStatusColor } from '@/utils';
import type { Job } from '@/types';
import styles from './index.module.scss';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { isFavorite, toggleFavorite } = useStore();
  const favorited = isFavorite(job.id);

  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/job-detail/index?id=${job.id}` });
  };

  const handleFavorite = (e: React.TouchEvent) => {
    e.stopPropagation();
    toggleFavorite(job.id);
    Taro.showToast({
      title: favorited ? '已取消收藏' : '已收藏',
      icon: 'none'
    });
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{job.title}</Text>
          <View
            className={styles.favorite}
            onClick={handleFavorite}
          >
            <Text className={favorited ? styles.favorited : styles.notFavorite}>
              {favorited ? '★' : '☆'}
            </Text>
          </View>
        </View>
        <View className={styles.statusRow}>
          <Tag
            text={getStatusText(job.status)}
            type={
              job.status === 'recruiting' ? 'success' :
              job.status === 'full' ? 'warning' : 'default'
            }
          />
          <Text className={styles.type}>
            {job.type} · {job.distance}
          </Text>
        </View>
      </View>

      <View className={styles.salaryRow}>
        <Text className={styles.salary}>¥{job.hourlyRate}</Text>
        <Text className={styles.salaryUnit}>/小时</Text>
        <Text className={styles.salaryNote}>{job.salaryNote}</Text>
      </View>

      <View className={styles.shiftRow}>
        <View className={styles.shiftItem}>
          <Text className={styles.shiftLabel}>📅</Text>
          <Text className={styles.shiftText}>
            {job.shifts[0]?.date} 共{job.shifts.length}个班次
          </Text>
        </View>
        <View className={styles.shiftItem}>
          <Text className={styles.shiftLabel}>🕐</Text>
          <Text className={styles.shiftText}>
            {job.shifts[0]?.startTime}-{job.shifts[0]?.endTime}
          </Text>
        </View>
      </View>

      <View className={styles.tagsRow}>
        {job.tags.map(tag => (
          <Tag key={tag} text={tag} type="default" />
        ))}
      </View>

      <View className={styles.footer}>
        <View className={styles.merchant}>
          <Image
            className={styles.merchantAvatar}
            src={job.merchantAvatar}
            mode="aspectFill"
          />
          <View className={styles.merchantInfo}>
            <Text className={styles.merchantName}>{job.merchantName}</Text>
            <Text className={styles.progress}>
              {job.appliedCount}/{job.headcount}人已报名
            </Text>
          </View>
        </View>
        <View
          className={styles.progressBar}
          style={{
            background: `linear-gradient(to right, ${getStatusColor(job.status)} ${(job.appliedCount / job.headcount) * 100}%, #F2F3F5 ${(job.appliedCount / job.headcount) * 100}%)`
          }}
        />
      </View>
    </View>
  );
};

export default JobCard;
