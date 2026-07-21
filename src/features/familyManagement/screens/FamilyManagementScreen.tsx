import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore'
import { useFamilyStore } from '../../../store/familyStore';

export default function FamilyManagementScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { members, loadMembers, addMember, removeMember } = useFamilyStore();

  const [name, setName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  useEffect(() => {
    if (currentUser) loadMembers(currentUser.id);
  }, [currentUser]);

  const handleAdd = async () => {
    if (!currentUser || !name) return;
    await addMember(currentUser.id, name, allergies, dietaryRestrictions);
    setName('');
    setAllergies('');
    setDietaryRestrictions('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Members</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.memberCard}>
            <Text style={styles.memberName}>{item.name}</Text>
            {!!item.allergies && <Text style={styles.memberDetail}>Allergies: {item.allergies}</Text>}
            {!!item.dietaryRestrictions && <Text style={styles.memberDetail}>Restrictions: {item.dietaryRestrictions}</Text>}
            <Button
              label="Remove"
              variant="text"
              onPress={() => currentUser && removeMember(item.id, currentUser.id)}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No family members added yet.</Text>}
      />

      <Card style={styles.form}>
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput label="Allergies (optional)" value={allergies} onChangeText={setAllergies} />
        <TextInput label="Dietary Restrictions (optional)" value={dietaryRestrictions} onChangeText={setDietaryRestrictions} />
        <Button label="Add Family Member" onPress={handleAdd} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.md },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  memberCard: { gap: 4 },
  memberName: { ...typography.titleMd, color: colors.onSurface },
  memberDetail: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginVertical: spacing.md },
  form: { gap: spacing.sm, marginTop: spacing.md },
});