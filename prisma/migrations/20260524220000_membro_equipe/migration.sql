-- Equipe interna (RH/TI) com login por senha.
CREATE TABLE IF NOT EXISTS "Membro" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "usuario" TEXT NOT NULL,
  "perfil" TEXT NOT NULL,
  "papel" TEXT,
  "senha" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membro_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Membro_usuario_key" ON "Membro"("usuario");

-- Cadastro inicial da equipe (senha definida no primeiro acesso).
INSERT INTO "Membro" (id, nome, usuario, perfil, papel) VALUES
  ('membro-aline',     'Aline Gonçalves', 'aline',     'rh', 'Coordenadora'),
  ('membro-sidnaria',  'Sidnaria',        'sidnaria',  'rh', 'Analista de RH'),
  ('membro-fran',      'Fran',            'fran',      'rh', 'Analista de RH'),
  ('membro-carol',     'Carol',           'carol',     'rh', 'Analista de RH'),
  ('membro-estagiaria','Estagiária',      'estagiaria','rh', 'Estagiária'),
  ('membro-daniel',    'Daniel Nogueira', 'daniel',    'ti', NULL),
  ('membro-marcelo',   'Marcelo',         'marcelo',   'ti', NULL),
  ('membro-jefferson', 'Jefferson',       'jefferson', 'ti', NULL)
ON CONFLICT (usuario) DO NOTHING;
