import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';

interface MealCardProps {
  mealType: string;
  dishName: string;
  imageUri: string;
}

export default function MealCard({ mealType, dishName, imageUri }: MealCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={styles.dishName}>{dishName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 100 },
  content: { padding: spacing.sm },
  mealType: { ...typography.labelLg, color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  dishName: { ...typography.titleMd, color: colors.onSurface },
});