import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import WizardShell from '../components/WizardShell';
import { useAuthStore } from '../../../store/authStore';
import { useSetupWizardStore, createDraftMember } from '../../../store/setupWizardStore';
import { durableImageUri, IMAGE_PICKER_OPTS } from '../../../shared/utils/persistImage';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { digitsOnly, nameTextOnly, parseAgeYears } from '../../../shared/utils/validation';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Family'>;

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function WizardFamilyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const members = useSetupWizardStore((s) => s.members);
  const ensureOwner = useSetupWizardStore((s) => s.ensureOwner);
  const addMember = useSetupWizardStore((s) => s.addMember);
  const removeMember = useSetupWizardStore((s) => s.removeMember);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [choiceModal, setChoiceModal] = useState<'relationship' | 'gender' | null>(null);

  useEffect(() => {
    ensureOwner(currentUser?.fullName ?? 'Me');
  }, [currentUser?.fullName]);

  const goNext = () => navigation.navigate('Allergies');

  const openModal = () => {
    setName('');
    setRelationship('');
    setAge('');
    setGender('');
    setFavoriteFoods('');
    setAvatarUri(null);
    setModalVisible(true);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo access to add a family member photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTS);
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(durableImageUri(result.assets[0]));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTS);
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(durableImageUri(result.assets[0]));
    }
  };

  const saveMember = () => {
    if (!name.trim()) return;
    const ageCheck = parseAgeYears(age);
    if (!ageCheck.ok) {
      notify('Invalid age', ageCheck.error);
      return;
    }
    const selectedRelationship = relationship || 'Other';
    const selectedGender = gender || 'Other';
    setChoiceModal(null);
    setModalVisible(false);
    setTimeout(() => confirmAction('Add family member?', `Add ${name.trim()} to your household?`, 'Add', () => {
      addMember(
        createDraftMember({
          name: name.trim(),
          relationship: selectedRelationship,
          age: ageCheck.value,
          gender: selectedGender,
          favoriteFoods: favoriteFoods.trim(),
          avatarUri,
        })
      );
      notify('Family member added', `${name.trim()} was added to your household.`);
    }), 0);
  };

  const confirmRemove = (localId: string, memberName: string) => {
    confirmAction(
      'Remove member?',
      `Remove ${memberName} from the list?`,
      'Remove',
      () => removeMember(localId),
      { destructive: true }
    );
  };

  return (
    <WizardShell step={4} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add Your Family Members</Text>
        <Text style={styles.body}>
          Add everyone you cook for so plans match real portions and preferences. Photos show up
          on the weekly planner.
        </Text>

        {members.map((member) => (
          <View key={member.localId} style={styles.memberCard}>
            <View style={styles.avatar}>
              {member.avatarUri || (member.isOwner && currentUser?.avatarUri) ? (
                <Image
                  source={{
                    uri: member.avatarUri || currentUser?.avatarUri || undefined,
                  }}
                  style={styles.avatarImg}
                />
              ) : (
                <MaterialIcons name="person" size={26} color={colors.primary} />
              )}
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberMeta}>
                {[member.relationship, member.age && `${member.age} yrs`, member.gender]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {!!member.favoriteFoods && (
                <Text style={styles.memberFoods} numberOfLines={1}>
                  Loves: {member.favoriteFoods}
                </Text>
              )}
            </View>
            {!member.isOwner && (
              <Pressable onPress={() => confirmRemove(member.localId, member.name)} hitSlop={10}>
                <MaterialIcons name="delete-outline" size={22} color={colors.error} />
              </Pressable>
            )}
          </View>
        ))}

        <Pressable onPress={openModal} style={styles.addButton}>
          <MaterialIcons name="add" size={22} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Family Member</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue" onPress={goNext} />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalSheet, { paddingBottom: spacing.md + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.photoRow}>
                <Pressable style={styles.photoCircle} onPress={() => void pickPhoto()}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.photoImg} />
                  ) : (
                    <MaterialIcons name="person" size={32} color={colors.primary} />
                  )}
                </Pressable>
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoBtn} onPress={() => void takePhoto()}>
                    <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Camera</Text>
                  </Pressable>
                  <Pressable style={styles.photoBtn} onPress={() => void pickPhoto()}>
                    <MaterialIcons name="photo-library" size={16} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Gallery</Text>
                  </Pressable>
                </View>
              </View>

              <TextInput
                label="Name"
                value={name}
                onChangeText={(v) => setName(nameTextOnly(v))}
                placeholder="e.g. Maria"
              />

              <Text style={styles.modalFieldLabel}>Relationship</Text>
              <Pressable style={styles.selectField} onPress={() => setChoiceModal('relationship')}>
                <Text style={styles.selectValue}>{relationship || 'Choose relationship'}</Text>
                <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
              </Pressable>
              {choiceModal === 'relationship' && (
                <View style={styles.inlineChoiceCard}>
                  {RELATIONSHIPS.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.choiceRow, relationship === option && styles.choiceRowSelected]}
                      onPress={() => {
                        setRelationship(option);
                        setChoiceModal(null);
                      }}
                    >
                      <Text style={relationship === option ? styles.choiceTextSelected : styles.choiceText}>
                        {option}
                      </Text>
                      {relationship === option && <MaterialIcons name="check" size={20} color={colors.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}

              <TextInput
                label="Age"
                value={age}
                onChangeText={(v) => setAge(digitsOnly(v))}
                keyboardType="numeric"
                placeholder="e.g. 8"
              />

              <Text style={styles.modalFieldLabel}>Gender</Text>
              <Pressable style={styles.selectField} onPress={() => setChoiceModal('gender')}>
                <Text style={styles.selectValue}>{gender || 'Choose gender'}</Text>
                <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
              </Pressable>
              {choiceModal === 'gender' && (
                <View style={styles.inlineChoiceCard}>
                  {GENDERS.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.choiceRow, gender === option && styles.choiceRowSelected]}
                      onPress={() => {
                        setGender(option);
                        setChoiceModal(null);
                      }}
                    >
                      <Text style={gender === option ? styles.choiceTextSelected : styles.choiceText}>
                        {option}
                      </Text>
                      {gender === option && <MaterialIcons name="check" size={20} color={colors.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}

              <TextInput
                label="Favorite Foods (comma separated)"
                value={favoriteFoods}
                onChangeText={setFavoriteFoods}
                placeholder="e.g. Adobo, Sinigang"
              />

              <Button label="Add Member" onPress={saveMember} disabled={!name.trim()} style={styles.modalSave} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </WizardShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44 },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
  },
  memberMeta: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  memberFoods: {
    ...typography.labelLg,
    color: colors.primary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.full,
    height: 52,
    marginTop: spacing.xs,
  },
  addButtonText: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.primary,
  },
  footer: {
    padding: spacing.marginMobile,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.marginMobile,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoImg: { width: 72, height: 72 },
  photoActions: { gap: spacing.xs },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  photoBtnText: { ...typography.labelLg, fontSize: 13, color: colors.primary },
  modalFieldLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  selectValue: { ...typography.bodyLg, color: colors.onSurface },
  choiceCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  inlineChoiceCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  choiceRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  choiceRowSelected: { backgroundColor: colors.primaryContainer },
  choiceText: { ...typography.bodyLg, color: colors.onSurface },
  choiceTextSelected: { ...typography.titleMd, color: colors.primary },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  modalSave: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
