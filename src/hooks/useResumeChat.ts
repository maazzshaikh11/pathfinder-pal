import { useState, useCallback } from 'react';
import { ResumeAnalysis } from '@/lib/resumeScoring';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-chat`;

interface UseResumeChatProps {
  resumeAnalysis: ResumeAnalysis | null;
  username: string;
}

export const useResumeChat = ({ resumeAnalysis, username }: UseResumeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initializeChat = useCallback((analysis: ResumeAnalysis, fileName: string) => {
    const initialMessage: ChatMessage = {
      id: '1',
      role: 'assistant',
      content: `Hello ${username}! 👋 I've analyzed your resume "${fileName}". 

📊 **Your Resume Score: ${analysis.overallScore}%**

Here's a quick breakdown:
• Skill Match: ${analysis.skillMatchScore}%
• Project Quality: ${analysis.projectQualityScore}%
• Experience: ${analysis.experienceScore}%

${analysis.recommendations.length > 0 ? `\n💡 **Top Recommendation:** ${analysis.recommendations[0]}` : ''}

Feel free to ask me anything about your resume, skill gaps, or how to improve your profile!`
    };
    setMessages([initialMessage]);
  }, [username]);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id.startsWith('streaming-')) {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { 
          id: `streaming-${Date.now()}`, 
          role: 'assistant', 
          content: assistantContent 
        }];
      });
    };

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content 
          })),
          resumeAnalysis,
          username
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast({
            title: 'Rate Limit',
            description: errorData.error || 'Please wait a moment before sending another message.',
            variant: 'destructive'
          });
        } else if (response.status === 402) {
          toast({
            title: 'Credits Exhausted',
            description: errorData.error || 'AI credits have been used up.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to get AI response. Please try again.',
            variant: 'destructive'
          });
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Handle remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, resumeAnalysis, username, isLoading, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    initializeChat,
    clearChat
  };
};
