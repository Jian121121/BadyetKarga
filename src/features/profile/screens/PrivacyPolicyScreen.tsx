import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { LEGAL_DOCUMENTS } from '../../auth/content/legalDocuments';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const document = LEGAL_DOCUMENTS.privacy;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Card>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.updated}>Last updated: {document.updatedAt}</Text>
          <Text style={styles.intro}>{document.intro}</Text>
          {document.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  headerTitle: { ...typography.titleMd, color: colors.onSurface, flex: 1, textAlign: 'center' },
  content: { padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface },
  updated: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  intro: { ...typography.bodyMd, color: colors.onSurface, marginBottom: spacing.md },
  section: { marginBottom: spacing.md },
  heading: { ...typography.titleMd, color: colors.onSurface, marginBottom: 4 },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
