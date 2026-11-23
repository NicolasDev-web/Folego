import { monthLabel } from "../lib/populationDebt";
import population from "../../public/data/population_debt.json";
import { Link } from "react-router-dom";
import { SourceNote } from "../components/SourceNote";
import { useInvestigationData } from "../data/useInvestigationData";
import { observationsToCsv } from "../lib/investigationAnalysis";


const readingTips = [
  { title: "Quem foi contado?", text: "Um contrato é um empréstimo ou financiamento. Uma pessoa pode ter vários contratos, e uma família pode ter várias pessoas." },
  { title: "De onde vem o dado?", text: "Confira o local e a data. Uma pesquisa feita em Fortaleza descreve os entrevistados na capital." },
  { title: "O que significa sem dado?", text: "A fonte não informou um valor para aquele lugar ou período. Zero significa que houve uma medição e o resultado foi zero." },
];

const indicatorCatalog = [
  {
    id: "population_pof_passivo",
    name: "Quanto as famílias gastavam com empréstimos e prestações de imóvel",
    formula: "O IPECE divide a despesa média mensal com esses pagamentos (R$ 119,28) pela despesa média mensal total (R$ 2.830,34). A participação arredondada é de 4,2%.",
    unit: "% das despesas totais, monetárias e não monetárias. Valores em reais da época.",
    scale: "Todas as famílias do Ceará representadas pela pesquisa, inclusive as que não fizeram esses pagamentos.",
    source: "IBGE · POF, resultados para o Ceará publicados pelo IPECE no Informe 162",
    period: "2017–2018",
  },
  {
    id: "population_pof_atraso",
    name: "Quando uma conta de casa precisou esperar",
    formula: "Na tabela 4.1.4 da Síntese de Indicadores Sociais de 2021, a linha Ceará mostra que 42,35% dos moradores viviam em famílias que atrasaram água, luz ou gás por dificuldade financeira. Para aluguel ou prestação da casa, foram 6,73%.",
    unit: "% de moradores, coluna Total. A família podia relatar mais de um tipo de atraso.",
    scale: "Ceará inteiro. A pergunta cobre os 12 meses anteriores à entrevista.",
    source: "IBGE · Pesquisa de Orçamentos Familiares",
    period: "2017–2018",
  },
  {
    id: "population_datasenado_atraso",
    name: "Pessoas que relataram dívida atrasada havia mais de 90 dias",
    formula: "O DataSenado estima em 33% as respostas afirmativas no Ceará. A tabela 38 informa margem de erro de 5,4 pontos percentuais para esse resultado.",
    unit: "% de moradores com 16 anos ou mais.",
    scale: "Ceará inteiro. É a resposta de cada pessoa sobre as próprias dívidas.",
    source: "Instituto DataSenado · Panorama Político",
    period: "Junho de 2024",
  },
  {
    id: "population_serasa_adultos_negativados",
    name: "Adultos com nome negativado no Ceará",
    formula: "Percentual da população adulta com registro de negativação, publicado pela Serasa. A ilustração por 100 adultos usa o inteiro mais próximo.",
    unit: "% da população adulta, segundo a Serasa. Pessoas negativadas, não famílias.",
    scale: "Ceará e Brasil; negativação na base Serasa. Não mede todas as dívidas em dia ou em outros cadastros.",
    source: "Serasa · Mapa da Inadimplência e Negociação de Dívidas",
    period: monthLabel(population.registry.period),
  },
  {
    id: "population_ipdc_orcamento",
    name: "Dívidas no cotidiano em Fortaleza",
    formula: "Leitura direta dos percentuais de consumidores com dívidas, contas em atraso e dificuldade de quitação, da média de renda comprometida e das menções a gastos e instrumentos de crédito. Respostas podem se sobrepor; não devem ser somadas.",
    unit: "% divulgados pelo IPDC. O exemplo de R$ 1.000 aplica a proporção média divulgada ao orçamento ilustrativo.",
    scale: "Fortaleza; consumidores pesquisados e renda familiar. Não é uma estimativa estadual.",
    source: population.survey.source_label,
    period: monthLabel(population.survey.period),
  },
  {
    id: "population_scr_renda_ocupacao",
    name: "Atraso por renda e tipo de trabalho, no mesmo grupo",
    formula: "Filtrar CE e PF no arquivo mensal do SCR, agrupar conjuntamente por porte e cnae_ocupacao e dividir a soma de carteira_inadimplencia pela soma de carteira_ativa, multiplicando por 100. As combinações somam o total estadual.",
    unit: "Reais em contratos com atraso acima de 90 dias a cada R$ 100 de crédito. Inclui parcelas futuras dos contratos.",
    scale: "Ceará; renda individual do tomador e categorias amplas de ocupação. Sem contagem de famílias ou associação com CPFs do Caged.",
    source: "Banco Central · SCR.data · versão identificada em population_debt.json",
    period: monthLabel(population.credit.period),
  },
  {
    id: "carteira_pf",
    name: "Quanto falta pagar em crédito",
    formula: "Soma do saldo a pagar nos contratos de crédito de pessoas físicas.",
    unit: "Reais da época ou ajustados pela inflação até setembro de 2026",
    scale: "Ceará, Nordeste e Brasil",
    source: "BCB · SCR.data",
    period: "Agosto de 2019 a setembro de 2026",
  },
  {
    id: "inad90_carteira",
    name: "Parte do crédito em contratos com atraso",
    formula: "Saldo dos contratos com pelo menos uma parcela atrasada há mais de 90 dias, dividido pelo saldo de todos os contratos e multiplicado por 100.",
    unit: "Reais a cada R$ 100 de saldo a pagar",
    scale: "Ceará, Nordeste e Brasil, por tipo de crédito, renda e trabalho",
    source: "BCB · SCR.data",
    period: "2019-08 a 2026-09",
  },
  {
    id: "saldo_operacao",
    name: "Quanto falta pagar por contrato, em média",
    formula: "Soma do saldo dos grupos com contagem publicada, dividida pelo número de contratos nesses mesmos grupos.",
    unit: "Reais por contrato",
    scale: "Ceará, Nordeste e Brasil",
    source: "BCB · SCR.data",
    period: "2019-08 a 2026-09",
  },
  {
    id: "vencido15_sub",
    name: "Parte do crédito vencida há mais de 15 dias, por região do CEP",
    formula: "Valor das parcelas vencidas há mais de 15 dias, dividido pelo saldo total de crédito da região e multiplicado por 100.",
    unit: "% do saldo de crédito",
    scale: "Grupos definidos pelos dois primeiros dígitos do CEP",
    source: "BCB · Olinda scr_sub_regiao",
    period: "2019-08 a 2026-08",
  },
  {
    id: "comprometimento_br",
    name: "Parte da renda usada para pagar dívidas",
    formula: "O Banco Central compara as despesas com juros e pagamento do principal à renda disponível das famílias.",
    unit: "% da renda disponível",
    scale: "Brasil",
    source: "BCB · SGS 29034",
    period: "2019-01 a 2026-08",
  },
  {
    id: "familias_endividadas",
    name: "Famílias com dívidas ou contas em atraso",
    formula: "A pesquisa estima a parcela de famílias com dívidas e, separadamente, a parcela com contas em atraso.",
    unit: "% das famílias pesquisadas",
    scale: "Brasil",
    source: "CNC · PEIC",
    period: "2025-08 a 2026-10",
  },
  {
    id: "consumidores_endividados_ipdc",
    name: "Consumidores com dívidas ou contas em atraso",
    formula: "A pesquisa estima a parcela de consumidores com dívidas e, separadamente, a parcela com contas em atraso.",
    unit: "% dos consumidores pesquisados",
    scale: "Fortaleza",
    source: "Fecomércio-CE · IPDC",
    period: "2025-04 a 2026-10",
  },
  {
    id: "populacao_censo",
    name: "Quantas pessoas moram na cidade",
    formula: "Total de moradores do município contado pelo Censo.",
    unit: "Habitantes",
    scale: "184 municípios do Ceará",
    source: "IBGE · Censo Demográfico 2022 (SIDRA 4714)",
    period: "2022",
  },
  {
    id: "renda_domiciliar_pc_mediana",
    name: "Renda mensal por pessoa",
    formula: "Some a renda de quem mora na casa e divida pelo número de moradores. A mediana é o valor que fica no meio quando se ordenam as rendas por pessoa.",
    unit: "Reais por mês em valores de 2022",
    scale: "184 municípios do Ceará",
    source: "IBGE · Censo Demográfico 2022 (SIDRA 10295)",
    period: "2022",
  },
  {
    id: "taxa_desocupacao_pnad",
    name: "Pessoas sem trabalho e procurando emprego",
    formula: "Pessoas sem trabalho que procuravam emprego e estavam disponíveis para começar, divididas pela soma de quem trabalha e quem procura trabalho.",
    unit: "% das pessoas de 14 anos ou mais na força de trabalho",
    scale: "Ceará, Nordeste, Brasil e Fortaleza",
    source: "IBGE · PNAD Contínua (SIDRA 4099)",
    period: "2019 a 2026, por trimestre",
  },
  {
    id: "rendimento_habitual_real_pnad",
    name: "Quanto se ganha com trabalho, em média",
    formula: "Média do rendimento que as pessoas ocupadas costumam receber pelo trabalho, com ajuste pela inflação feito pelo IBGE.",
    unit: "Reais por mês",
    scale: "Ceará, Nordeste, Brasil e Fortaleza",
    source: "IBGE · PNAD Contínua (SIDRA 6472)",
    period: "2019 a 2026, por trimestre",
  },
  {
    id: "saldo_emprego_formal",
    name: "Postos de trabalho ganhos ou perdidos e salário inicial",
    formula: "O saldo é o número de contratações menos o de desligamentos. A média usa salários mensais de 0,3 a 150 salários mínimos e exclui contratos de trabalho intermitente.",
    unit: "Postos com carteira assinada e reais por mês",
    scale: "184 municípios do Ceará, Ceará, Nordeste e Brasil",
    source: "MTE · Novo Caged",
    period: "2020-01 a 2026-08 (série ajustada) e 2026-09 (detalhe municipal)",
  },
];

