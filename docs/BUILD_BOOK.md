# BUILD BOOK · Painel do Gestor
### Rede Pizza Pizza · We Love Pizza · Rei da Pizza (D&S Franchising / RWP)
Versão 1.0 · setembro/2026 · documento de construção para o Claude Code

---

## 0. Como usar este book com o Claude Code

1. Crie o repositório vazio e coloque este arquivo em `/docs/BUILD_BOOK.md` e o conteúdo da seção 13 em `/CLAUDE.md`.
2. Abra o Claude Code na raiz e mande: *"Leia /docs/BUILD_BOOK.md inteiro. Execute o Sprint 0 e pare para eu revisar o schema antes de aplicar as migrations."*
3. Depois, um sprint por vez: *"Execute o Sprint N conforme o book. Ao terminar, rode os testes de aceite do sprint e me mostre o resultado."*
4. Regras de trabalho pro agente: nunca inventar coluna, valor ou regra que não esteja aqui; se faltar informação, perguntar antes de assumir; toda fórmula vem da seção 6; toda tela tem os critérios de aceite da seção 7; commits pequenos com mensagem em português.

---

## 1. Produto e princípios

**O que é:** app web mobile-first (PWA) para gestor, gerente, equipe, auditor e CD de uma rede de pizzarias delivery. O gestor e o gerente só enviam o que já existe (relatórios do Saipos e do iFood, contagem de estoque, fotos, ponto) e o app calcula tudo: faturamento, CMV diário, metas e prêmio semanal, checklists, escala, previsão do dia, análises em português, com uma tela de TV na loja.

**Princípios de engenharia**
- Dia operacional: 06h00 às 05h59 do dia seguinte. Toda agregação usa `ops_date`, nunca a data civil.
- Nada é inventado: campo ausente vira pendência visível, não valor estimado.
- Idempotência: reenviar um relatório nunca duplica (chave natural por loja + id externo + data).
- Cálculo no banco (views/functions SQL) e em Edge Functions; a UI só renderiza.
- Parâmetros e réguas versionados com vigência (`valid_from`); todo cálculo grava a versão usada.
- PT-BR em tudo; datas dd/mm/aaaa; moeda `R$ 1.234,56`; número grande primeiro, explicação embaixo.

---

## 2. Arquitetura e stack

- **Frontend:** React 18 + Vite + TypeScript, Tailwind, shadcn/ui, Recharts (gráficos), `xlsx` (SheetJS) para parse no cliente quando o arquivo for planilha, PWA (vite-plugin-pwa) com fila offline (IndexedDB via Dexie) para contagem, presença e checklists.
- **Backend:** Supabase: Postgres 15 (RLS), Auth (e-mail/senha; magic link opcional), Storage (buckets `uploads`, `checklists`, `audits`), Edge Functions (Deno) para ingestão, extração com IA, recálculo e webhooks, Realtime (canal por loja para o modo TV), `pg_cron` (fechamento do dia às 06h05, apuração semanal segunda 06h30).
- **IA:** API da Anthropic (modelo Claude) chamada só nas Edge Functions: extração estruturada de PDF/imagem/texto (JSON Schema por tipo) e textos "Explicar".
- **Mensageria:** webhook para n8n → Z-API (WhatsApp) → assistente "Juh". O app só emite eventos com payload JSON (seção 9).
- **Ambientes:** `dev` (branch Supabase), `prod`. Variáveis: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` (só Edge), `ANTHROPIC_API_KEY` (só Edge), `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`.
- **Estrutura do repo:**
```
/app            frontend (Vite)
/supabase       migrations, seed, functions/
  /migrations
  /seed
  /functions/ingest, extract, recalc, weekly-close, alerts, explain
/docs           BUILD_BOOK.md, schemas/ (JSON Schemas de ingestão), samples/ (exports reais anonimizados)
/tests          testes de aceite (vitest + supabase-js contra o branch dev)
```

---

## 3. Papéis e permissões

| Papel | Escopo | Ver | Editar | Aprovar |
|---|---|---|---|---|
| admin_rede | todas as lojas | tudo | réguas, parâmetros, usuários, modelos de checklist, regras de gamificação | tudo |
| gestor | suas lojas | tudo da loja | meta da semana, parâmetros da loja, equipe, escala | fechamento da semana, contestações |
| gerente | sua loja | placar, dashboard do dia, CMV, escala | presença, checklists, contagem, envio de relatórios, indicadores digitados | — |
| equipe | sua loja | placar da semana e TV | — | — |
| auditor | lojas designadas | placar, checklists | avaliação semanal, pesagens, fotos | — |
| cd | todas as lojas | pedidos, cupons, compra sugerida | cupons, entregas | — |

Implementação: tabela `memberships(user_id, store_id, role)`; função SQL `has_role(store_id, roles[])`; RLS em todas as tabelas com `store_id` usando `has_role`. Tabelas de rede (parâmetros padrão, modelos) legíveis por todos os autenticados, editáveis só por `admin_rede`.

---

## 4. Modelo de dados (DDL)

Todas as tabelas: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at` (trigger), `created_by uuid`. Abaixo só as colunas de negócio.

