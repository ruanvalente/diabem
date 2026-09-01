# Sprint 5 — Intelligence

## Objetivo

Implementar a primeira camada de inteligência do DiaBem, transformando os dados registrados pelo usuário em **estatísticas, padrões observáveis e insights explicativos**.

A Sprint 5 deve implementar:

- Analytics Engine;
- Web Worker;
- Rule Engine;
- Insights;
- agregações estatísticas;
- detecção de padrões;
- comparação entre períodos;
- correlação temporal simples entre eventos;
- preparação para futura IA local e MCP.

A inteligência desta sprint deve ser **determinística, explicável e baseada exclusivamente nos dados existentes no dispositivo**.

Não utilizar LLM, API externa ou serviço de IA nesta sprint.

---

# 1. Princípios fundamentais

A arquitetura deve seguir:

```text
Dados do usuário
      ↓
Repositories
      ↓
Analytics Engine
      ↓
Web Worker
      ↓
Rule Engine
      ↓
Insights
      ↓
UI
```

Separar claramente:

```text
Analytics
```

de:

```text
Rules
```

e:

```text
Presentation
```

Exemplo:

```text
Analytics:
"A média dos últimos 7 dias foi 137 mg/dL."

Rule:
"Existe aumento da média no período noturno."

Insight:
"Seus registros apresentam valores médios maiores no período noturno."
```

O Analytics Engine calcula.

O Rule Engine interpreta padrões objetivos.

A camada de Insights transforma o resultado em uma mensagem compreensível.

A UI apenas apresenta.

---

# 2. Analisar a codebase antes de implementar

Antes de modificar qualquer arquivo, analisar a implementação das Sprints anteriores.

Verificar:

### Sprint 2

- IndexedDB;
- Dexie;
- repositories;
- services;
- schemas;
- autenticação;
- sessão;
- isolamento por `userId`;
- criptografia, caso implementada.

### Sprint 3

- GlucoseReading;
- Meal;
- Activity;
- Note;
- repositories;
- services;
- hooks.

### Sprint 4

- Dashboard;
- Timeline;
- filtros;
- gráficos;
- transformação de dados;
- componentes visuais;
- estados de loading/error/empty.

Também verificar:

- dependências;
- testes;
- arquitetura de pastas;
- padrões de nomenclatura;
- gerenciamento de estado;
- estratégias de cache/memoização.

Não criar uma segunda camada de acesso aos dados.

Não acessar IndexedDB diretamente dentro do Analytics Engine se os repositories já fornecem a abstração necessária.

Antes da implementação, apresentar:

1. arquitetura atual;
2. dados disponíveis;
3. repositories que serão utilizados;
4. transformações existentes que podem ser reutilizadas;
5. componentes da Sprint 4 que serão atualizados;
6. nova arquitetura proposta;
7. riscos e limitações.

---

# 3. Arquitetura proposta

Criar uma camada dedicada:

```text
src/
└── lib/
    └── intelligence/
        ├── analytics/
        │   ├── glucose.analytics.ts
        │   ├── meal.analytics.ts
        │   ├── activity.analytics.ts
        │   ├── timeline.analytics.ts
        │   └── period.analytics.ts
        │
        ├── rules/
        │   ├── rule-engine.ts
        │   ├── glucose.rules.ts
        │   ├── activity.rules.ts
        │   ├── meal.rules.ts
        │   └── timeline.rules.ts
        │
        ├── insights/
        │   ├── insight-generator.ts
        │   ├── insight.types.ts
        │   └── insight-priority.ts
        │
        └── types/
            ├── analytics.types.ts
            ├── rule.types.ts
            └── insight.types.ts
```

Adapte a estrutura às convenções existentes.

---

# 4. Analytics Engine

Criar um mecanismo responsável exclusivamente por calcular métricas.

Exemplo:

```ts
type GlucoseAnalytics = {
  count: number;
  average?: number;
  median?: number;
  minimum?: number;
  maximum?: number;
  standardDeviation?: number;
};
```

