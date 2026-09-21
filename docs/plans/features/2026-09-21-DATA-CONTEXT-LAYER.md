# Sprint 13 — Camada de Contexto e Inteligência Local

## Objetivo

Implementar uma **Camada de Contexto de Dados (Data Context Layer)** responsável por consolidar, normalizar e disponibilizar informações relevantes da aplicação de forma estruturada, segura e desacoplada das implementações internas de persistência.

Esta sprint representa a preparação da aplicação para futuras funcionalidades de:

- Inteligência local
- Modelos de linguagem
- MCP
- Ferramentas de IA
- Assistentes
- Agentes
- Automação baseada em dados

Entretanto, **nenhuma integração com LLM, MCP ou agente deve ser implementada nesta sprint**.

O principal objetivo é criar uma fronteira arquitetural clara entre:

```text
Dados da aplicação
        ↓
Camada de domínio
        ↓
Data Context Layer
        ↓
Futuras inteligências
```

A inteligência futura deverá consumir um contexto controlado e estruturado, sem acessar diretamente:

- IndexedDB
- Dexie
- Repositories
- Auth
- Chaves criptográficas
- Browser APIs
- Device APIs
- Estado interno da aplicação

---

# 1. Contexto Atual

Ao longo das sprints anteriores, a aplicação passou a possuir diferentes fontes e tipos de informação:

- Glicemia
- Alimentação
- Refeições
- Atividades
- Medicamentos
- Observações
- Analytics
- Insights
- Data Quality
- Proveniência

Atualmente, essas informações existem em diferentes camadas da aplicação.

Antes de introduzir IA, é necessário criar uma forma padronizada de responder:

> "Qual é o contexto de dados disponível para determinada análise?"

A aplicação não deve depender da estrutura interna de cada feature para responder essa pergunta.

---

# 2. Problema que a Sprint Resolve

Sem uma camada de contexto, uma futura inteligência poderia acabar dependendo diretamente de:

```text
IndexedDB
Dexie
Repositories
Services
Hooks
React State
Browser APIs
```

Isso criaria forte acoplamento.

O objetivo desta sprint é criar:

```text
                         Aplicação
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
      Features                            Analytics
          │                                     │
          └──────────────────┬──────────────────┘
                             │
                    Data Context Layer
                             │
                 ┌───────────┴───────────┐
                 │                       │
        Local Intelligence          Futuras IAs
```

---

# 3. Princípio Arquitetural

A futura inteligência **não deve conhecer a implementação interna da aplicação**.

A regra arquitetural desta sprint será:

> **Qualquer consumidor inteligente deve receber dados através de uma camada de contexto, nunca diretamente através dos repositories ou banco de dados.**

Portanto:

```text
CORRETO

AI / Intelligence
       ↓
DataContextService
       ↓
Application Domain
       ↓
Repository
       ↓
IndexedDB
```

Evitar:

```text
INCORRETO

AI
 ↓
Dexie
 ↓
IndexedDB
```

Ou:

```text
INCORRETO

AI
 ↓
MedicationRepository
 ↓
IndexedDB
```

---

# 4. Investigação Inicial

Antes de implementar a nova camada, analisar a arquitetura atual.

Consultar obrigatoriamente:

```text
AGENTS.md

docs/architecture/APPLICATION-ARCHITETURE.md

docs/architecture/COMPONENT-ARCHITECTURE.md
```

Também analisar:

```text
Analytics Engine
Rule Engine
Insights
Data Quality
Provenance
Repositories
Services
Hooks
Timeline
Dashboard
```

Mapear:

- Onde cada dado é armazenado
- Como cada dado é recuperado
- Quais repositories existem
- Quais services existem
- Como analytics são calculados
- Como insights são armazenados
- Como Data Quality é calculado
- Como provenance é representada
- Quais dados são derivados
- Quais dados são brutos

Não duplicar mecanismos existentes.

---

# 5. DataContext

Criar um contrato central para representar o contexto de dados.

