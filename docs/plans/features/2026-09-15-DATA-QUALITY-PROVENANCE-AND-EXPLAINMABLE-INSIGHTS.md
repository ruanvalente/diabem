# Sprint 11 — Data Quality, Provenance & Explainable Insights

## Objetivo

Criar uma camada de **qualidade, rastreabilidade, proveniência e explicabilidade dos dados** antes da introdução de qualquer funcionalidade baseada em Inteligência Artificial.

A aplicação já possui:

* registros de glicemia;
* refeições;
* atividades;
* observações;
* dashboard;
* timeline;
* filtros;
* gráficos;
* analytics engine;
* rule engine;
* insights;
* IndexedDB;
* Data Ownership;
* importação/exportação;
* Progressive Web APIs;
* câmera;
* reconhecimento de voz;
* notificações;
* camada de segurança.

O objetivo desta sprint é garantir que esses dados possam ser considerados **consistentes, rastreáveis e interpretáveis** antes de serem utilizados por qualquer futuro sistema de IA.

---

# 1. Princípio central

A aplicação deve conseguir responder:

```text
What?
→ O que aconteceu?

When?
→ Quando aconteceu?

Where?
→ De onde veio o dado?

How?
→ Como foi registrado/processado?

Why?
→ Por que esse insight foi gerado?

Confidence?
→ Quão confiável é essa informação?
```

Isso será fundamental para qualquer futura integração com:

* modelos locais;
* APIs de IA;
* MCP;
* agentes;
* recomendações;
* sumarização;
* geração de relatórios.

---

# 2. Data Provenance

Adicionar metadados de origem aos registros.

Exemplo:

```ts
interface DataProvenance {
  source:
    | "manual"
    | "import"
    | "device"
    | "camera"
    | "speech"
    | "system"

  sourceId?: string
  importedAt?: string
  recordedAt: string
}
```

A aplicação deve diferenciar:

```text
Manual
Importado
Dispositivo
Voz
Câmera
Sistema
```

Não modificar os dados originais apenas para adicionar essa informação.

A proveniência deve ser tratada como metadata.

---

# 3. Data Lineage

Criar uma forma de rastrear a transformação:

```text
Raw Data
   ↓
Validation
   ↓
Normalization
   ↓
Deduplication
   ↓
Repository
   ↓
Analytics
   ↓
Insight
```

Por exemplo:

```text
Glucose Record
      ↓
Validated
      ↓
Normalized
      ↓
Stored
      ↓
Analytics Rule #12
      ↓
Insight
```

O sistema deve conseguir identificar quais registros contribuíram para determinado insight.

---

# 4. Quality Score

Criar uma camada de avaliação de qualidade dos dados.

Não deve representar "verdade médica".

Deve representar apenas **qualidade técnica do dado**.

Exemplo:

```text
Data Quality

High
Medium
Low
Unknown
```

Fatores possíveis:

* origem conhecida;
* timestamp válido;
* unidade conhecida;
* valor dentro de domínio esperado;
* campos obrigatórios preenchidos;
* dado duplicado;
* dado importado;
* dado incompleto;
* transformação aplicada;
* inconsistências.

---

# 5. Data Validation

Centralizar regras de validação.

Exemplo:

```text
Glucose
 ├── value
 ├── unit
 ├── timestamp
 └── context

Meal
 ├── timestamp
 ├── description
 └── optional nutritional data

Activity
 ├── timestamp
 ├── type
 └── duration
```

Separar:

```text
Validation
Normalization
Business Rules
Analytics
```

Não misturar essas responsabilidades.

---

# 6. Data Quality Engine

Criar um serviço:

```text
DataQualityEngine
```

Responsável por analisar registros.

Exemplo:

```ts
interface DataQualityResult {
  score: number
  level: "high" | "medium" | "low" | "unknown"
  issues: DataQualityIssue[]
}
```

Exemplo de resultado:

```text
Registro
09/09/2026 09:30

Quality: Medium

Problemas:
- origem desconhecida
- observação vazia
```

A qualidade não deve impedir automaticamente o armazenamento.

---

# 7. Data Anomalies

Criar detecção de inconsistências **técnicas**, não diagnóstico médico.

Exemplos:

```text
timestamp futuro
timestamp muito antigo
duplicação
unidade incompatível
valor ausente
sequência impossível de importar
registro corrompido
```

Importante:

Não transformar esta feature em um sistema de diagnóstico.

O objetivo é:

> detectar inconsistências nos dados, não diagnosticar condições de saúde.

---