Implementar inicialmente:

```text
calculateCount()
calculateAverage()
calculateMedian()
calculateMin()
calculateMax()
calculateStandardDeviation()
```

Não implementar estatísticas desnecessárias.

---

# 5. Análise por período

Permitir análise de:

```text
Hoje
Últimos 7 dias
Últimos 14 dias
Últimos 30 dias
Período personalizado
```

Criar uma abstração consistente:

```ts
type AnalysisPeriod = {
  start: string;
  end: string;
};
```

Todas as análises devem receber um período explícito.

Evitar funções que implicitamente utilizam "hoje" sem receber contexto temporal.

---

# 6. Comparação de períodos

Implementar comparação simples:

```text
Período atual
vs
Período anterior
```

Exemplo:

```text
Últimos 7 dias
vs
7 dias anteriores
```

Calcular:

```text
average
count
minimum
maximum
totalMinutes
```

quando aplicável.

Resultado:

```ts
type PeriodComparison = {
  current: number;
  previous: number;
  absoluteDifference: number;
  percentageDifference?: number;
};
```

---

# 7. Analytics de glicemia

Criar análise específica para glicemia.

Métricas:

```text
Quantidade de registros
Média
Mediana
Mínimo
Máximo
Desvio padrão
Distribuição por período do dia
```

Também calcular:

```text
Manhã
Tarde
Noite
Madrugada
```

A classificação temporal deve ser centralizada e testável.

---

# 8. Tendência

Implementar uma análise simples de tendência.

Exemplo:

```text
Increasing
Decreasing
Stable
InsufficientData
```

Não interpretar isso clinicamente.

Exemplo:

```ts
type Trend = {
  direction: "increasing" | "decreasing" | "stable" | "insufficient_data";

  confidence?: number;
};
```

Se não houver dados suficientes:

```text
InsufficientData
```

Não tentar gerar tendência artificial.

---

# 9. Variabilidade

Calcular variabilidade dos registros.

Exemplo:

```text
standard deviation
range
coefficient of variation
```

Utilizar apenas métricas apropriadas aos dados disponíveis.

Não transformar uma métrica estatística em uma conclusão médica.

---

# 10. Análise temporal

Identificar distribuição dos registros ao longo do dia.

Exemplo:

```text
00–06
06–12
12–18
18–24
```

Gerar:

```text
count
average
minimum
maximum
```

por período.

Isso permitirá futuramente identificar padrões como:

> "A maior parte dos registros ocorre durante a manhã."

---

# 11. Relação temporal entre glicemia e refeições

Criar uma análise exploratória.

Quando houver:

```text
Meal
```

próximo de:

```text
GlucoseReading
```

associar temporalmente os eventos.

Exemplo:

```text
12:30
🍽️ Almoço

14:20
🩸 143 mg/dL
```

Criar uma estrutura:

```ts
type MealGlucoseRelation = {
  mealId: string;
  glucoseBefore?: GlucoseReading;
  glucoseAfter?: GlucoseReading;
  timeDifferenceMinutes?: number;
};
```

Utilizar uma janela temporal configurável.

Exemplo:

```text
before meal
→ até X minutos antes

after meal
→ até Y minutos depois
```

Os valores de janela devem ser definidos como constantes/configuração, e não espalhados pelo código.

---

# 12. Relação entre atividade e glicemia

Criar análise temporal semelhante para atividade.

Exemplo:

```text
18:00
🏃 Caminhada · 30 min

20:00
🩸 121 mg/dL
```

Criar estrutura que permita posteriormente analisar relações temporais.

Importante:

> Correlação temporal não significa causalidade.

Nunca apresentar:

> "A caminhada reduziu sua glicemia."

Preferir:

> "Nos registros disponíveis, houve uma medição após um período de atividade."

---

# 13. Qualidade dos dados

Antes de gerar insights, avaliar a qualidade do conjunto de dados.

Criar:

