import { useState } from "react";
import population from "../../public/data/population_debt.json";
import { balanceShare, occupationComparison } from "../lib/populationDebt";
import { SourceNote } from "./SourceNote";

const percent = (value: number) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
const compactMoney = (value: number) => value >= 1e9
  ? `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`
  : `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;

function ResponseList({ rows }: { rows: { label: string; pct: number }[] }) {
  return <ul className="population-response-list">{rows.map((row) => <li key={row.label}>
    <div><span>{row.label}</span><strong>{percent(row.pct)}</strong></div>
    <div className="population-response-track" aria-hidden="true"><span style={{ width: `${row.pct}%` }} /></div>
  </li>)}</ul>;
}

export function PopulationDebtSection() {
  const [view, setView] = useState<"people" | "credit">("people");
  const [income, setIncome] = useState("Mais de 1 a 2 salários mínimos");
  const [showAll, setShowAll] = useState(false);
  const { registry, survey, credit } = population;
  const rows = occupationComparison(credit.cross, income, showAll);
  const otherShare = balanceShare(credit.cross, "Outros");
  const examplePayment = survey.income_commitment_pct * 10;

  return <section className="content-section population-section" id="resumo-ceara" aria-labelledby="population-title">
    <header className="population-heading">
      <p className="section-marker">Por trás dos números, o orçamento de uma casa</p>
      <h2 id="population-title">Como a dívida pesa na vida das pessoas?</h2>
      <p>Ter uma compra parcelada e não conseguir pagar uma conta são situações diferentes. Veja onde a dificuldade aparece e o que está por trás das dívidas.</p>
    </header>
    <aside className="population-state-answer" aria-label="Pessoas negativadas no Ceará">
      <p className="population-scope">Ceará · Outubro de 2026 · Cadastro da Serasa</p>
      <div className="population-state-answer-grid">
        <p className="population-state-count"><strong>{Math.round(registry.state_adults_negative_pct)}</strong><span>em cada 100 adultos,<br />aproximadamente</span></p>
        <div><h3>Mais da metade dos adultos estava com o nome negativado.</h3><p>A Serasa registrou {registry.state_adults_negative_pct.toLocaleString("pt-BR")}% da população adulta do Ceará com dívidas negativadas. No Brasil, foram {registry.br_adults_negative_pct.toLocaleString("pt-BR")}%.</p><p>É um sinal de dificuldade para pagar que podemos observar no estado. Esse cadastro não conta famílias e não inclui todas as dívidas pagas em dia.</p></div>
      </div>
      <details><summary>De onde vem esse retrato do Ceará?</summary><p>Mapa da Serasa de outubro de 2026, páginas 6 e 7. O número 53 é o arredondamento de 52,79%. A base mede pessoas negativadas; não somamos esse percentual aos dados da pesquisa de Fortaleza ou do crédito bancário.</p><a href={registry.document_url} target="_blank" rel="noreferrer">Consultar relatório da Serasa</a></details>
    </aside>
    <p className="population-view-intro">Para entender quem enfrenta dificuldade e o que pesa no orçamento, veja duas leituras complementares:</p>
    <div className="population-view-switch" role="group" aria-label="Escolher visão sobre as dívidas">
      <button type="button" aria-pressed={view === "people"} onClick={() => setView("people")}>
        <strong>O dia a dia em Fortaleza</strong><span>Pessoas, gastos e orçamento</span>
      </button>
      <button type="button" aria-pressed={view === "credit"} onClick={() => setView("credit")}>
        <strong>Renda e trabalho no Ceará</strong><span>Crédito por grupo de tomadores</span>
      </button>
    </div>

    {view === "people" ? <div className="population-panel" id="population-people">
      <p className="population-scope">Fortaleza · Outubro de 2026 · Pesquisa com consumidores</p>
      <div className="population-key-numbers">
        <article><h3>Têm dívidas</h3><strong>{percent(survey.debt_pct)}</strong><p>Inclui quem está pagando em dia.</p></article>
        <article><h3>Têm contas em atraso</h3><strong>{percent(survey.late_pct)}</strong><p>Informaram dívidas ou contas que passaram do vencimento.</p></article>
        <article><h3>Preveem não conseguir pagar</h3><strong>{percent(survey.unable_to_pay_pct)}</strong><p>É a dificuldade de quitação informada na pesquisa.</p></article>
      </div>
      <p className="population-reading-note">São três medidas da pesquisa, com situações que podem se sobrepor. Não some os percentuais. Estes resultados descrevem a capital.</p>

      <div className="population-budget">
        <div><h3>Quanto do orçamento vai para dívidas?</h3><p>O IPDC divulgou comprometimento médio de <strong>{percent(survey.income_commitment_pct)} da renda familiar</strong>.</p><p>Para visualizar: em um orçamento de R$ 1.000, essa proporção equivale a:</p></div>
        <div className="population-budget-example">
          <div className="population-budget-bar" aria-hidden="true"><span style={{ width: `${survey.income_commitment_pct}%` }} /></div>
          <div className="population-budget-labels"><span><strong>{money(examplePayment)}</strong> para dívidas</span><span><strong>{money(1000 - examplePayment)}</strong> para demais despesas</span></div>
          <small>Exemplo ilustrativo da proporção média. Cada família tem um orçamento diferente.</small>
        </div>
      </div>

      <div className="population-story-grid">
        <article className="population-expenses"><h3>Quais gastos aparecem por trás da dívida?</h3><p>A alimentação a prazo é a despesa mais citada. Moradia, saúde e educação também aparecem.</p><ResponseList rows={survey.uses} /><p className="population-reading-note">Percentuais de menções publicados pelo IPDC. Uma pessoa pode citar vários gastos; não são fatias do dinheiro devido.</p></article>
        <aside className="population-attention"><h3>Quem enfrenta mais dificuldade?</h3><p>Na capital, a faixa com renda familiar de até 3 salários mínimos teve a maior proporção com contas em atraso, segundo o boletim:</p><p className="population-attention-value">{percent(survey.low_income_late_pct)} <span>nessa faixa</span></p><p>Na pesquisa como um todo, foram {percent(survey.late_pct)}.</p><p>Já ter dívidas também é comum entre rendas maiores: acima de 7 salários mínimos, {percent(survey.high_income_debt_pct)} relataram dívidas. Isso, por si só, não indica dificuldade para pagar.</p></aside>
      </div>

      <details className="population-explanation"><summary>Que dívidas são essas e por que o pagamento atrasa?</summary>
        <div className="population-story-grid">
          <div><h3>Como as compras são financiadas</h3><ResponseList rows={survey.products} /><p>O cartão é o instrumento mais citado. Usar cartão não significa estar no rotativo: uma compra pode ser paga integralmente no vencimento.</p></div>
          <div><h3>Motivos relatados para não pagar</h3><ResponseList rows={survey.nonpayment_reasons} /><p>São relatos dos entrevistados. O boletim não permite concluir que uma profissão, sozinha, cause a dificuldade.</p></div>
        </div>
        <p className="population-reading-note">As respostas de cada pergunta podem se sobrepor. O boletim não detalha a base de cada pergunta nem os erros amostrais; não convertemos esses percentuais em número de famílias.</p>
      </details>

      <SourceNote sourceLabel="Fecomércio-CE / IPDC" sourceUrl={survey.source_url} period="Outubro de 2026" territoryScope="Fortaleza" universe="Consumidores pesquisados na capital; renda familiar declarada" formula="Percentuais e média de comprometimento publicados no boletim de 22/10/2026. Exemplo de R$ 1.000: 1.000 × 41,8 / 100."
        limitNote="A pesquisa ajuda a entender o cotidiano na capital. Para dizer quantas famílias têm dívidas e quanto da renda usam para pagá-las no Ceará inteiro, ainda precisamos de uma pesquisa que represente o estado." />
    </div> : <div className="population-panel" id="population-credit">
      <p className="population-scope">Ceará · Setembro de 2026 · Crédito de pessoas físicas</p>
      <div className="population-comparison-heading"><div><h3>Na mesma faixa de renda, onde o atraso pesa mais?</h3><p>Compare a renda do tomador e o tipo de trabalho informado ao banco. A renda aqui é individual; na pesquisa de Fortaleza, é familiar.</p></div>
        <label className="population-income-filter">Renda mensal do tomador<select value={income} onChange={(event) => setIncome(event.target.value)}>{credit.incomes.map((item) => <option key={item} value={item}>{item === "Indisponível" ? "Renda não informada" : item}</option>)}</select></label>
      </div>
      <p className="population-money-definition">Leia assim: de cada <strong>R$ 100 de crédito a pagar</strong> em cada grupo, quanto estava em contratos com uma parcela atrasada há mais de 90 dias? O valor inclui as parcelas futuras desses contratos.</p>
      <div className="population-comparison-table-wrap"><table className="population-comparison-table">
        <caption>{income === "Indisponível" ? "Renda não informada" : income} · {showAll ? "todos os oito grupos" : "quatro grupos selecionados"}</caption>
        <thead><tr><th scope="col">Tipo de trabalho</th><th scope="col">Em contratos com atraso, a cada R$ 100</th><th scope="col">Crédito total do grupo</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.occupation}><th scope="row">{row.occupation}</th><td data-label="Com atraso a cada R$ 100">{row.late_pct == null ? "Não disponível" : <strong>{money(row.late_pct)}</strong>}</td><td data-label="Crédito total do grupo">{compactMoney(row.balance_brl)}</td></tr>)}</tbody>
      </table></div>
      <button type="button" className="population-show-all" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "Mostrar só os quatro grupos iniciais" : "Ver todos os tipos de trabalho"}</button>
      <div className="population-credit-takeaway" aria-live="polite"><h3>O que essa comparação permite dizer?</h3><p>{rows[0]?.late_pct != null ? <>Nesta faixa, <strong>{rows[0].occupation}</strong> tem a maior proporção de crédito em contratos com atraso entre os {showAll ? "oito" : "quatro"} grupos exibidos. O total ao lado ajuda a ver o tamanho de cada carteira.</> : "Não há taxa calculável para os grupos desta faixa."}</p><p>Isso não diz quantas pessoas estão em atraso. E controlar a renda ainda deixa diferenças de produtos, prazos e outras condições entre os grupos.</p></div>
      <p className="population-reading-note">A categoria “Outros” representa {otherShare == null ? "uma parcela sem medida disponível" : percent(otherShare)} de todo o crédito PF do Ceará. Ela reúne situações que a fonte não abre em profissões. O Novo Caged descreve empregos em outra base; não identifica os mesmos tomadores.</p>
      <details className="population-explanation"><summary>O que é esse crédito? Ver os principais tipos</summary>
        <p>São saldos a pagar a instituições financeiras. Financiamento habitacional paga a compra da moradia; consignado é descontado da folha; crédito pessoal sem consignação não tem esse desconto. Cartão para compras é separado de fatura financiada.</p>
        <ul className="population-product-list">{credit.products.slice(0, 6).map((item) => <li key={`${item.modality}-${item.submodality}`}><span>{item.submodality.trim()}</span><strong>{compactMoney(item.balance_brl)}</strong></li>)}</ul>
        <p>Os seis maiores saldos no Ceará, em todas as rendas. O SCR não informa qual compra originou cada contrato nem cobre toda dívida informal ou conta doméstica.</p>
      </details>
      <SourceNote sourceLabel="Banco Central · SCR.data" sourceUrl={credit.methodology_url} period="Setembro de 2026" territoryScope="Ceará" universe="Crédito PF por renda individual e natureza da ocupação" formula="100 × soma do saldo dos contratos com atraso acima de 90 dias ÷ soma do saldo total, dentro de cada combinação de renda e ocupação."
        limitNote="Os valores medem dinheiro, sem identificar pessoas ou famílias. As 72 combinações de renda e ocupação foram somadas diretamente na mesma versão do arquivo oficial." />
      <details className="population-explanation"><summary>Consultar versão e baixar os dados desta análise</summary><p>Arquivo {credit.file}. Esta seção usa a revisão consultada no estudo de renda e trabalho. O histórico de crédito abaixo preserva a coleta anterior; as duas versões arredondam a taxa estadual para 6,20%.</p><p className="population-file-hash">SHA-256: {credit.sha256}</p><a href="/data/population_debt.json" download>Baixar dados de renda, trabalho e pesquisa</a></details>
    </div>}
  </section>;
}
