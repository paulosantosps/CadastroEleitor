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
  observacao text,
  created_by uuid references auth.users(id),
  created_by_email text,
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

create table public.alteracoes_log (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid not null references public.moradores(id) on delete cascade,
  campo text not null,
  valor_antigo text,
  valor_novo text,
  alterado_por uuid references auth.users(id),
  alterado_por_email text,
  created_at timestamptz not null default now()
);

alter table public.alteracoes_log enable row level security;

grant select, insert on public.alteracoes_log to authenticated;

create policy "Authenticated users can view alteracoes_log"
on public.alteracoes_log for select to authenticated using (true);

create policy "Authenticated users can create alteracoes_log"
on public.alteracoes_log for insert to authenticated with check (true);

create index alteracoes_log_morador_idx on public.alteracoes_log (morador_id);
create index alteracoes_log_created_at_idx on public.alteracoes_log (created_at desc);
