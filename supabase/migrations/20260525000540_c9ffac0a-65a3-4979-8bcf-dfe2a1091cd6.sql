
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  active_skin text not null default 'midnight',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile + handle updated_at
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Directories
create table public.directories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.directories(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.directories enable row level security;
create policy "directories_all_own" on public.directories for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index directories_user_idx on public.directories(user_id);

-- Folders
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  directory_id uuid not null references public.directories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.folders enable row level security;
create policy "folders_all_own" on public.folders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index folders_user_idx on public.folders(user_id);
create index folders_directory_idx on public.folders(directory_id);

-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "notes_all_own" on public.notes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index notes_user_idx on public.notes(user_id);
create index notes_folder_idx on public.notes(folder_id);
create trigger notes_updated_at before update on public.notes for each row execute function public.set_updated_at();

-- Subscribers (tracks monthly skin subscription)
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscribed boolean not null default false,
  skin text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy "subscribers_select_own" on public.subscribers for select to authenticated using (auth.uid() = user_id);
create trigger subscribers_updated_at before update on public.subscribers for each row execute function public.set_updated_at();