```ts
type DataQuality = {
  totalRecords: number;
  missingValues: number;
  duplicatedRecords: number;
  periodCoverage: number;
  sufficientForAnalysis: boolean;
};
```

Exemplos:

```text
Poucos registros
→ insufficient_data
```

```text
30 dias sem nenhuma medição
→ baixa cobertura
```

O Rule Engine deve considerar a qualidade dos dados.

---

# 14. Insufficient Data

Criar um estado explícito:

```text
insufficient_data
```

Exemplo:

```text
Ainda não existem dados suficientes
para identificar padrões.

Continue registrando suas informações.
```

Não tentar gerar insights com amostras pequenas.

Essa regra deve estar centralizada.

---

# 15. Web Worker

Mover o processamento pesado para um Web Worker.

Arquitetura:

```text
React
  ↓
Intelligence Service
  ↓
Worker Adapter
  ↓
Web Worker
  ↓
Analytics Engine
  ↓
Rule Engine
  ↓
Insights
  ↓
Worker Adapter
  ↓
React
```

Criar algo semelhante a:

```text
src/
└── workers/
    └── intelligence.worker.ts
```

O Worker não deve acessar diretamente:

- React;
- componentes;
- DOM;
- hooks;
- estado global da aplicação.

Ele deve receber dados serializáveis.

---

# 16. Worker Message Protocol

Definir mensagens tipadas.

Exemplo:

```ts
type IntelligenceRequest = {
  type: "analyze";
  payload: {
    glucose: GlucoseReading[];
    meals: Meal[];
    activities: Activity[];
    notes: Note[];
    period: AnalysisPeriod;
  };
};
```

Resposta:

```ts
type IntelligenceResponse = {
  type: "success";
  payload: IntelligenceResult;
};
```

ou:

```ts
type IntelligenceResponse = {
  type: "error";
  error: {
    code: string;
    message: string;
  };
};
```

Não utilizar `any`.

---

# 17. Intelligence Result

Criar um modelo centralizado.

Exemplo:

```ts
type IntelligenceResult = {
  period: AnalysisPeriod;
  dataQuality: DataQuality;
  glucose?: GlucoseAnalytics;
  meals?: MealAnalytics;
  activities?: ActivityAnalytics;
  comparisons?: PeriodComparisonResult;
  patterns: Pattern[];
  insights: Insight[];
};
```

Esse objeto deverá ser a principal saída do sistema de inteligência.

---

# 18. Rule Engine

Criar um Rule Engine determinístico.

Arquitetura:

```text
Analytics Result
       ↓
Rule Engine
       ↓
Rules
       ↓
Pattern[]
```

Cada regra deve ser:

- independente;
- testável;
- explicável;
- determinística;
- versionável.

---

# 19. Interface de uma Rule

Criar uma interface semelhante a:

```ts
interface IntelligenceRule {
  id: string;
  version: string;
  description: string;
  evaluate(context: RuleContext): RuleResult | null;
}
```

Evitar regras espalhadas em componentes.

---

# 20. Rule Context

Criar contexto:

```ts
type RuleContext = {
  period: AnalysisPeriod;
  analytics: IntelligenceAnalytics;
  dataQuality: DataQuality;
};
```

Isso permite que novas regras sejam adicionadas sem alterar o motor principal.

---

# 21. Primeiras regras

Criar regras simples e explicáveis.

### Regra 1 — Poucos dados

```text
IF
  quantidade de dados < mínimo necessário

THEN
  insufficient_data
```

---

### Regra 2 — Maior concentração temporal

```text
IF
  determinado período do dia concentra
  significativamente mais registros

THEN
  pattern = "time_concentration"
```

---

### Regra 3 — Mudança de média

```text
IF
  média do período atual
  difere significativamente
  do período anterior

THEN
  pattern = "average_change"
```

O threshold deve ser configurável e documentado.

---

### Regra 4 — Variabilidade

```text
IF
  variabilidade aumentou
  em relação ao período anterior

THEN
  pattern = "increased_variability"
```

Não chamar isso de "descontrole".

---

