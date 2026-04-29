import { v } from "convex/values";
import { action } from "./_generated/server";

// Helper: try multiple Gemini models
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const MODELS = [
    "gemini-1.5-flash",        // Primary stable fast model
    "gemini-1.5-flash-8b",     // High rate limit
    "gemini-1.5-pro",          // High quality
    "gemini-2.0-flash-exp",    // Experimental 2.0
    "gemini-1.0-pro",          // Legacy stable
  ];

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const errors: string[] = [];

  for (const model of MODELS) {
    // Try both v1 and v1beta as some models are only in one or the other
    const versions = ["v1beta", "v1"];
    
    for (const version of versions) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err?.error?.message || err?.message || res.statusText;
          errors.push(`${model} (${version}): ${errMsg}`);
          continue;
        }

        const data = await res.json();
        const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (e: any) {
        errors.push(`${model} (${version}): ${e.message}`);
        continue;
      }
    }
  }

  throw new Error(`Gemini Error:\n${errors.join('\n')}`);
}

// Helper: try multiple Groq models (Llama, Mixtral, etc)
async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ];

  const errors: string[] = [];

  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err?.error?.message || err?.message || res.statusText;
        errors.push(`Groq ${model}: ${errMsg}`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e: any) {
      errors.push(`Groq ${model}: ${e.message}`);
      continue;
    }
  }

  throw new Error(`Groq Error:\n${errors.join('\n')}`);
}

// Master AI Router: Tries Gemini first, if it fails (or no key), tries Groq
async function callAI(prompt: string): Promise<string> {
  const errors: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt);
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  if (errors.length === 0) {
    throw new Error("Tidak ada kunci API yang dipasang. Tambahkan GEMINI_API_KEY atau GROQ_API_KEY di .env.local");
  }

  throw new Error(errors.join('\n\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI Chat Tutor
// ─────────────────────────────────────────────────────────────────────────────
export const chatTutor = action({
  args: {
    message: v.string(),
    mood: v.optional(v.string()),
    history: v.array(v.object({ role: v.string(), text: v.string() })),
  },
  handler: async (_ctx, args) => {
    const moodCtx = args.mood
      ? `Saat ini student sedang merasa: ${args.mood}. Sesuaikan nada bicara.`
      : "";

    const historyText = args.history
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`)
      .join("\n");

    const prompt = `Kamu adalah Tutor AI bernama Aivora. Gunakan Bahasa Indonesia yang ramah dan semi-formal.
Tugasmu: membimbing belajar, memberikan latihan, dan memotivasi. ${moodCtx}

Riwayat percakapan:
${historyText}

Student: ${args.message}
Tutor:`;

    return callAI(prompt);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AI Study Insights
// ─────────────────────────────────────────────────────────────────────────────
export const getInsights = action({
  args: {
    totalStudyMinutes: v.number(),
    streakDays: v.number(),
    completedTasksCount: v.number(),
  },
  handler: async (_ctx, args) => {
    const prompt = `Analisis performa belajar student berikut:
- Total Menit Belajar: ${args.totalStudyMinutes}
- Streak Hari Berturut-turut: ${args.streakDays}
- Tugas diselesaikan: ${args.completedTasksCount}

Berikan 1 paragraf singkat (maksimal 3 kalimat) berupa insight dan motivasi personal. Bahasa Indonesia yang ramah.`;

    return callAI(prompt);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI Generate Schedule
// ─────────────────────────────────────────────────────────────────────────────
export const generateSchedule = action({
  args: {
    tasks: v.array(
      v.object({
        title: v.string(),
        subject: v.string(),
        estimatedMinutes: v.number(),
        difficulty: v.string(),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const tasksData = JSON.stringify(args.tasks);
    const prompt = `Kamu adalah asisten jadwal belajar. Buat jadwal belajar dari tugas berikut:
${tasksData}

Buat blok jadwal menggunakan teknik Pomodoro (maks 45 menit per sesi).
Kembalikan HANYA JSON array valid seperti ini, tanpa backtick atau teks lain:
[
  {
    "title": "Judul sesi",
    "subject": "Mata kuliah",
    "startTime": "Sesi Pagi 1",
    "endTime": "Sesi Pagi 2",
    "type": "study",
    "durationMinutes": 45,
    "description": "Apa yang dikerjakan di sesi ini",
    "tips": "1 tips belajar praktis",
    "priority": 2,
    "focusTechnique": "Pomodoro"
  }
]
type harus salah satu dari: "study", "review", atau "practice".`;

    const rawReply = await callAI(prompt);

    try {
      const startIdx = rawReply.indexOf("[");
      const endIdx = rawReply.lastIndexOf("]");
      if (startIdx === -1 || endIdx === -1) {
        console.error("No JSON array in AI response:", rawReply);
        return [];
      }
      const parsed = JSON.parse(rawReply.substring(startIdx, endIdx + 1));
      // Sanitize type field
      return parsed.map((r: any) => ({
        ...r,
        type: ["study", "review", "practice"].includes(r.type) ? r.type : "study",
      }));
    } catch (e) {
      console.error("Failed to parse schedule JSON:", rawReply);
      throw new Error("AI memberikan jadwal yang tidak bisa dibaca. Coba lagi.");
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. AI Predict Task Duration
// ─────────────────────────────────────────────────────────────────────────────
export const predictTaskDuration = action({
  args: {
    title: v.string(),
    subject: v.string(),
    difficulty: v.string(),
  },
  handler: async (_ctx, args) => {
    const diffLabel =
      args.difficulty === "easy" ? "Mudah" : args.difficulty === "medium" ? "Sedang" : "Sulit";

    const prompt = `Prediksi estimasi waktu (dalam menit, hanya angka bulat) untuk tugas:
Judul: ${args.title}
Mata Kuliah: ${args.subject}
Tingkat Kesulitan: ${diffLabel}

Jawab HANYA dengan satu angka. Contoh: 90`;

    const reply = await callAI(prompt);
    const minutes = parseInt(reply.trim().replace(/[^0-9]/g, ""), 10);
    return isNaN(minutes) ? 60 : Math.min(Math.max(minutes, 15), 300);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AI Generate Skill Material
// ─────────────────────────────────────────────────────────────────────────────
export const getSkillMaterial = action({
  args: {
    skillTitle: v.string(),
    description: v.string(),
  },
  handler: async (_ctx, args) => {
    const prompt = `Kamu adalah ahli pendidikan Indonesia. Buat materi belajar yang LENGKAP dan MENARIK untuk:

Topik: ${args.skillTitle}
Deskripsi: ${args.description}

Gunakan format ini PERSIS (dengan ## untuk judul):

## 📌 Apa Itu ${args.skillTitle}?
Jelaskan konsep utama dalam 2-3 kalimat sederhana.

## 🎯 Mengapa Ini Penting?
- Alasan 1 yang konkret
- Alasan 2 yang konkret
- Alasan 3 yang konkret

## 🛠️ Cara Kerja & Contoh Nyata
Berikan 1 contoh konkret dengan analogi sehari-hari.

**Contoh:**
Tulis contoh singkat di sini.

## 📚 Konsep Kunci
- **Konsep 1:** Penjelasan singkat
- **Konsep 2:** Penjelasan singkat
- **Konsep 3:** Penjelasan singkat

## 💡 Tips Belajar Cepat
1 tips praktis yang bisa langsung dipraktikkan.

## ✅ Langkah Belajar Selanjutnya
1. Langkah pertama
2. Langkah kedua
3. Langkah ketiga

Gunakan Bahasa Indonesia yang ramah dan memotivasi.`;

    return callAI(prompt);
  },
});
