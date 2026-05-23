# Gestão de Diaristas

App web para administrar os diaristas das lojas: **cadastro de diaristas, cadastro de lojas,
escala/agenda, presença e pagamentos**. Funciona no celular e no computador.

Feito com Next.js, Prisma e Postgres.

## Quem usa

- **Você / RH**: gerenciam tudo pelo app (cadastros, escala, presença, pagamentos).
- **Diaristas**: recebem um **link pessoal** (sem senha) para ver a própria agenda e confirmar
  presença. O link fica na tela de edição de cada diarista (botão "Copiar").

## Telas

- **Início**: resumo do dia (escalados hoje, presenças pendentes, total a pagar).
- **Escala**: agenda por semana; agendar quem trabalha onde e quando; marcar presença/falta.
- **Diaristas**: cadastro (nome, WhatsApp, Pix, valor da diária) + link pessoal.
- **Lojas**: cadastro das lojas.
- **Pagamentos**: diárias a pagar (agrupadas por diarista) e histórico de pagos.

---

## Como rodar no seu computador (desenvolvimento)

1. Tenha o **Node.js 20+** instalado e um **Postgres** rodando.
2. Copie `.env.example` para `.env`. Em desenvolvimento, `DATABASE_URL` e `DIRECT_URL`
   podem ser **iguais** (apontando para o seu Postgres local).
3. Instale e prepare o banco:
   ```bash
   npm install
   npx prisma migrate dev      # cria as tabelas
   npm run db:seed             # (opcional) carrega dados de exemplo
   npm run dev                 # abre em http://localhost:3000
   ```

## Como colocar no ar (produção) — passo a passo

A forma mais simples usa **Vercel** (hospedagem) + um **Postgres** (banco). Tudo grátis para começar.

1. Suba este projeto para o GitHub (já está no repositório `felipefsw/felipefsw`).
2. Crie uma conta gratuita em **vercel.com** (login com GitHub) e clique em **Add New → Project**.
3. Selecione este repositório e clique em **Import** (deixe as variáveis de ambiente em branco).
4. Conecte um banco Postgres na aba **Storage** do projeto (Vercel Postgres, Supabase ou Neon).
   A integração cria automaticamente as variáveis `POSTGRES_PRISMA_URL` (pooled) e
   `POSTGRES_URL_NON_POOLING` (direta), que é o que o app usa — **não precisa criar nada à mão**.
5. Faça o deploy (ou **Redeploy**, se o primeiro tentou rodar antes do banco existir).
   No build, as tabelas são criadas sozinhas (`prisma migrate deploy` usa a `POSTGRES_URL_NON_POOLING`).
6. Pronto! A Vercel te dá um endereço (ex.: `seu-app.vercel.app`). Abra no celular e use
   "Adicionar à tela de início" para virar um atalho de app.

> Toda vez que você (ou eu) enviar mudanças para o GitHub, a Vercel atualiza o app sozinha.

### Carregar os dados reais em produção (opcional)

Os dados reais (lojas/diaristas) **não** ficam no Git. Para carregá-los no banco de produção,
rode o seed privado apontando as conexões para o banco da Vercel:

```bash
POSTGRES_PRISMA_URL="<pooled>" POSTGRES_URL_NON_POOLING="<direta>" npx tsx prisma/seed.real.ts
```

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | roda em modo desenvolvimento |
| `npm run build` | gera a versão de produção |
| `npm run db:seed` | carrega dados de exemplo |
| `npx prisma studio` | abre uma tela para ver/editar os dados do banco |