# 8. Explainable Rule Engine

O Rule Engine existente deve começar a fornecer explicações estruturadas.

Em vez de retornar apenas:

```ts
{
  type: "trend"
}
```

retornar algo como:

```ts
{
  ruleId: "glucose-trend-01",
  title: "Trend detected",
  explanation: "...",
  evidence: [...],
  generatedAt: "...",
  version: "1.2.0"
}
```

---

# 9. Evidence

Cada insight deve possuir evidências.

Exemplo:

```text
Insight

"Tendência identificada"

Evidências:

• 5 registros considerados
• período: últimos 7 dias
• regra: glucose-trend-01
• dados completos: 4/5
```

O usuário deve conseguir consultar os registros que deram origem ao insight.

---

# 10. Explainability UI

Criar uma interação como:

```text
Insight
──────────────

Tendência identificada

[Por que estou vendo isso?]
```

Ao abrir:

```text
Como este insight foi gerado?

Período analisado:
01/09 → 08/09

Registros utilizados:
5

Regra:
glucose-trend-01

Dados excluídos:
2 registros duplicados

[Ver dados utilizados]
```

Isso cria uma base muito importante para futuras respostas de IA.

---

# 11. Insight Versioning

Versionar as regras utilizadas.

Exemplo:

```text
ruleId:
glucose-trend

ruleVersion:
1.3.0
```

Se a regra mudar no futuro:

```text
1.3.0
↓
1.4.0
```

insights antigos não devem perder sua explicação original.

---

# 12. Analytics Snapshot

Considerar a criação de snapshots dos dados utilizados pelos analytics.

Exemplo:

```ts
interface AnalyticsSnapshot {
  generatedAt: string
  period: {
    from: string
    to: string
  }
  recordCount: number
  sourceIds: string[]
  engineVersion: string
}
```

Isso permite saber exatamente qual contexto foi utilizado.

---

# 13. Separar Raw Data de Derived Data

Essa distinção deve ser explícita.

```text
RAW DATA
────────────
Glucose
Meal
Activity
Note
Image
Device Record


DERIVED DATA
────────────
Statistics
Trends
Aggregations
Scores
Insights
Analytics
```

Derived data deve poder ser:

```text
recalculado
invalidado
atualizado
removido
```

sem destruir os dados originais.

---

# 14. Recalculation

Criar mecanismos para recalcular:

```text
Analytics
Insights
Quality Scores
Aggregations
```

quando:

* dados forem importados;
* dados forem excluídos;
* regras forem atualizadas;
* registros forem corrigidos.

Evitar armazenar resultados derivados como se fossem dados primários.

---

# 15. Audit Trail local

Criar um histórico técnico mínimo de operações importantes.

Exemplo:

```text
Data imported
Record created
Record updated
Record deleted
Analytics recalculated
Insight generated
```

Não armazenar conteúdo sensível desnecessariamente.

Exemplo:

```ts
{
  action: "record.created",
  entity: "glucose",
  entityId: "...",
  timestamp: "..."
}
```

Evitar:

```ts
{
  glucose: 180,
  note: "..."
}
```

no audit log, se não for necessário.

---

# 16. Correção de dados

Adicionar capacidade de corrigir registros mantendo sua origem.

Exemplo:

```text
Registro original
       ↓
Correção
       ↓
Registro atualizado
```

Preservar metadata suficiente para entender que o dado foi alterado.

Evitar criar uma solução de versionamento excessivamente complexa.

---

# 17. Data Confidence vs Medical Confidence

É importante estabelecer uma regra arquitetural:

```text
Data Quality ≠ Medical Accuracy
```

A aplicação pode afirmar:

> "Este registro possui timestamp válido e origem conhecida."

Mas não deve afirmar:

> "Este registro está clinicamente correto."

Essa separação deve existir também na documentação e futura camada de IA.

---

# 18. Privacy

A nova camada não deve aumentar desnecessariamente a exposição de dados.

Garantir:

* nenhum envio automático;
* nenhum analytics externo;
* nenhum conteúdo sensível em logs;
* nenhum conteúdo sensível em audit trail;
* metadata mínima;
* possibilidade de exclusão;
* respeito ao Data Ownership.

---

# 19. Performance

A análise de qualidade não deve bloquear a interface.

Para datasets maiores:

```text
IndexedDB
    ↓
Web Worker
    ↓
Data Quality Engine
    ↓
Result
    ↓
UI
```

Evitar recalcular todo o dataset após cada pequena alteração.

Utilizar:

