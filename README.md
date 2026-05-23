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
2. Copie `.env.example` para `.env` e ajuste a `DATABASE_URL` para o seu banco.
3. Instale e prepare o banco:
   ```bash
   npm install
   npx prisma migrate dev      # cria as tabelas
   npm run db:seed             # (opcional) carrega dados de exemplo
   npm run dev                 # abre em http://localhost:3000
   ```

## Como colocar no ar (produção) — passo a passo

A forma mais simples usa **Vercel** (hospedagem) + **Vercel Postgres** (banco). Tudo grátis para começar.

1. Suba este projeto para o GitHub (já está no repositório `felipefsw/felipefsw`).
2. Crie uma conta gratuita em **vercel.com** e clique em **Add New → Project**.
3. Selecione este repositório e clique em **Import**.
4. Antes (ou logo depois) do primeiro deploy, vá em **Storage → Create Database → Postgres**.
   A Vercel cria a variável `DATABASE_URL` automaticamente no projeto.
5. Clique em **Deploy**. No build, as tabelas são criadas sozinhas (`prisma migrate deploy`).
6. Pronto! A Vercel te dá um endereço (ex.: `seu-app.vercel.app`). Abra no celular e use
   "Adicionar à tela de início" para virar um atalho de app.

> Toda vez que você (ou eu) enviar mudanças para o GitHub, a Vercel atualiza o app sozinha.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | roda em modo desenvolvimento |
| `npm run build` | gera a versão de produção |
| `npm run db:seed` | carrega dados de exemplo |
| `npx prisma studio` | abre uma tela para ver/editar os dados do banco |
