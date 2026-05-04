import { GoogleGenAI } from "@google/genai";
import { Student, Performance } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async analyzePerformance(student: Student, performances: Performance[]) {
    if (!process.env.GEMINI_API_KEY) {
      return "AI Analysis unavailable: API Key not configured.";
    }

    const performanceData = performances
      .map(p => `${p.subject}: ${p.marks}/${p.totalMarks}`)
      .join(", ");

    const prompt = `
      You are an expert academic counselor and data scientist.
      Analyze the performance of student ${student.name} (${student.department}, Year ${student.year}).
      Performance Data: ${performanceData}.
      Provide a concise 3-sentence analysis of their strengths, weaknesses, and a recommendation for improvement.
      Format it professionally as if you are generating a formal college report.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "No analysis generated.";
    } catch (error) {
      console.error("AI analysis error:", error);
      return "Failed to generate AI analysis. Please try again later.";
    }
  }
};
