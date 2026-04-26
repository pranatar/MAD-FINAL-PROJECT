import { v } from "convex/values";
import { action } from "./_generated/server";

// Helper function to call Gemini API via REST
async function callGemini(prompt: string, systemInstruction?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Merge systemInstruction into the prompt for maximum compatibility
  const combinedPrompt = systemInstruction
    ? `${systemInstruction}\n\nSTUDENT REQUEST: ${prompt}`
    : prompt;

  const body: any = {
    contents: [{ role: "user", parts: [{ text: combinedPrompt }] }]
  };

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

Tugasmu mengonversi tugas ini menjadi blok-blok jadwal belajar yang DETAIL dan bermanfaat menggunakan teknik Pomodoro.
Pecah tugas sulit/panjang menjadi sesi "study" maksimal 45 menit per blok, dan tambahkan sesi "review" atau "practice" sesuai intuisi.
Jangan gunakan waktu spesifik seperti "08:00", cukup gunakan label waktu tentatif (e.g., "Sesi Pagi 1", "Sesi Siang 1", "Sesi Sore 1").

Untuk setiap blok jadwal, berikan informasi LENGKAP berikut:
- title: judul singkat sesi belajar
- subject: nama mata kuliah/topik
- startTime & endTime: label waktu tentatif (Sesi Pagi 1, dll)
- type: "study" | "review" | "practice"
- durationMinutes: estimasi durasi dalam menit (angka)
- description: deskripsi 1-2 kalimat tentang APA yang harus dikerjakan pada sesi ini secara spesifik
- tips: 1 tips belajar praktis dan spesifik untuk sesi ini (Bahasa Indonesia, singkat, actionable)
- priority: angka 1-3 (1=rendah, 2=sedang, 3=tinggi) berdasarkan urgensi tugas
- focusTechnique: teknik belajar yang disarankan, pilih salah satu: "Pomodoro", "Active Recall", "Mind Mapping", "Spaced Repetition", "Feynman Technique", "Practice Problems"

Kembalikan HANYA format JSON valid sebuah array of objects:
[
  {
    "title": "...",
    "subject": "...",
    "startTime": "Sesi Pagi 1",
    "endTime": "Sesi Pagi 2",
    "type": "study",
    "durationMinutes": 45,
    "description": "...",
    "tips": "...",
    "priority": 2,
    "focusTechnique": "Pomodoro"
  }
]
Tanpa backticks atau markdown. HANYA valid JSON.`;

    const rawReply = await callGemini(prompt);

    if (rawReply.includes("[Gemini Error Debug]")) {
      throw new Error(`Gemini API Error: ${rawReply}`);
    }

    try {
      // Robust JSON extraction: find the first '[' and last ']'
      const startIdx = rawReply.indexOf('[');
      const endIdx = rawReply.lastIndexOf(']');

      if (startIdx === -1 || endIdx === -1) {
        console.error("AI response does not contain a JSON array:", rawReply);
        return [];
      }

      const jsonStr = rawReply.substring(startIdx, endIdx + 1);
      const scheduleLines = JSON.parse(jsonStr);
      return scheduleLines;
    } catch (e) {
      console.error("Failed to parse Gemini schedule output. Raw response:", rawReply);
      throw new Error("Gagal mengurai jadwal dari AI. Respon tidak valid.");
    }
  }
});

// 4. AI Predict Task Duration
export const predictTaskDuration = action({
  args: {
    title: v.string(),
    subject: v.string(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Kamu adalah asisten akademik. Prediksi estimasi waktu pengerjaan tugas berikut dalam satuan MENIT (hanya angka bulat, tanpa teks lain):

Judul Tugas: ${args.title}
Mata Kuliah: ${args.subject}
Tingkat Kesulitan: ${args.difficulty === 'easy' ? 'Mudah' : args.difficulty === 'medium' ? 'Sedang' : 'Sulit'}

Pertimbangkan:
- Tugas mudah: 30–60 menit
- Tugas sedang: 60–120 menit  
- Tugas sulit: 120–240 menit
- Sesuaikan juga dengan kompleksitas nama mata kuliah dan judul tugasnya

Jawab HANYA dengan satu angka bulat dalam satuan menit. Contoh: 90`;

    const reply = await callGemini(prompt);
    const cleaned = reply.trim().replace(/[^0-9]/g, '');
    const minutes = parseInt(cleaned, 10);
    // Clamp between 15–300 menit, default 60 jika gagal parse
    return isNaN(minutes) ? 60 : Math.min(Math.max(minutes, 15), 300);
  }
});

// 5. AI Generate Skill Material
export const getSkillMaterial = action({
  args: {
    skillTitle: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Kamu adalah seorang ahli pendidikan. Buatlah ringkasan materi pembelajaran yang "Padat, Jelas, dan Menarik" untuk topik berikut:
    
    Topik: ${args.skillTitle}
    Penjelasan Singkat: ${args.description}
    
    Format materi harus terdiri dari:
    1. 📌 Konsep Inti (Apa itu topik ini?)
    2. 🚀 Mengapa ini Penting?
    3. 🛠️ Contoh Praktis / Cara Kerja
    4. 💡 1 Tips Cepat / Shortcut
    
    Gunakan Bahasa Indonesia yang ramah, beri emoji yang relevan. Jangan terlalu panjang, pastikan bisa dibaca dalam 2 menit.`;

    const systemInstruction = "Kamu adalah penulis materi edukasi yang hebat. Gunakan markdown sederhana (seperti bold, bullet points).";
    const reply = await callGemini(prompt, systemInstruction);
    return reply;
  }
});