export function MethodPage() {
  const investigationState = useInvestigationData();

  function downloadAllValidatedCsv() {
    if (investigationState.status !== "ready") return;
    const allObs = [
      ...investigationState.macro.observations,
      ...investigationState.profiles.observations,
      ...investigationState.labor.observations,
    ];
    const csv = observationsToCsv(allObs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "folego_dados.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main id="conteudo" className="method-page">
      <header className="page-intro method-intro">
        <h1>Como ler os números do Fôlego?</h1>
        <p>
          Veja o que cada número quer dizer, como foi calculado e onde encontrar a fonte.
        </p>
      </header>

      <section className="method-grid" aria-label="Perguntas para entender os dados">
        {readingTips.map((tip) => (
          <article key={tip.title}>
            <h2>{tip.title}</h2>
            <p>{tip.text}</p>
          </article>
        ))}
      </section>

      <section className="method-catalog-section" aria-labelledby="catalog-heading">
        <div className="section-header-block">
          <div>
            <h2 id="catalog-heading">O que cada número mede?</h2>
            <p className="section-lead">
              Abra um item para ver o cálculo, o local, o período e a fonte.
            </p>
          </div>
          {investigationState.status === "ready" ? (
            <button
              type="button"
              className="button button-dark"
              onClick={downloadAllValidatedCsv}
            >
              Baixar dados em CSV
            </button>
          ) : null}
        </div>

        <div className="method-indicators">
          {indicatorCatalog.map((item) => (
            <details key={item.id}>
              <summary>{item.name}</summary>
              <p>{item.formula}</p>
              <dl>
                <div><dt>Como aparece</dt><dd>{item.unit}</dd></div>
                <div><dt>Onde</dt><dd>{item.scale}</dd></div>
                <div><dt>Quando</dt><dd>{item.period}</dd></div>
                <div><dt>Fonte</dt><dd>{item.source}</dd></div>
              </dl>
              <small>No arquivo de dados: <code>{item.id}</code></small>
            </details>
          ))}
        </div>
      </section>

      <section className="method-breaks-section" aria-label="Mudanças e correções nos dados">
        <SourceNote
          sourceLabel="O Banco Central mudou uma regra em janeiro de 2025"
          sourceUrl="https://dadosabertos.bcb.gov.br/dataset/scr_data"
          period="A partir de janeiro de 2025"
          territoryScope="Ceará, Nordeste e Brasil"
          universe="Crédito com sinais de dificuldade de pagamento"
          formula="Resolução CMN 4.966 · Característica Especial 19"
          limitNote="O Banco Central mudou o critério de classificação do crédito com risco de não ser pago. O gráfico separa os dois períodos."
        />
        <SourceNote
          sourceLabel="De onde vêm os dados de Fortaleza em novembro de 2025?"
          sourceUrl="https://www.fecomercio-ce.com.br/wp-content/uploads/2026/01/01_2026_Fortaleza_Perfil-de-Endividamento-do-Consumidor.pdf#page=4"
          period="Novembro de 2025"
          territoryScope="Fortaleza"
          universe="Consumidores pesquisados em Fortaleza"
          formula="Leitura direta da tabela histórica do relatório de janeiro de 2026, página 4"
          limitNote="A Fecomércio registrou 72,2% de consumidores endividados e 20,5% com contas em atraso. Os demais campos dependem do que a fonte informa."
        />
      </section>

      <section className="method-detail">
        <div>
          <h2>Como conferimos os dados?</h2>
          <p>
            Registramos a versão da fonte, conferimos os cálculos e indicamos onde faltam dados. Os arquivos e as regras de conferência estão disponíveis para consulta.
          </p>
        </div>
        <aside>
          <p>Documentação e arquivos de dados</p>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/01_contexto/METODOLOGIA_DIDATICA.md">
            Metodologia didática
          </a>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/02_fontes/RELATORIO_QUALIDADE_DADOS.md">
            Relatório de qualidade e reconciliação
          </a>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/04_tecnico/CONTRATO_DADOS.json">
            Contrato de dados (JSON Schema)
          </a>
          <a href="/data/state_macro_series.json" download>
            Baixar state_macro_series.json
          </a>
          <a href="/data/credit_profiles.json" download>
            Baixar credit_profiles.json
          </a>
          <a href="/data/labor_and_surveys.json" download>
            Baixar labor_and_surveys.json
          </a>
          <a href="/data/population_debt.json" download>
            Baixar dados de impacto no orçamento, renda e trabalho
          </a>
        </aside>
      </section>

      <Link className="button button-dark" to="/cidades">
        Explorar os dados da minha cidade
      </Link>
    </main>
  );
}
