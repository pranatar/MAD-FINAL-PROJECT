import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user profile, create if not exists
export const getOrCreateUser = mutation({
  args: { userId: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) return existing;

    const id = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      totalXP: 0,
      level: 1,
      totalStudyMinutes: 0,
      streakDays: 0,
      badges: [],
    });
    return ctx.db.get(id);
  },
});

// Update user mood
export const updateMood = mutation({
  args: { userId: v.string(), mood: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();
    if (!user) return;
    await ctx.db.patch(user._id, {
      currentMood: args.mood,
      lastMoodUpdate: Date.now(),
    });
  },
});

// Add XP and auto level up
export const addXP = mutation({
  args: { userId: v.string(), xp: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();
    if (!user) return;
    const newXP = user.totalXP + args.xp;
    const newLevel = Math.floor(newXP / 500) + 1;
    const newBadges = [...user.badges];
    if (newLevel > user.level && !newBadges.includes(`Level ${newLevel}`)) {
      newBadges.push(`Level ${newLevel}`);
    }
    await ctx.db.patch(user._id, {
      totalXP: newXP,
      level: newLevel,
      badges: newBadges,
    });
  },
});

export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Reset user data to start fresh
export const resetUserData = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // 1. Get the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();
    
    if (!user) throw new Error("User not found");

    // 2. Delete all related data
    const tablesToClear = ["tasks", "studySessions", "scheduleBlocks", "skillNodes"] as const;
    for (const table of tablesToClear) {
      const records = await ctx.db
        .query(table as any)
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    // 3. Reset user profile stats
    await ctx.db.patch(user._id, {
      totalXP: 0,
      level: 1,
      totalStudyMinutes: 0,
      streakDays: 0,
      badges: [],
      currentMood: undefined,
      lastMoodUpdate: undefined,
      lastStudyDate: undefined,
    });

    return { success: true };
  },
});

