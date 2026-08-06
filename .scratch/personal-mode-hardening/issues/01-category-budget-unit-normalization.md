# 01 — Category Budget Unit Normalization

**What to build:** Category budget progress bars and remaining budget limits compare spending in Rupees against monthly budget limits in Rupees, fixing the 100x overstatement caused by raw paise comparison.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] `getBudgets` server action converts accumulated category transaction totals from paise to Rupees before calculating spent ratios and remaining budgets.
- [x] Category progress bars (`BudgetRow`) display accurate percentage used and remaining budget amounts matching actual transaction totals.
- [x] Integration tests verify that spent totals and remaining budget calculations return expected Rupee amounts for test transactions stored in paise.
