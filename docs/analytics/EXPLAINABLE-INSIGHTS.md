# Explainable Insights

Como o DiaBem explica **por que** um insight foi gerado, de forma acessível e
rastreável.

---

## 1. Princípio

Nenhum insight deve aparecer ao usuário sem responder:

> Por que estou vendo isso? Que dados foram usados? Qual regra foi aplicada?

---

## 2. Estrutura de um insight

```ts
interface Insight {
  id: string;
  type: InsightType;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  explanation: string;          // por que foi gerado
  evidence: PatternEvidence[];  // métricas e valores usados
  ruleId: string;               // regra (ex.: trend-detected)
  ruleVersion: string;          // versão (ex.: 1.0.0)
  sourceIds: string[];          // registros considerados
  generatedAt: string;          // data de geração
}
```

---

## 3. UI — "Por que estou vendo isso?"

Cada insight exibe o botão **"Por que estou vendo isso?"**

Ao abrir (diálogo acessível), o usuário vê:

- **Explicação** — por que o padrão foi identificado;
- **Base dos dados** — evidências (métrica, valor, comparação);
- **Como este insight foi gerado**:
  - Regra aplicada (`ruleId vruleVersion`);
  - Registros considerados (quantidade);
  - Período analisado;
  - Gerado em;
- Aviso de que o padrão **não é um diagnóstico médico**.

Arquivos:

- `components/features/dashboard/ui/insight-details.ui.tsx`
- `components/features/dashboard/ui/insights-card.ui.tsx`

### Acessibilidade (plan §20)

- `Dialog` acessível (foco, `aria`s, teclado) e conteúdo textual completo;
- O nível de qualidade é sempre apresentado como **texto**, nunca cor sozinha;
- `QualityIndicator` informa nível (`Alta/Média/Baixa/Desconhecida`), score
  percentual e quantidade de inconsistências técnicas.

Arquivo: `components/features/dashboard/ui/quality-indicator.ui.tsx`

---

## 4. Regras que geram insights

Todas as regras em `lib/intelligence/rules/` produzem `title`, `explanation` e
`sourceIds`:

| ruleId                   | descrição                                     |
| ---                      | ---                                           |
| `trend-detected`         | tendência nas medições                        |
| `time-concentration`     | concentração por horário                      |
| `average-change`         | variação da média entre períodos              |
| `increased-variability`  | aumento da variabilidade                      |
| `meal-glucose-relation`  | relação refeição × glicemia                   |
| `activity-glucose-relation` | relação atividade × glicemia               |
| `insufficient-data`      | dados insuficientes para concluir             |

O `RuleContext` carrega `records: { glucose, meals, activities }` para
permitir a derivação dos `sourceIds` por período.

---

## 5. Versionamento e não-regressão

- A versão da regra fica gravada no insight: se a regra evoluir de `1.0.0` para
  `1.1.0`, insights antigos **mantêm** sua explicação original (plan §11).
- `INTELLIGENCE_ENGINE_VERSION` versiona o motor que produz snapshots.

---

## 6. Recálculo

Dados derivados (analytics, insights, scores) **nunca** são persistidos como
dados primários — são recalculados a partir do raw data sempre que necessário
(importação, correção, exclusão, mudança de regra). Isso mantém a explicação
sempre coerente com o estado atual dos dados (plan §14).

---

## 7. Limitações

- A explicação descreve a **regra técnica aplicada**, não o comportamento
  clínico da pessoa.
- A qualidade informada é técnica (`Data Quality ≠ Medical Accuracy`).
- Registros excluídos ou duplicados podem deixar de aparecer em um insight
  recalculado; o insight não armazena o conteúdo dos registros — apenas os IDs
  (`sourceIds`) do contexto usado na geração.