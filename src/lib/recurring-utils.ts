import { addDays, addWeeks, addMonths, addYears, getDaysInMonth } from "date-fns";

export function calculateNextRunDate(
  currentDate: Date,
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
  scheduleMode: "CALENDAR" | "FIXED_INTERVAL" = "CALENDAR",
  startDate?: Date
): Date {
  const effectiveStartDate = startDate || currentDate;

  switch (frequency) {
    case "DAILY":
      return addDays(currentDate, 1);

    case "WEEKLY":
      return addWeeks(currentDate, 1);

    case "MONTHLY": {
      if (scheduleMode === "FIXED_INTERVAL") {
        return addMonths(currentDate, 1);
      }
      // CALENDAR mode: preserves target day of month from startDate
      const targetDay = effectiveStartDate.getDate();
      const nextMonthBase = addMonths(currentDate, 1);
      const nextDate = new Date(nextMonthBase);
      nextDate.setDate(1);
      const maxDaysInNextMonth = getDaysInMonth(nextDate);
      const newDay = Math.min(targetDay, maxDaysInNextMonth);

      nextDate.setDate(newDay);
      return nextDate;
    }

    case "YEARLY": {
      if (scheduleMode === "FIXED_INTERVAL") {
        return addYears(currentDate, 1);
      }
      // CALENDAR mode: preserves target day and month from startDate
      const targetDay = effectiveStartDate.getDate();
      const targetMonth = effectiveStartDate.getMonth();
      const nextYearBase = addYears(currentDate, 1);
      
      const nextDate = new Date(nextYearBase);
      nextDate.setDate(1);
      nextDate.setMonth(targetMonth);
      const maxDaysInNextMonth = getDaysInMonth(nextDate);
      const newDay = Math.min(targetDay, maxDaysInNextMonth);

      nextDate.setDate(newDay);
      return nextDate;
    }

    default:
      return addMonths(currentDate, 1);
  }
}
