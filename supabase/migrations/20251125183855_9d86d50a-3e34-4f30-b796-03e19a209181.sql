-- Corrigir produtos com caracteres corrompidos por encoding incorreto
-- Mapeamento de caracteres corrompidos mais comuns (Latin-1 lido como UTF-8)

UPDATE produtos 
SET nome = 
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
    nome,
    'ã', 'ã'),
    'á', 'á'),
    'à', 'à'),
    'â', 'â'),
    'é', 'é'),
    'ê', 'ê'),
    'í', 'í'),
    'ó', 'ó'),
    'ô', 'ô'),
    'õ', 'õ'),
    'ú', 'ú'),
    'ç', 'ç'),
    'Ã', 'Ã'),
    'Ó', 'Ó'),
    'Ç', 'Ç')
WHERE nome LIKE '%â%' 
   OR nome LIKE '%ã%' 
   OR nome LIKE '%á%'
   OR nome LIKE '%é%'
   OR nome LIKE '%í%'
   OR nome LIKE '%ó%'
   OR nome LIKE '%ú%'
   OR nome LIKE '%ç%';