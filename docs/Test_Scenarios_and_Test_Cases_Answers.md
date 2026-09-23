# BadyetKarga — Test Scenarios & Test Cases

**App Name:** BadyetKarga  
**App Type / Domain:** Lifestyle — Meal Planning & Grocery Budget Management

---

## Main Features / Modules

1. Household Setup & Family Management  
2. Meal Planner & Dish Library  
3. Automatic Grocery List Generation  
4. Budget Optimization  
5. Shopping Mode  
6. Analytics & Notifications  

*(Authentication / Login is excluded from these scenarios.)*

---

## Test Scenarios

| Scenario ID | Test Scenario |
|---|---|
| **TS-01** | Verify that a user can complete household setup and add a family member with allergy and dietary restriction details. |
| **TS-02** | Verify that a user can add a dish from the Dish Library to an empty meal planner day and meal slot. |
| **TS-03** | Verify that planned meals correctly generate a grocery list with merged ingredients and estimated costs. |
| **TS-04** | Verify that Budget Optimization correctly shows when grocery cost exceeds the usable weekly budget. |
| **TS-05** | Verify that Shopping Mode lets the user check off grocery items while shopping. |
| **TS-06** | Verify that Analytics displays spending insights and notification preferences can be updated in Profile. |

---

## Positive & Negative Test Cases

---

### TS-01 — Household Setup & Family Management

**Related Scenario:** TS-01 — Verify that a user can complete household setup and add a family member with allergy and dietary restriction details.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_FAMILY_001 |
| **Title** | Successfully add a family member with allergy details |
| **Related Scenario** | TS-01 — Verify that a user can complete household setup and add a family member with allergy and dietary restriction details. |
| **Preconditions** | 1. User is already logged in. 2. Household setup is complete, or user can open Family Management from Profile. |
| **Test Steps** | 1. Open **Profile**. 2. Open **Family Management**. 3. Tap add family member. 4. Enter name, relationship, age, and gender. 5. Select allergy **Peanuts**. 6. Save the member. 7. Confirm the member appears in the list. |
| **Test Data** | Name: Ana Cruz · Relationship: Daughter · Age: 10 · Allergy: Peanuts |
| **Expected Result** | The family member is saved and shown in the family list. Allergy details are stored with the member profile. |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_FAMILY_002 |
| **Title** | Cannot save family member when name is empty |
| **Related Scenario** | TS-01 — Verify that a user can complete household setup and add a family member with allergy and dietary restriction details. |
| **Preconditions** | 1. User is already logged in. 2. Add / Edit Family Member form is open. |
| **Test Steps** | 1. Leave the **Name** field blank. 2. Enter Age = 10. 3. Tap **Save**. |
| **Test Data** | Name: (empty) · Age: 10 |
| **Expected Result** | The member is not saved. The app shows a validation message or keeps Save disabled. No blank member is added to the family list. |

---

### TS-02 — Meal Planner & Dish Library

**Related Scenario:** TS-02 — Verify that a user can add a dish from the Dish Library to an empty meal planner day and meal slot.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_PLAN_001 |
| **Title** | Successfully add Arroz Caldo to empty Mon lunch slot |
| **Related Scenario** | TS-02 — Verify that a user can add a dish from the Dish Library to an empty meal planner day and meal slot. |
| **Preconditions** | 1. User is logged in with completed household. 2. Mon lunch slot is empty. 3. Dish Library contains Arroz Caldo. |
| **Test Steps** | 1. Open **Planner**. 2. Tap the empty **Mon · Lunch** slot. 3. In Dish Library, find **Arroz Caldo**. 4. Tap **Add to Planner**. 5. Return to Planner and check Mon lunch. |
| **Test Data** | Dish: Arroz Caldo · Day: Mon · Meal: lunch |
| **Expected Result** | Arroz Caldo appears under Mon lunch. The slot is no longer empty. Opening that meal for details is view-only (already planned). |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_PLAN_002 |
| **Title** | Cannot add dish when there are no free planner days |
| **Related Scenario** | TS-02 — Verify that a user can add a dish from the Dish Library to an empty meal planner day and meal slot. |
| **Preconditions** | 1. User is logged in. 2. All available planner slots already have dishes. |
| **Test Steps** | 1. Open **Planner**. 2. Tap **Browse Dishes**. 3. Tap **Add to Planner** on any dish. |
| **Test Data** | Any dish from Dish Library · Open slots: none |
| **Expected Result** | The app shows a “No free days” (or similar) message. The dish is not added to the planner. |

