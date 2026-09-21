# Local Intelligence

Camada de inteligência **determinística** e **100% local** da aplicação.

Ela consome um `DataContext` (fronteira definida em
`docs/architecture/DATA-CONTEXT-ARCHITECTURE.md`) e produz uma leitura
estrutural dos dados — contagens, cobertura, qualidade e proveniência — sem
nenhuma interpretação médica, sem rede, sem LLM e sem dependência de servidor.

---

## 1. Princípio

> Inteligência local produz **fatos estruturais rastreáveis**, nunca
> diagnósticos. Cada resultado explica, por regra, os dados que o originaram.

- **Sem LLM / MCP / agentes**: nenhuma chamada externa; determinismo garantido
  pela mesma entrada gerar a mesma saída re-executável.
- **Sem interpretação médica**: o módulo não afirma sobre saúde; apenas resume
  estrutura, cobertura, qualidade e origem.
- **Privacidade**: como consumidor do `DataContext`, nunca recebe credenciais,
  `userId`, chaves ou metadados internos.

---

## 2. Módulo

```text
lib/intelligence/local/
├── intelligence-result.ts        # LOCAL_INTELLIGENCE_VERSION + tipos do resultado
├── local-intelligence.service.ts # analyzeLocalIntelligence / localIntelligenceService
├── analyzers/
│   ├── records.analyzer.ts       # contagens por tipo de registro
│   ├── coverage.analyzer.ts      # dias cobertos e períodos vazios
│   ├── quality.analyzer.ts       # espelha o nível de qualidade (ou not_requested)
│   └── provenance.analyzer.ts    # agrega proveniência por origem
└── index.ts
```

Contrato público (plan §20): `localIntelligenceService.analyze(context)`
retorna `Promise<LocalIntelligenceResult>` — assíncrono para acomodar futuros
consumidores, mas sincronizável hoje (as análises são puras).

> Nota: o tipo é `LocalIntelligenceResult` para não colidir com
> `IntelligenceResult` de `lib/intelligence/types/worker.types.ts`.

---

## 3. Resultado

```ts
type LocalIntelligenceResult = {
  version: number;                     // LOCAL_INTELLIGENCE_VERSION = 1
  generatedAt: string;
  period: DataContextPeriod;

  summary: {
    totalRecords: number;
    availableRecordTypes: DataRecordKind[];
    counts: Record<DataRecordKind, number>;
  };

  dataQuality: {
    level: DataQualityLevel | "not_requested";
    issueCount: number;
    issueCodes: string[];
  };

  coverage: {
    start: string;
    end: string;
    totalDays: number;
    coveredDays: number;
    missingPeriods: string[];   // início de cada dia vazio (ISO)
    limited: boolean;           // período longo demais para enumerar
  };

  provenance: {
    bySource: Record<string, number>;
    knownSourceRate: number;
    unknownSourceCount: number;
    totalRecords: number;
    notRequested: boolean;
  };

  explanations: LocalIntelligenceExplanation[];  // rastreabilidade por regra
};
```

---

## 4. Regras e rastreabilidade

Cada seção deriva de uma regra identificada (`rule`), com `description` e os
`data` que a sustentam:

| Rule                 | Seção        | Produz                                                |
| -------------------- | ------------ | ----------------------------------------------------- |
| `records.count`      | `summary`    | total e contagens por tipo, tipos disponíveis          |
| `coverage.days`      | `coverage`   | total de dias, dias cobertos, períodos sem dados       |
| `quality.level`      | `dataQuality`| nível, contagem e códigos de problemas                 |
| `provenance.source`  | `provenance` | distribuição por origem, taxa de origem conhecida      |

### Convenções

- **Cobertura**: dias pela margem `toDateString()` local (mesma convenção da
  engine de analytics). Períodos acima de `MAX_COVERAGE_DAYS = 732` dias não
  têm os dias vazios enumerados — resultado marcado com `limited: true`.
- **Qualidade ausente**: se o contexto não incluiu `quality`, o nível é
  `not_requested` — nunca um palpite. O consumidor não pode inferir qualidade
  a partir da ausência.
- **Proveniência ausente**: idem — `notRequested: true` e contagens zeradas.
- **Origem desconhecida**: registros sem `provenance.source` contam como
  desconhecidos e reduzem `knownSourceRate`.

---

## 5. Determinismo

`analyzeLocalIntelligence` é composto de funções puras sobre o contexto.
Mesma entrada → mesma saída (exceto `generatedAt`, metadado de instante). Isto
permite:

- testes determinísticos (`local-intelligence.service.test.ts`);
- re-cálculo idempotente a cada chamada;
- auditoria de qualquer valor de volta ao `DataContext` via `explanations`.

---

## 6. Fronteira com IA futura

Quando a aplicação evoluir para uma camada de IA não-determinística, as
condições de fronteira continuam:

1. a IA consome apenas `DataContext` / `LocalIntelligenceResult`;
2. `LocalIntelligenceService` permanece como o piso confiável (verificável a
   qualquer momento);
3. nenhuma API de IA acessa repositórios ou IndexedDB.

---

## 7. Testes

```bash
bunx vitest run lib/intelligence/local
```

Casos cobertos:

- determinismo (duas execuções → mesmo `summary`);
- contagens/`availableRecordTypes`;
- cobertura (dias cobertos, dias vazios, período `limited`);
- qualidade espelhada do contexto e `not_requested` na ausência;
- agregação de proveniência e `notRequested`;
- presença de `explanations` para toda seção derivada.