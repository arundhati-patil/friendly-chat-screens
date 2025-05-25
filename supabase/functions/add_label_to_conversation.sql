
CREATE OR REPLACE FUNCTION add_label_to_conversation(conversation_id UUID, label_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.conversation_labels (conversation_id, label_id)
  VALUES (conversation_id, label_id)
  ON CONFLICT (conversation_id, label_id) DO NOTHING;
$$;