Estrutura conceitual:

```ts
interface DataContext {
  contextVersion: number;

  generatedAt: string;

  period: {
    start: string;
    end: string;
  };

  records: {
    glucose: GlucoseRecord[];
    meals: MealRecord[];
    activities: ActivityRecord[];
    medications: MedicationRecord[];
    notes: NoteRecord[];
  };

  statistics: StatisticsContext;

  insights: Insight[];

  quality: DataQualityContext;

  provenance: DataProvenanceContext;
}
```

A estrutura final deve ser adaptada aos modelos existentes no projeto.

Não duplicar modelos de domínio sem necessidade.

---

# 6. DataContextService

Criar um serviço responsável pela construção do contexto.

Contrato conceitual:

```ts
interface DataContextService {
  getContext(options: ContextOptions): Promise<DataContext>;
}
```

O serviço deve ser responsável por:

- Receber os parâmetros do contexto
- Consultar os dados necessários
- Aplicar filtros
- Agregar informações
- Integrar analytics
- Integrar insights
- Integrar Data Quality
- Integrar provenance
- Construir o contexto final
- Garantir que dados sensíveis internos não sejam expostos

---

# 7. ContextOptions

Criar opções para controlar quais informações devem fazer parte do contexto.

Exemplo:

```ts
interface ContextOptions {
  period: {
    start: string;
    end: string;
  };

  include?: {
    glucose?: boolean;
    meals?: boolean;
    activities?: boolean;
    medications?: boolean;
    notes?: boolean;

    statistics?: boolean;
    insights?: boolean;
    quality?: boolean;
    provenance?: boolean;
  };
}
```

Exemplo de utilização:

```ts
await dataContextService.getContext({
  period: {
    start: "2026-09-01",
    end: "2026-09-21",
  },

  include: {
    glucose: true,
    meals: true,
    medications: true,
    activities: false,
    notes: false,
    statistics: true,
    insights: true,
    quality: true,
    provenance: true,
  },
});
```

O sistema deve retornar somente as informações solicitadas quando isso for possível dentro da arquitetura existente.

---

# 8. Controle de Período

O contexto deve permitir trabalhar com períodos específicos.

Exemplo:

```text
01/09/2026 → 21/09/2026
```

O período deve ser aplicado de forma consistente a:

- Glicemia
- Alimentação
- Refeições
- Atividades
- Medicamentos
- Observações
- Analytics
- Insights

Validar:

- Data inicial
- Data final
- Período invertido
- Datas inválidas
- Datas futuras quando incompatíveis com a operação
- Timezone

O comportamento deve seguir as convenções já existentes na aplicação.

---

# 9. Contexto Incremental

Evitar sempre carregar todos os dados disponíveis.

Por exemplo:

```text
Contexto completo
```

não deve ser automaticamente necessário para uma operação que precisa apenas de:

```text
Glicemia
+
Estatísticas
```

O serviço deve permitir contextos menores.

Isso será importante para:

- Performance
- Memória
- Serialização
- Web Workers
- IA local
- Futuras chamadas para LLM

---

# 10. Normalização

Os dados disponibilizados pelo contexto devem possuir estruturas consistentes.

O contexto deve atuar como uma camada de normalização entre os diferentes domínios.

Exemplo conceitual:

```text
Repository
    ↓
Domain Record
    ↓
Context Normalizer
    ↓
DataContext
```

Não alterar os registros originais apenas para atender ao contexto.

O contexto deve ser uma representação derivada.

---

# 11. Dados Brutos x Dados Derivados

Manter separação clara entre:

### Dados brutos

- Glicemia
- Alimentação
- Refeições
- Atividades
- Medicamentos
- Observações

### Dados derivados

- Estatísticas
- Analytics
- Insights
- Data Quality
- Resumos

O contexto deve deixar clara essa diferença.

Exemplo:

```ts
interface DataContext {
  records: {
    // dados registrados pelo usuário
  };

  statistics: {
    // dados calculados
  };

  insights: {
    // dados derivados
  };
}
```