```sql
-- organização
brands(name text)
stores(brand_id, name, short_name, cnpj, address, city, open_time time, close_time time, tz text default 'America/Fortaleza', active bool)
profiles(user_id uuid unique, name, phone, avatar_url)
memberships(user_id, store_id, role text check (role in ('admin_rede','gestor','gerente','equipe','auditor','cd')), unique(user_id, store_id))

-- equipe e turnos
employees(store_id, name, role text check (role in ('producao','atendimento','lider_producao','gerente','diarista','entregador')), regime text check (regime in ('6x1','5x2','diarista')), shift_pref text, admission_date date, monthly_cost numeric, daily_rate numeric, active bool)
shifts(store_id null=rede, code text, label text, start_time time, end_time time, break_start time, break_end time, paid_hours numeric)   -- A 14:00-23:00 (15:30-16:30), A2 14:30-23:30, C 15:30-00:30 (16:30-17:30), B 17:00-02:00 (22:00-23:00)

-- parâmetros com vigência (rede = store_id null)
params(store_id null, key text, value_num numeric, value_text text, valid_from date, unique(store_id,key,valid_from))
-- chaves: pizzas_per_order, prod_target (22), att_target (25), min_prod (2), min_att (1), courier_cost (8), box_cost (1.25), gas_cost (0.25), drink_cost_order, ifood_rate (0.121), cmv_green (29), cmv_yellow (31), prod_time_ok (10), prod_time_bad (13), delivery_ok (40), delivery_bad (50), dough_max_min (60), floor_pct (85), nut_gate (70), nut_excel (90), late_tolerance (1), weeks_in_house (4), calls_green (1.5), calls_red (2.5), cancel_max (1), nota_min (4.8), prize_presence (30), prize_streak (40), prize_cmv_green (40), prize_cmv_yellow (20), prize_pizzas (15), prize_pizzas_110 (25), prize_quality (15), prize_excel (20), leader_potential (600), manager_potential (900), commission_pct (10), accelerator_pct (20), manager_bonus_110 (200)

-- cardápio, ficha e preços
ingredients(code text unique, name, unit text check (unit in ('kg','bola','un')), pack_label text, pack_size numeric)   -- 17 itens da curva + demais
cd_prices(ingredient_id, price numeric, valid_from date)
recipes(store_id null=rede, product_name text, size text check (size in ('G','P','broto')), category text check (category in ('salgada','doce','borda')), valid_from date)
recipe_items(recipe_id, ingredient_id, grams numeric)   -- massa em 'bola' = 1
product_aliases(alias text, recipe_id)   -- "1/2 calabresa", "sertao" -> Sertaneja etc.

-- ingestão
uploads(store_id, kind text, file_path text, sha256 text unique, status text check (status in ('recebido','processado','alerta','rejeitado')), summary jsonb, extracted jsonb, error text, period_start date, period_end date)
-- kind: saipos_vendas, saipos_itens, saipos_fechamento, saipos_tempo_producao, saipos_tempo_status, saipos_acerto, saipos_clientes, ifood_pedidos, ifood_vendas, ifood_cardapio, ifood_anuncios_print, ifood_promocoes_print, cd_cupom, contagem, ponto

-- fatos
orders(store_id, external_id text, sold_at timestamptz, ops_date date, channel text, order_type text check (order_type in ('D','B')), items_value numeric, delivery_fee numeric, surcharge numeric, discount numeric, total numeric, courier_pay numeric, courier_name text, district text, cancelled bool, upload_id, unique(store_id, external_id, sold_at))
items_sold(store_id, period_start, period_end, product_name, option_name, qty int, value numeric, kind text check (kind in ('produto','metade','borda','bebida','outro')), recipe_id null, upload_id)
daily_close(store_id, ops_date, total_faturado numeric, qty_orders int, source text, upload_id, unique(store_id, ops_date))
production_hours(store_id, ops_date, hour int, items int, avg_sec numeric, max_sec numeric, upload_id, unique(store_id, ops_date, hour))
status_times(store_id, period_start, period_end, status text, n int, avg_sec numeric, max_sec numeric, upload_id)
courier_settlements(store_id, period_start, period_end, courier_name text, fleet text, deliveries int, fee numeric, days int, value_delivered numeric, upload_id)
customers(store_id, external_id text, name, phone, district, lifetime_orders int, lifetime_value numeric, last_order date, upload_id, unique(store_id, external_id))
ifood_orders(store_id, ifood_id text unique, ordered_at timestamptz, ops_date, status text, items numeric, paid numeric, delivery_fee numeric, incentive_ifood numeric, incentive_store numeric, service_fee numeric, fees numeric, net numeric, payment text, upload_id)
ifood_metrics(store_id, period_start, period_end, visits int, item_views int, cart int, completed int, conversion numeric, new_customers int, ads_spend numeric, ads_visits int, ads_orders int, ads_sales numeric, promo_store numeric, promo_ifood numeric, rating numeric, cancel_pct numeric, calls_pct numeric, source text, upload_id)
attendance(store_id, employee_id, ops_date, status text check (status in ('P','A','F','T','O','S')), minutes_late int, source text check (source in ('ponto','gerente')), unique(store_id, employee_id, ops_date))

-- CMV diário
stock_counts(store_id, count_date date, counted_at timestamptz, ingredient_id, qty numeric, unit text, note text, photo_path text, unique(store_id, count_date, ingredient_id))
cd_deliveries(store_id, delivered_at timestamptz, cd_order_no int, ingredient_id, qty numeric, unit text, unit_price numeric, upload_id)
internal_consumption(store_id, ops_date, recipe_id, qty numeric)
cmv_daily(store_id, ops_date, total_faturado numeric, consumption_value numeric, cmv_real_pct numeric, cmv_theo_pct numeric, block_group int null, status text check (status in ('ok','bloco','pendente')), details jsonb, params_version date)
cmv_item_daily(store_id, ops_date, ingredient_id, initial numeric, received numeric, final numeric, consumed numeric, theo numeric, deviation_pct numeric, value numeric)

-- metas, semana e prêmio
week_targets(store_id, week_start date, target_revenue numeric, target_pizzas int, target_cmv numeric, target_rating numeric, message text, set_by uuid, unique(store_id, week_start))
week_indicators(store_id, week_start, revenue numeric, orders int, pizzas int, ticket numeric, cancel_pct numeric, counter_pct numeric, prod_time_avg numeric, cmv_pct numeric, rating numeric, calls_pct numeric, nutrition_pct numeric, gramatura_ok bool, source jsonb, unique(store_id, week_start))
checklist_templates(store_id null=rede, name text check (name in ('Abertura','Pico','Fechamento')), active bool)
checklist_items(template_id, position int, text text, reference_photo_path text, requires_photo bool)
checklist_marks(store_id, ops_date, item_id, done bool, done_at timestamptz, done_by uuid, evidence_path text, unique(store_id, ops_date, item_id))
week_settlements(store_id, week_start, status text check (status in ('aberta','fechada','aprovada','paga')), gates jsonb, team_prizes jsonb, hit_targets int, measured_targets int, total_payout numeric, closed_at, approved_by, paid_at, params_version date, unique(store_id, week_start))
payouts(settlement_id, employee_id, eligible bool, reasons text[], presence numeric, cmv numeric, pizzas numeric, quality numeric, excellence numeric, streak numeric, total numeric, streak_weeks int)
leader_month(store_id, month date, employee_id, blocks jsonb, score numeric, accelerator bool, prize numeric, commission numeric, gates jsonb, total numeric)
manager_month(store_id, month date, employee_id, blocks jsonb, score numeric, accelerator bool, prize numeric, bonus110 numeric, commission numeric, gates jsonb, total numeric)
disputes(settlement_id, employee_id, text, status text, resolved_by, resolution text)

-- auditoria, gamificação, alertas, IA
audits(store_id, audit_date, kind text check (kind in ('nutricao','rede')), score numeric, blocks jsonb, photos text[], auditor_id)
weighings(store_id, audit_id, recipe_id, expected_g numeric, measured_g numeric, ok bool)
gamification_rules(key, points int, valid_from)
gamification_points(store_id, week_start, employee_id null, key, points int, detail text)
alerts(store_id, kind, payload jsonb, sent_at, status)
ai_analyses(store_id, module text, period_start, period_end, prompt_hash text, text text, model text)
```

