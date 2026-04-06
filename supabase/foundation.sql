create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  language text not null default 'tr' check (language in ('tr', 'en')),
  university text not null default '',
  department text not null default '',
  class_year text not null default '' check (
    class_year in ('', 'hazirlik', '1', '2', '3', '4', '5', '6+', 'lisansustu')
  ),
  known_languages text[] not null default '{}'::text[],
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into storage.buckets (id, name, public)
values ('course-resources', 'course-resources', false)
on conflict (id) do update
set public = excluded.public;

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_state_select_own" on public.user_state;
create policy "user_state_select_own"
on public.user_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_state_insert_own" on public.user_state;
create policy "user_state_insert_own"
on public.user_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_update_own"
on public.user_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "course_resources_select_own" on storage.objects;
create policy "course_resources_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'course-resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "course_resources_insert_own" on storage.objects;
create policy "course_resources_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course-resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "course_resources_update_own" on storage.objects;
create policy "course_resources_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'course-resources'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'course-resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "course_resources_delete_own" on storage.objects;
create policy "course_resources_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course-resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_profile_updated_at();

create or replace function public.handle_user_state_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists user_state_set_updated_at on public.user_state;

create trigger user_state_set_updated_at
before update on public.user_state
for each row
execute function public.handle_user_state_updated_at();
