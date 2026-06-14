import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Tag from '../Tag';
import { getStatusText, formatCurrency } from '@/utils';
import { useStore } from '@/store/useStore';
import type { Task } from '@/types';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { checkInTask, checkOutTask, confirmTaskHours, submitAppeal } = useStore();

  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

  const estimatedSalary = task.hourlyRate * (task.actualHours || task.estimatedHours);

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认签到',
      content: `确定要签到「${task.jobTitle}」吗？\n当前时间将作为开始时间`,
      confirmText: '确认签到',
      confirmColor: '#2ECC71',
      success: (r) => {
        if (r.confirm) {
          checkInTask(task.id);
          Taro.showToast({ title: '签到成功', icon: 'success' });
        }
      }
    });
  };

  const handleCheckOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认签退',
      content: `确定要签退「${task.jobTitle}」吗？\n当前时间将作为结束时间`,
      confirmText: '确认签退',
      confirmColor: '#FF6B35',
      success: (r) => {
        if (r.confirm) {
          checkOutTask(task.id);
          Taro.showToast({ title: '签退成功', icon: 'success' });
        }
      }
    });
  };

  const handleConfirmHours = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hours = task.actualHours || task.estimatedHours;
    Taro.showModal({
      title: '确认工时',
      content: `「${task.jobTitle}」\n预计工时：${task.estimatedHours}小时\n实际工时：${hours}小时\n确认无误后提交？`,
      confirmText: '确认无误',
      confirmColor: '#2ECC71',
      success: (r) => {
        if (r.confirm) {
          confirmTaskHours(task.id, hours);
          Taro.showToast({ title: '工时已确认，等待结算', icon: 'success' });
        }
      }
    });
  };

  const handleAppeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` });
  };

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
            task.status === 'hours_confirmed' ? 'success' :
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
        {task.leaveReason && task.status === 'leave' && (
          <View className={styles.row}>
            <Text className={styles.label}>📝</Text>
            <Text className={styles.leaveReason}>请假原因：{task.leaveReason}</Text>
          </View>
        )}
        {task.appealReason && task.status === 'appeal' && (
          <View className={styles.row}>
            <Text className={styles.label}>⚠️</Text>
            <Text className={styles.appealReason}>申诉内容：{task.appealReason}</Text>
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.salaryBox}>
          <Text className={styles.salaryLabel}>预计收入</Text>
          <Text className={styles.salary}>{formatCurrency(estimatedSalary)}</Text>
        </View>
        {task.status === 'pending' && (
          <View
            className={styles.actionBtn}
            onClick={handleCheckIn}
          >
            <Text className={styles.actionText}>扫码签到</Text>
          </View>
        )}
        {task.status === 'ongoing' && (
          <View
            className={styles.actionBtn}
            onClick={handleCheckOut}
          >
            <Text className={styles.actionText}>扫码签退</Text>
          </View>
        )}
        {task.status === 'completed' && (
          <>
            <View
              className={[styles.actionBtn, styles.appealBtn].join(' ')}
              onClick={handleAppeal}
            >
              <Text className={[styles.actionText, styles.appealText].join(' ')}>申诉</Text>
            </View>
            <View
              className={styles.actionBtn}
              onClick={handleConfirmHours}
            >
              <Text className={styles.actionText}>确认工时</Text>
            </View>
          </>
        )}
        {task.status === 'hours_confirmed' && (
          <Tag text="✓ 工时已确认" type="success" size="md" />
        )}
        {task.status === 'appeal' && (
          <Tag text="申诉中" type="danger" size="md" />
        )}
        {task.status === 'leave' && (
          <Tag text="请假中" type="warning" size="md" />
        )}
      </View>
    </View>
  );
};

export default TaskCard;
