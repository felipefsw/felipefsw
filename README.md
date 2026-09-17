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

---

# Painel do Gestor

No mesmo app existe um segundo produto, em `/painel`: o **Painel do Gestor** das
pizzarias da rede (faturamento, CMV diário, metas e prêmio da semana, checklists,
escala, previsão do dia). Ele é construído a partir do documento
[`/docs/BUILD_BOOK.md`](docs/BUILD_BOOK.md), que é a fonte única de regras,
schema e testes.

## Como entrar

1. Rode `npm run db:seed:painel` uma vez (cria as lojas, a equipe, os turnos,
   os parâmetros, os feriados e o usuário administrador).
2. Abra `/painel/entrar` e entre com o e-mail e a senha do administrador
   (veja `.env.example` para mudar o padrão).
3. Em **Admin › Usuários** você cria as outras pessoas e escolhe o papel de
   cada uma em cada loja.

## Papéis

| Papel | Enxerga | Mexe em |
| --- | --- | --- |
| Administrador da rede | todas as lojas | tudo |
| Gestor | as lojas dele | meta da semana, parâmetros, equipe, escala; aprova o fechamento |
| Gerente | a loja dele | presença, checklists, contagem, envio de relatórios |
| Equipe | a loja dele | nada (só vê o placar e a TV) |
| Auditor | as lojas designadas | avaliação, pesagens e fotos |
| CD | todas as lojas | cupons e entregas |

## O que já está pronto

**Sprint 0 (base).** Banco com as 45 tabelas da seção 4 do book, travas de
papel por loja, login próprio, seletor de loja, tema, e o admin de usuários e
de parâmetros.

**Sprint 1 (enviar e vendas).** A tela **Enviar relatórios** lê o "Vendas por
período" do Saipos e grava os pedidos; mandar o mesmo arquivo de novo não
duplica nada. A tela **Vendas 360** mostra o faturamento do período, a média de
cada dia da semana com mínimo e máximo, o mapa de calor por hora, o dia a dia e
a previsão dos próximos 14 dias.

Os outros módulos (Placar, CMV, Dashboard do dia, Escala, Entregadores,
iFood 360) entram um sprint por vez, na ordem da seção 12 do book.

### Ainda falta, para fechar o Sprint 1

- os demais leitores do Saipos e do iFood (itens vendidos, fechamento, tempo de
  produção, relatório de pedidos do iFood);
- o teste 3 da seção 11, que fixa os números reais da WLP1 — ele só roda quando
  um export de verdade estiver em `/docs/samples/`.

## Coisas que o painel nunca faz

- **Não inventa número.** Se falta um dado, aparece uma pendência amarela
  dizendo o que enviar — nunca um valor estimado.
- **Não muda o passado.** Trocar um parâmetro cria uma linha nova com a data em
  que ele passa a valer; os cálculos dos dias anteriores continuam iguais.
- **Não mistura dia civil com dia de trabalho.** O dia operacional vai das 06h00
  às 05h59 do dia seguinte, então um pedido da 01h30 conta no dia anterior.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run db:seed:painel` | carrega os dados da seção 10 do book |
| `npm test` | roda os testes de aceite (seção 11 do book) |
