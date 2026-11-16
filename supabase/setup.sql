-- ============================================================
-- UNEPPE | Preparação do Supabase para a Bolsa Formação
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- Antes: Authentication > Providers > Email > DESLIGUE "Allow new users to sign up"
-- (só as pessoas que você criar à mão poderão entrar).
-- ============================================================

-- 1) Tabela dos cadastros
create table if not exists public.bolsa_cadastros (
  id          uuid primary key,
  created_at  timestamptz not null default now(),
  nome        text not null,
  rg          text not null,
  matricula   text not null,
  cpf         text not null,
  telefone    text not null,
  email       text not null,
  cep         text not null,
  endereco    text not null,
  arquivos    jsonb not null default '{}'::jsonb,   -- caminhos dos documentos no Storage
  declaracoes jsonb not null default '{}'::jsonb
);

-- 2) Segurança em nível de linha: o público só consegue ENVIAR, nunca LER
alter table public.bolsa_cadastros enable row level security;

drop policy if exists "publico envia cadastro" on public.bolsa_cadastros;
create policy "publico envia cadastro"
  on public.bolsa_cadastros for insert
  to anon
  with check (true);

drop policy if exists "equipe autenticada le cadastros" on public.bolsa_cadastros;
create policy "equipe autenticada le cadastros"
  on public.bolsa_cadastros for select
  to authenticated
  using (true);

-- 3) Pasta privada para os documentos (identidade, comprovantes, extrato)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bolsa-documentos', 'bolsa-documentos', false, 20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "publico envia documentos" on storage.objects;
create policy "publico envia documentos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'bolsa-documentos');

drop policy if exists "equipe autenticada le documentos" on storage.objects;
create policy "equipe autenticada le documentos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bolsa-documentos');

-- 4) Depois: crie o acesso do presidente em Authentication > Users > Add user
--    (e-mail + senha, marque "Auto Confirm User").
