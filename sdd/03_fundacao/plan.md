# Base do frontend e componentes — plano técnico

Entrada: documentos do pacote, evidências e entregas das dependências (01; fixtures podem anteceder 02).

## Sequência

1. Criar projeto React/TS/Vite e rotas → Build limpo e navegação principal com títulos semânticos.
2. Implementar tokens e layout responsivo → Hero, navegação e SectionHeader consistentes sem overflow.
3. Construir componentes de filtro e fonte → Busca, segmentado, MetricCard e SourceNote funcionam por teclado.
4. Criar adaptador de dados/cobertura → Estados observado, indisponível e erro seguem contrato; fixtures ficam isoladas.
5. Persistir filtros públicos na URL → Refresh e link reproduzem estado; nenhum dado pessoal na URL.
6. Verificar componentes nas três larguras → Screenshots de QA e lista de correções; foco e ordem de leitura adequados.

## Verificação

Revisar cada critério da spec usando evidência concreta: tabela, log, teste, tela ou documento conforme a tarefa. Testar cálculos e jornadas materiais; não criar testes que apenas repetem rótulos ou implementação. Uma evidência de disponibilidade não certifica série histórica inteira.

## Saída e passagem de fase

Frontend navegável, componentes reutilizáveis e catálogo de estados. Atualizar STATUS.md e registrar decisões. Se fonte bloquear uma tarefa, usar o caminho alternativo definido na viabilidade e seguir o que for independente; não simular conclusão.

## Riscos e resposta

Fonte instável: preservar versão validada e expor competência. Escala incompatível: separar bloco/território. Complexidade de interface: reduzir filtros simultâneos. Falta de dados: estado de ausência e explicação. Não sacrificar UX por um volume maior de gráficos.
