import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Web entrance via Framer Motion. */
export default function FadeIn({ children, delay = 0, style }: FadeInProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        ...(flat as Record<string, unknown>),
      }}
    >
      {children}
    </motion.div>
  );
}
