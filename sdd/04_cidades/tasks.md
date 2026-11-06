# Explorador municipal — microtarefas

## 04-01 — Carregar geometrias e códigos oficiais

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Cobertura da lista IBGE conferida; geometria sem correspondência gera alerta.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `metadata/municipal_geometry_manifest.json`, 184 geometrias e correspondência integral de geocódigos. Status: concluída em 06/11/2026.


## 04-02 — Implementar mapa e legenda acessível

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Escala e ausência distintas; seleção sincronizada com lista/tabela.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-01.
Evidência: `app/src/components/MunicipalityMap.tsx`, testes de projeção e capturas em `evidencias/qa/`. Mapa contextual sem escala de dívida; lista oferece a alternativa por teclado. Status: concluída em 06/11/2026.


## 04-03 — Construir ficha municipal

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Competência e fonte em cada bloco; contexto regional separado da observação municipal.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-02.
Evidência: `app/src/components/CoveragePanel.tsx`, população municipal observada em 2022 e dívida municipal explicitamente indisponível. Nenhum valor regional é atribuído à cidade. Status: concluída em 06/11/2026.


## 04-04 — Construir comparação de até três cidades

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Indicador/período/universo compatíveis; filtro impossível explicado.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 04-03.
Evidência: a preencher pelo executor. Status inicial: não iniciada.


## 04-05 — Implementar ranking apenas para medidas elegíveis

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Ordenação trata empate/null; número de municípios excluídos visível.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 04-04.
Evidência: a preencher pelo executor. Status inicial: não iniciada.


## 04-06 — Testar piloto e expandir cobertura

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Oito cidades do piloto, todas as disponíveis e estados de ausência testados por teclado/toque.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 04-05.
Evidência: a preencher pelo executor. Status inicial: não iniciada.
