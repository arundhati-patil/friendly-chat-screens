
CREATE OR REPLACE FUNCTION get_chat_labels()
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, color
  FROM public.chat_labels
  ORDER BY name;
$$;
