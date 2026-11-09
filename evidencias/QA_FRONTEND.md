# QA da base do frontend

Data: 09/11/2026. Escopo: base navegável, população, renda e emprego formal oficiais e explorador cartográfico municipal.

## Resultado

- `npm test`: 2 arquivos e 5 testes aprovados. O adaptador preserva `null` para ausência, rejeita valor numérico marcado como indisponível e a projeção cartográfica fecha os polígonos e compartilha a mesma transformação com os centroides.
- `npm run build`: TypeScript e build de produção concluídos com Vite 8.3.6.
- Auditoria de dependências após instalação: 0 vulnerabilidades reportadas pelo npm.
- Navegação confirmada nas rotas `/`, `/cidades` e `/metodo`, todas com `h1` semântico.
- Busca por “Crato” via teclado atualiza a ficha e a URL para `?cidade=crato`.
- As 184 geometrias são renderizadas; clicar em Fortaleza no mapa sincroniza mapa, ficha e URL.
- A seleção atualiza a etiqueta com o nome dentro do mapa e preserva a posição vertical da página.
- População, renda domiciliar per capita média e renda mediana cobrem exatamente os 184 códigos municipais, sem valores ausentes.
- Os arquivos brutos da renda conferem com os hashes SHA-256 registrados no manifesto de coleta.
- O emprego formal cobre os 184 municípios; admissões menos desligamentos fecha em 5.156 postos no Ceará em setembro de 2026.
- O saldo estadual e os saldos de Fortaleza, Morada Nova, Sobral, Caucaia e Tianguá coincidem com a divulgação oficial usada como conferência independente.
- “Ver quais empregos” abre uma leitura focada com ocupações, setores, recuos e salário médio das admissões; a ficha e o mapa permanecem intactos ao fechar.
- Em Sobral, a primeira ocupação exibida é “Trabalhador polivalente da confecção de calçados”, com saldo de +374; o valor confere com o agregado por CBO.
- O mapa abre no modo territorial; o zoom Sobral enquadra os 23 municípios da região sem deformar a malha.
- Emprego renderiza 178 círculos para saldos não nulos; renda mantém 184 polígonos em cinco faixas; população renderiza 184 círculos proporcionais sem sobreposição.
- A troca entre território, emprego, renda e população preserva Sobral na ficha, na URL e na etiqueta do mapa.
- A nova composição usa busca compacta, mapa dominante e uma única ficha lateral; no celular a ficha antecede o mapa.
- Mudança de rota reinicia a rolagem no topo. Links internos continuam levando às seções da página inicial.
- Nenhum erro ou aviso foi registrado no console durante a rodada no navegador.

## Larguras verificadas

| Largura | Página inicial | Cidades | Método | Overflow horizontal |
|---:|---|---|---|---|
| 390 px | Aprovada | Aprovada | Aprovada | Não |
| 768 px | Aprovada | Aprovada | Aprovada | Não |
| 1440 px | Aprovada | Aprovada | Aprovada | Não |

Screenshots reproduzíveis com `npm run qa:screenshots`:

- `evidencias/qa/home-390.png`
- `evidencias/qa/home-768.png`
- `evidencias/qa/home-1440.png`
- `evidencias/qa/cidades-sobral-390.png`
- `evidencias/qa/cidades-sobral-1440.png`
- `evidencias/qa/cidades-sobral-empregos-390.png`
- `evidencias/qa/cidades-sobral-empregos-1440.png`
- `evidencias/qa/cidades-mapa-zoom-sobral-1440.png`
- `evidencias/qa/cidades-mapa-emprego-1440.png`
- `evidencias/qa/cidades-mapa-renda-1440.png`
- `evidencias/qa/cidades-mapa-populacao-1440.png`

## Contraste dos pares principais

| Primeiro plano | Fundo | Razão |
|---|---|---:|
| `#F8F5ED` | `#103E3B` | 10,86:1 |
| `#142D2C` | `#F4F1E8` | 12,90:1 |
| `#4C6260` | `#F4F1E8` | 5,77:1 |
| `#FFFFFF` | `#125C57` | 7,79:1 |
| `#FFFFFF` | `#B94D32` | 5,04:1 |

Os pares verificados atendem 4,5:1 para texto normal. A checagem não substitui uma auditoria completa de todos os estados e combinações futuras.

## Limites desta rodada

- Não houve teste com participantes; a tarefa 01-05 permanece aberta.
- Comparação entre cidades e séries de crédito ainda não foram implementadas. A renda é um retrato nominal do Censo 2022; o emprego é a competência 09/2026 sem ajustes declarados posteriormente.
- Os estados de carregamento e erro existem, mas a simulação de falha de rede permanece para a fase de validação.
- A inspeção de acessibilidade cobriu semântica, nomes acessíveis, foco visível, alvos principais e movimento reduzido; leitor de tela e ordem completa de tabulação permanecem para a fase de validação.

