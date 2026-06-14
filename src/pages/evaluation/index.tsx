import React, { useState, useMemo } from 'react';
import { View, Text, Input, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { mockEvaluations } from '@/data/settlements';
import { getAverageRating, formatCurrency } from '@/utils';
import type { Evaluation } from '@/types';
import styles from './index.module.scss';

const WORKER_TAGS = ['准时到岗', '迟到早退', '手脚麻利', '效率低下', '配合默契', '态度不好', '工作认真', '偷工减料', '吃苦耐劳', '服务热情'];
const MERCHANT_TAGS = ['安排合理', '现场混乱', '沟通顺畅', '态度恶劣', '包吃满意', '薪资拖欠', '环境舒适', '管理混乱', '准时结薪', '加班有补贴'];

type RatingKey = 'punctuality' | 'cooperation' | 'completion';

const RATING_CONFIG: { key: RatingKey; label: string; icon: string }[] = [
  { key: 'punctuality', label: '守时程度', icon: '⏰' },
  { key: 'cooperation', label: '配合度', icon: '🤝' },
  { key: 'completion', label: '工作完成', icon: '✅' }
];

const STAR_ICONS = ['☆', '★'];
const STAR_COLORS = ['#C9CDD4', '#FFB800', '#FF8C00', '#FF6B35', '#FF4D00'];

const EvaluationPage: React.FC = () => {
  const router = useRouter();
  const { currentRole, user } = useStore();
  const isWorker = currentRole === 'worker';

  const taskId = router.params.taskId || 'task_004';
  const jobTitle = router.params.jobTitle || '会展中心展位协助';
  const targetId = router.params.targetId || (isWorker ? 'm_002' : 'u_001');
  const targetName = router.params.targetName || (isWorker ? '国家会议中心' : '张小明');
  const targetAvatar = router.params.targetAvatar || (isWorker ? 'https://picsum.photos/id/1082/200/200' : 'https://picsum.photos/id/64/200/200');

  const TAGS = isWorker ? MERCHANT_TAGS : WORKER_TAGS;

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    punctuality: 0,
    cooperation: 0,
    completion: 0
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const averageRating = useMemo(() => {
    if (ratings.punctuality === 0 && ratings.cooperation === 0 && ratings.completion === 0) {
      return 0;
    }
    return getAverageRating(ratings.punctuality, ratings.cooperation, ratings.completion);
  }, [ratings]);

  const canSubmit = ratings.punctuality > 0 && ratings.cooperation > 0 && ratings.completion > 0;

  const handleStarClick = (key: RatingKey, value: number) => {
    setRatings(prev => ({ ...prev, [key]: prev[key] === value ? value - 1 : value }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    Taro.showModal({
      title: '确认提交评价',
      content: `综合评分 ${averageRating} 分，提交后无法修改，是否确认？`,
      confirmText: '确认提交',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (!res.confirm) return;

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);

        Taro.showToast({
          title: '评价提交成功',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    });
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '取消评价',
      content: '确认放弃本次评价？',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack();
        }
      }
    });
  };

  const relatedEvaluations = mockEvaluations.filter(e => e.taskId === taskId);

  const renderStars = (count: number, size: 'sm' | 'lg' = 'sm') => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < count;
      const color = filled ? STAR_COLORS[count - 1] : STAR_COLORS[0];
      const icon = filled ? STAR_ICONS[1] : STAR_ICONS[0];
      return (
        <Text
          key={i}
          style={{
            color,
            fontSize: size === 'lg' ? 48 : 24
          }}
        >
          {icon}
        </Text>
      );
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.targetCard}>
        <View className={styles.targetAvatar}>
          <Image className={styles.targetAvatarImg} src={targetAvatar} mode='aspectFill' />
        </View>
        <View className={styles.targetInfo}>
          <Text className={styles.targetName}>{targetName}</Text>
          <Text className={styles.targetJob}>
            {jobTitle} · {isWorker ? '商家雇主' : '零工人员'}
          </Text>
        </View>
      </View>

      <View className={styles.ratingSection}>
        <Text className={styles.sectionTitle}>请为对方打分</Text>

        {RATING_CONFIG.map(config => (
          <View key={config.key} className={styles.ratingRow}>
            <Text className={styles.ratingLabel}>
              <Text className={styles.labelIcon}>{config.icon}</Text>
              {config.label}
            </Text>
            <View className={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(val => (
                <View
                  key={val}
                  className={styles.star}
                  onClick={() => handleStarClick(config.key, val)}
                >
                  <Text style={{ color: val <= ratings[config.key] ? STAR_COLORS[ratings[config.key] - 1] : STAR_COLORS[0] }}>
                    {val <= ratings[config.key] ? STAR_ICONS[1] : STAR_ICONS[0]}
                  </Text>
                </View>
              ))}
            </View>
            <Text className={styles.ratingValue}>
              {ratings[config.key] > 0 ? `${ratings[config.key]}.0` : '-'}
            </Text>
          </View>
        ))}

        {averageRating > 0 && (
          <View className={styles.averageRow}>
            <Text className={styles.averageLabel}>综合评分</Text>
            <Text className={styles.averageValue}>{averageRating}</Text>
            <View>{renderStars(Math.round(averageRating), 'sm')}</View>
          </View>
        )}
      </View>

      <View className={styles.tagsSection}>
        <Text className={styles.tagsTitle}>选择印象标签</Text>
        <Text className={styles.tagsDesc}>可多选，帮助其他{isWorker ? '零工' : '商家'}参考</Text>
        <View className={styles.tagsWrap}>
          {TAGS.map(tag => (
            <View
              key={tag}
              className={[styles.tagItem, selectedTags.includes(tag) ? styles.active : ''].join(' ')}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.commentSection}>
        <Text className={styles.commentTitle}>补充评价（可选）</Text>
        <Input
          className={styles.commentInput}
          type='text'
          placeholder='说说你的真实感受...'
          placeholderClass='input-placeholder'
          value={comment}
          maxlength={300}
          onInput={(e) => setComment(e.detail.value)}
        />
        <Text className={styles.commentCounter}>{comment.length}/300</Text>
      </View>

      {relatedEvaluations.length > 0 && (
        <View className={styles.historySection}>
          <Text className={styles.historyTitle}>相关评价</Text>
          {relatedEvaluations.map((e: Evaluation) => {
            const evalAverage = getAverageRating(e.punctuality, e.cooperation, e.completion);
            return (
              <View key={e.id} className={styles.evaluationItem}>
                <View className={styles.evalHeader}>
                  <Image className={styles.evalAvatar} src={e.fromAvatar} mode='aspectFill' />
                  <View className={styles.evalInfo}>
                    <Text className={styles.evalName}>{e.fromName}</Text>
                    <Text className={styles.evalTime}>{e.createdAt}</Text>
                  </View>
                  <View className={styles.evalStars}>
                    {renderStars(Math.round(evalAverage), 'sm')}
                  </View>
                </View>
                <Text className={styles.evalMeta}>
                  守时{e.punctuality}·配合{e.cooperation}·完成{e.completion}
                </Text>
                {e.tags.length > 0 && (
                  <View className={styles.evalTags}>
                    {e.tags.map(t => (
                      <Text key={t} className={styles.evalTag}>{t}</Text>
                    ))}
                  </View>
                )}
                {e.comment && <Text className={styles.evalComment}>{e.comment}</Text>}
              </View>
            );
          })}
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={handleCancel}>取消</View>
        <View
          className={[styles.submitBtn, !canSubmit ? styles.disabled : ''].join(' ')}
          onClick={handleSubmit}
        >
          {loading ? '提交中...' : '提交评价'}
        </View>
      </View>
    </View>
  );
};

export default EvaluationPage;