---

### TS-03 — Automatic Grocery List Generation

**Related Scenario:** TS-03 — Verify that planned meals correctly generate a grocery list with merged ingredients and estimated costs.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_GROCERY_001 |
| **Title** | Grocery list generated with merged shared ingredients |
| **Related Scenario** | TS-03 — Verify that planned meals correctly generate a grocery list with merged ingredients and estimated costs. |
| **Preconditions** | 1. User is logged in. 2. Two dishes that both use Rice are available. 3. Current week grocery list can be regenerated. |
| **Test Steps** | 1. Plan Dish A on Mon lunch. 2. Plan Dish B on Mon dinner (also uses Rice). 3. Open **Groceries**. 4. Regenerate the list if needed. 5. Find the **Rice** row. 6. Check the total estimated cost. |
| **Test Data** | Dish A and Dish B both contain Rice · Same week plan |
| **Expected Result** | Grocery List shows ingredients from both dishes. Rice appears as one merged row with combined quantity. Total estimated cost updates correctly. |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_GROCERY_002 |
| **Title** | Grocery list shows empty state when no meals are planned |
| **Related Scenario** | TS-03 — Verify that planned meals correctly generate a grocery list with merged ingredients and estimated costs. |
| **Preconditions** | 1. User is logged in. 2. Meal Planner for the current week has no planned meals. |
| **Test Steps** | 1. Confirm Planner has no meals. 2. Open **Groceries**. 3. Tap regenerate if available. |
| **Test Data** | Planned meals: none |
| **Expected Result** | Grocery List shows an empty state (no items / plan meals first). No ingredient rows are created. The app does not crash. |

---

### TS-04 — Budget Optimization

**Related Scenario:** TS-04 — Verify that Budget Optimization correctly shows when grocery cost exceeds the usable weekly budget.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_BUDGET_001 |
| **Title** | Budget Optimization flags over-budget grocery plan |
| **Related Scenario** | TS-04 — Verify that Budget Optimization correctly shows when grocery cost exceeds the usable weekly budget. |
| **Preconditions** | 1. Weekly budget is set low (e.g. ₱500). 2. System automatic buffer is applied. 3. Enough meals are planned so grocery estimate exceeds usable budget. |
| **Test Steps** | 1. Set weekly budget to ₱500 in Edit Household. 2. Plan several higher-cost dishes. 3. Open **Groceries**. 4. Open **Optimize Budget / Budget Optimization**. 5. Review total cost, reserved buffer, and usable budget. |
| **Test Data** | Weekly budget: ₱500 · Multiple high-cost planned dishes |
| **Expected Result** | Budget Optimization shows grocery total above usable budget. Reserved buffer and usable budget are visible. The over-budget condition is clearly indicated. |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_BUDGET_002 |
| **Title** | User cannot manually choose buffer percentage options |
| **Related Scenario** | TS-04 — Verify that Budget Optimization correctly shows when grocery cost exceeds the usable weekly budget. |
| **Preconditions** | 1. User is logged in. 2. User opens Setup Wizard Household step or Edit Household. |
| **Test Steps** | 1. Open household budget settings. 2. Look for buffer choices such as 5%, 10%, 15%, or custom. 3. Change weekly budget and/or goals. 4. Observe the Automatic Budget Buffer section. |
| **Test Data** | Weekly budget: ₱3000 · Goal: Save Money |
| **Expected Result** | There is no 5/10/15/custom buffer picker. Buffer is calculated automatically from budget, goals, and meal style. Reserved amount updates when budget/goals change. |