Não persistir o `DataContext` completo como se fosse um registro primário.

---

# 12. Analytics

Integrar o contexto ao Analytics Engine existente.

O fluxo esperado:

```text
Records
   ↓
Analytics Engine
   ↓
Statistics
   ↓
DataContext
```

Não duplicar cálculos existentes.

Se já existir:

```ts
analyticsService.getStatistics(...)
```

reutilizar o mecanismo.

Não criar:

```ts
dataContext.calculateStatistics(...)
```

se essa responsabilidade já pertence ao Analytics Engine.

---

# 13. Insights

Integrar os insights existentes ao contexto.

Exemplo:

```ts
interface DataContext {
  insights: Insight[];
}
```

Cada insight deve manter suas informações de explicabilidade já existentes, incluindo quando aplicável:

- `ruleId`
- `ruleVersion`
- Título
- Explicação
- Evidências
- Data de geração

O Data Context não deve modificar a interpretação do insight.

---

# 14. Data Quality

Integrar o resultado do sistema de Data Quality.

Exemplo:

```ts
interface DataQualityContext {
  overall: "high" | "medium" | "low" | "unknown";

  issues: DataQualityIssue[];

  bySource?: Record<string, QualitySummary>;

  byRecordType?: Record<string, QualitySummary>;
}
```

O formato final deve seguir os modelos existentes.

O contexto deve permitir que uma futura inteligência saiba:

```text
"Esses dados existem"
```

e também:

```text
"Esses dados possuem limitações de qualidade"
```

Isso é importante para evitar interpretações incorretas no futuro.

---

# 15. Proveniência

O contexto deve preservar informações de proveniência.

Exemplo:

```text
Origem:
- Manual
- Importação
- Dispositivo
- Câmera
- Voz
- Sistema
```

A futura inteligência deve poder distinguir, quando disponível:

```text
Registro manual
```

de:

```text
Registro importado
```

ou:

```text
Registro proveniente de dispositivo
```

Não alterar a proveniência original.

---

# 16. Segurança e Privacidade

A camada de contexto deve funcionar como uma **fronteira de segurança**.

Nunca incluir automaticamente:

```text
- Senhas
- Tokens
- Sessões
- Chaves criptográficas
- Informações internas de autenticação
- Dados técnicos desnecessários
- Informações internas do IndexedDB
- Dados de infraestrutura
```

O contexto deve conter apenas informações necessárias para a finalidade solicitada.

---

# 17. Dados Sensíveis

Medicamentos, glicemia, alimentação e demais informações de saúde devem ser tratados como dados sensíveis.

A implementação deve evitar:

- Logs contendo registros completos
- `console.log(dataContext)`
- Persistência desnecessária
- Envio automático para serviços externos
- Telemetria contendo dados pessoais

Durante desenvolvimento, utilizar dados fictícios nos logs e testes.

---

# 18. AI Boundary

Criar uma fronteira arquitetural explícita.

Documentar:

```text
                         Aplicação
                             │
                    DataContextService
                             │
                    DataContext Contract
                             │
              ┌──────────────┴──────────────┐
              │                             │
     Inteligência Local              Futuras Integrações
              │                             │
              └──────────────┬──────────────┘
                             │
                          Contexto
```

A regra será:

> **Nenhuma integração de IA futura poderá acessar diretamente repositories, IndexedDB, Dexie, autenticação ou APIs sensíveis da aplicação.**

---

# 19. Inteligência Local

Nesta sprint será criada apenas a infraestrutura necessária para futuras análises locais.

Não utilizar LLM.

A primeira camada de inteligência pode trabalhar de forma determinística.

Exemplos:

```text
DataContext
    ↓
Local Intelligence
    ↓
Resumo estrutural
```

Possibilidades:

- Identificar quantidade de registros
- Identificar períodos sem dados
- Identificar tipos de registros disponíveis
- Identificar problemas de qualidade
- Identificar origem dos dados
- Resumir estatísticas existentes
- Identificar ausência de determinados dados

