import { GoogleGenAI } from "@google/genai";
import { Emotion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AIService {
  static async detectEmotion(text: string): Promise<Emotion> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following text and return ONLY one word representing the primary emotion from this list: Happy, Sad, Anxious, Stressed, Neutral, Angry, Excited, Calm.
      
      Text: "${text}"`,
    });
    const emotion = response.text?.trim() as Emotion;
    return emotion || 'Neutral';
  }

  static async generateResponse(text: string, emotion: Emotion): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a compassionate AI companion. The user is feeling ${emotion}. 
      User said: "${text}"
      Provide a brief, empathetic response (2-3 sentences).`,
    });
    return response.text || "I'm here for you.";
  }

  static async generateSuggestion(text: string, emotion: Emotion): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the user's input and their detected emotion (${emotion}), provide one practical, small suggestion or self-care exercise they can do right now. 
      User said: "${text}"
      Keep it under 30 words.`,
    });
    return response.text || "Take a deep breath and stay hydrated.";
  }

  static async analyzeMemory(history: { emotion: Emotion; timestamp: number }[]): Promise<string> {
    if (history.length === 0) return "No history yet. Let's start tracking your mood today.";
    
    const recentEmotions = history.slice(-5).map(h => h.emotion).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this recent mood history: ${recentEmotions}. 
      Provide a one-sentence summary of the trend or a supportive observation.`,
    });
    return response.text || "You're doing great tracking your journey.";
  }
}
