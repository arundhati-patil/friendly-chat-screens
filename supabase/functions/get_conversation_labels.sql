
CREATE OR REPLACE FUNCTION get_conversation_labels(conversation_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT cl.id, cl.name, cl.color
  FROM public.chat_labels cl
  INNER JOIN public.conversation_labels conl ON cl.id = conl.label_id
  WHERE conl.conversation_id = $1;
$$;
