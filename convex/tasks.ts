import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks for a user
export const getTasks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    subject: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    deadline: v.string(),
    estimatedMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Auto-compute priority based on deadline proximity & difficulty
    const daysUntilDeadline = Math.max(
      1,
      Math.ceil(
        (new Date(args.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );
    const difficultyScore = args.difficulty === "hard" ? 3 : args.difficulty === "medium" ? 2 : 1;
    const priority = Math.min(5, Math.round((5 / daysUntilDeadline) * difficultyScore));

    return ctx.db.insert("tasks", {
      ...args,
      completed: false,
      priority,
    });
  },
});

// Mark task as done
export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { completed: true });
  },
});

// Delete task
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

// Get active schedule blocks
export const getScheduleBlocks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Auto-generate schedule blocks from tasks
export const generateSchedule = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    // Delete old uncompleted blocks
    const oldBlocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();
    for (const block of oldBlocks) {
      await ctx.db.delete(block._id);
    }

    // Sort by priority desc
    const sorted = [...tasks].sort((a, b) => b.priority - a.priority);
    let currentTime = new Date();
    // Start from tomorrow 8AM
    currentTime.setDate(currentTime.getDate() + 1);
    currentTime.setHours(8, 0, 0, 0);

    for (const task of sorted) {
      const blockMinutes = Math.min(task.estimatedMinutes, 90); // cap at 90min
      const endTime = new Date(currentTime.getTime() + blockMinutes * 60000);

      await ctx.db.insert("scheduleBlocks", {
        userId: args.userId,
        taskId: task._id,
        title: `Study: ${task.title}`,
        subject: task.subject,
        startTime: currentTime.toISOString(),
        endTime: endTime.toISOString(),
        completed: false,
        type: task.difficulty === "hard" ? "study" : "review",
      });

      // Next block 30min after
      currentTime = new Date(endTime.getTime() + 30 * 60000);
      if (currentTime.getHours() >= 21) {
        // Next day 8AM
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(8, 0, 0, 0);
      }
    }
  },
});
