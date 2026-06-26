# Conectar o EspetoControl ao Supabase real

Este projeto ja esta preparado para gravar dados reais no Supabase. O modo demo continua existindo apenas para preview visual.

## 1. Criar projeto Supabase

1. Acesse o painel do Supabase.
2. Crie um novo projeto.
3. Abra `Project Settings > API`.
4. Copie:
   - `Project URL`
   - `anon public key`

## 2. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
EXPO_PUBLIC_ENABLE_DEMO=false
```

Depois de alterar o `.env`, reinicie o Expo com cache limpo:

```bash
npx expo start --clear
```

## 3. Rodar o schema SQL

No painel do Supabase:

1. Abra `SQL Editor`.
2. Cole todo o conteudo de `supabase/schema.sql`.
3. Execute o script.
4. Depois, execute na ordem cada arquivo de `supabase/migrations/` (0001, 0002, ...).
   O `0002_team_roles.sql` cria a aba "Minha equipe": papel (gerente/colaborador),
   status (pendente/ativo/inativo) e as regras de RLS que escondem dados
   financeiros de colaboradores no banco, não só na tela.

Esse script cria:

- `empresas`
- `usuarios`
- `produtos`
- `vendas`
- `venda_itens`
- `gastos`
- funcoes RPC para cadastro inicial e venda
- RLS para isolar dados por empresa

## 4. Configurar Auth para o MVP

Para o cadastro funcionar diretamente pelo app neste MVP:

1. Abra `Authentication > Providers > Email`.
2. Desative a confirmacao obrigatoria de email.

Se a confirmacao de email ficar ativa, o usuario precisara confirmar o email antes de o app criar o perfil/empresa.

## 4.1 Publicar a Edge Function de convite (obrigatório para "Minha equipe")

Convidar alguém por email exige a Admin API do Supabase, que só pode rodar no
servidor (a `service_role` key nunca pode ir para o app). Por isso existe
`supabase/functions/invite-member`.

1. Instale a Supabase CLI e faça login (`supabase login`).
2. Vincule o projeto: `supabase link --project-ref <seu-project-ref>`.
3. Publique a função: `supabase functions deploy invite-member`.
4. Em `Authentication > URL Configuration`, configure a `Site URL` para a URL
   onde o app web fica publicado (ex: `https://espetocontrol.vercel.app`) e
   adicione `espetocontrol://` na lista de Redirect URLs (necessário para o
   link de convite abrir o app nativo).

Sem isso, o botão "Convidar" na aba Equipe retorna erro.

## 5. Como testar gravacao real

1. Abra o app.
2. Nao use `Ver demo sem cadastro`.
3. Toque em `Criar minha conta`.
4. Cadastre nome, empresa, email e senha.
5. Cadastre produtos.
6. Registre vendas e gastos.
7. Confira as tabelas no Supabase em `Table Editor`.

## 6. O que grava de verdade

- Produtos criados vao para `produtos`.
- Gastos criados vao para `gastos`.
- Vendas usam a funcao `registrar_venda`, que cria:
  - uma linha em `vendas`
  - varias linhas em `venda_itens`
- Dashboard consulta os dados reais do dia.

## 7. Observacao importante

O app so salva no banco quando ha sessao autenticada real. O modo demo usa dados locais e nao grava nada.

Para testar producao, deixe `EXPO_PUBLIC_ENABLE_DEMO=false`.

## 8. Deploy web para teste de producao

O projeto esta preparado para publicar a versao web estatica.

Build local:

```bash
npm run build:web
```

Preview local:

```bash
npm run preview:web
```

Vercel:

- Build command: `npm run build:web`
- Output directory: `dist-web`
- Environment variables:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_ENABLE_DEMO=false`

Netlify:

- Build command: `npm run build:web`
- Publish directory: `dist-web`
- Environment variables iguais as da Vercel.
