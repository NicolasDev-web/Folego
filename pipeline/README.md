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

A etapa baixa o `CAGEDMOV` mais recente configurado, lê o arquivo nacional em fluxo e agrega admissões, desligamentos e saldo para os 184 municípios do Ceará. O arquivo nacional não é versionado por causa do volume; URL, tamanho e SHA-256 ficam no manifesto, enquanto o agregado municipal reproduzível é preservado. A competência de setembro de 2026 é conferida contra o saldo estadual e os cinco destaques municipais publicados pelo Governo Federal.

Para reutilizar um arquivo já baixado:

```bash
python pipeline/extract/municipal_employment.py --archive /caminho/CAGEDMOV202609.7z
```

O valor mensal usa o `CAGEDMOV` da própria competência. Ajustes declarados em publicações posteriores ainda não integram esse retrato e são identificados explicitamente na interface e no manifesto.

