import type { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { spacing } from '../theme';
import GlassView from './GlassView';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, style }: CardProps) {
  return <GlassView style={[styles.card, style]}>{children}</GlassView>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
});
