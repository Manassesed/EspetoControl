# Deploy de teste em producao

O projeto ja esta pronto para deploy web estatico.

## Validado localmente

Comandos que passaram:

```bash
npm run typecheck
npm run build:web
```

A build final fica em:

```text
dist-web
```

## Variaveis obrigatorias

Configure estas variaveis na hospedagem:

```env
EXPO_PUBLIC_SUPABASE_URL=https://hszxiirgicrbfommrdty.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_GiphOzfpWHZjltGX0OxInw_l6SSaXZg
EXPO_PUBLIC_ENABLE_DEMO=false
```

## Vercel

1. Crie uma conta ou entre em https://vercel.com.
2. Importe este projeto.
3. Use:
   - Build Command: `npm run build:web`
   - Output Directory: `dist-web`
4. Adicione as variaveis de ambiente acima.
5. Deploy.

O arquivo `vercel.json` ja configura fallback para SPA.

## Netlify

1. Crie uma conta ou entre em https://netlify.com.
2. Importe este projeto.
3. Use:
   - Build Command: `npm run build:web`
   - Publish Directory: `dist-web`
4. Adicione as variaveis de ambiente acima.
5. Deploy.

O arquivo `netlify.toml` ja configura fallback para SPA.

## Teste depois do deploy

1. Abra a URL publica no celular.
2. Crie uma conta real.
3. Cadastre um produto.
4. Registre uma venda.
5. Cadastre um gasto.
6. Confira as tabelas no Supabase.

Nao use modo demo em producao. Ele esta desativado por `EXPO_PUBLIC_ENABLE_DEMO=false`.
