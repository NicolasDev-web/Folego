# Arquitetura proposta

Frontend: React + TypeScript + Vite. Mapas em Leaflet com GeoJSON simplificado; gráficos SVG/D3 quando a narrativa pedir desenho específico. Estado de filtros em um store pequeno; URL apenas com filtros públicos. Preferir HTML semântico e dados pré-agregados. Proposta para o novo projeto, não descrição do stack do repositório original.

Pipeline: Python + pandas/pyarrow e validação de schemas; armazenamento intermediário Parquet; JSONs pequenos por seção/território na entrega web. Sem necessidade de LLM, login ou API de IA no MVP. Hospedagem estática Vercel é uma possibilidade; publicação é fase posterior.

## Estrutura de implementação futura

- app/src/components: botões, busca, ficha, legenda, gráficos e notas.
- app/src/features: panorama, cidades, evolução, perfis e fontes.
- app/public/data: agregados e catálogo de cobertura versionados.
- pipeline/extract, transform, validate: um adaptador por fonte.
- data/raw: downloads brutos fora do bundle web; data/processed: saídas reprodutíveis.
- metadata: fontes, regras, licenças e manifestos de coleta.
- tests: cálculos essenciais, contratos, geografia e jornadas principais.

## Grão e modelagem

Não unir tudo numa tabela larga por município+mês. Manter fatos separados: crédito UF/mês/modalidade/perfil; sub-região/mês; pesquisa/edição/território/grupo; município/ano/indicador de contexto; reclamações/município/período. Dimensões comuns: território, tempo, fonte e métrica.

O contrato de observação em `CONTRATO_DADOS.json` é uma proposta de formato de saída. Validar em implementação. Chave inclui fonte, versão, métrica, território, competência, universo e dimensões. Para taxa, guardar numerador e denominador quando disponíveis; ausência não vira 0.

## Transformação e qualidade

Guardar raw imutável com hash; parser por versão; campos geográficos como string; dinheiro em unidade documentada e sem arredondamento prematuro; separar categorias de total/subtotal. Campos de entrada são whitelisted. Scripts devem falhar com mensagem útil quando schema ou unidade mudar.

Para geometrias, fixar edição IBGE, SIRGAS 2000 na origem e conversão explícita quando necessária para web; simplificação preserva topologia e IDs. Geometrias de município e sub-região ficam em camadas separadas.

Dados da aplicação devem ser pré-processados; não baixar o arquivo anual completo do SCR no navegador. Carregar mapas e bibliotecas por demanda. Publicar somente agregados pertinentes, sem dados pessoais ou textos identificáveis de reclamações.

## Reprodutibilidade

Cada atualização gera manifesto, relatório de qualidade, revisão de comparabilidade e versão de dados. Pipeline manual primeiro. Automatização futura somente após estabilizar fonte e parser; não há tarefa agendada criada nesta entrega.
