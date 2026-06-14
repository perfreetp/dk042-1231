import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { mockWithdrawRecords, totalBalance } from '@/data/settlements';
import { formatCurrency, getStatusText } from '@/utils';
import type { WithdrawRecord } from '@/types';
import styles from './index.module.scss';

type WithdrawMethod = '微信' | '支付宝' | '银行卡';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const FEE_RATE = 0.001;
const MIN_WITHDRAW = 10;

const WithdrawPage: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<WithdrawMethod>('微信');
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const fee = Math.max(amountNum * FEE_RATE, 0.1);
  const actualAmount = amountNum > 0 ? Math.max(amountNum - fee, 0) : 0;
  const canWithdraw = amountNum >= MIN_WITHDRAW && amountNum <= totalBalance;

  const handleQuickAmount = (val: number) => {
    const finalVal = Math.min(val, totalBalance);
    setAmount(String(finalVal));
  };

  const handleAll = () => {
    setAmount(String(totalBalance));
  };

  const handleSubmit = async () => {
    if (!canWithdraw || loading) return;

    Taro.showModal({
      title: '确认提现',
      content: `提现金额：${formatCurrency(amountNum)}\n手续费：${formatCurrency(fee)}\n实际到账：${formatCurrency(actualAmount)}\n方式：${method}`,
      confirmText: '确认提现',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (!res.confirm) return;

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setLoading(false);

        Taro.showToast({
          title: '提现申请已提交',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    });
  };

  const methods: { key: WithdrawMethod; name: string; desc: string; icon: string; iconCls: string }[] = [
    { key: '微信', name: '微信钱包', desc: '单笔限额：¥50,000，2小时内到账', icon: '💬', iconCls: styles.wechatIcon },
    { key: '支付宝', name: '支付宝', desc: '单笔限额：¥100,000，2小时内到账', icon: '💰', iconCls: styles.alipayIcon },
    { key: '银行卡', name: '银行卡', desc: '工作日次日到账，节假日顺延', icon: '💳', iconCls: styles.bankIcon }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.balanceCard}>
        <Text className={styles.balanceLabel}>可提现余额（元）</Text>
        <Text className={styles.balanceAmount}>{totalBalance.toFixed(2)}</Text>
        <Text className={styles.balanceTips}>
          预计到账金额 = 提现金额 - 手续费（费率0.1%，最低0.1元）
        </Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>提现金额</Text>
        </View>

        <View className={styles.amountSection}>
          <View className={styles.inputRow}>
            <Text className={styles.currencySymbol}>¥</Text>
            <Input
              className={styles.amountInput}
              type='digit'
              placeholder='请输入提现金额'
              placeholderClass='input-placeholder'
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
            <View className={styles.allBtn} onClick={handleAll}>全部</View>
          </View>

          <View className={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(val => (
              <View
                key={val}
                className={[styles.quickItem, amountNum === Math.min(val, totalBalance) ? styles.active : ''].join(' ')}
                onClick={() => handleQuickAmount(val)}
              >
                {val}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>提现方式</Text>
        </View>

        <View className={styles.methodList}>
          {methods.map(m => (
            <View
              key={m.key}
              className={[styles.methodItem, method === m.key ? styles.active : ''].join(' ')}
              onClick={() => setMethod(m.key)}
            >
              <View className={[styles.methodIcon, m.iconCls].join(' ')}>
                <Text>{m.icon}</Text>
              </View>
              <View className={styles.methodInfo}>
                <Text className={styles.methodName}>{m.name}</Text>
                <Text className={styles.methodDesc}>{m.desc}</Text>
              </View>
              <View className={[styles.radioDot, method === m.key ? styles.active : ''].join(' ')} />
            </View>
          ))}
        </View>
      </View>

      {amountNum > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleText}>到账明细</Text>
          </View>
          <View className={styles.feeTip}>
            <Text className={styles.tipIcon}>💡</Text>
            <View className={styles.tipText}>
              提现金额：{formatCurrency(amountNum)}
              {'\n'}手续费：{formatCurrency(fee)}
              {'\n'}实际到账：{formatCurrency(actualAmount)}
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>最近提现</Text>
        </View>
        <View className={styles.withdrawRecord}>
          {mockWithdrawRecords.slice(0, 4).map((r: WithdrawRecord) => (
            <View key={r.id} className={styles.recordItem}>
              <View className={styles.recordHeader}>
                <Text className={styles.recordMethod}>{r.method}提现</Text>
                <Text className={styles.recordAmount}>-{formatCurrency(r.amount)}</Text>
              </View>
              <View className={styles.recordMeta}>
                <Text className={styles.recordTime}>
                  {r.createdAt}
                  {r.completedAt && ` · ${r.completedAt}到账`}
                </Text>
                <Text className={[styles.recordStatus, r.status].join(' ')}>
                  {getStatusText(r.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View
          className={[styles.submitBtn, !canWithdraw ? styles.disabled : ''].join(' ')}
          onClick={handleSubmit}
        >
          {loading ? '提交中...' : `立即提现 ${actualAmount > 0 ? formatCurrency(actualAmount) : ''}`}
        </View>
      </View>
    </View>
  );
};

export default WithdrawPage;
