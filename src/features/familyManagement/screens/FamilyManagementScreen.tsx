import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import {
  useFamilyStore,
  defaultAvailability,
  type MemberAvailability,
} from '../../../store/familyStore';
import {
  getAvailabilityForMember,
  setAvailability as saveMemberAvailability,
} from '../../../services/database/availabilityRepository';
import {
  RELATIONSHIPS,
  GENDERS,
  ALLERGY_OPTIONS,
  DIET_OPTIONS,
} from '../../../shared/constants/family';
import { WEEK_DAYS, WEEK_MEALS } from '../../../shared/utils/week';
import { durableImageUri, IMAGE_PICKER_OPTS } from '../../../shared/utils/persistImage';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { digitsOnly, nameTextOnly, parseAgeYears } from '../../../shared/utils/validation';
import BackHeader from '../../../shared/components/BackHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function FamilyManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { members, loadMembers, addMember, updateMember, removeMember } = useFamilyStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Child');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [availability, setAvailability] = useState<MemberAvailability>(defaultAvailability());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [choiceModal, setChoiceModal] = useState<'relationship' | 'gender' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) void loadMembers(currentUser.id);
  }, [currentUser?.id]);

  const openModal = () => {
    setEditingId(null);
    setName('');
    setRelationship('Child');
    setAge('');
    setGender('');
    setFavoriteFoods('');
    setAllergies([]);
    setDiets([]);
    setAvailability(defaultAvailability());
    setAvatarUri(null);
    setModalVisible(true);
  };

  const openEditModal = async (member: (typeof members)[number]) => {
    setEditingId(member.id);
    setName(member.name);
    setRelationship(member.relationship || 'Other');
    setAge(member.age || '');
    setGender(member.gender || '');
    setFavoriteFoods(member.favoriteFoods || '');
    setAllergies(member.allergies ? member.allergies.split(/[,;/|]+/).filter(Boolean) : []);
    setDiets(member.dietaryRestrictions ? member.dietaryRestrictions.split(/[,;/|]+/).filter(Boolean) : []);
    const rows = await getAvailabilityForMember(member.id);
    const nextAvailability = defaultAvailability();
    for (const row of rows) {
      if (nextAvailability[row.dayOfWeek as keyof MemberAvailability]) {
        nextAvailability[row.dayOfWeek as keyof MemberAvailability] = {
          breakfast: row.breakfast,
          lunch: row.lunch,
          snack: row.snack,
          dinner: row.dinner,
        };
      }
    }
    setAvailability(nextAvailability);
    setAvatarUri(member.avatarUri ?? null);
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

  const copyFromOwner = () => {
    setAvailability(defaultAvailability());
  };

  const handleSave = () => {
    if (!currentUser || !name.trim() || saving) return;
    const ageCheck = parseAgeYears(age);
    if (!ageCheck.ok) {
      notify('Invalid age', ageCheck.error);
      return;
    }
    const isEditing = editingId !== null;
    const memberId = editingId;
    const selectedRelationship = relationship || 'Other';
    const selectedGender = gender || 'Other';
    setChoiceModal(null);
    setModalVisible(false);
    setTimeout(() => confirmAction(
      isEditing ? 'Save family member?' : 'Add family member?',
      isEditing ? `Save changes to ${name.trim()}?` : `Add ${name.trim()} to your household?`,
      isEditing ? 'Save' : 'Add',
      () =>
      void (async () => {
        setSaving(true);
        try {
          const patch = {
            name: name.trim(),
            allergies: allergies.join(','),
            dietaryRestrictions: diets.join(','),
            relationship: selectedRelationship,
            age: ageCheck.value,
            gender: selectedGender,
            favoriteFoods: favoriteFoods.trim(),
            avatarUri,
          };
          if (memberId !== null) {
            for (const day of WEEK_DAYS) {
              const slot = availability[day];
              await saveMemberAvailability(memberId, day, slot.breakfast, slot.lunch, slot.snack, slot.dinner);
            }
            await updateMember(memberId, currentUser.id, patch);
            notify('Family member updated', `${name.trim()} was saved.`);
          } else {
            await addMember(
              currentUser.id,
              name.trim(),
              allergies.join(','),
              diets.join(','),
              { relationship: selectedRelationship, age: ageCheck.value, gender: selectedGender, favoriteFoods: favoriteFoods.trim(), avatarUri },
              availability
            );
            notify('Family member added', `${name.trim()} was added to your household.`);
          }
          setEditingId(null);
        } catch (err) {
          notify('Could not save family member', err instanceof Error ? err.message : 'Please try again.');
        } finally {
          setSaving(false);
        }
      })()
    ), 0);
  };

  const handleRemove = (id: number, memberName: string) => {
    if (!currentUser) return;
    confirmAction(
      'Remove member?',
      `Remove ${memberName} from your household?`,
      'Remove',
      () => void removeMember(id, currentUser.id),
      { destructive: true }
    );
  };

  const toggleMeal = (day: (typeof WEEK_DAYS)[number], meal: (typeof WEEK_MEALS)[number]) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: !prev[day][meal] },
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: 0 }]}> 
      <BackHeader title="Family Members" onBack={navigation.goBack} />
      <View style={{ flex: 1, padding: spacing.marginMobile, paddingTop: spacing.sm }}>
      <Text style={styles.title}>Family Members</Text>
      <Text style={styles.subtitle}>
        Same details as Setup Wizard — allergies and schedules stay linked to meal planning.
      </Text>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.avatar}>
                {item.avatarUri ? (
                  <Image source={{ uri: item.avatarUri }} style={styles.avatarImg} />
                ) : (
                  <MaterialIcons name="person" size={22} color={colors.primary} />
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberMeta}>
                  {[item.relationship, item.age && `${item.age} yrs`, item.gender]
                    .filter(Boolean)
                    .join(' · ') || 'Family member'}
                </Text>
              </View>
              <View style={styles.memberActions}>
                <Pressable onPress={() => void openEditModal(item)} hitSlop={10}>
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </Pressable>
                {item.relationship !== 'Self' && (
                  <Pressable onPress={() => handleRemove(item.id, item.name)} hitSlop={10}>
                    <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                  </Pressable>
                )}
              </View>
            </View>
            {!!item.allergies && (
              <Text style={styles.memberDetail}>Allergies: {item.allergies}</Text>
            )}
            {!!item.dietaryRestrictions && (
              <Text style={styles.memberDetail}>Diet: {item.dietaryRestrictions}</Text>
            )}
            {!!item.favoriteFoods && (
              <Text style={styles.memberDetail}>Loves: {item.favoriteFoods}</Text>
            )}
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No family members added yet.</Text>}
      />

      <Button label="Add Family Member" onPress={openModal} style={styles.addButton} />

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
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId === null ? 'New Family Member' : 'Edit Family Member'}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                label="Full Name"
                value={name}
                onChangeText={(v) => setName(nameTextOnly(v))}
                placeholder="e.g. Baby Liam"
              />

              <Text style={styles.fieldLabel}>Relationship</Text>
              <Pressable style={styles.selectField} onPress={() => setChoiceModal('relationship')}>
                <Text style={styles.selectValue}>{relationship || 'Choose relationship'}</Text>
                <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
              </Pressable>
              {choiceModal === 'relationship' && (
                <View style={styles.inlineChoiceCard}>
                  {RELATIONSHIPS.filter((option) => option !== 'Self').map((option) => (
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
                label="Age (Years)"
                value={age}
                onChangeText={(v) => setAge(digitsOnly(v))}
                keyboardType="numeric"
                placeholder="e.g. 2"
              />

              <Text style={styles.fieldLabel}>Gender</Text>
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
                label="Favorite Foods"
                value={favoriteFoods}
                onChangeText={setFavoriteFoods}
                placeholder="e.g. Pasta, Apples, Chicken"
              />

              <Text style={styles.fieldLabel}>Major Allergies</Text>
              <View style={styles.chipRow}>
                {ALLERGY_OPTIONS.map((a) => {
                  const selected = allergies.includes(a);
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setAllergies(toggleInList(allergies, a))}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={selected ? styles.chipTextSelected : styles.chipText}>{a}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Dietary Lifestyles</Text>
              <View style={styles.chipRow}>
                {DIET_OPTIONS.map((d) => {
                  const selected = diets.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDiets(toggleInList(diets, d))}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={selected ? styles.chipTextSelected : styles.chipText}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.availHeader}>
                <Text style={styles.fieldLabel}>Weekly Availability</Text>
                <Pressable onPress={copyFromOwner} style={styles.sameAsMine}>
                  <MaterialIcons name="content-copy" size={14} color={colors.primary} />
                  <Text style={styles.sameAsMineText}>Full week</Text>
                </Pressable>
              </View>
              <View style={styles.grid}>
                <View style={styles.gridHeaderRow}>
                  <Text style={[styles.gridDay, styles.gridHeader]}>Day</Text>
                  {WEEK_MEALS.map((m) => (
                    <Text key={m} style={[styles.gridMeal, styles.gridHeader]}>
                      {m.charAt(0).toUpperCase()}
                    </Text>
                  ))}
                </View>
                {WEEK_DAYS.map((day) => (
                  <View key={day} style={styles.gridRow}>
                    <Text style={styles.gridDay}>{day}</Text>
                    {WEEK_MEALS.map((meal) => {
                      const on = availability[day][meal];
                      return (
                        <Pressable
                          key={meal}
                          onPress={() => toggleMeal(day, meal)}
                          style={[styles.toggle, on && styles.toggleOn]}
                        >
                          {on && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>

              <Button
                label={editingId === null ? 'Add Member' : 'Save Changes'}
                onPress={handleSave}
                disabled={!name.trim()}
                loading={saving}
                style={styles.modalSave}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  memberCard: { gap: 4 },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
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
  memberInfo: { flex: 1 },
  memberName: { ...typography.titleMd, color: colors.onSurface },
  memberMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  memberDetail: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  addButton: { marginTop: spacing.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.marginMobile,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.titleLg, color: colors.onSurface },
  fieldLabel: {
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
  chipSelected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  chipText: { ...typography.labelLg, fontSize: 13, color: colors.onSurfaceVariant },
  chipTextSelected: { ...typography.labelLg, fontSize: 13, color: colors.primary },
  availHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sameAsMine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  sameAsMineText: { ...typography.labelLg, color: colors.primary },
  grid: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  gridHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  gridHeader: { ...typography.labelLg, color: colors.onSurfaceVariant },
  gridDay: { width: 44, ...typography.bodyMd, color: colors.onSurface },
  gridMeal: { flex: 1, textAlign: 'center' },
  toggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    marginHorizontal: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  modalSave: { marginBottom: spacing.lg },
});
