# Data Quality

Como o DiaBem avalia a **qualidade técnica** dos dados registrados.

> **Data Quality ≠ Medical Accuracy.**  
> Uma leitura com score alto significa "dado tecnicamente consistente", nunca
> "clinicamente correto".

---

## 1. Princípio

A qualidade representa a confiabilidade técnica do registro, não um veredito
clínico. O objetivo é detectar **inconsistências técnicas** — não diagnosticar
condições de saúde.

---

## 2. Níveis

| Nível     | Faixa de score |
| ---       | ---            |
| `high`    | ≥ 0.80         |
| `medium`  | ≥ 0.50         |
| `low`     | > 0            |
| `unknown` | = 0            |

A comunicação com o usuário nunca depende **apenas** de cor: o nível é sempre
apresentado como texto (ex.: "Qualidade dos dados: Alta").

---

## 3. Fatores analisados

Por entidade (`glucose`, `meal`, `activity`):

| Código                  | Concentrações                                            |
| ---                     | ---                                                      |
| `unknown_provenance`    | origem desconhecida informada                            |
| `missing_value`         | valor ausente (ex.: glicemia sem `value`)                |
| `future_timestamp`      | timestamp no futuro                                      |
| `old_timestamp`         | timestamp muito antigo (fora da janela relevante)        |
| `invalid_timestamp`     | timestamp não parseável                                  |
| `unknown_unit`          | unidade não reconhecida (glicemia)                       |
| `missing_notes`         | observação vazia onde é esperado um contexto (info)      |
| `missing_required_field`| campo obrigatório ausente                                |

Severidade:

- `warning`: penaliza o score (`0.25`);
- `info`: penaliza levemente (`0.05`).

Score do registro = `1` menos as penalidades (mínimo `0`).

---

## 4. Camada de serviço

### Engine

Módulo: `lib/data-quality/`

- `quality-engine.ts` — `assessRecord`, `assessDataset`, `levelFromScore`
- `rules/glucose-quality.rule.ts`
- `rules/meal-quality.rule.ts`
- `rules/activity-quality.rule.ts`

### Resultado do dataset

`computeDataQuality` (em `analytics-engine.ts`) agora delega a avaliação ao
Data Quality Engine e consolida:

```ts
interface DataQuality {
  totalRecords: number;
  missingValues: number;
  duplicatedRecords: number;
  periodCoverage: number;
  sufficientForAnalysis: boolean;
  score: number;       // média do score das entidades
  level: "high" | "medium" | "low" | "unknown";
  issues: DataQualityIssue[];  // deduplicadas por código
}
```

---

## 5. Detecção de anomalias

Após a introdução da validação centralizada, `lib/data-quality` detecta
inconsistências técnicas como `future_timestamp`, duplicação, unidade
incompatível e valor ausente.

Validação de entrada continua em `lib/data-ownership/import/record-validation.ts`
e `lib/health/validation.ts`.

---

## 6. Qualidade não bloqueia

A qualidade **nunca impede o armazenamento** do registro. Ela apenas informa e
prepara a camada de analytics/insights — um dado de baixa qualidade ainda é
armazenado, mas sinalizado.