### Regra 5 — Registros após refeições

Identificar se existem registros suficientes próximos a refeições.

Resultado:

```text
meal_glucose_data_available
```

Não concluir causalidade.

---

### Regra 6 — Atividade registrada

Identificar períodos nos quais existem atividades e registros posteriores.

Resultado:

```text
activity_glucose_data_available
```

Novamente, não assumir causalidade.

---

# 22. Pattern

Criar um modelo intermediário:

```ts
type Pattern = {
  id: string;
  ruleId: string;
  type: PatternType;
  severity: "info" | "notice";
  confidence?: number;
  evidence: PatternEvidence[];
};
```

Evitar níveis como:

```text
critical
danger
emergency
```

nesta camada, pois o MVP não está realizando triagem médica.

---

# 23. Evidências

Todo insight deve ser baseado em evidências.

Exemplo:

```ts
type PatternEvidence = {
  metric: string;
  value: number;
  comparison?: number;
  period: AnalysisPeriod;
};
```

Exemplo conceitual:

```text
Padrão identificado:

Média da noite
137 mg/dL

Média da manhã
121 mg/dL

Base:
14 registros
```

Isso torna o insight explicável.

---

# 24. Insight Engine

Criar uma camada que transforma patterns em insights.

Exemplo:

```ts
type Insight = {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  evidence: PatternEvidence[];
  generatedAt: string;
};
```

---

# 25. Linguagem dos Insights

Os insights devem ser:

- neutros;
- claros;
- curtos;
- explicáveis;
- não alarmistas;
- baseados em dados.

Exemplo adequado:

> "Nos últimos 7 dias, seus registros apresentaram maior média no período da noite."

Exemplo inadequado:

> "Sua glicemia está descontrolada."

Outro exemplo inadequado:

> "Você precisa mudar sua alimentação."

---

# 26. Disclaimer contextual

Quando um insight estiver relacionado a dados de saúde, deixar claro que ele representa uma observação dos registros.

Exemplo:

> "Este é um padrão observado nos seus registros e não representa um diagnóstico médico."

Não é necessário repetir um texto enorme em todos os cards.

Pode existir uma explicação contextual acessível.

---

# 27. Priorização dos Insights

Criar uma estratégia de prioridade.

Exemplo:

```ts
type InsightPriority = "low" | "medium";
```

Evitar criar um sistema de severidade médica.

Ordenar:

```text
1. Insights relevantes
2. Insights informativos
3. Insights exploratórios
```

---

# 28. Dashboard — Insights

Adicionar uma seção:

```text
Padrões observados

┌──────────────────────────────────┐
│ 📊 Período noturno               │
│                                  │
│ Seus registros apresentam uma    │
│ média maior durante a noite.     │
│                                  │
│ 14 registros analisados          │
│                                  │
│ [ Ver detalhes ]                 │
└──────────────────────────────────┘
```

---

# 29. Insight Details

Criar uma visualização detalhada.

Exemplo:

```text
Padrão observado

Maior média no período noturno

Últimos 7 dias

Manhã
121 mg/dL

Noite
137 mg/dL

Base:
14 registros

Este padrão foi identificado
a partir dos seus registros.
```

Adicionar link:

```text
[ Ver registros relacionados ]
```

Isso conecta Intelligence → Timeline.

---

# 30. Timeline + Insights

Permitir que um insight leve o usuário para os dados que originaram o insight.

Exemplo:

```text
Insight
 ↓
Evidence
 ↓
Timeline
 ↓
Registros relacionados
```

Isso é fundamental para transparência.

O usuário deve conseguir responder:

> "De onde o aplicativo tirou isso?"

---

# 31. Filtros e Intelligence

A análise deve respeitar os filtros da Sprint 4.

Exemplo:

```text
Dashboard
Período: últimos 7 dias
```

Então:

```text
Analytics
→ últimos 7 dias
```

Se o usuário selecionar:

```text
01/08 → 30/08
```

a inteligência deverá analisar exatamente esse período.