Índices: `orders(store_id, ops_date)`, `orders(store_id, sold_at)`, `attendance(store_id, ops_date)`, `checklist_marks(store_id, ops_date)`, `ifood_orders(store_id, ops_date)`, `production_hours(store_id, ops_date)`.

Views/functions SQL a criar (usadas pelos módulos): `v_orders_hourly` (ops_date, hour, orders, revenue, deliveries, counter, by channel), `v_weekday_profile(store_id, weeks)` (média por dia da semana e hora, excluindo feriados), `v_cum_share_15min(store_id, day_type)` (curva acumulada por quarto de hora), `f_forecast_day(store_id, date)`, `f_project_live(store_id, date, minute, orders)`, `f_cmv_day(store_id, date)`, `f_settle_week(store_id, week_start)`, `f_staffing_need(store_id, weekday)`, `f_weekly_purchase(store_id)`.

Feriados: tabela `holidays(date, name, behaves_like text default 'Sáb')`.

RLS (padrão): `select` para membros da loja; `insert/update` por papel conforme seção 3; tabelas com `store_id null` (rede) editáveis só por `admin_rede`. Edge Functions usam `service_role` e validam o JWT do usuário chamador.

---

## 5. Ingestão

### 5.1 Fluxo
1. Upload para `uploads/{store_id}/{yyyy}/{mm}/{sha256}.{ext}` (Storage). Se `sha256` já existe: retorna o registro anterior (idempotente).
2. Edge `ingest`: detecta `kind` (por extensão + cabeçalhos + palavras-chave), extrai, valida, grava, chama `recalc` para o período.
3. Planilhas (`xlsx/csv`): parse determinístico com SheetJS (sem IA). PDF/imagem/texto: Edge `extract` chama a API da Anthropic com o JSON Schema do tipo e retorna JSON; a validação rejeita se totais não fecham.
4. Status: `processado` (tudo ok), `alerta` (gravado com avisos: ex. período parcial), `rejeitado` (motivo). O usuário vê o histórico e pode reprocessar.

