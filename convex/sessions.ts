import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a completed study session
export const logSession = mutation({
  args: {
    userId: v.string(),
    subject: v.string(),
    durationMinutes: v.number(),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const xpEarned = Math.round(args.durationMinutes * 1.5);

    await ctx.db.insert("studySessions", {
      userId: args.userId,
      subject: args.subject,
      durationMinutes: args.durationMinutes,
      mood: args.mood,
      date: today,
      completed: true,
      xpEarned,
    });

    // Update user totals
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();

    if (user) {
      const isNewDay = user.lastStudyDate !== today;
      const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = isNewDay && user.lastStudyDate === yesterdayDate
        ? user.streakDays + 1
        : isNewDay ? 1 : user.streakDays;

      const newXP = user.totalXP + xpEarned;
      const newLevel = Math.floor(newXP / 500) + 1;

      await ctx.db.patch(user._id, {
        totalStudyMinutes: user.totalStudyMinutes + args.durationMinutes,
        totalXP: newXP,
        level: newLevel,
        streakDays: newStreak,
        lastStudyDate: today,
      });
    }

    return xpEarned;
  },
});

// Get all sessions for analytics
export const getSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get subject breakdown
export const getSubjectStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const subjectMap: Record<string, number> = {};
    for (const s of sessions) {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
    }
    return Object.entries(subjectMap).map(([subject, minutes]) => ({
      subject,
      minutes,
    }));
  },
});

// Get weekly study time
export const getWeeklyStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const weekly: Record<string, number> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      weekly[key] = 0;
    }
    for (const s of sessions) {
      if (s.date in weekly) weekly[s.date] += s.durationMinutes;
    }
    return Object.entries(weekly).map(([date, minutes]) => ({
      day: days[new Date(date).getDay()],
      minutes,
    }));
  },
});
