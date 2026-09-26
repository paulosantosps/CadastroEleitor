# Cadastro de Moradores (por Título de Eleitor)

Sistema simples de cadastro e consulta de moradores, usando o **Título de
Eleitor** como identificador principal (CPF é opcional). Sem módulo de
serviços — só cadastro.

Stack: Vite + React + TypeScript + React Router + Supabase (chamado direto
do navegador, protegido por Row Level Security). Sem backend próprio.

## 1. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Vá em **SQL Editor**, cole o conteúdo de `supabase-schema.sql` e rode.
3. Vá em **Settings → API** e copie a **Project URL** e a **anon public key**.

## 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os valores do passo anterior:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:5173. Crie uma conta pela própria tela de login
(aba "Criar uma conta nova") — o Supabase manda um e-mail de confirmação.

## 4. Subir pro GitHub

```bash
git init
git add .
git commit -m "Primeira versão"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

## 5. Publicar na Vercel

1. Em https://vercel.com, clique em **Add New → Project** e importe esse
   repositório do GitHub.
2. Em **Environment Variables**, adicione as mesmas duas variáveis do
   passo 2 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Clique em **Deploy**. A Vercel detecta que é um projeto Vite
   automaticamente.

O arquivo `vercel.json` já está configurado para as rotas do React Router
funcionarem certinho (sem ele, atualizar a página em `/moradores` daria
404).

## Estrutura

```
src/
  lib/
    supabase.ts       -> cliente do Supabase
    auth.tsx           -> contexto de sessão/login
    cpf.ts              -> validação de CPF
    titulo-eleitor.ts   -> validação de Título de Eleitor (algoritmo do TSE)
    cep.ts              -> busca de endereço via CEP (ViaCEP)
  components/
    Layout.tsx          -> cabeçalho com as abas (Cadastrar / Moradores)
  pages/
    Login.tsx
    Cadastrar.tsx       -> busca por Título de Eleitor + formulário de cadastro
    Moradores.tsx       -> lista de todos os cadastros, com filtro por nome
    MoradorDetail.tsx   -> ver/editar um morador
```

## Campos do cadastro

- **Título de Eleitor** — obrigatório, chave de busca principal, único no banco
- **Nome completo** — obrigatório
- **Fiscal/Responsável** — obrigatório
- **CPF** — opcional
- E-mail, telefone, CEP (preenche o endereço automaticamente) e endereço — opcionais