### 5.2 Detecção por conteúdo
| kind | assinatura |
|---|---|
| saipos_vendas | cabeçalho com "Data da venda", "Total", "Está cancelado", "Tipo do pedido", "Canal de venda" |
| saipos_itens | cabeçalho "Itens e Opções", "Quantidade", "Valor Total", "Percentual"; linhas de categoria sem "- " e de itens com "- " |
| saipos_fechamento | texto/PDF/foto com "Total Faturado" e "Qtde" |
| saipos_tempo_producao | colunas DIA, DIA DA SEMANA, HORA, TEMPO MÉD., QTD. ITENS (segundos na 12ª coluna, itens na 17ª) |
| saipos_tempo_status | linhas Cozinha, Pizza Pronta, Saiu para entrega, Entregue com quantidade, mín, méd, máx |
| saipos_acerto | "Acerto de entregadores": nome, entregas, R$ pago, dias, valor entregue |
| saipos_clientes | colunas "Qtd. Pedidos", "Nome", "Telefone", "Valor Total", "Ticket Médio", "Última Compra" |
| ifood_pedidos | colunas "ID DO PEDIDO", "STATUS", "VALOR DOS ITENS", "TOTAL PAGO", "INCENTIVO PROMOCIONAL DO IFOOD", "INCENTIVO PROMOCIONAL DA LOJA", "TAXA DE SERVIÇO", "TAXAS E COMISSÕES", "VALOR LÍQUIDO" |
| ifood_cardapio | abas "Funil Loja", "Itens", "Complementos" |
| ifood_vendas | aba "Vendas" com "Total de pedidos concluídos", "Novos clientes" |
| ifood_anuncios_print / ifood_promocoes_print | imagem com "Retorno por real investido", "ROAS", "Visitas via Anúncios" / "Pedidos com promoção", "Total investido pela loja" |
| cd_cupom | foto/PDF com itens, quantidade, preço e "pedido nº" |
| contagem | formulário do app (não passa por upload) ou foto da folha (IA) |
| ponto | export do ponto: nome, data, entrada, saída, status |

### 5.3 Mapeamento Saipos · Vendas por período → `orders`
`Data da venda` (dd/mm/aaaa HH:MM) → `sold_at`; `ops_date = date(sold_at − 6h)`; `Canal de venda` → channel; `Tipo do pedido` (D/B) → order_type; `Itens`, `Entrega`, `Acréscimo`, `Desconto`, `Total`, `Valor Entregador`, `Entregador`, `Bairro`; `Está cancelado` = 'S' → cancelled. `external_id` = `Id do pedido no parceiro` ou `Número do pedido no parceiro` + data. Regras: cancelados gravados com `cancelled=true` e excluídos das views.

### 5.4 Mapeamento Saipos · Itens vendidos → `items_sold` (+ pizzas)
Categoria = linha sem "- ". Produto = linha com "- " cuja nome bate em `product_aliases` (kind produto). Opção = linha com "- " começando por "1/2 " (metade), "Borda"/"Sem Borda" (borda), bebida (coca, guaraná, pepsi, água, refri, lata). Contagem de pizzas: produtos com "Pizza G"/"Pizza Grande" contam 1 G (com "2 Pizza G" contam 2; "Pizza G + Pizza P" conta 1 G + 1 P); "Pequena"/"Pizza 4 Fatias" 1 P; "Brotinho" 1 broto. Metades → sabores (÷ 2). Bordas → quantidade por tipo. Mix da loja = `pizzas_per_order = (G+P+broto) / pedidos válidos do mesmo período`.

### 5.5 Mapeamento iFood · Relatório de pedidos → `ifood_orders`
Só `status = CONCLUIDO` entra nos cálculos; cancelados ficam para a taxa de cancelamento. `ops_date` pela mesma regra de 06h.

### 5.6 JSON Schemas (em `/docs/schemas/*.json`)
Um por `kind`, com `required`, tipos e validações (`total = itens + entrega + acréscimo − desconto` com tolerância R$ 0,05; datas dentro do período informado; quantidades inteiras). O prompt de extração para PDF/imagem: *"Extraia exatamente os campos do schema; se um campo não estiver visível, use null; não calcule nem arredonde; responda só o JSON."*

---

## 6. Regras de cálculo (fonte única)