Não utilizar silenciosamente outro intervalo.

---

# 32. Cache de análises

Avaliar cache local de resultados.

Exemplo:

```text
analysis cache
```

Chave:

```text
userId
+
period
+
dataVersion
```

Se os dados não mudaram:

```text
→ reutilizar análise
```

Se um novo registro for criado:

```text
→ invalidar cache
```

Não implementar cache complexo se o volume de dados ainda não justificar.

---

# 33. Data Version

Criar uma estratégia para identificar mudanças nos dados.

Exemplo:

```ts
type DatasetVersion = {
  userId: string;
  version: number;
  updatedAt: string;
};
```

Cada alteração relevante poderá incrementar a versão.

Isso ajudará posteriormente na sincronização e cache.

---

# 34. Performance

O Worker deve evitar bloquear a UI.

Garantir:

```text
UI
→ responsiva
```

durante:

```text
Analytics
→ Rule Engine
→ Insights
```

Para datasets grandes:

- evitar loops desnecessários;
- reduzir cópias de objetos;
- agrupar cálculos;
- reutilizar resultados;
- limitar consultas;
- utilizar estruturas eficientes.

---

# 35. Cancelamento

Avaliar suporte a cancelamento de análises longas.

Exemplo:

```text
Usuário muda filtro
      ↓
Cancela análise anterior
      ↓
Inicia nova análise
```

Evitar que resultados antigos sobrescrevam resultados novos.

---

# 36. Concorrência

Garantir que:

```text
Analysis A
```

não sobrescreva:

```text
Analysis B
```

quando B for mais recente.

Utilizar um identificador de request:

```ts
requestId: string;
```

Exemplo:

```text
Request 1
Request 2

Request 1 termina depois

→ ignorar resultado
```

---

# 37. Privacidade

Todos os cálculos devem ocorrer localmente.

Nesta sprint:

```text
IndexedDB
 ↓
Analytics
 ↓
Worker
 ↓
Insights
```

Não enviar dados de saúde para:

- APIs externas;
- serviços de analytics;
- LLMs;
- provedores de IA;
- servidores de terceiros.

Essa restrição é obrigatória para o MVP.

---

# 38. IA não faz parte desta sprint

Não adicionar:

- OpenAI;
- Gemini;
- Claude;
- APIs externas;
- LLM local;
- MCP.

A Sprint 5 deve construir a base determinística.

Posteriormente:

```text
Analytics Engine
      ↓
Structured Insights
      ↓
Future AI
```

Isso permitirá que uma futura IA receba informações estruturadas em vez de acessar diretamente o banco.

---

# 39. Preparação para MCP

Embora MCP não seja implementado agora, estruturar serviços que futuramente possam ser expostos como ferramentas.

Exemplos:

```ts
getGlucoseSummary();
getTimeline();
getMealSummary();
getActivitySummary();
getInsights();
comparePeriods();
```

Essas funções devem retornar dados estruturados.

Futuramente:

```text
MCP Tool
   ↓
Service
   ↓
Analytics
   ↓
Local Data
```

Não permitir que uma futura IA tenha acesso direto ao IndexedDB.

---

# 40. Preparação para IA local

A saída do Analytics Engine deve ser estruturada:

```json
{
  "period": {},
  "metrics": {},
  "patterns": [],
  "insights": []
}
```

Isso permitirá futuramente:

```text
Local Analytics
       ↓
Structured Context
       ↓
Local LLM
       ↓
Natural Language
```

sem precisar enviar todo o banco para o modelo.

---

# 41. Testes do Analytics Engine

Criar testes unitários abrangentes.

### Média

```text
[100, 120, 140]
→ 120
```

### Mediana

```text
[100, 120, 140]
→ 120
```

### Mínimo

```text
[100, 120, 140]
→ 100
```

### Máximo

```text
[100, 120, 140]
→ 140
```

### Desvio padrão

Validar com dataset conhecido.

---

# 42. Testes de período

Testar:

