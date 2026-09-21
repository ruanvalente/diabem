# Data Context Architecture

A camada de contexto é a **fronteira única** entre os dados da aplicação e
qualquer consumidor — incluindo uma futura camada de IA. Ela garante:

- um contrato **versionado** e estável (`DataContext`);
- isolamento de propriedade (ninguém recebe dados de outro usuário);
- não exposição de dados internos (persistência, autenticação, criptografia);
- seleção incremental de dados por tipo e seção derivada.

---

## 1. Princípio

> Nenhum consumidor — UI, relatório ou IA — acessa IndexedDB, Dexie,
> repositórios, autenticação ou criptografia diretamente. Todo acesso passa
> pelo `DataContextService`.

O serviço recebe a menor superfície possível de entrada:

```ts
type DataContextOptions = {
  userId: string;
  period: DataContextPeriod; // { start, end }
  include?: DataContextIncludeOptions;
};
```

e devolve apenas o que foi pedido, no formato versionado.

---

## 2. Localização no módulo

```text
lib/intelligence/
├── data-context/
│   ├── data-context.types.ts      # contrato versionado (DATA_CONTEXT_VERSION = 1)
│   ├── context-options.ts         # validação de entrada + resolução de seleção
│   ├── context-normalizer.ts      # normalização por tipo de registro
│   ├── context-builder.ts         # montagem pura do DataContext
│   ├── context-security.ts        # filtro de propriedade, stripping, log seguro
│   ├── data-context.service.ts    # porta de entrada (DataContextService)
│   └── *.test.ts                  # testes unitários, segurança e performance
└── local/                         # análise determinística (Docs: LOCAL-INTELLIGENCE.md)
```

A camada reutiliza a pipeline existente de inteligência
(`lib/intelligence/intelligence.service.ts`) **sem duplicar** cálculos de
estatística, insights ou qualidade.

---

## 3. Contrato `DataContext` (versionado)

```ts
type DataContext = {
  contextVersion: number;   // muda em quebras estruturais
  generatedAt: string;      // instante da montagem
  period: DataContextPeriod;
  records: {                // apenas os tipos solicitados
    glucose: NormalizedGlucoseRecord[];
    meals: NormalizedMealRecord[];
    activities: NormalizedActivityRecord[];
    medications: NormalizedMedicationRecord[];
    notes: NormalizedNoteRecord[];
  };
  statistics?: IntelligenceAnalytics;
  insights?: Insight[];
  quality?: DataQuality;
  provenance?: DataContextProvenanceSummary;
};
```

### Raw vs Derived

| RAW (`records`)                                  | DERIVED (seções `?`)             |
| ------------------------------------------------ | -------------------------------- |
| dados normalizados, prontos para consumo          | `statistics`, `insights`, `quality`, `provenance` |
| declarativos, sempre passíveis de recálculo       | agregados produzidos na montagem  |

Regra: as seções derivadas são **opcionais** e recalculadas a cada chamada.
Nada de derivado é persistido pelo serviço.

---

## 4. Seleção incremental e controle de período

`include` controla:

- tipos de registro: `glucose`, `meals`, `activities`, `medications`, `notes`;
- seções derivadas: `statistics`, `insights`, `quality`, `provenance`.

Defaults:

| Item                 | Default |
| -------------------- | ------- |
| glucose / meals / activities / medications | on  |
| notes                | off  (texto livre sensível) |
| statistics / insights / quality / provenance | on  |

Um contexto "só glicemia" carrega **um** repositório e, se `statistics` não for
pedido, **não executa** a pipeline de inteligência
(`shouldComputeAnalytics` só ativa quando há seção derivada pedida **e** pelo
menos um tipo analisável — `glucose`, `meals`, `activities`).

O período é validado e normalizado para ISO 8601 (`validateDataContextPeriod`):
datas inválidas, ausentes ou invertidas (`start > end`) são rejeitadas antes de
qualquer I/O.

Cobertura das seções derivadas: `statistics`, `insights` e `quality` refletem
**apenas** `glucose`, `meals` e `activities` (escopo da pipeline de
inteligência); `provenance` agrega **todos** os tipos selecionados. Por isso um
contexto com medicamentos pode reportar `provenance.totalRecords` maior que
`quality.totalRecords` — comportamento esperado.

