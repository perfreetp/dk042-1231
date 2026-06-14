import React, { useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { calculateShiftHours } from '@/store/useStore';
import type { JobType, JobShift } from '@/types';
import styles from './index.module.scss';

const JOB_TYPES: JobType[] = ['餐饮', '会展', '仓储', '物流', '零售', '保洁', '安保', '其他'];
const AVAILABLE_TAGS = ['日结', '周结', '月结', '包吃', '包住', '急招', '长期', '周末', '夜班', '轻松', '高薪'];

const MOCK_LOCATIONS = [
  { address: '北京市朝阳区朝阳大悦城', latitude: 39.9271, longitude: 116.5187, distance: '1.2km' },
  { address: '北京市海淀区中关村软件园', latitude: 40.0499, longitude: 116.2854, distance: '8.5km' },
  { address: '北京市大兴区亦庄经济开发区', latitude: 39.7817, longitude: 116.5047, distance: '12.3km' },
  { address: '北京市朝阳区三里屯太古里', latitude: 39.9384, longitude: 116.4546, distance: '2.8km' }
];

const PublishJobPage: React.FC = () => {
  const addJob = useStore(s => s.addJob);

  const [title, setTitle] = useState('');
  const [jobType, setJobType] = useState<JobType>('餐饮');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [headcount, setHeadcount] = useState(5);
  const [hourlyRate, setHourlyRate] = useState('25');
  const [salaryNote, setSalaryNote] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(39.9087);
  const [longitude, setLongitude] = useState(116.3975);
  const [distance, setDistance] = useState('3.5km');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shifts, setShifts] = useState<JobShift[]>([
    { date: '2026-06-15', startTime: '09:00', endTime: '18:00' }
  ]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addShift = () => {
    if (shifts.length >= 10) {
      Taro.showToast({ title: '最多添加10个班次', icon: 'none' });
      return;
    }
    setShifts([...shifts, { date: '2026-06-16', startTime: '09:00', endTime: '18:00' }]);
  };

  const removeShift = (index: number) => {
    if (shifts.length <= 1) {
      Taro.showToast({ title: '至少保留1个班次', icon: 'none' });
      return;
    }
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const updateShift = (index: number, field: keyof JobShift, value: string) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const validate = (): string | null => {
    if (!title.trim()) return '请填写岗位名称';
    if (!description.trim()) return '请填写岗位说明';
    if (!address.trim()) return '请填写工作地址';
    if (Number(hourlyRate) <= 0) return '请输入有效的时薪';
    if (headcount <= 0) return '请设置招聘人数';
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      Taro.showToast({ title: error, icon: 'none' });
      return;
    }

    const reqList = requirements
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const newJob = addJob({
      title,
      type: jobType,
      description,
      requirements: reqList.length > 0 ? reqList : ['身体健康，吃苦耐劳'],
      shifts,
      headcount,
      hourlyRate: Number(hourlyRate),
      salaryNote: salaryNote || '按时结算，薪资透明',
      address: address || '请输入工作地址',
      latitude,
      longitude,
      distance,
      tags: selectedTags
    });

    console.log('[PublishJob] submit success, jobId:', newJob.id);

    Taro.showModal({
      title: '发布成功',
      content: `岗位"${title}"已发布\n共${shifts.length}个班次，招${headcount}人\n可在"我的岗位"中查看管理`,
      showCancel: false,
      confirmText: '去看看',
      confirmColor: '#FF6B35',
      success: () => {
        Taro.switchTab({ url: '/pages/home/index' });
      }
    });
  };

  const handleSaveDraft = () => {
    console.log('[PublishJob] save draft');
    Taro.showToast({ title: '已保存为草稿', icon: 'success' });
  };

  const handlePickLocation = () => {
    const locationList = MOCK_LOCATIONS.map(l => `${l.address}（${l.distance}）`).join('\n');
    Taro.showActionSheet({
      itemList: MOCK_LOCATIONS.map(l => `${l.address}（${l.distance}）`),
      success: (res) => {
        const loc = MOCK_LOCATIONS[res.tapIndex];
        setAddress(loc.address);
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
        setDistance(loc.distance);
        Taro.showToast({ title: '已选择地址', icon: 'success' });
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          基本信息
        </Text>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>岗位名称</Text>
          <Input
            className={styles.input}
            placeholder="如：餐厅服务员、仓库分拣员"
            placeholderClass={styles.input}
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={30}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>工作类型</Text>
          <View className={styles.typeGrid}>
            {JOB_TYPES.map(type => (
              <View
                key={type}
                className={classnames(styles.typeChip, jobType === type && styles.active)}
                onClick={() => setJobType(type)}
              >
                {type}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>岗位说明</Text>
          <Textarea
            className={styles.textarea}
            placeholder="请详细描述工作内容、工作环境等"
            placeholderStyle="color: #C9CDD4"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>任职要求（每行一条）</Text>
          <Textarea
            className={styles.textarea}
            placeholder={`如：\n年龄18-45岁\n身体健康无传染疾病\n吃苦耐劳，服从管理`}
            placeholderStyle="color: #C9CDD4"
            value={requirements}
            onInput={(e) => setRequirements(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🕐</Text>
          班次设置
        </Text>

        {shifts.map((shift, index) => (
          <View key={index} className={styles.shiftCard}>
            {shifts.length > 1 && (
              <View className={styles.removeShift} onClick={() => removeShift(index)}>
                ✕
              </View>
            )}
            <View className={styles.shiftRow}>
              <View className={styles.shiftField}>
                <Text className={styles.shiftLabel}>工作日期</Text>
                <Input
                  className={styles.shiftInput}
                  type="digit"
                  value={shift.date}
                  onInput={(e) => updateShift(index, 'date', e.detail.value)}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
            <View className={styles.shiftRow}>
              <View className={styles.shiftField}>
                <Text className={styles.shiftLabel}>开始时间</Text>
                <Input
                  className={styles.shiftInput}
                  value={shift.startTime}
                  onInput={(e) => updateShift(index, 'startTime', e.detail.value)}
                  placeholder="HH:MM"
                />
              </View>
              <View className={styles.shiftField}>
                <Text className={styles.shiftLabel}>结束时间</Text>
                <Input
                  className={styles.shiftInput}
                  value={shift.endTime}
                  onInput={(e) => updateShift(index, 'endTime', e.detail.value)}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </View>
        ))}

        <View className={styles.addShiftBtn} onClick={addShift}>
          + 添加班次
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💰</Text>
          薪资与人数
        </Text>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>时薪标准</Text>
          <View className={styles.salaryRow}>
            <Input
              className={styles.salaryInput}
              type="digit"
              value={hourlyRate}
              onInput={(e) => setHourlyRate(e.detail.value)}
              placeholder="请输入时薪"
            />
            <Text className={styles.salaryUnit}>元/小时</Text>
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>招聘人数</Text>
          <View className={styles.numInputWrap}>
            <View className={styles.numBtn} onClick={() => setHeadcount(Math.max(1, headcount - 1))}>
              －
            </View>
            <Text className={styles.numValue}>{headcount}</Text>
            <View className={styles.numBtn} onClick={() => setHeadcount(headcount + 1)}>
              ＋
            </View>
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>薪资说明</Text>
          <Input
            className={styles.input}
            placeholder="如：日结、包吃、全勤奖等"
            value={salaryNote}
            onInput={(e) => setSalaryNote(e.detail.value)}
            maxlength={50}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          工作地点
        </Text>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>详细地址</Text>
          <Input
            className={styles.input}
            placeholder="请输入或在地图上选择地址"
            value={address}
            onInput={(e) => setAddress(e.detail.value)}
            maxlength={100}
          />
        </View>
        <View
          style={{
            background: '#E8F4FD',
            padding: '20rpx 24rpx',
            borderRadius: '12rpx',
            color: '#3498DB',
            fontSize: '28rpx',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handlePickLocation}
        >
          🗺️ 打开地图定位选点
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🏷️</Text>
          岗位标签
        </Text>
        <View className={styles.tagsArea}>
          {AVAILABLE_TAGS.map(tag => (
            <View
              key={tag}
              className={classnames(styles.tagChip, selectedTags.includes(tag) && styles.active)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnSecondary)} onClick={handleSaveDraft}>
          保存草稿
        </View>
        <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSubmit}>
          立即发布
        </View>
      </View>
    </View>
  );
};

export default PublishJobPage;
