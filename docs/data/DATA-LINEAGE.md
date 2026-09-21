# Data Lineage

Como o DiaBem rastreia **quais registros contribuíram** para cada análise e
**como** eles foram transformados.

---

## 1. Principle

O sistema deve responder, para qualquer insight:

> Quais registros deram origem a este insight? Qual período foi analisado?
> Qual versão de regra foi aplicada?

Nenhum resultado derivado deve existir sem rastreabilidade.

---

## 2. Cadeia de transformação

```text
Raw Data (IndexedDB)
   ↓  validation / normalization
Repository
   ↓
Analytics (analytics-engine)
   ↓
Rule Engine (regras com evidências)
   ↓
Insight (explicável)
   ↓
UI / relatórios
```

---

## 3. Separação Raw vs Derived

| RAW DATA        | DERIVED DATA                    |
| ---             | ---                             |
| Glucose         | Statistics                      |
| Meal            | Trends                          |
| Activity        | Aggregations                    |
| Note            | Scores (`DataQuality`)          |
| Image           | Insights / Patterns             |
| Device Record   | Analytics (snapshots)          |

Regra: dados derivados podem ser **recalculados, invalidados, atualizados ou
removidos** sem afetar os dados primários. Dados primários nunca são
destruídos para recalcular algo.

---

## 4. Rastreabilidade no Insight

Cada `Insight` carrega a origem completa do seu contexto:

```ts
interface Insight {
  ...
  ruleId: string;          // qual regra gerou
  ruleVersion: string;     // versão da regra
  explanation: string;     // por quê
  sourceIds: string[];     // quais registros
  generatedAt: string;     // quando
  evidence: PatternEvidence[];
}
```

### Evidências

Cada evidência registra a métrica, o valor e o **período** analisado:

```ts
interface PatternEvidence {
  metric: string;
  value: number;
  comparison?: number;
  period?: { start: string; end: string };
  sourceIds?: string[];
}
```

---

## 5. Regras e versionamento

- `ruleId` identifica a regra (`trend-detected`, `oscilation`, ...).
- `ruleVersion` (semver, ex.: `1.0.0`) garante que um insight antigo mantenha
  sua explicação original mesmo se a regra evoluir no futuro (plan §11).
- `lib/intelligence/rules/rule-helpers.ts` filtra por período os `sourceIds`
  de cada entidade dentro do contexto informado.

Arquivos:

- `lib/intelligence/types/rule.types.ts`
- `lib/intelligence/rules/*.ts`
- `lib/intelligence/insights/insight-generator.ts`

---

## 6. Analytics Snapshot

Cada execução produz um snapshot descritivo do contexto analisado:

```ts
interface AnalyticsSnapshot {
  generatedAt: string;
  period: { start: string; end: string };
  recordCount: number;
  sourceIds: string[];
  engineVersion: string; // INTELLIGENCE_ENGINE_VERSION = "1.0.0"
}
```

`IntelligenceResult` inclui `snapshot`, permitindo reproduzir exatamente qual
conjunto de dados originou um resultado.

Arquivos:

- `lib/intelligence/types/analytics.types.ts`
- `lib/intelligence/worker/intelligence.worker.ts`
- `lib/intelligence/intelligence.service.ts`

---

## 7. DataContextService

Para consumo futuro por IA (plan §24 e §25), a **única** porta de entrada é o
`DataContextService`:

```ts
interface DataContextService {
  getContext(options: DataContextOptions): Promise<DataContextResult>;
}
```

O serviço valida o período e o `userId`, carrega **apenas** os tipos de dados
solicitados (cada repositório com `findByUser(userId, { from, to })`), re-aplica
o filtro de propriedade (*defense-in-depth*) e remove campos internos antes de
montar o contexto.

```ts
interface DataContext {
  contextVersion: number;      // DATA_CONTEXT_VERSION = 1
  generatedAt: string;
  period: DataContextPeriod;   // { start, end }
  records: {
    glucose: NormalizedGlucoseRecord[];
    meals: NormalizedMealRecord[];
    activities: NormalizedActivityRecord[];
    medications: NormalizedMedicationRecord[];
    notes: NormalizedNoteRecord[];      // excluído por padrão (texto livre)
  };
  statistics?: IntelligenceAnalytics;
  insights?: Insight[];
  quality?: DataQuality;
  provenance?: DataContextProvenanceSummary;
}
```

As seções derivadas (`statistics`, `insights`, `quality`, `provenance`) são
opcionais e controladas por `include`. `statistics`/`quality` reutilizam a
pipeline de inteligência existente (`analyzeIntelligence`) — nunca são
recalculadas em paralelo.

A IA futura consome `DataContextService`, **nunca** IndexedDB, Crypto keys,
autenticação ou APIs de dispositivo diretamente.

Garantias de arquitetura: `docs/architecture/DATA-CONTEXT-ARCHITECTURE.md`.
Análise determinística sobre o contexto: `docs/intelligence/LOCAL-INTELLIGENCE.md`.

Arquivos:

- `lib/intelligence/data-context/data-context.service.ts`
- `lib/intelligence/data-context/data-context.types.ts`
- `lib/intelligence/data-context/context-*.ts`