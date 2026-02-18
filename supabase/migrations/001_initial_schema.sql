create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  platform text not null check (platform in ('whatsapp', 'facebook')),
  created_at timestamptz not null default now(),
  unique(phone, platform)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved', 'needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('student', 'bot')),
  content text not null,
  topic text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_student_id on public.conversations(student_id);
create index if not exists idx_conversations_status on public.conversations(status);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_students_search on public.students using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(phone,'')));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

alter table public.students enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.admin_roles enable row level security;

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = user_uuid
      and ar.role in ('admin', 'super_admin')
  );
$$;

create policy "Admins can read students"
on public.students
for select
using (public.is_admin(auth.uid()));

create policy "Admins can manage students"
on public.students
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can read conversations"
on public.conversations
for select
using (public.is_admin(auth.uid()));

create policy "Admins can manage conversations"
on public.conversations
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can read messages"
on public.messages
for select
using (public.is_admin(auth.uid()));

create policy "Admins can manage messages"
on public.messages
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Super admin can manage roles"
on public.admin_roles
for all
using (exists (
  select 1 from public.admin_roles ar
  where ar.user_id = auth.uid() and ar.role = 'super_admin'
))
with check (exists (
  select 1 from public.admin_roles ar
  where ar.user_id = auth.uid() and ar.role = 'super_admin'
));

create or replace function public.queries_per_day()
returns table(day date, total bigint)
language sql
security definer
set search_path = public
as $$
  select date(created_at) as day, count(*) as total
  from public.messages
  where sender = 'student'
  group by date(created_at)
  order by day desc;
$$;

create or replace function public.most_asked_topic()
returns table(topic text, total bigint)
language sql
security definer
set search_path = public
as $$
  select m.topic, count(*) as total
  from public.messages m
  where sender = 'student'
  group by m.topic
  order by total desc
  limit 5;
$$;
