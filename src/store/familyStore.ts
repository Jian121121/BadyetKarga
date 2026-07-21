import { create } from 'zustand';
import { addFamilyMember, getFamilyMembers, deleteFamilyMember, type FamilyMember } from '../../../services/database/familyRepository';

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;

  loadMembers: (userId: number) => Promise<void>;
  addMember: (userId: number, name: string, allergies: string, dietaryRestrictions: string) => Promise<void>;
  removeMember: (id: number, userId: number) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  isLoading: false,

  loadMembers: async (userId) => {
    set({ isLoading: true });
    const members = await getFamilyMembers(userId);
    set({ members, isLoading: false });
  },

  addMember: async (userId, name, allergies, dietaryRestrictions) => {
    await addFamilyMember(userId, name, allergies, dietaryRestrictions);
    const members = await getFamilyMembers(userId);
    set({ members });
  },

  removeMember: async (id, userId) => {
    await deleteFamilyMember(id);
    const members = await getFamilyMembers(userId);
    set({ members });
  },
}));