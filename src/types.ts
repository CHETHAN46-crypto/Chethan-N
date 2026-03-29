export type Emotion = 'Happy' | 'Sad' | 'Anxious' | 'Stressed' | 'Neutral' | 'Angry' | 'Excited' | 'Calm';

export interface AgentLog {
  agentName: string;
  status: 'thinking' | 'completed' | 'error';
  output?: string;
  timestamp: number;
}

export interface MoodEntry {
  timestamp: number;
  emotion: Emotion;
  score: number; // 1-10 for charting
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: Emotion;
  suggestion?: string;
  timestamp: number;
}
