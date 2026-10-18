import { View, Text, Image, Pressable, StyleSheet, type ImageSourcePropType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';

interface MealCardProps {
  mealType: string;
  dishName: string;
  imageSource?: ImageSourcePropType;
  empty?: boolean;
  onPress?: () => void;
}

export default function MealCard({
  mealType,
  dishName,
  imageSource,
  empty = false,
  onPress,
}: MealCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, empty && styles.cardEmpty, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${mealType}: ${dishName}`}
    >
      <View style={styles.imageWrap}>
        {imageSource && !empty ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons
              name={empty ? 'add-circle-outline' : 'restaurant'}
              size={32}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.calendarBadge}>
          <MaterialIcons name="event" size={14} color={colors.onPrimary} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={styles.dishName} numberOfLines={2}>
          {dishName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  cardEmpty: {
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.85,
  },
  imageWrap: {
    position: 'relative',
    height: 124,
    backgroundColor: colors.primaryContainer,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radii.default,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.sm,
  },
  mealType: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dishName: {
    ...typography.titleMd,
    fontSize: 15,
    lineHeight: 20,
    color: colors.onSurface,
  },
});
