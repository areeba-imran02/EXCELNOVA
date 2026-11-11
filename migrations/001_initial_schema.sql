-- ExcelNova AI initial Supabase schema.
-- Run in Supabase SQL Editor. RLS is enabled for user-owned records.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  project_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_type text not null,
  status text not null default 'queued' check (status in ('queued','working','completed','failed')),
  selected_model text,
  fallback_used boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null,
  completed boolean not null default false,
  score numeric,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_key)
);

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
create index if not exists chat_conversations_user_updated_idx on public.chat_conversations(user_id, updated_at desc);
create index if not exists chat_messages_conversation_created_idx on public.chat_messages(conversation_id, created_at);
create index if not exists agent_executions_user_created_idx on public.agent_executions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_executions enable row level security;
alter table public.analyses enable row level security;
alter table public.reports enable row level security;
alter table public.learning_progress enable row level security;

create policy "profile owner can read" on public.profiles for select using (auth.uid() = id);
create policy "profile owner can insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profile owner can update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "project owner full access" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversation owner full access" on public.chat_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "message owner full access" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agent execution owner read" on public.agent_executions for select using (auth.uid() = user_id);
create policy "analysis owner full access" on public.analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "report owner full access" on public.reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning owner full access" on public.learning_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
