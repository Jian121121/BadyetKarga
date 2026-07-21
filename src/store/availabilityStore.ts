import { create } from 'zustand';
import { setAvailability, getAvailabilityForMember, type Availability } from '../services/database/availabilityRepository';

interface AvailabilityState {
  availability: Availability[];
  loadAvailability: (familyMemberId: number) => Promise<void>;
  updateAvailability: (
    familyMemberId: number,
    dayOfWeek: string,
    breakfast: boolean,
    lunch: boolean,
    snack: boolean,
    dinner: boolean
  ) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availability: [],

  loadAvailability: async (familyMemberId) => {
    const availability = await getAvailabilityForMember(familyMemberId);
    set({ availability });
  },

  updateAvailability: async (familyMemberId, dayOfWeek, breakfast, lunch, snack, dinner) => {
    await setAvailability(familyMemberId, dayOfWeek, breakfast, lunch, snack, dinner);
    const availability = await getAvailabilityForMember(familyMemberId);
    set({ availability });
  },
}));