- hoje;
- 7 dias;
- 30 dias;
- período personalizado;
- limites de data;
- timezone;
- mudança de mês;
- mudança de ano.

---

# 43. Testes de tendência

Criar datasets:

```text
Increasing
```

```text
Decreasing
```

```text
Stable
```

```text
InsufficientData
```

Garantir comportamento determinístico.

---

# 44. Testes do Rule Engine

Cada regra deve possuir testes próprios.

Exemplo:

```text
Input
 ↓
Rule
 ↓
Expected Pattern
```

Não testar todas as regras apenas através de testes E2E.

---

# 45. Testes de Insights

Garantir que:

```text
Pattern
 ↓
Insight
```

produza:

- título;
- descrição;
- evidência;
- período;
- referência à regra.

Também garantir que um insight não seja criado sem evidência suficiente.

---

# 46. Testes do Web Worker

Testar:

- request válido;
- response válido;
- erro;
- requestId;
- concorrência;
- dataset vazio;
- dataset grande;
- cancelamento, caso implementado.

---

# 47. Testes de isolamento

Obrigatório:

```text
User A
 ↓
Analytics A
```

não pode acessar:

```text
User B
```

O Analytics Service deve receber dados já limitados ao usuário atual ou realizar queries explicitamente scoped.

---

# 48. Testes E2E

Criar fluxo:

```text
Login
 ↓
Criar registros
 ↓
Dashboard
 ↓
Selecionar período
 ↓
Executar análise
 ↓
Insight aparece
 ↓
Abrir insight
 ↓
Ver evidências
 ↓
Abrir registros relacionados
```

---

# 49. Cenário sem dados

Usuário recém-criado:

```text
Dashboard
 ↓
Insights
```

Mostrar:

> "Ainda não existem dados suficientes para identificar padrões."

Não mostrar insights genéricos.

---

# 50. Cenário com poucos dados

Exemplo:

```text
2 registros
```

Mostrar:

> "Continue registrando informações para que possamos identificar padrões nos seus dados."

Não gerar conclusões.

---

# 51. Cenário com dados suficientes

Exemplo:

```text
30 dias
50+ registros
```

Permitir:

```text
Analytics
 ↓
Patterns
 ↓
Insights
```

---

# 52. Acessibilidade

Insights devem ser acessíveis.

Garantir:

- headings;
- foco;
- navegação por teclado;
- leitura por screen reader;
- contraste;
- informações textuais equivalentes aos gráficos;
- não depender exclusivamente de cor.

Exemplo:

Não utilizar apenas:

```text
🟢 tendência
```

Utilizar:

```text
Tendência: estável
```

---

# 53. UX

A inteligência não deve dominar a dashboard.

Prioridade:

```text
1. Dados
2. Contexto
3. Insights
```

Evitar:

```text
10 insights
```

na tela inicial.

Mostrar poucos insights relevantes.

Exemplo:

```text
Padrões observados

[ Insight 1 ]

[ Insight 2 ]

[ Ver todos ]
```

---

# 54. Linguagem

Evitar linguagem alarmista.

### Não utilizar:

- "Perigo";
- "Crise";
- "Descontrole";
- "Você está doente";
- "Você precisa";
- "Isso significa que você tem".

### Preferir:

- "Observamos";
- "Seus registros mostram";
- "Foi identificado";
- "Nos dados disponíveis";
- "Durante o período analisado";
- "Pode ser interessante acompanhar".

---

# 55. Regra de ouro da inteligência

Nunca transformar:

```text
correlação
```

em:

```text
causalidade
```

Nunca transformar:

```text
estatística
```

em:

```text
diagnóstico
```

Nunca transformar:

```text
padrão
```

em:

```text
prescrição
```

O sistema deve ajudar o usuário a **observar seus dados**, não substituir um profissional de saúde.

---

# 56. Critérios de aceite

A Sprint 5 somente será considerada concluída quando:

