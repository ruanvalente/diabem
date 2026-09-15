# Data Provenance

Como o DiaBem rastreia a **origem** de cada registro de saúde, sem modificar o
conteúdo original dos dados.

---

## 1. Princípio

Proveniência é **metadata**. Ela nunca altera o valor do registro — apenas
responde:

> De onde veio este dado? Como foi registrado?

Isso permite classificar a origem de um registro sem interferir no dado de
saúde em si.

---

## 2. Modelo

### Tipo `DataProvenance`

```ts
interface DataProvenance {
  source: "manual" | "import" | "device" | "camera" | "speech" | "system";
  sourceId?: string;
  importedAt?: string;
  recordedAt: string;
}
```

### Fontes suportadas

| Valor     | Significado                                  |
| ---       | ---                                          |
| `manual`  | Registrado manualmente na interface          |
| `import`  | Importado via Data Ownership (JSON)          |
| `device`  | Gravado por dispositivo de saúde conectado   |
| `speech`  | Capturado por reconhecimento de voz          |
| `camera`  | Capturado por foto/OCR da câmera             |
| `system`  | Gerado automaticamente pelo próprio sistema  |

Arquivo: `lib/db/types.ts`

---

## 3. Fluxo de aplicação

Todos os serviços de escrita marcam proveniência no momento da criação:

```text
UI / Voz / Câmera / Importação / Dispositivo
        ↓
   Serviço de escrita
        ↓   provenance.source definido ou default "manual"
   IndexedDB (registro + provenance)
        ↓
   Audit trail (ação, sem conteúdo sensível)
```

Arquivos:

- `lib/health/glucose.service.ts`
- `lib/health/meal.service.ts`
- `lib/health/activity.service.ts`
- `lib/health/note.service.ts`
- `lib/data-ownership/import/importer.ts`
- `lib/devices/core/device-normalizer.ts`

### Regras

- `source` é obrigatório; sem ele, assume **`manual`**.
- `recordedAt` é sempre o instante da gravação local.
- A correção de um registro **preserva** a origem original (o dado foi
  corrigido, não re-originado).

---

## 4. Proveniência na importação

Ao importar um arquivo, cada registro **novo** recebe `source: "import"` e o
`sourceId` fornecido pelo usuário (se houver). Registros que já carregam
proveniência (ex.: re-importação de um export JSON que originalmente vinha de
device ou manual) **preservam** a origem original. A re-normalização
(`normalizeFromExport`) mantém a proveniência existente quando nenhuma nova é
fornecida.

Arquivos:

- `lib/data-ownership/import/importer.ts`
- `lib/data-ownership/import/normalizer.ts`
- `lib/data-ownership/import/record-validation.ts`

---

## 5. Proveniência de voz e câmera

- **Voz** (`speech`): conectada no formulário de glicemia via
  `VoiceInputWidget`; o estado `speechUsed` propaga `provenanceSource: "speech"`.
- **Câmera** (`camera`): o pipeline está pronto (`camera-capture`), mas ainda
  não está ligado ao formulário de glicemia. Quando ligado, basta propagar
  `provenanceSource: "camera"`.

Arquivo: `components/features/glucose/glucose-form-dialog.tsx`

---

## 6. Privacidade

A proveniência **não** contém dado de saúde: identifica apenas a origem. Não é
enviada para nenhum servidor e respeita a exclusão local (Data Ownership).

> A proveniência é tratada como metadado **não-sensível**, armazenada em
> plaintext junto ao registro.