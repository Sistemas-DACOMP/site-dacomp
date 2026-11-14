-- Novo papel: aluno (cadastro público, sem acesso aos painéis internos).
-- Migração separada: o valor do enum precisa ser confirmado antes de ser
-- usado em funções/políticas na migração seguinte.
alter type public.app_role add value if not exists 'aluno';
