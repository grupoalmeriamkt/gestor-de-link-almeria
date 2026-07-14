-- Seed de desenvolvimento (opcional). Execute após criar um usuário admin.
-- Ajuste os UUIDs conforme necessário; aqui usamos gen_random_uuid().

insert into partners (id, name, domain, status)
values (gen_random_uuid(), 'Parceiro X', 'parceirox.com.br', 'active')
returning id;

-- Use o id retornado acima para criar campanha/posicionamento, ou crie tudo pelo painel.