- [ ] Analytics Engine implementado.
- [ ] Estatísticas básicas implementadas.
- [ ] Análise por período implementada.
- [ ] Comparação entre períodos implementada.
- [ ] Tendência implementada.
- [ ] Distribuição temporal implementada.
- [ ] Análise de variabilidade implementada.
- [ ] Relação temporal com refeições preparada/implementada.
- [ ] Relação temporal com atividade preparada/implementada.
- [ ] Data Quality implementado.
- [ ] Estado `insufficient_data` implementado.
- [ ] Web Worker implementado quando justificável.
- [ ] Comunicação Worker ↔ aplicação tipada.
- [ ] Request IDs implementados para evitar resultados obsoletos.
- [ ] Rule Engine implementado.
- [ ] Rules são independentes e testáveis.
- [ ] Patterns possuem evidências.
- [ ] Insight Engine implementado.
- [ ] Insights são baseados em evidências.
- [ ] Insights são explicáveis.
- [ ] Insights não realizam diagnóstico.
- [ ] Insights não prescrevem tratamento.
- [ ] Dashboard apresenta insights.
- [ ] Insight pode levar às evidências.
- [ ] Filtros da Sprint 4 são respeitados.
- [ ] Processamento acontece localmente.
- [ ] Nenhum dado de saúde é enviado para APIs externas.
- [ ] Preparação para futura IA está documentada.
- [ ] Preparação para MCP está documentada.
- [ ] Testes unitários implementados.
- [ ] Testes do Rule Engine implementados.
- [ ] Testes do Worker implementados.
- [ ] Testes E2E implementados.
- [ ] Testes de isolamento entre usuários implementados.
- [ ] Performance validada.
- [ ] Acessibilidade validada.

---

# 57. Resultado esperado

Ao final da Sprint 5, o DiaBem deverá evoluir de:

```text
"Eu registro meus dados."
```

para:

```text
"Eu consigo entender meus próprios registros."
```

Fluxo:

```text
                    DADOS
                      │
                      ↓
                IndexedDB
                      │
                      ↓
               Repositories
                      │
                      ↓
             Analytics Engine
                      │
                      ↓
                 Web Worker
                      │
                      ↓
                Rule Engine
                      │
                      ↓
                  Patterns
                      │
                      ↓
               Insight Engine
                      │
                      ↓
                  Insights
                      │
              ┌───────┴───────┐
              ↓               ↓
          Dashboard        Timeline
```

O usuário deverá conseguir visualizar estatísticas, tendências e padrões observados nos próprios registros, sempre com transparência sobre a origem dessas informações.

---

# 58. Arquitetura final da Sprint 5

A arquitetura deverá ficar próxima de:

```text
                         UI
                          │
                    ┌─────┴─────┐
                    ↓           ↓
                Dashboard     Timeline
                    │
                    ↓
             Intelligence Hook
                    │
                    ↓
          Intelligence Service
                    │
                    ↓
              Worker Adapter
                    │
                    ↓
              Web Worker
                    │
          ┌─────────┴──────────┐
          ↓                    ↓
   Analytics Engine       Rule Engine
          │                    │
          │                    ↓
          │                 Patterns
          │                    │
          └─────────┬──────────┘
                    ↓
              Insight Engine
                    │
                    ↓
                 Result
```

A camada de persistência permanece:

```text
Repositories
      ↓
Dexie
      ↓
IndexedDB
```

e não deve ser acessada diretamente pela UI ou pelo Rule Engine.

---

# 59. Preparação para a Sprint 6

A implementação deve deixar uma fronteira clara para futura IA:

```text
                   Local Data
                       ↓
                Analytics Engine
                       ↓
                Structured Result
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
        Rule Engine          Future AI
             ↓                   ↓
          Insights          AI Insights
             │                   │
             └─────────┬─────────┘
                       ↓
                       UI
```

Na próxima etapa, uma IA poderá utilizar os resultados estruturados para:

- explicar padrões em linguagem natural;
- responder perguntas sobre os próprios registros;
- resumir períodos;
- permitir consultas conversacionais;
- auxiliar na navegação dos dados.
