import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Tag from '../Tag';
import { getStatusText, getStatusColor, formatCurrency } from '@/utils';
import type { Task } from '@/types';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

  const estimatedSalary = task.hourlyRate * (task.actualHours || task.estimatedHours);

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <Text className={styles.title}>{task.jobTitle}</Text>
          <View className={styles.meta}>
            <Text className={styles.type}>{task.jobType}</Text>
            <Text className={styles.dot}>·</Text>
            <Text className={styles.merchant}>{task.merchantName}</Text>
          </View>
        </View>
        <Tag
          text={getStatusText(task.status)}
          type={
            task.status === 'pending' ? 'info' :
            task.status === 'ongoing' ? 'primary' :
            task.status === 'completed' ? 'warning' :
            task.status === 'leave' ? 'warning' :
            task.status === 'appeal' ? 'danger' : 'success'
          }
          size="md"
        />
      </View>

      <View className={styles.body}>
        <View className={styles.row}>
          <Text className={styles.label}>📅</Text>
          <View className={styles.content}>
            <Text className={styles.date}>{task.date}</Text>
            <Text className={styles.time}>{task.startTime} - {task.endTime}</Text>
          </View>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>📍</Text>
          <Text className={styles.address}>{task.address}</Text>
        </View>
        {task.status !== 'pending' && (
          <View className={styles.row}>
            <Text className={styles.label}>⏱️</Text>
            <View className={styles.checkInfo}>
              {task.checkInTime && (
                <Text className={styles.checkText}>签到：{task.checkInTime.split(' ')[1]}</Text>
              )}
              {task.checkOutTime && (
                <Text className={styles.checkText}>签退：{task.checkOutTime.split(' ')[1]}</Text>
              )}
              {task.actualHours !== undefined && (
                <Text className={styles.checkText}>工时：{task.actualHours}h</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.salaryBox}>
          <Text className={styles.salaryLabel}>预计收入</Text>
          <Text className={styles.salary}>{formatCurrency(estimatedSalary)}</Text>
        </View>
        {task.status === 'ongoing' && (
          <View
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              Taro.showToast({ title: '扫码签到功能', icon: 'none' });
            }}
          >
            <Text className={styles.actionText}>扫码签到</Text>
          </View>
        )}
        {task.status === 'completed' && (
          <View
            className={[styles.actionBtn, styles.appealBtn].join(' ')}
            onClick={(e) => {
              e.stopPropagation();
              Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
            }}
          >
            <Text className={[styles.actionText, styles.appealText].join(' ')}>确认工时</Text>
          </View>
        )}
        {task.appealStatus === 'pending' && (
          <Tag text="申诉中" type="warning" />
        )}
      </View>
    </View>
  );
};

export default TaskCard;
