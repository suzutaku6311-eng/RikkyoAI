-- 認証・認可機能のためのデータベースマイグレーション（安全版）
-- 実行方法: Supabase Dashboard > SQL Editor で実行
-- 注意: このバージョンは既存のトリガーを削除しません（より安全）

-- 1. user_profiles テーブル（Supabase Authの拡張）
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- 2. access_logs テーブル
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'document_upload', 'document_delete', etc.
  resource_type TEXT, -- 'document', 'user', etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);

-- 3. document_permissions テーブル（将来の拡張用）
CREATE TABLE IF NOT EXISTS public.document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'download', 'edit', 'delete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id, permission_type)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON public.document_permissions(user_id);

-- 4. documents テーブルの拡張
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'all' CHECK (access_level IN ('all', 'role_based', 'user_based'));

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents(is_public);

-- 5. Row Level Security (RLS) の有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシーの作成（既存のポリシーがある場合はスキップ）

-- user_profilesテーブルのRLSポリシー
DO $$
BEGIN
  -- ユーザーは自分のプロフィールのみ閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  -- ユーザーは自分のプロフィールを更新可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;

  -- 管理者は全ユーザーのプロフィールを閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON public.user_profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- スーパー管理者は全ユーザーのプロフィールを更新可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Super admins can update all profiles'
  ) THEN
    CREATE POLICY "Super admins can update all profiles"
      ON public.user_profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'super_admin'
        )
      );
  END IF;
END $$;

-- documentsテーブルのRLSポリシー
DO $$
BEGIN
  -- 公開文書は全認証ユーザーが閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Public documents are viewable by all authenticated users'
  ) THEN
    CREATE POLICY "Public documents are viewable by all authenticated users"
      ON public.documents FOR SELECT
      USING (
        is_public = true AND
        auth.role() = 'authenticated'
      );
  END IF;

  -- 管理者は全文書を閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Admins can view all documents'
  ) THEN
    CREATE POLICY "Admins can view all documents"
      ON public.documents FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- ユーザーは自分が作成した文書を閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Users can view own documents'
  ) THEN
    CREATE POLICY "Users can view own documents"
      ON public.documents FOR SELECT
      USING (created_by = auth.uid());
  END IF;

  -- 管理者は文書を挿入可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Admins can insert documents'
  ) THEN
    CREATE POLICY "Admins can insert documents"
      ON public.documents FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- 管理者は文書を更新可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Admins can update documents'
  ) THEN
    CREATE POLICY "Admins can update documents"
      ON public.documents FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- 管理者は文書を削除可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'Admins can delete documents'
  ) THEN
    CREATE POLICY "Admins can delete documents"
      ON public.documents FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- access_logsテーブルのRLSポリシー
DO $$
BEGIN
  -- 全認証ユーザーがログを挿入可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_logs' 
    AND policyname = 'Authenticated users can insert logs'
  ) THEN
    CREATE POLICY "Authenticated users can insert logs"
      ON public.access_logs FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- 管理者は全ログを閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_logs' 
    AND policyname = 'Admins can view all logs'
  ) THEN
    CREATE POLICY "Admins can view all logs"
      ON public.access_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- ユーザーは自分のログのみ閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'access_logs' 
    AND policyname = 'Users can view own logs'
  ) THEN
    CREATE POLICY "Users can view own logs"
      ON public.access_logs FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- document_permissionsテーブルのRLSポリシー
DO $$
BEGIN
  -- 管理者は全権限を閲覧・管理可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'document_permissions' 
    AND policyname = 'Admins can manage all permissions'
  ) THEN
    CREATE POLICY "Admins can manage all permissions"
      ON public.document_permissions FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  -- ユーザーは自分の権限を閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'document_permissions' 
    AND policyname = 'Users can view own permissions'
  ) THEN
    CREATE POLICY "Users can view own permissions"
      ON public.document_permissions FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 7. 関数: 新規ユーザー登録時にuser_profilesを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;  -- 既に存在する場合は何もしない
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: auth.usersに新規ユーザーが追加されたときにuser_profilesを作成
-- 既にトリガーが存在する場合はスキップ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 8. 関数: updated_atを自動更新
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー: user_profilesのupdated_atを自動更新
-- 既にトリガーが存在する場合はスキップ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

