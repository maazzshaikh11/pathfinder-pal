import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Users, ArrowLeft, User, 
  Circle, Loader2, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// The canonical identifier used when a student sends to TPO
const TPO_USERNAME = 'TPO Admin';

interface Message {
  id: string;
  sender_username: string;
  sender_role: string;
  recipient_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface StudentConversation {
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const TPOChat = () => {
  const navigate = useNavigate();
  const { username, role } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [students, setStudents] = useState<StudentConversation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (role !== 'tpo') navigate('/');
  }, [role, navigate]);

  // ── Fetch all student conversations ────────────────────────────────────────
  // A conversation exists when a student has sent at least one message to TPO.
  const fetchConversations = async () => {
    try {
      // Get ALL messages involving the TPO (sent to 'TPO Admin' or sent from 'TPO Admin')
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_username.eq.${TPO_USERNAME},sender_username.eq.${TPO_USERNAME}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by student username
      const studentMap = new Map<string, StudentConversation>();

      (data || []).forEach((msg: Message) => {
        // The student is whichever side is NOT 'TPO Admin'
        const studentUsername =
          msg.sender_username === TPO_USERNAME
            ? msg.recipient_username
            : msg.sender_username;

        if (!studentUsername) return;

        if (!studentMap.has(studentUsername)) {
          studentMap.set(studentUsername, {
            username: studentUsername,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.sender_role === 'student' && !msg.is_read ? 1 : 0,
          });
        } else if (msg.sender_role === 'student' && !msg.is_read) {
          studentMap.get(studentUsername)!.unreadCount++;
        }
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch messages for selected student ────────────────────────────────────
  const fetchMessages = async (studentUsername: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_username.eq.${studentUsername},recipient_username.eq.${TPO_USERNAME}),` +
          `and(sender_username.eq.${TPO_USERNAME},recipient_username.eq.${studentUsername})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread student messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_username', studentUsername)
        .eq('recipient_username', TPO_USERNAME)
        .eq('is_read', false);

      // Refresh sidebar counts
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // ── Initial load + realtime subscription ───────────────────────────────────
  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('tpo-chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          const involvesTpo =
            msg.recipient_username === TPO_USERNAME ||
            msg.sender_username === TPO_USERNAME;

          if (!involvesTpo) return;

          // Add to open conversation in real-time
          if (selectedStudent) {
            const isCurrentConvo =
              (msg.sender_username === selectedStudent && msg.recipient_username === TPO_USERNAME) ||
              (msg.sender_username === TPO_USERNAME && msg.recipient_username === selectedStudent);
            if (isCurrentConvo) {
              setMessages(prev => [...prev, msg]);
            }
          }

          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username, selectedStudent]);

  useEffect(() => {
    if (selectedStudent) fetchMessages(selectedStudent);
  }, [selectedStudent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_username: TPO_USERNAME,   // always 'TPO Admin' so students can match it
          sender_role: 'tpo',
          recipient_username: selectedStudent,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const d = formatDate(msg.created_at);
    if (!acc[d]) acc[d] = [];
    acc[d].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="accent" size={250} />
      <Navbar />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <CyberButton variant="ghost" onClick={() => navigate('/tpo-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </CyberButton>
            <div>
              <h1 className="font-display text-3xl font-bold text-glow">Student Messages</h1>
              <p className="text-muted-foreground">Chat with students directly</p>
            </div>
          </div>
          <CyberButton variant="ghost" onClick={fetchConversations}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </CyberButton>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
          {/* ── Student list ── */}
          <CyberCard variant="glow" className="overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="font-display font-bold">Students</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Students will appear here when they message you</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {students.map((student) => (
                  <motion.button
                    key={student.username}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStudent(student.username)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedStudent === student.username
                        ? 'bg-accent/20 border border-accent/50'
                        : 'bg-muted/50 border border-border hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {student.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate text-sm">{student.username}</p>
                          {student.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-accent text-xs flex items-center justify-center font-bold shrink-0 ml-1">
                              {student.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{student.lastMessage}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </CyberCard>

          {/* ── Chat area ── */}
          <CyberCard variant="accent" className="md:col-span-2 flex flex-col overflow-hidden">
            {!selectedStudent ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageSquare className="w-16 h-16 text-accent/50 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Select a Student</h3>
                  <p className="text-muted-foreground text-sm">Choose a student from the list to start chatting</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Chat header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold">{selectedStudent}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Circle className="w-2 h-2 fill-success text-success" />
                      Student
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No messages yet — say hello!
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center gap-4 my-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">{date}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <AnimatePresence>
                            {msgs.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex mb-3 ${msg.sender_role === 'tpo' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[75%] p-3 rounded-lg ${
                                  msg.sender_role === 'tpo'
                                    ? 'bg-accent/20 border border-accent/30'
                                    : 'bg-muted border border-border'
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
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2 pt-4 border-t border-border shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Reply to ${selectedStudent}...`}
                    className="flex-1 bg-muted border-border"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <CyberButton
                    variant="accent"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </CyberButton>
                </div>
              </div>
            )}
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default TPOChat;
