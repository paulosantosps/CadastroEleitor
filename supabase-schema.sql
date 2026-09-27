create table public.moradores (
  id uuid primary key default gen_random_uuid(),
  voter_title text not null unique,
  cpf text,
  name text not null,
  fiscal_responsavel text not null,
  email text,
  phone text,
  cep text,
  address text,
  voter_zone text,
  voter_section text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moradores enable row level security;

create policy "Authenticated users can view moradores"
on public.moradores for select to authenticated using (true);

create policy "Authenticated users can insert moradores"
on public.moradores for insert to authenticated with check (true);

create policy "Authenticated users can update moradores"
on public.moradores for update to authenticated using (true) with check (true);
