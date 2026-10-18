import { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, typography, spacing, radii } from '../theme';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function TextInput({
  label,
  error,
  value,
  onFocus,
  onBlur,
  style,
  multiline,
  containerStyle,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, (isFocused || !!value) && styles.labelFloating]}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        {...rest}
        value={value}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  labelFloating: {
    ...typography.labelLg,
    color: colors.primary,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glass,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.labelLg,
    color: colors.error,
    marginTop: 4,
  },
});