Essas análises devem ser técnicas e estruturais.

Não devem realizar diagnóstico médico.

---

# 20. Local Intelligence Service

Criar, quando adequado à arquitetura existente, uma camada como:

```ts
interface LocalIntelligenceService {
  analyze(context: DataContext): Promise<IntelligenceResult>;
}
```

Exemplo:

```ts
interface IntelligenceResult {
  generatedAt: string;

  summary: {
    totalRecords: number;
    availableRecordTypes: string[];
  };

  dataQuality: {
    level: string;
    issues: number;
  };

  coverage: {
    start: string;
    end: string;
    missingPeriods?: string[];
  };
}
```

O contrato deve ser simples e evolutivo.

Não criar uma abstração complexa apenas para preparar a IA.

---

# 21. Explicabilidade

Qualquer resultado produzido pela nova camada deve possuir origem rastreável.

Evitar resultados como:

```text
"Algo aconteceu com seus dados."
```

Preferir:

```text
"Existem 42 registros no período analisado.
38 foram registrados manualmente e 4 foram importados."
```

Sempre que possível, permitir rastrear:

```text
Resultado
   ↓
Regra
   ↓
Dados utilizados
```

---

# 22. Versionamento do Contexto

O contrato do DataContext deve possuir versão.

Exemplo:

```ts
{
  contextVersion: 1;
}
```

Isso permitirá evoluir a estrutura sem quebrar futuras integrações.

Uma futura versão poderá ser:

```text
contextVersion: 2
```

sem necessariamente quebrar consumidores existentes.

---

# 23. Performance

A camada de contexto não deve degradar a performance da aplicação.

Avaliar:

- Quantidade de registros
- Consultas ao IndexedDB
- Serialização
- Deserialização
- Memória
- Re-renderizações
- Cálculos derivados
- Cache
- Memoização

Evitar:

```text
Abrir dashboard
 ↓
Carregar todos os registros
 ↓
Construir contexto completo
 ↓
Calcular todos os analytics
```

quando o dashboard não precisar dessas informações.

---

# 24. Web Worker

Avaliar quais operações devem ser executadas em Web Worker.

Principalmente:

- Construção de contextos grandes
- Normalização
- Agregações
- Data Quality
- Estatísticas pesadas

Não mover operações simples para Worker sem necessidade.

A decisão deve ser baseada no custo real da operação.

---

# 25. Cache

Avaliar cache de contexto quando apropriado.

Exemplo:

```text
Contexto:
01/09 → 21/09

        ↓

Contexto já calculado
        ↓
Reutilizar quando os dados não foram alterados
```

O cache deve ser invalidado quando houver alterações relevantes em:

- Registros
- Analytics
- Insights
- Data Quality
- Proveniência

Não persistir cache desnecessariamente.

---

# 26. Reatividade

Avaliar como o DataContext deve reagir às alterações dos registros.

Exemplo:

```text
Novo medicamento
      ↓
Repository
      ↓
Invalidar contexto relevante
      ↓
Recalcular quando necessário
```

Evitar recalcular todo o contexto global a cada alteração.

Preferir atualizações incrementais quando a arquitetura atual permitir.

---

# 27. Testes Unitários

Criar testes para:

- `DataContextService`
- `ContextBuilder`
- Normalização
- Filtro por período
- Seleção de dados
- Integração com analytics
- Integração com insights
- Data Quality
- Proveniência
- Versionamento
- Exclusão de dados sensíveis

Exemplos:

```text
deve construir contexto para determinado período
```

```text
deve retornar apenas os tipos solicitados
```

```text
deve respeitar o usuário atual
```

```text
não deve incluir credenciais no contexto
```

```text
deve incluir informações de qualidade
```

```text
deve preservar proveniência
```

```text
deve utilizar a versão correta do contexto
```

---

# 28. Testes de Integração

Validar:

