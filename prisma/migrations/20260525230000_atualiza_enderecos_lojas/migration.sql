-- Atualiza endereços, bairros e cidades das lojas pela tabela enviada pelo RH.
-- Match por regex case-insensitive sobre o nome (aceita "Pizza Pizza 1", "PIZZA PIZZA 01", etc).
-- É seguro re-rodar: só atualiza linhas que casam pelo nome.

-- ==== Pizza Pizza ====
UPDATE "Loja" SET "endereco" = 'Av. Desembargador Gonzaga, 1376', "bairro" = 'Cidade dos Funcionários', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?1$';

UPDATE "Loja" SET "endereco" = 'Av. Santos Dumont, 5500', "bairro" = 'Cocó', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?2$';

UPDATE "Loja" SET "endereco" = 'Av. Heráclito Graça, 1100', "bairro" = 'Aldeota', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?3$';

UPDATE "Loja" SET "endereco" = 'Av. Washington Soares, 727', "bairro" = 'Guararapes', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?4$';

UPDATE "Loja" SET "endereco" = 'Av. Eusébio de Queiroz, 1171', "bairro" = 'Eusébio', "cidade" = 'Eusébio'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?5$';

UPDATE "Loja" SET "endereco" = 'Av. Dep. Castelo de Castro, 848', "bairro" = 'Jangurussu', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?6$';

UPDATE "Loja" SET "endereco" = 'Av. Jovita Feitosa, 1081', "bairro" = 'Parquelândia', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?7$';

UPDATE "Loja" SET "endereco" = 'Av. Godofredo Maciel, 392', "bairro" = 'Parangaba', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?8$';

UPDATE "Loja" SET "endereco" = 'Av. Godofredo Maciel, 5792', "bairro" = 'Mondubim', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*0?9$';

UPDATE "Loja" SET "endereco" = 'Av. Antônio Alves de Lacerda, 146', "bairro" = 'Maracanaú', "cidade" = 'Maracanaú'
  WHERE "nome" ~* '^pizza\s*pizza\s*10$';

UPDATE "Loja" SET "endereco" = 'R. Virgílio Coelho, 472', "bairro" = 'Aquiraz', "cidade" = 'Aquiraz'
  WHERE "nome" ~* '^pizza\s*pizza\s*11$';

UPDATE "Loja" SET "endereco" = 'R. Antônio Guedes Pessôa, 143', "bairro" = 'Caucaia', "cidade" = 'Caucaia'
  WHERE "nome" ~* '^pizza\s*pizza\s*12$';

UPDATE "Loja" SET "endereco" = 'Av. Pres. Castelo Branco, 3976', "bairro" = 'Horizonte', "cidade" = 'Horizonte'
  WHERE "nome" ~* '^pizza\s*pizza\s*14$';

-- PP15 sem endereço definido ainda; só bairro/cidade.
UPDATE "Loja" SET "bairro" = 'Henrique Jorge', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^pizza\s*pizza\s*15$';

-- ==== We Love Pizza ====
UPDATE "Loja" SET "endereco" = 'Av. Pontes Vieira, 734', "bairro" = 'Fátima', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^we\s*love\s*pizza\s*0?1$';

UPDATE "Loja" SET "endereco" = 'Av. Dr. Silas Munguba, 3530', "bairro" = 'Itaperi', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^we\s*love\s*pizza\s*0?2$';

UPDATE "Loja" SET "endereco" = 'Av. Frei Cirilo, 4160', "bairro" = 'Messejana', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^we\s*love\s*pizza\s*0?3$';

UPDATE "Loja" SET "endereco" = 'Av. Sgto. Hermínio Sampaio, 9', "bairro" = 'São Gerardo', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^we\s*love\s*pizza\s*0?4$';

UPDATE "Loja" SET "endereco" = 'Av. Min. Albuquerque Lima, 393', "bairro" = 'Conjunto Ceará', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^we\s*love\s*pizza\s*0?5$';

-- ==== Royal Pizza ====
UPDATE "Loja" SET "endereco" = 'Av. Edilson Brasil Soares, 1174', "bairro" = 'Sapiranga', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^royal\s*pizza\s*0?1$';

UPDATE "Loja" SET "endereco" = 'Av. Farias Brito, 160', "bairro" = 'Varjota', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^royal\s*pizza\s*0?2$';

UPDATE "Loja" SET "endereco" = 'R. Santo Agostinho, 1660', "bairro" = 'Bom Jardim', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^royal\s*pizza\s*0?3$';

-- ==== REI (Messejana, Av. Washington Soares, 8800) ====
-- O nome no banco pode variar — tenta padrões comuns (Rei, Reizinho, "Pizza Rei").
UPDATE "Loja" SET "endereco" = 'Av. Washington Soares, 8800', "bairro" = 'Messejana', "cidade" = 'Fortaleza'
  WHERE "nome" ~* '^rei(zinho)?(\s+pizza)?$' OR "nome" ~* 'pizza\s+rei';
