-- Limpa todo o histórico operacional de diárias para recomeçar com usuários reais.
-- Mantém: Diaristas, Lojas, Gestores, Membros, Usuários, BancoLoja, Bloqueios, Bonificações, Mensagens, ValoresFunção.
-- Apaga: Escalas (diárias confirmadas), Requisições (vagas), Convocações, Inscrições, Avaliações (diarista↔loja).
TRUNCATE TABLE
  "Avaliacao",
  "AvaliacaoLoja",
  "Convocacao",
  "Inscricao",
  "Requisicao",
  "Escala"
RESTART IDENTITY CASCADE;
