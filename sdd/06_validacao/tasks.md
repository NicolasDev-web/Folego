# Validação estatística, UX e acessibilidade — microtarefas

## 06-01 — Reconciliar métricas e amostras com fontes

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Ponderação, estoques, operações e versões revisados em checklist assinado pelo executor.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `02_fontes/RELATORIO_QUALIDADE_DADOS.md`, `evidencias/VALIDACAO_ESTATISTICA_E_ACESSIBILIDADE.md` e `pipeline/tests/test_phase02.py`. Status: concluída em 09/11/2026.


## 06-02 — Auditar cobertura e ausência

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Dados suprimidos/null preservados; filtros e rankings não inventam precisão.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 06-01.
Evidência: `evidencias/VALIDACAO_ESTATISTICA_E_ACESSIBILIDADE.md`, `app/src/lib/municipalComparisonAndRanking.test.ts` e `app/src/lib/investigationAnalysis.test.ts`. Status: concluída em 09/11/2026.


## 06-03 — Executar jornadas e testes de acessibilidade

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Busca, comparação e fonte por teclado; teste de zoom, contraste e leitura de gráficos.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 06-02.
Evidência: `app/scripts/capture-qa.mjs` e `evidencias/VALIDACAO_ESTATISTICA_E_ACESSIBILIDADE.md`. Status: concluída em 09/11/2026.


## 06-04 — Revisar usabilidade com participantes

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Achados reais e correções priorizadas, sem alegar representatividade estatística.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 06-03.
Evidência: protocolo pronto em `03_design/ROTEIRO_TESTE_USABILIDADE.md`; aguardando sessões com participantes humanos reais (não simuladas por regra inegociável). Status: pendente de sessões humanas reais.


## 06-05 — Fazer QA visual e conteúdo

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Telas 390/768/1440, títulos, legendas e datas; imagens de QA internas.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 06-04.
Evidência: `evidencias/QA_FRONTEND.md` e 22 capturas verificadas em `evidencias/qa/`. Status: concluída em 09/11/2026.


## 06-06 — Corrigir defeitos e registrar riscos restantes

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Problemas críticos fechados; pendências menores registradas com impacto.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 06-05.
Evidência: `evidencias/VALIDACAO_ESTATISTICA_E_ACESSIBILIDADE.md`. Status: concluída em 09/11/2026.
