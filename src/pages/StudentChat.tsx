import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, ArrowLeft, Shield, 
  Circle, Loader2, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_username: string;
  sender_role: string;
  recipient_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const StudentChat = () => {
  const navigate = useNavigate();
  const { username, role } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tpoUsername] = useState('TPO Admin'); // Default TPO username

  // Redirect if not student
  useEffect(() => {
    if (role !== 'student') {
      navigate('/');
    }
  }, [role, navigate]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark TPO messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_username', username)
        .eq('sender_role', 'tpo');

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('student-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.recipient_username === username || newMsg.sender_username === username) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_username: username,
          sender_role: 'student',
          recipient_username: tpoUsername,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <CyberButton variant="ghost" onClick={() => navigate('/tracks')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </CyberButton>
            <div>
              <h1 className="font-display text-3xl font-bold text-glow">TPO Chat</h1>
              <p className="text-muted-foreground">Chat with the Training & Placement Office</p>
            </div>
          </div>
          <CyberButton variant="ghost" onClick={fetchMessages}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </CyberButton>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <CyberCard variant="glow" className="flex flex-col h-[calc(100vh-250px)]">
            {/* Chat Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display font-bold text-lg">TPO Admin</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Circle className="w-2 h-2 fill-success text-success" />
                  Training & Placement Office
                </div>
              </div>
            </div>

            {/* Messages */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageSquare className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Start a Conversation</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Have questions about placements, interviews, or career guidance? 
                    Send a message to the TPO!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{date}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <AnimatePresence>
                      {msgs.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex mb-3 ${msg.sender_role === 'student' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] p-3 rounded-lg ${
                            msg.sender_role === 'student'
                              ? 'bg-primary/20 border border-primary/30'
                              : 'bg-accent/20 border border-accent/30'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to TPO..."
                className="flex-1 bg-muted border-border"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <CyberButton
                variant="primary"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </CyberButton>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default StudentChat;
