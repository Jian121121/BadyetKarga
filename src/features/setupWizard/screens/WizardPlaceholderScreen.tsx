import { View, Text, StyleSheet } from 'react-native';

export default function WizardPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup Wizard Steps 2-9 (coming in Phase 9)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, textAlign: 'center', paddingHorizontal: 24 },
});