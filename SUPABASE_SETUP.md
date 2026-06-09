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