### 6.1 Dia, curvas e previsão
- `ops_date = date(ts − 6h)`. Feriado (tabela) se comporta como sábado.
- Tipos de dia: Dom, Sáb, Sex, Seg–Qui.
- Perfil por dia da semana: média de pedidos por hora nas últimas 4 a 5 semanas completas, excluindo feriados e o dia corrente.
- Previsão do dia = média do dia da semana. Previsão da semana = soma dos 7 dias. Previsão de 14 dias = tabela por data.
- Curva acumulada por quarto de hora: `cum[q] = pedidos até o fim do quarto q ÷ pedidos do dia`, média do tipo de dia; interpolação linear dentro do quarto.
- Projeção ao vivo: `total = comandas_até_t ÷ cum(t)`; faixa = min/max de `comandas × total_i ÷ cum_i(t)` sobre os dias do mesmo tipo (ignorar dias com `cum_i(t)·total_i < 10`); "ritmo" = comandas do último intervalo ÷ esperado no intervalo. Só projetar com `cum(t) ≥ 3%`.
- Próximos 60 min: `pedidos_60 = total × (cum(t+60) − cum(t))`; pizzas = `× pizzas_per_order` (G e P separados pelo mix); ingredientes = Σ pizzas × gramas médias por G/P (ficha × mix); motoboys = entregas_60 ÷ 4 (arredondar pra cima).
- Massa: aberta no máximo `dough_max_min` (60) antes do forno; programação em lotes de 30 min: a cada meia hora abrir metade do que a próxima hora pede.
- Tempo de produção (KDS): média ponderada por itens; régua 10/13 min. Capacidade: reportar a faixa de itens/hora a partir da qual a média passa de 10.

### 6.2 CMV diário (skill v4.0)
- `CMV_real = (estoque_inicial + recebido_CD − estoque_final) × preço_CD ÷ Total_Faturado` (por item e somado). Estoque inicial de hoje = final de ontem (contagem da manhã fecha ontem).
- `CMV_teórico = Σ (itens vendidos × ficha × preço) ÷ Total_Faturado`. Desvio item = `real ÷ teórico − 1` (positivo = prejuízo; negativo = qualidade em risco).
- Curva única de 17 itens (inclui bisnagas). Unidades: massa em tabuleiros (24 bolas = 9,12 kg) ou bolas; mussarela peça 5 kg; molho só sacos de 1,7 kg ou caixa de 8 (balde preparado = consumo); calabresa pacote 2,5 kg ou kg ÷ 2,5; bisnagas em bisnagas (req cx 8, cc cx 4, ched cx 6, chocolates cx 8); frações 0,25/0,5/0,75.
- Itens da rota não misturam com estoque antes da contagem; se guardado, registrar (massa no freezer em tabuleiros).
- Consumo negativo → status `pendente` e pedido de recontagem; dia sem contagem ou duvidoso → `bloco` com o dia vizinho (CMV do bloco, sem acusar item).
- Cupom faltante: sequência de `cd_order_no` por loja; lacuna = alerta.
- Consumo interno: sempre com sabor real, entra no teórico.
- Régua (parâmetro): verde < 29, amarelo 29–31, vermelho > 31. Sem comparação entre lojas.
- Gramas por borda de requeijão = consumo de requeijão em bordas ÷ bordas vendidas (meta 130–150 g).
- Catálogo de erros (sintoma → causa → ação) implementado como regras de alerta: item −50%/negativo; requeijão que não fecha; massa some/sobra vs pedidos; estoque idêntico 2 dias (contagem copiada); estoque sobe sem cupom; unidade ausente; mussarela ±15–20 kg num dia; sanfona em par de dias; consumo interno zerado em dia cheio; % alto em dia fraco (ler consumo absoluto).
- Lista de compra: necessidade do dia (previsão × ficha × mix) − estoque.

### 6.3 Custo variável e iFood
- Taxa iFood = `ifood_rate (12,1%) × (itens − incentivo_loja + entrega) + taxa_serviço`. Incentivo do iFood volta no repasse (não é custo). Receita real = `itens − incentivo_loja + entrega` (= Total do Saipos − taxa de serviço).
- Custo variável por pedido = ficha × mix + quebra% × receita + `box_cost` × pizzas + `gas_cost` × pizzas + `drink_cost_order` + taxa iFood (só pedidos iFood) + `courier_cost` × entregas.
- Chamados: régua verde ≤ 1,5%, amarelo até 2,5% (limite do iFood), vermelho acima.
- Ponte iFood do período: bruto = itens + entrega + serviço; cliente pagou = bruto − incentivos; repasse = pago + incentivo iFood − serviço − taxas. Validar `Σ TOTAL PAGO` e `Σ VALOR LÍQUIDO` com tolerância 0,5%.

### 6.4 Escala
- Necessidade por hora: `prod = max(min_prod, ceil(pizzas_h ÷ prod_target))`, `att = max(min_att, ceil(pedidos_h ÷ att_target))`, só em horas com demanda.
- Presença por turno (com intervalos): A 14–23 (0,5 nas horas 15 e 16), A2 14:30–23:30, C 15:30–00:30 (0,5 em 16 e 17), B 17–02 (0 na hora 22). Intervalo nunca entre 18h e 21h.
- Horas pagas: 6×1 = 44 + 4 extras × 1,5 = 50 h-equivalentes/semana; 5×2 = 44 h; diarista 8 h.
- Cenários: hoje, 6×1 enxuto, 5×2 fixos + diaristas, 5×2 com 6 fixos. Métricas: pessoas-dia, horas pagas, pizzas por hora paga, aproveitamento (necessárias ÷ escaladas), pior hora, semáforo por célula.
- Motoboys: necessários por hora = entregas ÷ 4; pagos por entrega.

