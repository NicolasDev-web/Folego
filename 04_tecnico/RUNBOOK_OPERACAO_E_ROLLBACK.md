# Runbook de Operação, Atualização de Dados e Rollback — Fase 07

Data: 09/11/2026. Destino de produção: **https://folego-vert.vercel.app** (`nicolas-santos-projects2/folego`) e repositório GitHub **https://github.com/NicolasDev-web/Folego**.

---

## 1. Arquitetura de Publicação

- **Pipeline de Dados (`pipeline/`):** Python 3.11+ com `duckdb`, `pyarrow`, `openpyxl`, `xlrd`, `pypdf` e `jsonschema`. Extrai dados oficiais das APIs e repositórios abertos do BCB, IBGE, MTE, CNC e Fecomércio-CE, gera tabelas fato em Parquet (`data/processed/*.parquet`), valida cada observação contra `04_tecnico/CONTRATO_DADOS.json` e exporta pacotes JSON estáticos para `app/public/data/`.
- **Aplicação Web (`app/`):** React 19 + TypeScript 7 + Vite 8. Consome exclusivamente os pacotes JSON pré-agregados e auditados em `app/public/data/`, sem chaves privadas, sem banco em tempo de execução e sem coleta de dados pessoais.

---

## 2. Procedimento de Atualização Mensal / Trimestral

1. **Executar a coleta e validação do pipeline:**
   ```powershell
   python -m pipeline.run_phase02
   python -m pytest pipeline/tests/test_phase02.py -v
   ```

   A coleta também pode ser iniciada em **GitHub Actions → Preparar atualização oficial dos dados → Run workflow**. O fluxo executa as mesmas validações, cria uma branch exclusiva e entrega um link para abrir a revisão; não publica diretamente em produção.
2. **Executar os testes unitários e o build da aplicação:**
   ```powershell
   Set-Location app
   npm test -- --run
   npm run build
   ```
3. **Executar a suíte de QA visual e acessibilidade (Playwright):**
   ```powershell
   npm run qa:screenshots
   ```
4. **Publicar no GitHub e na Vercel:**
   ```powershell
   git add -A
   git commit -m "data: update official competence packages"
   git push origin main
   Set-Location app
   vercel --prod --yes
   ```

Em cada pull request e envio para `main`, `.github/workflows/ci.yml` executa automaticamente os testes do pipeline, os testes do frontend e o build. A aprovação da proposta de dados continua sendo humana porque algumas fontes divulgam novas competências por URLs e planilhas específicas.

Toda segunda-feira, `.github/workflows/source-freshness.yml` consulta os catálogos oficiais do IBGE, MTE e BCB e guarda um relatório de disponibilidade. Esse fluxo é somente de leitura: ele sinaliza competências novas, mas não altera dados públicos, não cria publicação e não dispara deploy.

---

## 3. Procedimento de Rollback Imediato

Caso uma nova divulgação oficial apresente corrupção de schema ou regressão visual após o deploy:

1. **Rollback instantâneo na Vercel (sem novo build):**
   ```powershell
   vercel rollback https://folego-vert.vercel.app --yes
   ```
   Ou promover um deployment anterior específico listado em `vercel ls folego`:
   ```powershell
   vercel promote <deployment-url> --yes
   ```
2. **Reversão dos pacotes de dados no Git:**
   - Os hashes SHA-256 de todas as coletas anteriores estão preservados em `metadata/phase02_manifest.json`, `metadata/scr_data_monthly_hashes.json`, `metadata/municipal_income_manifest.json` e `metadata/municipal_employment_manifest.json`.
   - Para restaurar o estado anterior no repositório:
     ```powershell
     git revert HEAD
     git push origin main
     ```
