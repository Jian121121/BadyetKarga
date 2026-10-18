import { deleteHouseholdSettings } from './householdRepository';
import { getFamilyMembers, deleteFamilyMember } from './familyRepository';
import { clearPantryItems } from './pantryRepository';
import { clearMealPlanForUser } from './mealPlanRepository';
import { clearGroceryListForUser } from './groceryRepository';
import { clearMealExceptions } from './mealExceptionRepository';
import { clearShoppingHistory } from './purchaseRepository';
import { clearAppMeta } from './appMetaRepository';
import { getAllDishes, deleteCustomDish } from './dishRepository';

/**
 * Removes every household record tied to a local user id so the account starts
 * fresh (Setup Wizard shows again). Used when a brand-new Firebase account reuses
 * an email that already had local data on this device.
 */
export async function resetLocalUserData(userId: number): Promise<void> {
  const members = await getFamilyMembers(userId);
  for (const member of members) await deleteFamilyMember(userId, member.id);

  const dishes = await getAllDishes();
  for (const dish of dishes) {
    if (dish.isCustom && dish.createdBy === userId) await deleteCustomDish(userId, dish.id);
  }

  await clearMealPlanForUser(userId);
  await clearGroceryListForUser(userId);
  await clearPantryItems(userId);
  await clearMealExceptions(userId);
  await clearShoppingHistory(userId);
  await clearAppMeta(userId);
  await deleteHouseholdSettings(userId);
}
