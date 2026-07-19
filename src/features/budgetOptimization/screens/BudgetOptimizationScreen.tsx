import { View, Text, StyleSheet } from 'react-native';

export default function BudgetOptimizationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget Optimization</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
});