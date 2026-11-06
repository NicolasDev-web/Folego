# QA da base do frontend

Data: 06/11/2026. Escopo: base navegável, população oficial e explorador cartográfico municipal.

## Resultado

- `npm test`: 2 arquivos e 4 testes aprovados. O adaptador preserva `null` para ausência, rejeita valor numérico marcado como indisponível e a projeção cartográfica fecha os polígonos nos limites compartilhados.
- `npm run build`: TypeScript e build de produção concluídos com Vite 8.3.6.
- Auditoria de dependências após instalação: 0 vulnerabilidades reportadas pelo npm.
- Navegação confirmada nas rotas `/`, `/cidades` e `/metodo`, todas com `h1` semântico.
- Busca por “Crato” via teclado atualiza a ficha e a URL para `?cidade=crato`.
- As 184 geometrias são renderizadas; clicar em Fortaleza no mapa sincroniza mapa, ficha e URL.
- A seleção atualiza a etiqueta com o nome dentro do mapa e preserva a posição vertical da página.
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
- Comparação entre cidades, renda, emprego formal e séries de crédito ainda não foram implementados.
- Os estados de carregamento e erro existem, mas a simulação de falha de rede permanece para a fase de validação.
- A inspeção de acessibilidade cobriu semântica, nomes acessíveis, foco visível, alvos principais e movimento reduzido; leitor de tela e ordem completa de tabulação permanecem para a fase de validação.

