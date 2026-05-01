import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const INITIAL_NODES = [
  { nodeId: "foundations", category: "general", title: "Dasar Belajar", description: "Langkah awal membangun kebiasaan belajar", xpRequired: 0, icon: "🌱", parentNodeId: undefined },
  { nodeId: "basic-programming", category: "coding", title: "Dasar Pemrograman", description: "Variables, loops & conditions", xpRequired: 0, icon: "💻", parentNodeId: "foundations" },
  { nodeId: "math-basic", category: "math", title: "Matematika Dasar", description: "Arithmetic & algebra", xpRequired: 50, icon: "➕", parentNodeId: "foundations" },
  { nodeId: "logic-master", category: "coding", title: "Master Logika", description: "Advanced problem solving", xpRequired: 100, icon: "🧠", parentNodeId: "basic-programming" },
  { nodeId: "calculus", category: "math", title: "Kalkulus Seru", description: "Derivatives & integrals", xpRequired: 150, icon: "📐", parentNodeId: "math-basic" },
  { nodeId: "data-structures", category: "coding", title: "Struktur Data", description: "Arrays, stacks & queues", xpRequired: 200, icon: "🗂️", parentNodeId: "logic-master" },
  { nodeId: "statistics", category: "math", title: "Ahli Statistika", description: "Data analysis & probability", xpRequired: 250, icon: "📊", parentNodeId: "calculus" },
  { nodeId: "algorithms", category: "coding", title: "Ninja Algoritma", description: "Sorting, searching & optimization", xpRequired: 300, icon: "⚡", parentNodeId: "data-structures" },
];

// Initialize skill tree for a user
export const initSkillTree = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skillNodes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return; // Already initialized

    for (const node of INITIAL_NODES) {
      await ctx.db.insert("skillNodes", {
        userId: args.userId,
        ...node,
        unlocked: node.xpRequired === 0, // Unlock roots automatically
        completed: false,
      });
    }
  },
});

// Get all skill nodes for user
export const getSkillNodes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("skillNodes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Sync unlocks based on current XP
export const syncUnlocks = mutation({
  args: { userId: v.string(), currentXP: v.number() },
  handler: async (ctx, args) => {
    const nodes = await ctx.db
      .query("skillNodes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const node of nodes) {
      if (!node.unlocked && args.currentXP >= node.xpRequired) {
        await ctx.db.patch(node._id, { unlocked: true });
      }
    }
  },
});

// Mark a node as completed
export const completeNode = mutation({
  args: { userId: v.string(), nodeId: v.string() },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("skillNodes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("nodeId"), args.nodeId))
      .first();
    if (node) {
      await ctx.db.patch(node._id, { completed: true });
    }
  },
});
