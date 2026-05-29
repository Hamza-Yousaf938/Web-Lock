
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('parent', 'child');
CREATE TYPE public.device_platform AS ENUM ('chrome_extension', 'android', 'ios', 'firefox_extension', 'edge_extension');
CREATE TYPE public.focus_intensity AS ENUM ('soft', 'hard', 'nuclear');
CREATE TYPE public.profile_kind AS ENUM ('default', 'study', 'exam', 'assignment', 'custom');

-- ===== TIMESTAMP HELPER =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===== FAMILIES =====
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  owner_id UUID NOT NULL,
  parent_pin_hash TEXT,
  vpn_blocklist_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_families_owner ON public.families(owner_id);

-- ===== PARENT PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_family ON public.profiles(family_id);

-- ===== USER ROLES (separate table per security rules) =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- ===== HAS_ROLE SECURITY DEFINER =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== GET_USER_FAMILY (security definer to avoid recursion) =====
CREATE OR REPLACE FUNCTION public.get_user_family(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT family_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- ===== CHILDREN =====
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  age INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_children_family ON public.children(family_id);

-- ===== DEVICES =====
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  platform public.device_platform NOT NULL,
  device_token TEXT NOT NULL UNIQUE,
  pairing_code TEXT UNIQUE,
  pairing_code_expires_at TIMESTAMPTZ,
  paired_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_family ON public.devices(family_id);
CREATE INDEX idx_devices_child ON public.devices(child_id);
CREATE INDEX idx_devices_token ON public.devices(device_token);

-- ===== BLOCKLISTS =====
CREATE TABLE public.blocklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind public.profile_kind NOT NULL DEFAULT 'custom',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blocklists_family ON public.blocklists(family_id);

CREATE TABLE public.blocklist_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocklist_id UUID NOT NULL REFERENCES public.blocklists(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocklist_id, domain)
);
CREATE INDEX idx_blocklist_sites_blocklist ON public.blocklist_sites(blocklist_id);

-- ===== FOCUS SESSIONS =====
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  blocklist_id UUID REFERENCES public.blocklists(id) ON DELETE SET NULL,
  intensity public.focus_intensity NOT NULL DEFAULT 'hard',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_focus_family ON public.focus_sessions(family_id);
CREATE INDEX idx_focus_device ON public.focus_sessions(device_id);

-- ===== SCHEDULES =====
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  blocklist_id UUID REFERENCES public.blocklists(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  days_of_week INT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_schedules_family ON public.schedules(family_id);

-- ===== BLOCK EVENTS (stats) =====
CREATE TABLE public.block_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_block_events_family_time ON public.block_events(family_id, blocked_at DESC);
CREATE INDEX idx_block_events_child ON public.block_events(child_id);

-- ===== WAITLIST =====
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ENABLE RLS =====
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocklist_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES: families =====
CREATE POLICY "Owners can view their family" ON public.families FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR id = public.get_user_family(auth.uid()));
CREATE POLICY "Authenticated users can create a family" ON public.families FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their family" ON public.families FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their family" ON public.families FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ===== POLICIES: profiles =====
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ===== POLICIES: user_roles =====
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own role on signup" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===== POLICIES: family-scoped tables (children, devices, blocklists, etc.) =====
-- All scoped to user's family via get_user_family
CREATE POLICY "Family members can view children" ON public.children FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));
CREATE POLICY "Parents can manage children" ON public.children FOR ALL TO authenticated
  USING (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view devices" ON public.devices FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));
CREATE POLICY "Parents can manage devices" ON public.devices FOR ALL TO authenticated
  USING (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view blocklists" ON public.blocklists FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));
CREATE POLICY "Parents can manage blocklists" ON public.blocklists FOR ALL TO authenticated
  USING (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view blocklist sites" ON public.blocklist_sites FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.blocklists b WHERE b.id = blocklist_id AND b.family_id = public.get_user_family(auth.uid())));
CREATE POLICY "Parents can manage blocklist sites" ON public.blocklist_sites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.blocklists b WHERE b.id = blocklist_id AND b.family_id = public.get_user_family(auth.uid())) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.blocklists b WHERE b.id = blocklist_id AND b.family_id = public.get_user_family(auth.uid())) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view focus sessions" ON public.focus_sessions FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));
CREATE POLICY "Parents can manage focus sessions" ON public.focus_sessions FOR ALL TO authenticated
  USING (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view schedules" ON public.schedules FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));
CREATE POLICY "Parents can manage schedules" ON public.schedules FOR ALL TO authenticated
  USING (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'))
  WITH CHECK (family_id = public.get_user_family(auth.uid()) AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Family members can view block events" ON public.block_events FOR SELECT TO authenticated
  USING (family_id = public.get_user_family(auth.uid()));

-- ===== WAITLIST: anyone can join =====
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ===== TRIGGERS for updated_at =====
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blocklists_updated BEFORE UPDATE ON public.blocklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== AUTO-CREATE family + profile + role on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_family_id UUID;
  new_blocklist_id UUID;
BEGIN
  -- Create family owned by user
  INSERT INTO public.families (owner_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'family_name', 'My Family'))
  RETURNING id INTO new_family_id;

  -- Create profile linked to family
  INSERT INTO public.profiles (user_id, family_id, display_name)
  VALUES (NEW.id, new_family_id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  -- Assign parent role
  INSERT INTO public.user_roles (user_id, family_id, role)
  VALUES (NEW.id, new_family_id, 'parent');

  -- Seed default blocklist
  INSERT INTO public.blocklists (family_id, name, kind, description)
  VALUES (new_family_id, 'Default', 'default', 'Common distractions')
  RETURNING id INTO new_blocklist_id;

  INSERT INTO public.blocklist_sites (blocklist_id, domain) VALUES
    (new_blocklist_id, 'facebook.com'),
    (new_blocklist_id, 'instagram.com'),
    (new_blocklist_id, 'tiktok.com'),
    (new_blocklist_id, 'twitter.com'),
    (new_blocklist_id, 'x.com'),
    (new_blocklist_id, 'reddit.com'),
    (new_blocklist_id, 'youtube.com');

  -- Seed Study profile
  INSERT INTO public.blocklists (family_id, name, kind, description)
  VALUES (new_family_id, 'Study', 'study', 'Locked-in study mode')
  RETURNING id INTO new_blocklist_id;
  INSERT INTO public.blocklist_sites (blocklist_id, domain) VALUES
    (new_blocklist_id, 'facebook.com'), (new_blocklist_id, 'instagram.com'),
    (new_blocklist_id, 'tiktok.com'), (new_blocklist_id, 'youtube.com'),
    (new_blocklist_id, 'reddit.com'), (new_blocklist_id, 'netflix.com'),
    (new_blocklist_id, 'twitch.tv');

  -- Seed Exam profile (everything except essentials)
  INSERT INTO public.blocklists (family_id, name, kind, description)
  VALUES (new_family_id, 'Exam', 'exam', 'Maximum focus for exams')
  RETURNING id INTO new_blocklist_id;
  INSERT INTO public.blocklist_sites (blocklist_id, domain) VALUES
    (new_blocklist_id, 'facebook.com'), (new_blocklist_id, 'instagram.com'),
    (new_blocklist_id, 'tiktok.com'), (new_blocklist_id, 'youtube.com'),
    (new_blocklist_id, 'reddit.com'), (new_blocklist_id, 'netflix.com'),
    (new_blocklist_id, 'twitch.tv'), (new_blocklist_id, 'discord.com'),
    (new_blocklist_id, 'snapchat.com'), (new_blocklist_id, 'pinterest.com');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
