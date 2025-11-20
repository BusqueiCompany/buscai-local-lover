-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ticket_response', 'partnership_response', 'delivery_response', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID NULL,
  reference_type TEXT NULL CHECK (reference_type IN ('ticket', 'partnership', 'delivery') OR reference_type IS NULL),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_messages table for conversations
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ADMINISTRADOR'::app_role) OR has_role(auth.uid(), 'SUPORTE'::app_role));

-- Ticket messages policies
CREATE POLICY "Users can view messages from their tickets"
ON public.ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_messages.ticket_id 
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'ADMINISTRADOR'::app_role) OR has_role(auth.uid(), 'SUPORTE'::app_role))
  )
);

CREATE POLICY "Users can create messages in their tickets"
ON public.ticket_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
  ) AND auth.uid() = user_id
);

CREATE POLICY "Admins can create messages in any ticket"
ON public.ticket_messages
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'ADMINISTRADOR'::app_role) OR has_role(auth.uid(), 'SUPORTE'::app_role))
  AND auth.uid() = user_id
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable realtime for ticket_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;