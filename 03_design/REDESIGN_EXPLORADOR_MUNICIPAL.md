# Redesign do explorador municipal

Decisão aplicada em 06/11/2026 após crítica especializada e pesquisa de referências.

## Problema observado

A versão anterior dava o mesmo peso para busca, mapa e ficha. A lista permanente de 184 municípios empurrava a informação principal para baixo, sobretudo no celular. O nome da cidade e os limites metodológicos apareciam repetidos em vários cartões, enquanto o mapa ocupava uma área secundária.

## Referências estudadas

- [Our World in Data — redesign das visualizações](https://ourworldindata.org/redesigning-our-interactive-data-visualizations): controles específicos à visualização, fonte próxima ao gráfico e exploração em tela ampla.
- [Data Commons — Place Explorer](https://datacommons.org/place/): busca territorial como entrada e perfil do lugar como resultado.
- [Data Commons — Map Explorer](https://www.datacommons.org/explore/): mapa como ferramenta principal da exploração geográfica.
- [Data USA — Geography Profile](https://datausa.io/profile/geo/united-states): fatos essenciais antes do detalhamento e contexto metodológico associado ao indicador.
- [Mapbox — interação por feição](https://docs.mapbox.com/mapbox-gl-js/example/simple-interactions/): seleção territorial destacada e propriedades apresentadas em uma ficha.
- [Mapbox — mapa claro](https://www.mapbox.com/maps/light): base cartográfica neutra para preservar o protagonismo da informação sobreposta.

As referências foram usadas como padrões de hierarquia e interação, não como linguagem visual a copiar.

## Direção escolhida

Mapa dominante com ficha lateral enxuta:

```text
┌───────────────────────────────────────────────────────────┐
│ Buscar município                         184 disponíveis  │
├────────────────────────────────────┬──────────────────────┤
│                                    │ Sobral               │
│                                    │ 203.023 habitantes   │
│          MAPA DO CEARÁ             │ Censo 2022 · IBGE    │
│                                    │                      │
│        município destacado         │ Dívida municipal     │
│                                    │ Não disponível       │
│ legenda e fonte                    │ Fontes e limites     │
└────────────────────────────────────┴──────────────────────┘
```

No celular, a ordem passa a ser busca, resumo municipal, mapa e fonte. A busca funciona como combobox com até oito sugestões, evitando renderizar a lista completa no fluxo da página.

## Decisões de conteúdo

- Remover o badge “Cobertura mista”, o grande travessão de ausência e as notas metodológicas duplicadas.
- Manter população, período e fonte juntos.
- Tratar indisponibilidade em uma linha neutra, sem usar a cor da seleção territorial.
- Recolher metadados extensos em “Fontes e limites”.
- Usar terracota somente para o município selecionado.
- Usar `#174440` como campo cartográfico principal, com limites claros e contraste tonal.
- Exibir o nome selecionado dentro do mapa e preservar a posição da página durante a troca de município.
- Preservar equivalente textual, busca por teclado e atualização anunciada da ficha.