### 6.5 Metas e bonificação (v1)
**Semana da loja** (segunda a domingo, dia operacional).
- Travas da loja: `nutrition_pct ≥ nut_gate`; checklists de Abertura, Pico e Fechamento com todos os itens feitos nos 7 dias; `gramatura_ok`; piso `revenue ≥ floor_pct × target_revenue`.
- Travas da pessoa: `F = 0` e `A + S ≤ late_tolerance`. Atestado (`T`) isolado não derruba a semana; 2 no mês derrubam a presença mensal (parâmetro).
- Prêmios por pessoa elegível:
  - presença = `prize_presence` se `weeks_in_house ≥ 4`;
  - cmv = verde `prize_cmv_green`, amarelo `prize_cmv_yellow`, vermelho 0; zera se falhar nutrição, checklist, gramatura ou piso;
  - pizzas = `prize_pizzas` se `pizzas ≥ target_pizzas`, `prize_pizzas_110` se ≥ 110%; zera no piso;
  - qualidade = `prize_quality` se `rating ≥ nota_min` e `cancel_pct ≤ cancel_max` e `prod_time_avg ≤ prod_time_ok` e chamados ≤ 2,5% (entre 1,5 e 2,5 paga metade); zera se nutrição/checklist/piso falharem;
  - excelência = `prize_excel` se `nutrition_pct ≥ nut_excel` (com checklist e piso ok);
  - sequência = `prize_streak` na 4ª semana perfeita consecutiva (ou folga extra, escolha registrada).
- Piso da loja: paga só presença.
- Fechamento: `week_settlements` com `gates`, `team_prizes`, `payouts` por pessoa e motivos; estados aberta → fechada (domingo 06h05 por cron ou manual) → aprovada (gestor) → paga.

**Líder de produção (mês)**: blocos e pesos: CMV 30% (≤ 28 → 1; ≤ 30 → 0,5), assiduidade da produção 20% (≤ 2 faltas/atestados → 1; ≤ 5 → 0,5), tempo de produção 15% (média ≤ 9 e 0 horas > 13 → 1; média ≤ 10 → 0,5), gramatura 15% (0 desvios → 1; 1 → 0,5), massa/mise en place 10% (4/4 auditorias → 1; 3 → 0,5), time elegível 10% (100% → 1; ≥ 70% → 0,5). `score = Σ peso × nota`; `prize = leader_potential × score/100 × (1 + accelerator_pct se todos ≥ 0,8)`; `commission = commission_pct × prêmio pago à produção`; travas (presença própria, contagem todos os dias, nutrição semanal nunca < gate) zeram o mês.

**Gerente (mês)**: faturamento × meta 20% (≥ 100% → 1; ≥ 90% → 0,5), CMV 20%, iFood 20% (3 de 3 na régua → 1; 2 → 0,5), assiduidade da equipe 20% (≤ 3 → 1; ≤ 7 → 0,5), rotina e auditoria 20% (checklists 100%, nutrição média ≥ 80, auditoria ≥ 80: 3 → 1; 2 → 0,5). Acelerador +20%; `manager_bonus_110` se faturamento ≥ 110%; comissão sobre o prêmio da equipe; travas: presença própria, contagem e fechamento todos os dias, nutrição nunca < gate, cancelamento nunca > 2%.

**Gamificação**: pontos por semana (regras em `gamification_rules`): CMV verde, contagem 7/7, checklists 7/7, tempo na régua, nota ≥ 4,8, excelência (dobra), auditoria; ranking mensal e trimestral por loja e por gerente; rebaixamento com 2 semanas seguidas de CMV vermelho ou chamados > 2,5%.

---

## 7. Módulos e telas (critérios de aceite)

Padrão de tela: cabeçalho com loja e período; primeiro card com o número principal; semáforo por régua; botão "Explicar" (IA); exportar xlsx e imagem; loading esqueleto; estados vazios com a instrução do que enviar.

### 7.1 Login, lojas e administração
- Login e-mail/senha; seleção de loja (se > 1); troca de papel visível.
- Admin: usuários, memberships, parâmetros (rede e loja, com vigência), réguas, turnos, ingredientes e preços, ficha técnica, modelos de checklist (itens, ordem, foto de referência, exigência de foto), regras de gamificação, feriados, logs de ingestão.
- Aceite: usuário `gerente` não vê outra loja nem edita meta (testar via RLS); alteração de parâmetro cria nova linha com `valid_from` e não altera cálculos anteriores.

### 7.2 Enviar (ingestão)
- Drop de arquivos múltiplos; detecção automática com opção manual; barra de progresso; resultado por arquivo (o que foi lido: "2.033 pedidos de 07/09 a 13/09"); histórico com filtro e reprocessar.
- Aceite: reenviar o mesmo arquivo retorna "já processado" sem duplicar; Vendas por período de teste (WLP1 14/08–12/09) resulta em 10.205 pedidos válidos e R$ 613.154 de Total; semana 07/09–13/09 parcial = 2.033 pedidos.

