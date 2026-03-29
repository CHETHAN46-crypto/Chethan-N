/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Activity, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  History, 
  PlusCircle, 
  TrendingUp,
  Smile,
  Frown,
  AlertCircle,
  Zap,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AIService } from './services/aiService';
import { ChatMessage, Emotion, AgentLog, MoodEntry } from './types';
import { cn } from './lib/utils';

const EMOTION_SCORES: Record<Emotion, number> = {
  'Happy': 10,
  'Excited': 9,
  'Calm': 8,
  'Neutral': 5,
  'Anxious': 3,
  'Stressed': 2,
  'Angry': 2,
  'Sad': 1
};

const EMOTION_COLORS: Record<Emotion, string> = {
  'Happy': 'text-yellow-500 bg-yellow-50 border-yellow-200',
  'Excited': 'text-orange-500 bg-orange-50 border-orange-200',
  'Calm': 'text-teal-500 bg-teal-50 border-teal-200',
  'Neutral': 'text-gray-500 bg-gray-50 border-gray-200',
  'Anxious': 'text-purple-500 bg-purple-50 border-purple-200',
  'Stressed': 'text-red-500 bg-red-50 border-red-200',
  'Angry': 'text-rose-500 bg-rose-50 border-rose-200',
  'Sad': 'text-blue-500 bg-blue-50 border-blue-200'
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [memorySummary, setMemorySummary] = useState('No history yet.');
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentLogs]);

  const addLog = (agentName: string, status: 'thinking' | 'completed' | 'error', output?: string) => {
    setAgentLogs(prev => [
      { agentName, status, output, timestamp: Date.now() },
      ...prev.slice(0, 49)
    ]);
  };

  const processInput = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setCurrentStep(0); // Input received
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      // Step 1: Emotion Detection Agent
      setCurrentStep(1);
      addLog('Emotion Detection Agent', 'thinking');
      const emotion = await AIService.detectEmotion(text);
      addLog('Emotion Detection Agent', 'completed', `Detected: ${emotion}`);

      // Step 2: Conversation Agent
      setCurrentStep(2);
      addLog('Conversation Agent', 'thinking');
      const response = await AIService.generateResponse(text, emotion);
      addLog('Conversation Agent', 'completed', 'Generated empathetic response');

      // Step 3: Suggestion Agent
      setCurrentStep(3);
      addLog('Suggestion Agent', 'thinking');
      const suggestion = await AIService.generateSuggestion(text, emotion);
      addLog('Suggestion Agent', 'completed', 'Generated self-care suggestion');

      // Step 4: Memory Agent
      setCurrentStep(4);
      addLog('Memory Agent', 'thinking');
      const newMoodEntry: MoodEntry = {
        timestamp: Date.now(),
        emotion,
        score: EMOTION_SCORES[emotion]
      };
      const updatedHistory = [...moodHistory, newMoodEntry];
      setMoodHistory(updatedHistory);
      const summary = await AIService.analyzeMemory(updatedHistory);
      setMemorySummary(summary);
      addLog('Memory Agent', 'completed', 'Updated mood history and trend analysis');

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        emotion,
        suggestion,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setCurrentStep(5); // Done
    } catch (error) {
      console.error(error);
      addLog('System', 'error', 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setCurrentStep(null), 3000);
    }
  };

  const handleQuickInput = (emotion: string) => {
    const prompts: Record<string, string> = {
      'stress': "I'm feeling really stressed out today.",
      'sad': "I'm feeling a bit down and sad.",
      'anxious': "I'm feeling very anxious about something."
    };
    processInput(prompts[emotion]);
  };

  const handleDailyCheckin = () => {
    processInput("I'm doing my daily check-in. Here's how I'm feeling...");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100 overflow-hidden">
      {/* Left Sidebar: Agent Activity */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 border-r border-gray-200 bg-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight">Agent Activity</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Real-time Pipeline</p>
            </div>
          </div>
          <button onClick={() => setIsLeftSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
            <PlusCircle size={20} className="rotate-45" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {agentLogs.map((log, i) => (
              <motion.div
                key={log.timestamp + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 rounded-xl border text-sm transition-all",
                  log.status === 'thinking' ? "bg-blue-50 border-blue-100 animate-pulse" : 
                  log.status === 'error' ? "bg-red-50 border-red-100" : "bg-white border-gray-100 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    {log.agentName === 'Emotion Detection Agent' && <Brain size={14} className="text-purple-500" />}
                    {log.agentName === 'Conversation Agent' && <MessageSquare size={14} className="text-blue-500" />}
                    {log.agentName === 'Suggestion Agent' && <Sparkles size={14} className="text-amber-500" />}
                    {log.agentName === 'Memory Agent' && <History size={14} className="text-teal-500" />}
                    {log.agentName}
                  </span>
                  {log.status === 'thinking' ? (
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                  ) : (
                    <CheckCircle2 size={12} className="text-green-500" />
                  )}
                </div>
                {log.output && <p className="text-gray-600 text-xs leading-relaxed">{log.output}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
          {agentLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <Activity size={48} className="mb-4" />
              <p className="text-sm">No activity yet. Send a message to start the pipeline.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Workflow Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-8 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button 
              onClick={() => setIsLeftSidebarOpen(true)}
              className="md:hidden p-2 bg-gray-50 rounded-xl text-gray-500 shrink-0"
            >
              <Activity size={20} />
            </button>
            {[
              { icon: MessageSquare, label: 'Input' },
              { icon: Brain, label: 'Emotion' },
              { icon: Zap, label: 'Response' },
              { icon: Sparkles, label: 'Suggestion' },
              { icon: History, label: 'Memory' }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 shrink-0">
                <div className={cn(
                  "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-500",
                  currentStep === i + 1 ? "bg-blue-600 text-white scale-110 shadow-md shadow-blue-200" : 
                  (currentStep && currentStep > i + 1) ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}>
                  <step.icon size={14} className="md:w-4 md:h-4" />
                </div>
                <span className={cn(
                  "text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors hidden sm:inline",
                  currentStep === i + 1 ? "text-blue-600" : "text-gray-400"
                )}>{step.label}</span>
                {i < 4 && <div className="w-2 md:w-4 h-px bg-gray-200 ml-1 md:ml-2" />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDailyCheckin}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
            >
              <PlusCircle size={14} className="text-blue-600 md:w-4 md:h-4" />
              <span className="hidden xs:inline">Daily Check-in</span>
              <span className="xs:hidden">Check-in</span>
            </button>
            <button 
              onClick={() => setIsRightSidebarOpen(true)}
              className="md:hidden p-2 bg-gray-50 rounded-xl text-gray-500"
            >
              <TrendingUp size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 px-4">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-3">
                <Brain size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">SafeSpace Multi-Agent</h1>
                <p className="text-gray-500 leading-relaxed">
                  A structured AI system that detects emotions, provides empathetic responses, 
                  and tracks your mood over time.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                <button onClick={() => handleQuickInput('stress')} className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-400 transition-all group">
                  <AlertCircle className="mx-auto mb-2 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Stress</span>
                </button>
                <button onClick={() => handleQuickInput('sad')} className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-400 transition-all group">
                  <Frown className="mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Sad</span>
                </button>
                <button onClick={() => handleQuickInput('anxious')} className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-400 transition-all group">
                  <Zap className="mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Anxious</span>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col max-w-2xl",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-100 rounded-tl-none"
              )}>
                {msg.content}
              </div>
              
              {msg.role === 'assistant' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 w-full space-y-3"
                >
                  {msg.emotion && (
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border",
                      EMOTION_COLORS[msg.emotion]
                    )}>
                      <Brain size={12} />
                      Detected: {msg.emotion}
                    </div>
                  )}
                  {msg.suggestion && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                      <Sparkles size={18} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Agent Suggestion</p>
                        <p className="text-sm text-amber-900 leading-relaxed font-medium">{msg.suggestion}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-2 items-center text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              Agents are processing...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-8 bg-white border-t border-gray-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); processInput(input); }}
            className="max-w-3xl mx-auto flex gap-2 md:gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling?"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="bg-blue-600 text-white p-3 md:p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 shrink-0"
            >
              <Send size={18} className="md:w-5 md:h-5" />
            </button>
          </form>
        </div>
      </main>

      {/* Right Sidebar: Mood Trend & Memory */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-80 md:w-96 border-l border-gray-200 bg-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-100">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight">Mood Trend</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Memory Agent Analysis</p>
            </div>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
            <PlusCircle size={20} className="rotate-45" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="h-48 w-full">
            {moodHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodHistory.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis 
                    dataKey="timestamp" 
                    hide 
                  />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip 
                    labelStyle={{ display: 'none' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Score: ${value}`, 'Mood']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0D9488" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                <TrendingUp size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-medium">Need at least 2 entries to show trend</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Memory Summary */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <History size={12} />
              Memory Agent Summary
            </h3>
            <div className="bg-teal-50 border border-teal-100 p-5 rounded-2xl">
              <p className="text-sm text-teal-900 leading-relaxed italic font-medium">
                "{memorySummary}"
              </p>
            </div>
          </section>

          {/* Current vs Previous */}
          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current</h3>
              <div className={cn(
                "p-4 rounded-2xl border text-center transition-all",
                moodHistory.length > 0 ? EMOTION_COLORS[moodHistory[moodHistory.length - 1].emotion] : "bg-gray-50 border-gray-100 text-gray-400"
              )}>
                <p className="text-lg font-black">
                  {moodHistory.length > 0 ? moodHistory[moodHistory.length - 1].emotion : '—'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Previous</h3>
              <div className={cn(
                "p-4 rounded-2xl border text-center transition-all",
                moodHistory.length > 1 ? EMOTION_COLORS[moodHistory[moodHistory.length - 2].emotion] : "bg-gray-50 border-gray-100 text-gray-400"
              )}>
                <p className="text-lg font-black">
                  {moodHistory.length > 1 ? moodHistory[moodHistory.length - 2].emotion : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Quick Check-in</h3>
            <div className="space-y-2">
              {[
                { id: 'stress', label: 'High Stress', icon: AlertCircle, color: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' },
                { id: 'sad', label: 'Feeling Down', icon: Frown, color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' },
                { id: 'anxious', label: 'Anxiety Spike', icon: Zap, color: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200' }
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickInput(action.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white text-sm font-bold transition-all group",
                    action.color
                  )}
                >
                  <div className="flex items-center gap-3">
                    <action.icon size={18} className="text-gray-400 group-hover:text-inherit" />
                    {action.label}
                  </div>
                  <PlusCircle size={16} className="text-gray-200 group-hover:text-inherit" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
