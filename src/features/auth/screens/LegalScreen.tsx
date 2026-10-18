import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { LEGAL_DOCUMENTS } from '../content/legalDocuments';

type Props = NativeStackScreenProps<AuthStackParamList, 'LegalDocument'>;

export default function LegalDocumentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const document = LEGAL_DOCUMENTS[route.params.document];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{document.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.updated}>Last updated: {document.updatedAt}</Text>
          <Text style={styles.intro}>{document.intro}</Text>

          {document.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  updated: {
    ...typography.labelLg,
    color: colors.primary,
  },
  intro: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeading: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  sectionBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
