# EspetoControl

SaaS mobile em React Native + Expo para vendedores pequenos registrarem vendas, gastos e lucro diario com poucos toques.

## Stack

- Expo Router, React Native e TypeScript
- NativeWind para UI
- React Hook Form + Zod para formularios
- TanStack Query para cache e sincronizacao
- Supabase Auth, PostgreSQL e RLS

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env` e preencha:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

3. Rode o SQL em `supabase/schema.sql` no SQL Editor do Supabase.

4. Inicie o app:

```bash
npm start
```

## Observacao de cadastro

O fluxo cria usuario, empresa e perfil pelo app. Para esse fluxo funcionar sem backend extra, deixe a confirmacao de email desativada no Supabase Auth durante o MVP. Em producao, prefira mover a criacao de empresa/perfil para uma Edge Function ou trigger controlada.

## Supabase real

Para salvar dados de verdade, siga o passo a passo em `SUPABASE_SETUP.md`.
