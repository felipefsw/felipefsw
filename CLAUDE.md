@AGENTS.md

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
