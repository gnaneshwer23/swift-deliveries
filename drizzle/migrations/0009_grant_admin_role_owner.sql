INSERT INTO public.user_roles (user_id, role)
VALUES ('cf458125-aa26-47b9-9391-19a7a8a472f3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;