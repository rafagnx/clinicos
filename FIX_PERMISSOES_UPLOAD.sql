-- COPIE ESTE CÓDIGO E COLE NO 'SQL EDITOR' DO SUPABASE
-- Isso vai liberar as permissões para você subir fotos (Upload)

-- 1. Garante que o bucket 'images' existe e é público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remove políticas antigas (limpeza)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;

-- 3. Cria a Regra Mágica: Permite TUDO para o bucket 'images'
-- (Leitura, Upload, Edição e Deleção para qualquer usuário logado ou anônimo)
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'images' )
WITH CHECK ( bucket_id = 'images' );