### 7.3 Dashboard do dia (previsão ao vivo)
- Cards: faturamento e pedidos de hoje (dos uploads do dia ou da última leitura), previsão do dia, projeção (central + faixa), % do dia feito, vs. dia médio, ritmo da última leitura; tabela "como o resto do dia entra"; "confirma na hora cheia"; mise en place 60 min; programação de massa em lotes de 30 min; motoboys por hora.
- "Registrar leitura": hora, comandas, faturamento opcional; várias leituras por dia; link compartilhável.
- Aceite: WLP1 domingo 13/09, leitura 262 às 19h36 → 582 (faixa 526–670); leitura 409 às 21h17 → 533 (505–570).

### 7.4 Placar da semana
- Seletor de semana; bloco Meta (gestor); grade pessoa × dia (P/A/F/T/O/S) importável do ponto; checklists por dia com itens, foto de referência e evidência (câmera), "marcar tudo"; indicadores da semana (automáticos com cadeado, digitados sem); apuração por pessoa com motivo; fechamento com metas batidas, elegíveis e valores; aprovação; card WhatsApp; contestação em 48 h.
- Modo TV: rota `/tv/:store` com token de leitura; tela cheia, fonte em vh; Realtime; relógio; recado do gestor.
- Aceite: com os valores da v1 e a semana simulada do book (loja verde, 1 falta, 2 atrasos) o total é R$ 930 para 10 pessoas; nutrição 65 zera CMV e qualidade; faturamento 80% paga só presença.

### 7.5 CMV diário
- Formulário de contagem por item com unidade e frações; cupom do CD; fechamento; itens vendidos; card diário; semana; raio-x ficha × real por item; lista de compra; alertas do catálogo; bloco.
- Aceite: com contagem inicial, cupom e contagem final de teste, `cmv_real_pct` bate com a planilha da skill em ±0,1 ponto; desvio por item em ±1%.

### 7.6 Vendas 360
- Mapa de calor semana × hora (pedidos, R$, pizzas), média por dia da semana com mín/máx, curva acumulada e régua de projeção, canais e tipo por hora, ticket por hora, dia a dia, semanas com ticket, conferência com fechamento, previsão 14 dias com pessoas escaladas.
- Aceite: WLP1 domingo médio 514 pedidos; 64% dos pedidos entre 18h e 21h; ticket semanal entre R$ 59 e R$ 63 nas 6 semanas de teste.

### 7.7 Demanda, produção e tempo
- Pizzas e ingredientes por hora por tipo de dia (mix × ficha); compra semanal implícita; tempo de produção por hora e dia da semana com régua; tempo × carga; horas mais lentas; tempo por status.
- Aceite: WLP1 KDS 15/08–13/09: 11.363 itens, média 8,1 min; 7 horas com ≥ 130 itens, média 10,0 min.

### 7.8 Escala
- Cadastro da equipe; necessidade por hora; cenários; grade nome × dia arrastável; horas pagas; exportar.
- Aceite: com a equipe da WLP1 e a demanda do estudo, cenário "hoje" = 556 h pagas e cenário "5×2 fixos + diaristas" = 496 h, nenhuma hora vermelha de segunda a sábado.

### 7.9 Entregadores
- Acerto do período; rankings (frequência, produtividade, faturamento entregue); escala por hora; custo por entrega.
- Aceite: acerto WLP1 14/08–13/09: 69 motoboys, 9.787 entregas, R$ 69.521, 12,0 entregas por motoboy-dia.

### 7.10 iFood 360
- Ponte bruto → pago → repasse com percentuais; regra da taxa; promoções por pedido; frete grátis; funil vs período anterior; anúncios (ROAS, custo por visita e por pedido, régua de orçamento diário); escada de preços por item; sensibilidade (volume para empatar).
- Aceite: relatório de pedidos WLP1 14/08–12/09: 8.941 concluídos, bruto R$ 628.395, repasse R$ 462.500 (73,6%); taxa efetiva 12,1% sobre a base.

### 7.11 Compras e CD · 7.12 Clientes · 7.13 Auditoria e gamificação · 7.14 IA e alertas
- Compras: kg e embalagens por insumo para a semana típica; comparação com pedido; ruptura; conciliação boleto × cupons.
- Clientes: base ativa, novos, frequência, top por valor e pedidos, bairros, cadastro (telefone, e-mail, aniversário), reativação (> 45 dias sem pedir e ≥ 3 pedidos), aniversariantes.
- Auditoria: formulário do auditor e da nutricionista com blocos, fotos e pesagens; pontos; ranking; selos.
- IA: "Explicar" por módulo com contexto (números do período + réguas) e formato WhatsApp; histórico.
- Alertas: regras → `alerts` → webhook n8n; cada alerta com texto pronto.

---

## 8. TV, Realtime e offline
- Rota `/tv/:store_id?token=` com `tv_tokens(store_id, token, expires)`; leitura via Edge (sem expor RLS de escrita); Realtime nos canais `placar:{store_id}` e `dashboard:{store_id}`; fallback de polling 30 s.
- Offline: formulários de contagem, presença e checklists gravam no IndexedDB e sincronizam com fila (retry exponencial); indicador "X itens pendentes".

