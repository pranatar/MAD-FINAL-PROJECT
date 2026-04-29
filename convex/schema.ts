import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profile & progress
  users: defineTable({
    name: v.string(),
    email: v.string(),
    totalXP: v.number(),
    level: v.number(),
    currentMood: v.optional(v.string()), // "tired" | "energetic" | "bored"
    lastMoodUpdate: v.optional(v.number()),
    totalStudyMinutes: v.number(),
    streakDays: v.number(),
    lastStudyDate: v.optional(v.string()),
    badges: v.array(v.string()),
    googleId: v.optional(v.string()),
    picture: v.optional(v.string()),
    provider: v.optional(v.string()),
  }),

  // Study sessions
  studySessions: defineTable({
    userId: v.string(),
    subject: v.string(),
    durationMinutes: v.number(),
    mood: v.optional(v.string()),
    date: v.string(), // ISO date string
    completed: v.boolean(),
    xpEarned: v.number(),
  }).index("by_user", ["userId"]),

  // Tasks / Assignments with deadlines
  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    subject: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    deadline: v.string(), // ISO date string
    estimatedMinutes: v.number(),
    completed: v.boolean(),
    priority: v.number(), // auto-computed 1-5
  }).index("by_user", ["userId"]),

  // Scheduled study blocks
  scheduleBlocks: defineTable({
    userId: v.string(),
    taskId: v.optional(v.id("tasks")),
    title: v.string(),
    subject: v.string(),
    startTime: v.string(), // ISO datetime
    endTime: v.string(),
    completed: v.boolean(),
    type: v.union(v.literal("study"), v.literal("review"), v.literal("practice")),
    durationMinutes: v.optional(v.number()),
    description: v.optional(v.string()),
    tips: v.optional(v.string()),
    priority: v.optional(v.number()),
    focusTechnique: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Skill tree nodes
  skillNodes: defineTable({
    userId: v.string(),
    nodeId: v.string(),       // e.g. "basic-programming"
    category: v.string(),     // e.g. "coding", "math"
    title: v.string(),
    description: v.string(),
    xpRequired: v.number(),
    unlocked: v.boolean(),
    completed: v.boolean(),
    parentNodeId: v.optional(v.string()),
    icon: v.string(),
  }).index("by_user", ["userId"]),
});
