
CREATE OR REPLACE FUNCTION create_chat_label(label_name TEXT, label_color TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.chat_labels (name, color)
  VALUES (label_name, label_color);
$$;
