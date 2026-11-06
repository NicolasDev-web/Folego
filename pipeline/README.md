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