## 9. Integrações
- **Anthropic (Edge `extract` e `explain`):** modelo Claude; `max_tokens` 2000; system prompt de extração com o JSON Schema; para imagens, enviar base64; retornar só JSON; validar antes de gravar. `explain`: recebe módulo + números + réguas e devolve texto ≤ 700 caracteres em PT-BR formato WhatsApp (asteriscos, emojis moderados, números antes de narrativa, ≤ 3 ações).
- **n8n / Z-API (Edge `alerts`):** `POST N8N_WEBHOOK_URL` com `{secret, store, kind, title, text, data, to: [phones]}`; kinds: `cmv_fora_regua`, `contagem_nao_enviada`, `dia_abaixo_previsao_20h`, `tempo_producao_13`, `checklist_nao_feito`, `fechamento_pendente`, `placar_semanal`, `ranking_mensal`.
- **Exportações:** xlsx (SheetJS) e imagem (html-to-image) de qualquer card.

## 10. Seed inicial
- Lojas: We Love Pizza 1 (Pontes Vieira, 14:30–02:00) e Rei da Pizza WS (Washington Soares, 14:00–00:00).
- Equipe WLP1: produção Cleilson (líder), Valdinar, Leonardo, Mauricio, Ronald; atendimento Marina, Camila, Ana Flávia, Weydna, Adriana; regime atual 6×1.
- Turnos A, A2, C, B. Parâmetros padrão (seção 4). Preços do CD set/2026 e ficha técnica v3.2 (skill CMV). Modelos de checklist (Abertura 7 itens, Pico 5, Fechamento 5) com os textos do Placar v3. Feriados 2026 (Fortaleza). Regras de gamificação iniciais.
- Amostras em `/docs/samples/` (exports reais anonimizados) para os testes de aceite.

## 11. Testes de aceite (vitest contra o branch dev)
1. Ingestão idempotente e mapeamento de colunas (seção 5).
2. Dia operacional: pedido às 01:30 de 14/09 pertence a 13/09.
3. Perfil e previsão: WLP1 Seg 218, Ter 222, Qua 238, Qui 259, Sex 397, Sáb 441, Dom 514 (±1).
4. Projeção ao vivo (7.3).
5. CMV diário com o caso da skill.
6. Apuração semanal (7.4) e regras de trava.
7. Escala (7.8). 8. Entregadores (7.9). 9. iFood (7.10).
10. RLS: gerente não lê outra loja; equipe não escreve; TV só lê.

## 12. Plano de execução
- **Sprint 0 (base):** repo, Supabase branch, migrations do schema, RLS, seed, auth, layout, tema, seletor de loja, admin mínimo. DoD: testes 2 e 10.
- **Sprint 1 (ingestão + vendas):** Enviar, parsers Saipos (vendas, itens, fechamento, tempo), views horárias, Vendas 360 básico, previsão 14 dias. DoD: testes 1, 3.
- **Sprint 2 (placar):** metas, presença, checklists com foto, indicadores, apuração, fechamento, card WhatsApp, TV com Realtime. DoD: teste 6.
- **Sprint 3 (CMV):** contagem, cupom, cálculo, cards, raio-x, lista de compra, alertas do catálogo. DoD: teste 5.
- **Sprint 4 (dia e produção):** dashboard do dia com previsão ao vivo, mise en place, massa, KDS, demanda por hora, compras. DoD: teste 4.
- **Sprint 5 (escala e entregadores):** cenários, grade, acerto, rankings, escala de motoboys. DoD: testes 7 e 8.
- **Sprint 6 (iFood 360 e IA):** ponte, funil, anúncios, escada de preços, Explicar em todos os módulos, extração por IA de PDF/imagem. DoD: teste 9.
- **Sprint 7 (gamificação, líder e gerente, alertas, clientes, offline):** apurações mensais, ranking, webhooks, PWA offline, clientes.
- **Sprint 8 (endurecimento):** performance, auditoria de acessos, exportações, documentação de operação, treinamento (guia da equipe embutido no app).

## 13. CLAUDE.md sugerido (raiz do repo)
```
# Painel do Gestor · instruções para o agente
- Leia /docs/BUILD_BOOK.md antes de qualquer tarefa; ele é a fonte única de regras, schema e aceite.
- Nunca invente coluna, parâmetro ou regra. Se faltar, pergunte.
- Toda fórmula de negócio vem da seção 6 do book; toda tela, da seção 7; todo teste, da seção 11.
- Dia operacional: 06h às 05h59. Use sempre ops_date.
- Cálculo no Postgres (views/functions) ou nas Edge Functions; a UI não recalcula regra de negócio.
- Parâmetros e réguas têm vigência; grave params_version em cada apuração.
- Ingestão é idempotente por sha256 e por chave natural.
- PT-BR em toda string visível; datas dd/mm/aaaa; moeda R$ com vírgula.
- Tema: fundo #0c0c0c, superfícies #141414, texto #f3eee8, laranja #FF4B1F, dourado #F5C451; Barlow Condensed + Barlow; semáforo verde/amarelo/vermelho.
- Commits pequenos, mensagens em português, um sprint por branch. Rode os testes de aceite do sprint antes de abrir PR.
- Segredos só em variáveis de ambiente; ANTHROPIC_API_KEY e SERVICE_ROLE só em Edge Functions.
```
