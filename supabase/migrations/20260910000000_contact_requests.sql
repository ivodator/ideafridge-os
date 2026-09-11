begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  company text not null check (char_length(company) between 1 and 150),
  message text not null default '' check (char_length(message) <= 2000),
  source text not null default 'website' check (source = 'website'),
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from public, anon, authenticated;
grant all on public.contact_requests to service_role;
comment on table public.contact_requests is 'Private contact requests. Written only by the validated contact Edge Function. No public API policies.';

create table if not exists private.contact_rate_limits (
  bucket text primary key check (char_length(bucket) <= 100),
  hits integer not null check (hits > 0),
  reset_at timestamptz not null
);
alter table private.contact_rate_limits enable row level security;
revoke all on private.contact_rate_limits from public, anon, authenticated;

create or replace function public.consume_contact_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_bucket is null or char_length(p_bucket) > 100 or p_limit not between 1 and 1000 or p_window_seconds not between 60 and 86400 then
    return false;
  end if;
  delete from private.contact_rate_limits where reset_at < now() - interval '1 day';
  insert into private.contact_rate_limits (bucket, hits, reset_at)
  values (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set hits = case when private.contact_rate_limits.reset_at <= now() then 1 else private.contact_rate_limits.hits + 1 end,
        reset_at = case when private.contact_rate_limits.reset_at <= now() then now() + make_interval(secs => p_window_seconds) else private.contact_rate_limits.reset_at end
    where private.contact_rate_limits.reset_at <= now() or private.contact_rate_limits.hits < p_limit
  returning hits into v_hits;
  return found;
end;
$$;

revoke all on function public.consume_contact_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_contact_limit(text, integer, integer) to service_role;

commit;