```text
Repository
   ↓
DataContextService
   ↓
Analytics
   ↓
Insights
   ↓
Data Quality
   ↓
DataContext
```

Garantir que o contexto representa corretamente os dados reais da aplicação.

---

# 29. Testes de Segurança

Criar testes para garantir que:

- `userId` de outro usuário não seja incluído
- Dados de outros usuários não sejam retornados
- Tokens não sejam incluídos
- Chaves criptográficas não sejam incluídas
- Dados de autenticação não sejam incluídos
- Dados internos do banco não sejam expostos
- Logs não contenham dados sensíveis

---

# 30. Testes de Performance

Avaliar o comportamento com:

- Poucos registros
- Centenas de registros
- Milhares de registros

Medir, quando possível:

- Tempo de construção do contexto
- Memória
- Tempo de serialização
- Tempo de processamento em Worker

O objetivo não é criar uma suíte de benchmark complexa, mas identificar gargalos antes da introdução de IA.

---

# 31. Acessibilidade

A camada de contexto é principalmente lógica, mas qualquer interface criada para visualizar informações de contexto ou inteligência deve respeitar:

- WCAG
- Navegação por teclado
- Leitores de tela
- Contraste
- Estados sem dependência de cor
- Texto alternativo para gráficos
- Feedback de carregamento

Caso seja criado um painel de diagnóstico do contexto, ele deve seguir os mesmos padrões visuais da aplicação.

---

# 32. Interface de Diagnóstico

Criar, se fizer sentido para o desenvolvimento, uma interface interna para visualizar o contexto.

Exemplo:

```text
Contexto Atual

Período
01/09/2026 → 21/09/2026

Registros
Glicemia:       18
Alimentação:    12
Refeições:      24
Atividades:      9
Medicamentos:   15
Observações:     7

Qualidade
Alta

Proveniência
Manual:       72
Importado:    13

Insights
5
```

Essa interface deve ser considerada uma ferramenta de desenvolvimento/diagnóstico, caso não exista necessidade de expô-la ao usuário final.

---

# 33. Documentação

Criar ou atualizar documentação relacionada à nova camada.

Sugestão:

```text
docs/
├── architecture/
│   └── DATA-CONTEXT-ARCHITECTURE.md
│
└── intelligence/
    └── LOCAL-INTELLIGENCE.md
```

Documentar:

- Objetivo
- Responsabilidades
- Contratos
- Fluxo de dados
- Segurança
- Privacidade
- Performance
- Versionamento
- Limites
- Integração futura com IA

---

# 34. Estrutura Sugerida

Seguir a arquitetura existente do projeto.

Uma estrutura conceitual pode ser:

```text
src/
├── domain/
│   └── context/
│       ├── data-context.ts
│       ├── context-options.ts
│       └── context-types.ts
│
├── services/
│   └── context/
│       ├── data-context.service.ts
│       ├── context-builder.ts
│       ├── context-normalizer.ts
│       └── context-security.ts
│
└── intelligence/
    └── local/
        ├── local-intelligence.service.ts
        ├── intelligence-result.ts
        └── analyzers/
```

A estrutura definitiva deve seguir o padrão estabelecido em:

```text
AGENTS.md
docs/architecture/
```

Não criar diretórios desnecessários.

---

# 35. Critérios de Aceite

## DataContext

- [ ] Existe um contrato formal de `DataContext`
- [ ] O contexto possui versionamento
- [ ] O contexto possui período
- [ ] O contexto suporta seleção de dados
- [ ] O contexto contém registros
- [ ] O contexto pode conter estatísticas
- [ ] O contexto pode conter insights
- [ ] O contexto pode conter Data Quality
- [ ] O contexto pode conter Proveniência

## DataContextService

- [ ] Existe um serviço responsável pela construção do contexto
- [ ] Serviço respeita o usuário atual
- [ ] Serviço respeita o período solicitado
- [ ] Serviço permite selecionar tipos de dados
- [ ] Serviço não acessa diretamente dados de outros usuários
- [ ] Serviço não expõe informações internas

