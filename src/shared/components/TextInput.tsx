import { useState } from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { colors, typography, spacing, radii } from '../theme';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
}

export default function TextInput({ label, error, value, onFocus, onBlur, ...rest }: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, (isFocused || !!value) && styles.labelFloating]}>
        {label}
      </Text>
      <RNTextInput
        value={value}
        style={[styles.input, isFocused && styles.inputFocused, !!error && styles.inputError]}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...rest}
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
    borderColor: colors.outline,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
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