import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radii } from '../theme';

interface GlassViewProps extends ViewProps {
  children?: ReactNode;
  intensity?: number;
}

/**
 * Frosted panel. On iOS and web the blur is real. On Android the tint
 * stays translucent when the platform cannot sample the view behind it.
 */
export default function GlassView({ children, style, intensity = 70, ...rest }: GlassViewProps) {
  return (
    <View style={[styles.shell, style]} {...rest}>
      <BlurView
        intensity={intensity}
        tint="systemUltraThinMaterialLight"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.wash} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    backgroundColor: 'transparent',
  },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassHighlight,
  },
});
