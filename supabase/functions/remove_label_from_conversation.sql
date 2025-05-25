
CREATE OR REPLACE FUNCTION remove_label_from_conversation(conversation_id UUID, label_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.conversation_labels
  WHERE conversation_id = $1 AND label_id = $2;
$$;