---

## 5. Fluxo do serviço

```text
getContext(options)
  → validateDataContextOptions        # usuário + período
  → resolveSelection(include)          # defaults + flags do usuário
  → se nada solicitado → erro          # "Nenhum tipo de dado foi solicitado."
  → Promise.all(loaders[n])            # 1 repositório por tipo selecionado
      findByUser(userId, { from, to })
  → filterRecordsByUser                # defense-in-depth de propriedade
  → stripInternalFieldsFromRecords     # userId/sourceKey/createdAt/...
  → buildDataContext (puro)            # normaliza + seções derivadas
  → DataContext
```

Qualquer falha de I/O vira `{ ok: false; error }`. O serviço nunca faz throw.

Se a pipeline de inteligência falhar internamente depois da validação, as
seções derivadas são **omitidas** e o contexto permanece `{ ok: true }` com os
dados brutos. Limitação conhecida: hoje o consumidor não distingue "seção não
solicitada" de "seção falhou ao calcular". Se houver consumidor dependente
dessa distinção, expor um sinal `partialFailure` em futura versão do contrato
(`DATA_CONTEXT_VERSION = 2`).

---

## 6. Segurança e privacidade

A camada implementa o contrato de segurança da aplicação:

1. **Propriedade**: repositórios consultam por `userId` e o serviço re-filtra os
   resultados (`context-security.ts`) — um bug de repositório não vaza dados de
   outro usuário.
2. **Superfície mínima**: normalização (`context-normalizer.ts`) reduz cada
   registro ao necessário. Campos internos (`userId`, `sourceKey`,
   `passwordHash`, `passwordSalt`, `keySalt`, `createdAt`, `updatedAt`) nunca
   cruzam a fronteira.
3. **Textos livres**: `notes` ficam fora por padrão (texto médico sensível
   desencriptado); a inclusão é explícita.
4. **Log seguro**: `summarizeContextForLogging` expõe apenas contagens, período
   e versão — jamais valores de saúde, texto livre, ids ou proveniência.
5. **Proveniência não mutável**: a origem de cada registro é preservada; a
   seção `provenance` é uma agregação derivada (contagens por fonte), nunca
   altera o registro original.

---

## 7. IA: fronteira e consumo

O `DataContext` é o artefato consumido por qualquer camada de IA:

- a IA nunca recebe credenciais, chaves, `userId` ou metadados de autenticação;
- a IA consome **somente** o contexto montado pelo serviço;
- consumo determinístico hoje: `LocalIntelligenceService`
  (`docs/intelligence/LOCAL-INTELLIGENCE.md`).

Decisão: **sem cache e sem Web Worker** nesta sprint. A avaliação técnica
mostrou que a montagem de ~2 mil registros é bem inferior a 1 s (ver
`context-performance.test.ts`), não justificando ainda complexidade de cache
(versionamento de invalidação) nem transferência a thread. Revisitar cache
quando houver consumidor em hot path.

Avaliação técnica e UI de diagnóstico ficam para sprint futura (plan §28–§31),
fora dos critérios de aceite.

---

## 8. Testes

- **Unit**: validação de período/opções, normalização, resolução de seleção.
- **Integração de fronteira**: serviço com repositórios simulados (carregamento
  por seleção, exclusão de notas por padrão, período, errros).
- **Segurança**: filtro de propriedade, stripping de campos internos, resumo de
  log sem vazamento.
- **Performance**: guarda de regressão em contexto de ~2 mil registros.
- **Local Intelligence**: ver `docs/intelligence/LOCAL-INTELLIGENCE.md`.

Rodar:

```bash
bun run test
bun run lint
bunx tsc --noEmit
```

---

## 9. Evolução futura

- Subir `DATA_CONTEXT_VERSION` em toda quebra estrutural do contrato.
- Cache apenas com versionamento de invalidação explícito.
- Novos tipos de registro: adicionar normalizer próprio, entrada em
  `DataContextRecords`, e entrada em `loaders`/`DataRecordKind`.