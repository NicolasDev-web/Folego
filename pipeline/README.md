# Pipeline de dados

O pipeline começa manual e reproduzível, conforme `04_tecnico/ARQUITETURA.md`.

## Coleta da fase 00

```bash
python pipeline/extract/phase00_collect.py
```

O script usa somente a biblioteca padrão do Python, preserva as respostas brutas, calcula SHA-256, valida os 184 municípios do Ceará e produz:

- `data/raw/`: respostas imutáveis das APIs oficiais;
- `data/processed/municipal_context.json`: contexto municipal normalizado;
- `data/processed/coverage_matrix.csv`: matriz inicial do piloto territorial;
- `metadata/phase00_manifest.json`: URLs, data de coleta, hashes e contagens;
- `app/public/data/municipal_context.json`: recorte público consumido pelo frontend.

Nenhuma taxa municipal de dívida é calculada pelo script.

## Geometrias municipais

Depois da coleta inicial, gere a malha usada pelo explorador:

```bash
python pipeline/extract/municipal_geometries.py
```

O script baixa a visão de qualidade mínima da API de Malhas do IBGE, exige 184 geometrias e confere cada `codarea` contra o cadastro municipal. O snapshot bruto e seu hash são preservados; essa geometria serve para contexto visual em escala estadual, não para medições de precisão.

## Rendimento municipal do Censo 2022

```bash
python pipeline/extract/municipal_income.py
```

A etapa consulta a tabela SIDRA 10295 somente nos totais de sexo, cor ou raça e idade. Ela valida média e mediana do rendimento nominal mensal domiciliar per capita para os 184 municípios, preserva a resposta bruta e enriquece o contexto público. O universo exclui pensionistas, empregados domésticos e parentes de empregados domésticos, conforme a própria tabela.

## Emprego formal municipal

```bash
python pipeline/extract/municipal_employment.py
```

A etapa baixa o `CAGEDMOV` mais recente configurado, lê o arquivo nacional em fluxo e agrega admissões, desligamentos e saldo para os 184 municípios do Ceará. Ela também cruza ocupações com o dicionário oficial da CBO 2002 e resume setores pela seção CNAE. O salário médio nominal usa o campo `salário`, já mensalizado pelo MTE, somente nas admissões entre 0,3 e 150 salários mínimos (limites inclusivos), excluindo vínculos intermitentes (`indtrabintermitente = 1`). Em 2026 a faixa é de R$ 486,30 a R$ 243.150,00. Essa seleção afeta apenas a média salarial; os fluxos e saldos continuam contando todos os vínculos. O arquivo nacional não é versionado por causa do volume; URL, tamanho e SHA-256 ficam no manifesto, enquanto os agregados municipais e o pequeno dicionário CBO são preservados.

Antes de gravar os dados processados e públicos, setembro de 2026 é conferido contra o saldo estadual, os cinco destaques municipais e a média salarial estadual de R$ 2.081,38 publicados pelo Governo Federal. Uma divergência bloqueia a geração. Novas competências exigem configurar o salário mínimo e o valor oficial independente em `municipal_employment.py`. O manifesto registra a faixa, a metodologia, a amostra elegível e exclusões sem dupla contagem, por ordem: ausente/não positivo, abaixo do mínimo, acima do máximo e intermitente dentro da faixa. Amostras vazias permanecem `null`; amostras inferiores a cinco admissões recebem uma observação de cautela na interface, sem supressão arbitrária.

Para reutilizar um arquivo já baixado:

```bash
python pipeline/extract/municipal_employment.py --archive /caminho/CAGEDMOV202609.7z --cbo /caminho/cbo2002-ocupacao.csv
```

O valor mensal usa o `CAGEDMOV` da própria competência. Ajustes declarados em publicações posteriores ainda não integram esse retrato e são identificados explicitamente na interface e no manifesto.

Saídas específicas: `municipal_employment_2026-09.csv` contém o total municipal; `municipal_employment_occupations_2026-09.csv` preserva o fato por ocupação. O contexto público recebe somente os cinco maiores saldos ocupacionais, os três maiores recuos e os três setores com mais movimentações por município.

## Coleta e tratamento completo da Fase 02 (`02_dados`)

```bash
python pipeline/run_phase02.py
```

Por padrão, a data UTC atual identifica a coleta. Para reproduzir uma coleta com data explícita:

```bash
python -m pipeline.run_phase02 --collected-date 2026-11-10
```

Executa os adaptadores de extração (`bcb_adapter.py`, `ibge_adapter.py`, `mte_caged_adapter.py`, `surveys_adapter.py`), a normalização por versão metodológica (`normalize.py`), a separação de fatos e dimensões em Parquet (`facts.py`), o cálculo dos indicadores prioritários (`indicators.py`) e a validação e exportação pública conforme `04_tecnico/CONTRATO_DADOS.json` (`export_public.py`):

- `data/processed/dim_territory.parquet` e `dim_indicator.parquet`: dimensões canônicas sem duplicação;
- `data/processed/fact_scr_macro.parquet`, `fact_scr_profiles.parquet`, `fact_scr_subregion.parquet`, `fact_caged_adjusted.parquet`, `fact_surveys.parquet`: fatos separados por nível territorial (`BR`, `NE`, `CE`, `sub_regiao`, `capital_pesquisa`, `municipio`);
- `app/public/data/state_macro_series.json`, `credit_profiles.json` e `labor_and_surveys.json`: agregados públicos validados contra `CONTRATO_DADOS.json`;
- `metadata/phase02_manifest.json` e `metadata/scr_data_monthly_hashes.json`: manifesto completo e hashes SHA-256;
- `02_fontes/RELATORIO_QUALIDADE_DADOS.md`: relatório de reconciliação e qualidade.

Para executar a suíte de testes automatizados da Fase 02:

```bash
python -m pytest pipeline/tests -v
```

## Automação segura

- `.github/workflows/ci.yml` valida o pipeline, os contratos, os testes do site e o build em cada pull request e envio para `main`.
- `.github/workflows/data-refresh.yml` é acionado manualmente, executa a coleta completa e cria uma branch exclusiva com link para revisão. Ele não publica dados nem altera `main` ou a produção automaticamente.

O fluxo de atualização permanece manual até que todos os adaptadores de fontes com competências explícitas sejam parametrizados. Isso evita que uma mudança de URL, planilha ou metodologia entre silenciosamente em produção.

## Monitoramento de novas competências

Uma verificação semanal, somente de leitura, compara a última competência publicada com o catálogo oficial do IBGE, MTE e BCB:

```bash
python -m pipeline.audit_source_freshness
```

O resultado fica em `metadata/source_freshness.json`. O monitor não altera os pacotes públicos: uma competência nova gera apenas um alerta para revisão humana. Falhas temporárias de consulta também ficam explícitas no relatório sem apagar os resultados das demais fontes. A publicação continua dependendo da coleta completa, das reconciliações, dos testes e da aprovação da proposta de atualização.
