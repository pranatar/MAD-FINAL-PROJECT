import { action } from "./_generated/server";
import { v } from "convex/values";

// Helper function to call Gemini API via REST
async function callGemini(prompt: string, systemInstruction?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API Error:", errText);
    return `[Gemini Error Debug]: ${errText}`;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa merespon saat ini.";
}

// 1. AI Chat Tutor Action
export const chatTutor = action({
  args: { 
    message: v.string(), 
    mood: v.optional(v.string()),
    history: v.array(v.object({ role: v.string(), text: v.string() })) 
  },
  handler: async (ctx, args) => {
    const moodContext = args.mood ? `Saat ini student sedang merasa: ${args.mood}. Sesuaikan nada bicara dan tingkat kesabaranmu.` : "";
    
    // Format history for the prompt context to keep it simple with pure string
    let historyText = args.history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
    let fullPrompt = `Riwayat percakapan:\n${historyText}\n\nStudent: ${args.message}\nTutor:`;

    const systemInstruction = `Kamu adalah Tutor AI pintar dan empatik bernama Aivora.
Bahasa utamamu adalah Bahasa Indonesia yang ramah, asik, semi-formal seperti mentor mahasiswa.
Tugasmu membimbing belajar, memberikan soal latihan jika diminta, dan terus memotivasi. 
${moodContext}`;

    const reply = await callGemini(fullPrompt, systemInstruction);
    return reply;
  }
});

// 2. AI Study Insights
export const getInsights = action({
  args: {
    totalStudyMinutes: v.number(),
    streakDays: v.number(),
    completedTasksCount: v.number(),
  },
  handler: async (ctx, args) => {
    const prompt = `Analisis performa belajar student berikut:
- Total Menit Belajar: ${args.totalStudyMinutes}
- Streak Hari Berturut-turut: ${args.streakDays}
- Tugas diselesaikan: ${args.completedTasksCount}

Berikan 1 paragraf singkat (maksimal 3 kalimat) berupa insight / motivasi personal. Apakah dia kurang belajar, sangat bagus, atau berpotensi burnout? Jangan bertele-tele.`;
    
    const reply = await callGemini(prompt, "Kamu adalah AI analis performa belajar.");
    return reply;
  }
});

// 3. AI Generate Schedule (Adaptive Scheduling)
export const generateSchedule = action({
  args: {
    tasks: v.array(v.object({
      title: v.string(),
      subject: v.string(),
      estimatedMinutes: v.number(),
      difficulty: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const tasksData = JSON.stringify(args.tasks);
    const prompt = `Berikut adalah daftar tugas yang belum selesai:
${tasksData}

Tugasmu mengonversi tugas ini menjadi blok-blok jadwal belajar menggunakan teknik Pomodoro.
Pecah tugas sulit/panjang menjadi sesi "study" maksimal 45 menit per blok, dan tambahkan sesi "review" atau "practice" sesuai intuisi.
Jangan gunakan waktu spesifik seperti "08:00", cukup gunakan label waktu tentatif (e.g., "Sesi Pagi 1", "Sesi Siang").

Kembalikan HANYA format JSON valid sebuah array of objects:
[
  { "title": "...", "subject": "...", "startTime": "Sesi Pagi 1", "endTime": "Sesi Pagi 2", "type": "study" | "review" | "practice" }
]
Tanpa backticks atau markdown. HANYA valid JSON.`;

    const rawReply = await callGemini(prompt);
    
    try {
      // Clean up markdown quotes if Gemini accidentally adds them
      const cleaned = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
      const scheduleLines = JSON.parse(cleaned);
      return scheduleLines;
    } catch (e) {
      console.error("Failed to parse Gemini schedule output", rawReply);
      return []; // fallback
    }
  }
});
