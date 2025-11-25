# Prompts prontos para Lovable - Reestruturação e Importadores

## Reestruturar Admin (colar no chat do Lovable)
Reestruture o painel ADMIN:
1) Criar Sidebar com itens: Dashboard, Users, Produtos Globais, Importações, Lojas, Pedidos, Entregadores, Suporte, Logs.
2) Dashboard: mostrar KPIs (pedidosHoje, entregadoresOnline, produtosToReview, importErrors).
3) Migrar telas existentes em src/pages/admin para novos módulos com rotas limpas.
4) Criar tela Produtos Globais que mostre produtos_base com filtros (categoria, brand, to_review) e botões: Editar, Excluir, Marcar Revisado.
5) Criar tela Importações com upload CSV; após upload executar pipeline (OpenFoodFacts) descrito.
6) Permissões: todas as telas acima visíveis apenas para usuário com nível ADMIN.
7) Gerar logs detalhados de importação e botão 'baixar CSV de relatório'.

## Importador CSV -> Open Food Facts
(Use o prompt de integração já criado previamente no chat e cole aqui como ação automatizada no Lovable).