---

### TS-05 — Shopping Mode

**Related Scenario:** TS-05 — Verify that Shopping Mode lets the user check off grocery items while shopping.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_SHOP_001 |
| **Title** | Successfully check off grocery items in Shopping Mode |
| **Related Scenario** | TS-05 — Verify that Shopping Mode lets the user check off grocery items while shopping. |
| **Preconditions** | 1. User is logged in. 2. Grocery List has at least two items generated from the meal plan. |
| **Test Steps** | 1. Open **Groceries**. 2. Open **Shopping Mode**. 3. Check the first grocery item. 4. Check the second grocery item. 5. Confirm checked items are marked as done. |
| **Test Data** | At least 2 grocery items present (e.g. Rice, Chicken) |
| **Expected Result** | Checked items are marked complete in Shopping Mode. Remaining unchecked items stay active. Progress is visible to the user. |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_SHOP_002 |
| **Title** | Shopping Mode has nothing useful to check when grocery list is empty |
| **Related Scenario** | TS-05 — Verify that Shopping Mode lets the user check off grocery items while shopping. |
| **Preconditions** | 1. User is logged in. 2. Grocery List is empty (no planned meals / no items). |
| **Test Steps** | 1. Open **Groceries**. 2. Confirm list is empty. 3. Open **Shopping Mode**. |
| **Test Data** | Grocery items: none |
| **Expected Result** | Shopping Mode shows an empty state or no items to check. User cannot complete a shopping checklist. App remains stable with no crash. |

---

### TS-06 — Analytics & Notifications

**Related Scenario:** TS-06 — Verify that Analytics displays spending insights and notification preferences can be updated in Profile.

#### Template A: Positive / Happy Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_ANALYTICS_001 |
| **Title** | Analytics loads and notification preferences can be turned on |
| **Related Scenario** | TS-06 — Verify that Analytics displays spending insights and notification preferences can be updated in Profile. |
| **Preconditions** | 1. User is logged in with completed household. 2. Analytics and Profile tabs are accessible. |
| **Test Steps** | 1. Open **Analytics**. 2. Confirm insight cards load (weekly spending, utilization, etc.). 3. Open **Profile**. 4. Turn Notifications master switch ON. 5. Enable Meal reminders. |
| **Test Data** | Notifications master: ON · Meal reminders: ON |
| **Expected Result** | Analytics screens display without crashing. Notification preferences save successfully and show as active. |

#### Template B: Negative / Error Path Test Case

| Field | Details |
|---|---|
| **Test Case ID** | TC_ANALYTICS_002 |
| **Title** | Turning notifications master OFF disables reminder categories |
| **Related Scenario** | TS-06 — Verify that Analytics displays spending insights and notification preferences can be updated in Profile. |
| **Preconditions** | 1. User is logged in. 2. Profile notification settings are visible. |
| **Test Steps** | 1. Open **Profile**. 2. Turn Notifications master switch OFF. 3. Observe Meal / Grocery / Budget reminder controls. 4. Leave Profile and return to confirm the setting remains OFF. |
| **Test Data** | Notifications master: OFF |
| **Expected Result** | Master switch stays OFF. Category reminders are inactive. Status does not show ALL ON. App does not crash. |

---

## Summary Map

| Scenario ID | Module | Positive Case | Negative Case |
|---|---|---|---|
| TS-01 | Household & Family | TC_FAMILY_001 | TC_FAMILY_002 |
| TS-02 | Meal Planner & Dish Library | TC_PLAN_001 | TC_PLAN_002 |
| TS-03 | Grocery List Generation | TC_GROCERY_001 | TC_GROCERY_002 |
| TS-04 | Budget Optimization | TC_BUDGET_001 | TC_BUDGET_002 |
| TS-05 | Shopping Mode | TC_SHOP_001 | TC_SHOP_002 |
| TS-06 | Analytics & Notifications | TC_ANALYTICS_001 | TC_ANALYTICS_002 |