## Integração

- [ ] Glicemia está integrada
- [ ] Alimentação está integrada
- [ ] Refeições estão integradas
- [ ] Atividades estão integradas
- [ ] Medicamentos estão integrados
- [ ] Observações estão integradas
- [ ] Analytics está integrado
- [ ] Insights estão integrados
- [ ] Data Quality está integrado
- [ ] Proveniência está integrada

## Segurança

- [ ] Tokens não fazem parte do contexto
- [ ] Senhas não fazem parte do contexto
- [ ] Chaves criptográficas não fazem parte do contexto
- [ ] Dados de autenticação não fazem parte do contexto
- [ ] Dados de outro usuário não fazem parte do contexto
- [ ] Dados sensíveis não são registrados em logs

## Performance

- [ ] Contexto não é construído desnecessariamente
- [ ] Dados podem ser selecionados
- [ ] Consultas são eficientes
- [ ] Não existem re-renderizações desnecessárias
- [ ] Operações pesadas foram avaliadas para Web Worker
- [ ] Cache foi avaliado quando aplicável

## Inteligência Local

- [ ] Existe uma camada inicial de inteligência local
- [ ] Ela funciona sem LLM
- [ ] Resultados são determinísticos
- [ ] Resultados possuem origem rastreável
- [ ] Nenhuma interpretação médica é criada
- [ ] Nenhuma chamada externa é realizada

## Testes

- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Testes de segurança passam
- [ ] Testes de performance foram realizados
- [ ] Regressão existente continua funcionando

## Documentação

- [ ] Arquitetura do DataContext documentada
- [ ] Contratos documentados
- [ ] Limites de segurança documentados
- [ ] Fluxo para futura IA documentado

---

# 36. Definição de Pronto

A Sprint 13 será considerada concluída quando:

1. A aplicação possuir uma camada formal de contexto.
2. `DataContextService` estiver implementado.
3. O contexto respeitar o período solicitado.
4. O contexto respeitar o usuário atual.
5. O contexto permitir seleção dos tipos de dados.
6. Todos os registros principais estiverem integrados.
7. Analytics estiver integrado.
8. Insights estiverem integrados.
9. Data Quality estiver integrado.
10. Proveniência estiver integrada.
11. O contexto possuir versionamento.
12. Dados sensíveis internos não puderem ser expostos.
13. A camada não depender diretamente de IndexedDB/Dexie.
14. A camada não depender diretamente de autenticação.
15. Operações pesadas tiverem sido avaliadas quanto ao uso de Web Worker.
16. Performance tiver sido validada.
17. Testes automatizados estiverem implementados.
18. Documentação arquitetural estiver atualizada.
19. Nenhum LLM tiver sido integrado.
20. Nenhum MCP tiver sido integrado.
21. Nenhum agente tiver sido implementado.

---

# 37. Estratégia de Implementação

## Fase 1 — Mapeamento

Analisar:

```text
AGENTS.md
docs/architecture/*
```

Mapear:

```text
Repositories
Services
Analytics
Insights
Data Quality
Provenance
```

Identificar o que já existe antes de criar novas abstrações.

---

## Fase 2 — Contrato

Criar:

```text
DataContext
ContextOptions
ContextVersion
```

Definir claramente quais dados fazem parte do contexto.

---

## Fase 3 — Construção

Implementar:

```text
DataContextService
        ↓
ContextBuilder
        ↓
ContextNormalizer
```

Integrar as fontes existentes.

---

## Fase 4 — Segurança

Implementar as regras de:

```text
Ownership
Data Filtering
Sensitive Data Protection
Context Boundary
```

---

## Fase 5 — Performance

Avaliar:

```text
Cache
Memoization
Web Worker
Incremental Processing
Serialization
```

Aplicar somente o que for necessário.

---

## Fase 6 — Inteligência Local

Criar uma primeira camada determinística para:

