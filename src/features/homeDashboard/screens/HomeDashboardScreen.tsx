import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../shared/theme';
import HomeHeader from '../components/HomeHeader';
import WeeklyBudgetCard from '../components/WeeklyBudgetCard';
import QuickActions from '../components/QuickActions';
import FamilyCountCard from '../components/FamilyCountCard';
import MealCard from '../components/MealCard';

export default function HomeDashboardScreen() {
  return (
    <View style={styles.root}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Good Morning, Juan</Text>
        <Text style={styles.subGreeting}>Here's your household overview for today.</Text>

        <View style={styles.row}>
          <WeeklyBudgetCard spent={1250} total={4500} daysLeft={4} />
        </View>

        <View style={styles.row}>
          <QuickActions
            onPlanMeals={() => {}}
            onGenerateGroceryList={() => {}}
            onShoppingMode={() => {}}
          />
        </View>

        <View style={styles.row}>
          <FamilyCountCard count={4} />
        </View>

        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <View style={styles.mealsGrid}>
          <MealCard mealType="Breakfast" dishName="Garlic Rice & Egg" imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuBVzQlA-Br1RG8VA7BdzTu9DxWCFB6kN4ob2Jzn1JzdBdBsyIM6HaGT3LaDiZGbBVZP2NIFRLZ9cPQEruyMwnKQ5H_OkBpti7JK7o8H5QQVXOOj2boLAmUVlDOfgOieNF_0sYG5NKMdVx1ELRbm0BjRSdTwJs86pqls362aX1_0nRcW9bkvWLDzfWgjMiXHcBHE__uQXbDAx8w7wVAbug9scmKvEVFYAi5IdU6z81iAiRvqovESjorTfw" />
          <MealCard mealType="Lunch" dishName="Chicken Adobo" imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuCa08HnLQTrxBAW7WALdqWj8ZeWz4K2HACd_Imwgd2YpjppqDRKPAS3BcjDzTWqpvrMXt5zYjqk1EkHcrqlVrCR_ICRutmVdzrzMykkK8PYHmtfvWNF6iwnrrOZ8M0m-U62Tp6oeRPVxcEQAxKje5xsGiltQK9_T5ADtVDonaPiEwvANrmC5az3UZPgQ5TxL2V9sky3Xbxabjai5v8vrB6fHanwNpTzj7PyJ6j2mxeuznaufewXtGycnA" />
          <MealCard mealType="Snack" dishName="Fresh Fruit" imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuCfxZLf0r72jPG9-kKRIvWhGuF5OcBmCNfRNTVoqSAPv_ei_HXQltOEYMNK2t7fjxGBxJnx--hJTbwywHnIxaZM-v6VcCWEsgU3TFNdvSrocmaPB4CpT4KwI2Dmf3-hYVwoLDuLye-5DLprPUtU8D_IOjWf6JrPl6Ujw3t9kr2XvQpj6iqpLEyjoiqVhsSrguCX144V_e-ebLHV9PS2j3_dq46A30GRGX1aEBTlDQ48_Sz7UpRsVS-CdA" />
          <MealCard mealType="Dinner" dishName="Sinigang" imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuCdgVonjqlCPw_5PBJ8Qifk3fRYIltPrmGb3-7q_lIY4erhNpt69RLR3_H2eL_bj51bhTtM_-cVeeUuZLj1ALSIIUg2ENzFsKvR7LxJHs3yvDZ99Qx3M8Kp5mQY59PsnG7fEpgr4Gn71ROOfhx5KTRKow9RcIgJ8kJkmtgUU0NFYFhREXdrnBLUALShvFVt-ENkH1TGNObx6q-c9FEAOTjIu9bSgR7R2YFUlrvt8QXzk1Fb6onYP9NOHQ" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingBottom: 100 },
  greeting: { ...typography.displayLg, color: colors.onSurface, marginBottom: spacing.xs },
  subGreeting: { ...typography.bodyLg, color: colors.onSurfaceVariant, marginBottom: spacing.xl },
  row: { marginBottom: spacing.md },
  sectionTitle: { ...typography.headlineLgMobile, color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.md },
  mealsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});