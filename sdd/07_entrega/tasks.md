# Publicação e manutenção — microtarefas

## 07-01 — Preparar build e revisão de conteúdo público

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Agregados, licenças e fontes incluídos; ausência de dados pessoais/chaves.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `app/dist/`, `app/public/data/` e `04_tecnico/RUNBOOK_OPERACAO_E_ROLLBACK.md`. Status: concluída em 09/11/2026.


## 07-02 — Medir desempenho em ambiente definido

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Registrar LCP/INP/CLS medidos e corrigir problemas materiais.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 07-01.
Evidência: `evidencias/QA_FRONTEND.md` (bundle JS gzip de 125 kB, CSS gzip de 9,6 kB, CLS = 0,00 e renderização estática sub-segundo). Status: concluída em 09/11/2026.


## 07-03 — Publicar no destino do projeto

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Somente conforme autorização e destino definidos no projeto de implementação; URL revisada.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 07-02.
Evidência: Produção publicada em `https://folego-vert.vercel.app` e repositório GitHub `https://github.com/NicolasDev-web/Folego`. Status: concluída em 09/11/2026.


## 07-04 — Verificar versão publicada

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Build, assets, links, mapa, fontes, downloads e navegação funcionam.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 07-03.
Evidência: `https://folego-vert.vercel.app`, `https://folego-vert.vercel.app/cidades` e `https://folego-vert.vercel.app/metodo` verificados via HTTP e Playwright. Status: concluída em 09/11/2026.


## 07-05 — Documentar atualização e rollback

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Manifesto, comandos, versões, falhas de fonte e restauração documentados.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 07-04.
Evidência: `04_tecnico/RUNBOOK_OPERACAO_E_ROLLBACK.md` e `metadata/phase02_manifest.json`. Status: concluída em 09/11/2026.


## 07-06 — Entregar README e histórico de release

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Limites municipais e última competência por fonte transparentes.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 07-05.
Evidência: `README.md`, `sdd/STATUS.md` e `sdd/DECISOES.md`. Status: concluída em 09/11/2026.
