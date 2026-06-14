import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  mockSettlements,
  mockWithdrawRecords,
  totalPendingIncome,
  totalBalance
} from '@/data/settlements';
import EmptyState from '@/components/EmptyState';
import { formatCurrency, getStatusText } from '@/utils';
import styles from './index.module.scss';

const SettlementPage: React.FC = () => {
  const totalPaid = mockSettlements
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.netAmount, 0);

  const pendingSettlements = mockSettlements.filter(s => s.status === 'pending');
  const paidSettlements = mockSettlements.filter(s => s.status === 'paid');

  const goWithdraw = () => {
    console.log('[Settlement] go withdraw, balance:', totalBalance);
    if (totalBalance <= 0) {
      Taro.showToast({ title: '暂无可提现金额', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: '/pages/withdraw/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.balanceSection}>
        <Text className={styles.balanceLabel}>可提现余额（元）</Text>
        <Text className={styles.balanceAmount}>{totalBalance.toFixed(2)}</Text>
        <View className={styles.balanceRow}>
          <View className={styles.balanceInfo}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>待结算</Text>
              <Text className={styles.infoValue}>{formatCurrency(totalPendingIncome)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>累计收入</Text>
              <Text className={styles.infoValue}>{formatCurrency(totalPaid + totalBalance)}</Text>
            </View>
          </View>
          <View className={styles.withdrawBtn} onClick={goWithdraw}>
            立即提现
          </View>
        </View>
      </View>

      {pendingSettlements.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleText}>
              <Text className={styles.sectionIcon}>⏳</Text>
              待结算明细
            </Text>
            <Text className={styles.moreLink}>{pendingSettlements.length}笔</Text>
          </View>
          <View className={styles.deductionCard}>
            {pendingSettlements.map(s => (
              <View key={s.id}>
                <View className={styles.deductionRow}>
                  <Text className={styles.deductionLabel}>{s.jobTitle}（{s.date}）</Text>
                  <Text className={[styles.deductionAmount, styles.positive].join(' ')}>
                    +{formatCurrency(s.netAmount)}
                  </Text>
                </View>
                {s.deductions.map((d, i) => (
                  <View key={`d-${i}`} className={styles.deductionRow}>
                    <Text className={styles.deductionLabel}>  - {d.label}</Text>
                    <Text className={[styles.deductionAmount, styles.negative].join(' ')}>
                      -{formatCurrency(d.amount)}
                    </Text>
                  </View>
                ))}
                {s.bonus.map((b, i) => (
                  <View key={`b-${i}`} className={styles.deductionRow}>
                    <Text className={styles.deductionLabel}>  + {b.label}</Text>
                    <Text className={[styles.deductionAmount, styles.positive].join(' ')}>
                      +{formatCurrency(b.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>
            <Text className={styles.sectionIcon}>📊</Text>
            历史工资
          </Text>
          <Text className={styles.moreLink}>共{paidSettlements.length}笔</Text>
        </View>
        {paidSettlements.length > 0 ? (
          <View className={styles.settlementList}>
            {paidSettlements.map(s => (
              <View key={s.id} className={styles.settlementItem}>
                <View className={styles.settlementHeader}>
                  <Text className={styles.settlementJob}>{s.jobTitle}</Text>
                  <Text className={[styles.settlementStatus, s.status].join(' ')}>
                    {getStatusText(s.status)}
                  </Text>
                </View>
                <View className={styles.settlementMeta}>
                  <Text className={styles.settlementDate}>
                    工作日期：{s.date} · 到账：{s.paidAt}
                  </Text>
                  <Text className={styles.settlementNet}>
                    {formatCurrency(s.netAmount)}
                  </Text>
                </View>
                <View className={styles.settlementDetail}>
                  <Text className={styles.detailTag}>
                    底薪 {formatCurrency(s.baseAmount)}
                  </Text>
                  {s.bonus.map((b, i) => (
                    <Text key={i} className={styles.detailTag}>
                      {b.label} +{formatCurrency(b.amount)}
                    </Text>
                  ))}
                  {s.deductions.map((d, i) => (
                    <Text key={i} className={styles.detailTag}>
                      {d.label} -{formatCurrency(d.amount)}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon="💰" title="暂无历史工资" description="完成任务后，工资记录会显示在这里" />
        )}
      </View>

      <View className={[styles.section, styles.withdrawSection].join(' ')}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>
            <Text className={styles.sectionIcon}>💳</Text>
            提现记录
          </Text>
          <Text className={styles.moreLink}>共{mockWithdrawRecords.length}笔</Text>
        </View>
        {mockWithdrawRecords.length > 0 ? (
          mockWithdrawRecords.map(r => (
            <View key={r.id} className={styles.withdrawItem}>
              <View className={styles.withdrawLeft}>
                <Text className={styles.withdrawMethod}>{r.method}提现</Text>
                <Text className={styles.withdrawDate}>
                  申请：{r.createdAt}
                  {r.completedAt && ` · 到账：${r.completedAt}`}
                </Text>
              </View>
              <View className={styles.withdrawRight}>
                <Text className={styles.withdrawAmount}>-{formatCurrency(r.amount)}</Text>
                <Text className={[styles.withdrawStatus, r.status].join(' ')}>
                  {getStatusText(r.status)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="🏦" title="暂无提现记录" description="第一次提现后，记录会显示在这里" />
        )}
      </View>
    </ScrollView>
  );
};

export default SettlementPage;
