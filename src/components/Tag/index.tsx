import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TagProps {
  text: string;
  type?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

const Tag: React.FC<TagProps> = ({ text, type = 'default', size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, styles[type], styles[size])}>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Tag;
