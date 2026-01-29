-- Create messages table for TPO-Student chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_username TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'tpo')),
  recipient_username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_messages_sender ON public.messages(sender_username);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_username);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Since we're using demo login without real auth, allow all authenticated access
-- In production, this would be more restrictive
CREATE POLICY "Allow all operations on messages" 
ON public.messages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;