* incremental processing;
* memoization;
* cache;
* snapshots;
* processamento assíncrono.

---

# 20. Accessibility

A explicabilidade deve ser acessível.

Garantir:

* accordion acessível;
* foco correto;
* keyboard navigation;
* leitores de tela;
* mensagens de status;
* contraste;
* não depender exclusivamente de gráficos;
* dados importantes disponíveis em texto.

Exemplo:

```text
Quality: Medium
```

não depender apenas de uma cor.

---

# 21. Testing

Criar testes para:

### Data Quality

* dado válido;
* dado incompleto;
* dado duplicado;
* timestamp inválido;
* origem desconhecida;
* dados importados;
* dados corrigidos.

### Provenance

* manual;
* import;
* device;
* speech;
* camera.

### Analytics

* regra correta;
* versão da regra;
* evidências;
* source IDs;
* snapshot.

### Explainability

* insight;
* evidências;
* registros utilizados;
* registros excluídos;
* explicação.

### Recalculation

* importação;
* alteração;
* deleção;
* mudança de versão da regra.

---

# 22. E2E

Testar:

```text
Create Record
    ↓
Analytics
    ↓
Insight
    ↓
Why?
    ↓
Evidence
    ↓
View Records
```

Também:

```text
Import
    ↓
Quality Analysis
    ↓
Preview
    ↓
Confirm
    ↓
Analytics Recalculation
    ↓
Updated Insight
```

---

# 23. Documentation

Criar:

```text
docs/
├── data/
│   ├── DATA-PROVENANCE.md
│   ├── DATA-QUALITY.md
│   └── DATA-LINEAGE.md
│
└── analytics/
    └── EXPLAINABLE-INSIGHTS.md
```

Documentar:

* diferença entre raw e derived data;
* provenance;
* quality;
* evidence;
* rule versioning;
* recalculation;
* limitações.

---

# 24. Preparação para IA

A sprint deve criar uma interface que futuramente possa ser consumida por uma camada de IA.

Por exemplo:

```ts
interface DataContextService {
  getContext(options: ContextOptions): Promise<DataContext>
}
```

Resultado conceitual:

```ts
interface DataContext {
  period: DateRange
  records: NormalizedRecord[]
  statistics: Statistics
  insights: Insight[]
  quality: DataQualitySummary
  provenance: ProvenanceSummary
}
```

A IA futuramente consumiria:

```text
DataContextService
```

e não:

```text
IndexedDB
```

diretamente.

---

# 25. AI Boundary

Estabelecer explicitamente a fronteira:

```text
┌──────────────────────────────┐
│         APPLICATION          │
│                              │
│ Raw Data                     │
│ Data Quality                 │
│ Provenance                   │
│ Analytics                    │
│ Rule Engine                  │
│ Explainable Insights         │
└───────────────┬──────────────┘
                │
          DataContextService
                │
┌───────────────▼──────────────┐
│       FUTURE AI LAYER        │
│                              │
│ Local AI                     │
│ External AI                  │
│ MCP                          │
│ Agents                       │
└──────────────────────────────┘
```

A IA não deve acessar diretamente:

```text
IndexedDB
Crypto keys
Authentication data
Browser APIs
Device APIs
```

---

# 26. Definition of Done

* [x] Data Provenance implementada;
* [x] Data Quality Engine implementado;
* [x] validação centralizada;
* [x] detecção de inconsistências;
* [x] raw/derived data claramente separados;
* [x] lineage implementado;
* [x] insights possuem evidências;
* [x] Rule Engine possui versionamento;
* [x] analytics possuem snapshots;
* [x] recalculation implementado;
* [x] audit trail mínimo implementado;
* [x] privacy revisada;
* [x] performance validada;
* [x] acessibilidade validada;
* [x] testes unitários;
* [x] testes de integração;
* [x] testes E2E;
* [x] documentação criada;
* [x] `DataContextService` definido;
* [x] boundary para futura IA documentada.

---

# Resultado esperado

Ao final da sprint, a aplicação deverá conseguir transformar:

```text
Raw Data
```

em:

```text
Validated Data
      ↓
Normalized Data
      ↓
Trusted Context
      ↓
Analytics
      ↓
Explainable Insights
```

sem depender de Inteligência Artificial.

O principal objetivo é criar uma base onde, no futuro, uma IA não precise "adivinhar" o contexto dos dados.

Ela receberá um contexto estruturado, validado, rastreável e explicável.

> **Antes de ensinar a aplicação a pensar, devemos garantir que ela sabe quais dados possui, de onde vieram e como foram utilizados.**
