-- v_orders_hourly (seção 4 do /docs/BUILD_BOOK.md): pedidos por hora do dia
-- operacional, já sem os cancelados ("cancelados ... excluídos das views",
-- seção 5.3).
--
-- A hora é a hora do RELÓGIO DA LOJA: `sold_at` é um instante em UTC e
-- `stores.tz` diz em que fuso a loja vive, então a conversão é feita aqui e
-- não depende de onde o servidor está rodando.
--
-- ATENÇÃO: o Prisma não declara views no schema.prisma. Se `prisma migrate dev`
-- um dia acusar esta view como "drift", a resposta é mantê-la.

CREATE OR REPLACE VIEW v_orders_hourly AS
SELECT
  o.store_id,
  o.ops_date,
  EXTRACT(HOUR FROM (o.sold_at AT TIME ZONE s.tz))::int AS hour,
  o.channel,
  count(*)::int                                          AS orders,
  sum(coalesce(o.total, 0))::numeric(14,2)               AS revenue,
  count(*) FILTER (WHERE o.order_type = 'D')::int        AS deliveries,
  count(*) FILTER (WHERE o.order_type = 'B')::int        AS counter
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE o.cancelled = false
GROUP BY o.store_id, o.ops_date, 3, o.channel;