- Cobertura dos dados
- Quantidade de registros
- Qualidade
- Proveniência
- Estatísticas estruturais

Sem LLM.

---

## Fase 7 — Testes

Executar:

```text
Unitários
    ↓
Integração
    ↓
Segurança
    ↓
Performance
    ↓
Regressão
```

---

## Fase 8 — Documentação

Atualizar:

```text
Arquitetura
Contratos
Segurança
Performance
Limites da Inteligência
```

---

# 38. Restrições

Não:

- Integrar OpenAI ou outro LLM
- Criar MCP
- Criar agentes
- Criar chatbot
- Criar chamadas externas de IA
- Enviar dados para servidores externos
- Criar backend apenas para a camada de contexto
- Acessar IndexedDB diretamente a partir da futura inteligência
- Acessar Dexie diretamente a partir da futura inteligência
- Acessar autenticação a partir da futura inteligência
- Expor chaves criptográficas
- Duplicar Analytics Engine
- Duplicar Data Quality
- Duplicar Provenance
- Criar uma segunda camada de Repository
- Implementar diagnóstico médico
- Criar recomendações clínicas
- Introduzir dependências desnecessárias

---

# 39. Resultado Esperado

Ao final desta sprint, a arquitetura deverá evoluir de:

```text
                    Aplicação
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Features      Analytics     Insights
          │             │             │
          └─────────────┼─────────────┘
                        │
                     IndexedDB
```

para:

```text
                         Aplicação
                             │
            ┌────────────────┼────────────────┐
            │                │                │
         Features        Analytics        Insights
            │                │                │
            └────────────────┼────────────────┘
                             │
                        Domain Layer
                             │
                             ▼
                   DataContextService
                             │
                             ▼
                        DataContext
                             │
              ┌──────────────┴──────────────┐
              │                             │
      Local Intelligence              Future AI
              │                             │
              └──────────────┬──────────────┘
                             │
                        Context Contract
```

A partir desta sprint, a inteligência deixa de depender da implementação interna da aplicação.

---

# 40. Preparação para as Próximas Sprints

A Sprint 13 deve preparar diretamente a arquitetura para:

## Sprint 14 — MCP e Ferramentas de IA

Possíveis ferramentas:

```text
get_glucose_records
get_meal_records
get_activity_records
get_medication_records
get_notes
get_statistics
get_insights
get_data_quality
get_context
```

Essas ferramentas deverão utilizar o:

```text
DataContextService
```

e não os repositories diretamente.

---

## Sprint 15 — Assistente de IA

A futura IA poderá receber:

```text
Usuário
   ↓
Pergunta
   ↓
AI Assistant
   ↓
Data Context
   ↓
Contextual Response
```

---

## Sprint 16 — Agentes e Automação

Posteriormente:

```text
AI Agent
   ↓
Tools
   ↓
DataContext
   ↓
Analytics / Rules / Actions
```

sempre respeitando as permissões e limites definidos pela aplicação.

---

# Conclusão

A Sprint 13 representa a criação da **ponte entre o sistema de dados atual e a futura camada de inteligência**.

O objetivo não é fazer a aplicação "pensar" ainda.

O objetivo é garantir que, quando isso acontecer, ela consiga fornecer um contexto:

- Estruturado
- Confiável
- Versionado
- Rastreável
- Seguro
- Performático
- Explicável
- Desacoplado
- Compatível com processamento local

A regra arquitetural principal desta sprint é:

> **A futura inteligência deve conhecer o contexto dos dados, mas não precisa conhecer como esses dados são armazenados ou como a aplicação funciona internamente.**

Dessa forma, a evolução futura poderá seguir:

```text
Registros
    ↓
Analytics
    ↓
Data Quality
    ↓
Proveniência
    ↓
DataContext
    ↓
Inteligência Local
    ↓
MCP
    ↓
Assistente
    ↓
Agentes
```

sem precisar reestruturar novamente a arquitetura fundamental da aplicação.
