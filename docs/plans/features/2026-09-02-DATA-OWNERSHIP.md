# Sprint 7 — Data Ownership

## Objetivo

Implementar uma camada completa de **propriedade, portabilidade e controle dos dados do usuário**.

Ao final desta sprint, o usuário deverá conseguir:

- exportar seus dados em CSV;
- exportar seus dados em JSON;
- importar dados de CSV;
- importar dados de JSON;
- validar arquivos antes da importação;
- visualizar um preview dos dados que serão importados;
- evitar duplicações;
- preservar a integridade dos dados existentes;
- realizar backup antes de operações potencialmente destrutivas;
- compartilhar dados/relatórios utilizando as Web APIs disponíveis;
- utilizar essas funcionalidades mesmo offline;
- compreender claramente onde seus dados estão armazenados.

A filosofia desta sprint é:

> **Os dados pertencem ao usuário.**

A aplicação não deve criar dependência desnecessária de um servidor para permitir que o usuário recupere ou transfira seus próprios dados.

---

# 1. Princípios fundamentais

A arquitetura deve seguir:

```text
                  User Data
                     │
            ┌────────┴─────────┐
            ↓                  ↓
       Import Pipeline    Export Pipeline
            │                  │
            ↓                  ↓
       Validation         Serialization
            │                  │
            ↓                  ↓
       Normalization          File
            │                  │
            ↓                  ↓
         Repository         Download
            │
            ↓
        IndexedDB
```

Para compartilhamento:

```text
Local Data
    ↓
Report / Export
    ↓
Blob / File
    ↓
Web Share API
    ↓
User
```

A aplicação deve continuar sendo:

```text
Local-first
Offline-first
Privacy-first
Data ownership
```

---

# 2. Analisar a codebase antes de implementar

Antes de modificar qualquer arquivo, analisar:

### Sprint 2

- IndexedDB;
- Dexie;
- repositories;
- schemas;
- migrations;
- userId;
- autenticação;
- isolamento de dados.

### Sprint 3

- glicemia;
- alimentação;
- atividade;
- observações.

### Sprint 4

- dashboard;
- timeline;
- filtros;
- gráficos.

### Sprint 5

- analytics;
- insights;
- regras;
- resultados derivados.

### Sprint 6

- PWA;
- Service Worker;
- IndexedDB;
- Web Crypto;
- criptografia;
- armazenamento local.

Verificar principalmente como a criptografia implementada na Sprint 6 afeta:

```text
Import
Export
Migration
Backup
Restore
```

Antes da implementação apresentar:

1. modelo atual dos dados;
2. formato atual dos schemas;
3. estratégia de criptografia;
4. formato de exportação proposto;
5. estratégia de importação;
6. estratégia de versionamento;
7. estratégia de deduplicação;
8. riscos de segurança.

Não criar uma segunda camada de persistência.

---

# 3. Arquitetura de Data Ownership

Criar uma camada dedicada:

```text
src/
└── lib/
    └── data-ownership/
        ├── import/
        │   ├── csv/
        │   ├── json/
        │   ├── importer.ts
        │   ├── validator.ts
        │   ├── normalizer.ts
        │   └── deduplicator.ts
        │
        ├── export/
        │   ├── csv/
        │   ├── json/
        │   ├── exporter.ts
        │   └── serializer.ts
        │
        ├── share/
        │   ├── share.service.ts
        │   └── share.types.ts
        │
        └── types/
            ├── import.types.ts
            ├── export.types.ts
            └── backup.types.ts
```

Adaptar à arquitetura definida no `AGENTS.md` e nos documentos de arquitetura existentes.

---

# 4. Data Export Format

Criar um formato oficial de exportação.

O JSON deverá possuir:

```text
version
exportedAt
application
user
data
```

Exemplo conceitual:

```json
{
  "version": 1,
  "application": "DiaBem",
  "exportedAt": "2026-09-02T12:00:00Z",
  "data": {
    "glucose": [],
    "meals": [],
    "activities": [],
    "notes": []
  }
}
```

Não utilizar o formato interno do IndexedDB como contrato público.

O formato de exportação deve ser uma API de dados independente.

---

# 5. Versionamento

Todo JSON exportado deve possuir versão:

```text
version: 1
```

Futuramente:

```text
version: 2
version: 3
```

Criar mecanismo para detectar:

```text
UnsupportedVersion
```

Não tentar importar silenciosamente um formato incompatível.

---

# 6. Metadata

O arquivo exportado deve conter metadata suficiente para identificação.

Exemplo:

```text
application
schemaVersion
exportedAt
```

Evitar armazenar informações desnecessárias.

Não incluir:

- tokens;
- sessões;
- credenciais;
- chaves criptográficas;
- secrets;
- informações internas do navegador;
- dados do Service Worker.

---

# 7. CSV Export

Implementar exportação CSV para os principais conjuntos de dados:

```text
Glicemia
Alimentação
Atividade
Observações
```

Preferir arquivos separados:

```text
diabem-glucose.csv
diabem-meals.csv
diabem-activities.csv
diabem-notes.csv
```

ou um ZIP apenas se houver justificativa real.

Para o MVP, arquivos separados são mais simples e interoperáveis.

---

# 8. CSV Schema

Definir explicitamente as colunas.

Exemplo para glicemia:

```text
id
timestamp
value
unit
context
notes
createdAt
updatedAt
```

Não exportar campos internos sem necessidade.

Documentar o significado de cada coluna.

---

# 9. CSV Encoding

Garantir compatibilidade com:

- Excel;
- Google Sheets;
- LibreOffice;
- ferramentas de análise de dados.

Utilizar UTF-8.

Avaliar BOM quando necessário para melhorar compatibilidade com ferramentas que tenham problemas de detecção de UTF-8.

---

# 10. CSV Delimiter

Definir claramente o delimitador.

Considerar o contexto brasileiro e compatibilidade com:

```text
Excel
LibreOffice
Google Sheets
```

Preferir uma estratégia consistente e documentada.

O importador deve conseguir reconhecer ou configurar o delimitador quando possível.

---

# 11. CSV Import

Permitir:

```text
Selecionar arquivo
      ↓
Ler arquivo
      ↓
Detectar formato
      ↓
Validar
      ↓
Normalizar
      ↓
Preview
      ↓
Confirmar
      ↓
Importar
```

Nunca inserir diretamente no banco assim que o arquivo for selecionado.

---

# 12. JSON Import

Fluxo:

```text
Arquivo JSON
     ↓
Parse
     ↓
Version Validation
     ↓
Schema Validation
     ↓
Normalization
     ↓
Deduplication
     ↓
Preview
     ↓
User Confirmation
     ↓
Transaction
     ↓
IndexedDB
```

---

# 13. File Validation

Validar:

- extensão;
- MIME type quando disponível;
- tamanho máximo;
- encoding;
- estrutura;
- schema;
- versão;
- campos obrigatórios;
- tipos;
- limites;
- datas;
- IDs.

Não confiar apenas na extensão:

```text
.json
.csv
```

O conteúdo precisa ser validado.

---

# 14. Limite de tamanho

Definir limite para arquivos de importação.

Exemplo:

```text
10 MB
```

O valor deve ser configurável.

Caso ultrapasse:

```text
Arquivo muito grande.
```

Não tentar processar um arquivo potencialmente enorme na thread principal.

---

# 15. Web Worker para importação

Se o volume justificar, processar:

```text
CSV parsing
JSON parsing
validation
normalization
deduplication
```

em Web Worker.

Arquitetura:

```text
UI
 ↓
Import Service
 ↓
Worker
 ↓
Parse
 ↓
Validate
 ↓
Normalize
 ↓
Result
```

A UI deve permanecer responsiva.

---

# 16. Streaming

Para CSVs grandes, avaliar parsing incremental/streaming.

Não carregar desnecessariamente todo o arquivo em memória.

Se o MVP não precisar disso, documentar como evolução futura.

---

# 17. Schema Validation

Criar schemas específicos para o formato de importação.

Não reutilizar cegamente os schemas internos do banco.

Exemplo:

```text
ImportSchema
      ↓
Domain Model
```

e não:

```text
CSV
 ↓
IndexedDB
```

diretamente.

---

# 18. Normalization

A importação deve normalizar os dados.

Exemplo:

```text
"  120  "
```

→

```text
120
```

Datas:

```text
2026-09-02T10:30:00Z
```

→ formato interno consistente.

Unidades:

```text
mg/dL
```

→ enum/valor conhecido.

---

# 19. Não alterar silenciosamente os dados

Se um valor for inválido:

```text
120abc
```

não converter silenciosamente para:

```text
120
```

Marcar como erro.

O usuário deve saber o que não será importado.

---

# 20. Import Preview

Antes da confirmação, mostrar:

```text
Importação

Arquivo:
backup.json

Glicemias:
128

Refeições:
42

Atividades:
18

Observações:
31

Novos registros:
187

Duplicados:
14

Erros:
3

[ Cancelar ] [ Importar ]
```

---

# 21. Erros de importação

Mostrar erros de maneira acionável.

Exemplo:

```text
3 registros não poderão ser importados.

Linha 18
Valor de glicemia inválido.

Linha 42
Data inválida.

Linha 53
Campo obrigatório ausente.
```

Não mostrar stack traces.

---

# 22. Partial Import

Não realizar importação parcial silenciosa.

Definir uma estratégia:

### Opção recomendada para o MVP

```text
Validação completa
      ↓
Se houver erros críticos
      ↓
Não importar
```

Permitir ao usuário corrigir o arquivo e tentar novamente.

Para erros não críticos, deixar explícito quais registros serão ignorados.

---

# 23. Deduplicação

Criar mecanismo para evitar registros duplicados.

Não depender apenas do `id`, pois arquivos importados podem vir de outras instalações.

Criar estratégia baseada em:

```text
id
timestamp
userId
type
content
```

conforme cada entidade.

A estratégia deve ser específica para cada tipo de dado.

---

# 24. Importação do próprio backup

Cenário:

```text
Export
 ↓
File
 ↓
Delete data
 ↓
Import
```

deve resultar em dados equivalentes.

Criar teste de round-trip:

```text
Original
 ↓
Export JSON
 ↓
Import JSON
 ↓
Restored
```

Validar equivalência dos dados.

---

# 25. Transaction

A importação deve utilizar transação quando possível.

Fluxo:

```text
Validation
 ↓
Transaction
 ↓
Insert/Update
 ↓
Commit
```

Se ocorrer erro:

```text
Rollback
```

Evitar banco em estado parcialmente importado.

---

# 26. Backup antes da importação

Para operações que possam sobrescrever dados, oferecer:

```text
Antes de continuar, recomendamos
exportar seus dados atuais.
```

Para o MVP, a estratégia mais segura é:

```text
Import
 ↓
Merge
```

em vez de:

```text
Import
 ↓
Delete all
 ↓
Replace
```

---

# 27. Estratégias de importação

Implementar inicialmente:

```text
Adicionar ao existente
```

Exemplo:

```text
Dados atuais: 100
Arquivo: 50
Duplicados: 10

Resultado: 140
```

Futuramente:

```text
Merge
Replace
Restore
```

podem ser adicionados.

---

# 28. Import Mode

Criar uma abstração:

```ts
type ImportMode = "merge" | "replace";
```

No MVP:

```text
merge
```

é o comportamento padrão.

Se `replace` não for implementado, não exibir essa opção na UI.

---

# 29. Criptografia

A Sprint 6 implementou criptografia local.

A Sprint 7 deve respeitar essa arquitetura.

Fluxo:

```text
Import File
     ↓
Validate
     ↓
Normalize
     ↓
Domain Model
     ↓
Encrypt
     ↓
Repository
     ↓
IndexedDB
```

Não armazenar dados importados em texto puro.

---

# 30. Export + Encryption

O JSON exportado deve possuir uma estratégia explícita.

Definir:

### Exportação legível

```text
JSON/CSV
```

Adequada para:

- interoperabilidade;
- análise;
- migração.

### Backup protegido

Futuramente:

```text
Encrypted Backup
```

Não misturar os dois conceitos.

Para o MVP, documentar claramente que CSV/JSON exportados são arquivos legíveis e, portanto, devem ser tratados como dados sensíveis.

---

# 31. Aviso de segurança na exportação

Antes de exportar:

> "Este arquivo contém seus dados pessoais. Armazene-o em um local seguro."

Não bloquear o usuário.

---

# 32. Export Service

Criar:

```ts
exportData({
  format: "json" | "csv",
  scope: ExportScope,
});
```

Exemplo:

```ts
type ExportScope = {
  glucose: boolean;
  meals: boolean;
  activities: boolean;
  notes: boolean;
};
```

---

# 33. Exportação completa

Adicionar:

```text
Exportar todos os dados
```

que gera:

```text
JSON
```

como formato principal de backup/interoperabilidade.

CSV permanece ideal para análise em planilhas.

---

# 34. Exportação parcial

Permitir:

```text
Somente glicemia
Somente alimentação
Somente atividade
Somente observações
Todos
```

Isso será especialmente útil para compartilhamento.

---

# 35. Filtros na exportação

A exportação deve respeitar filtros quando aplicável.

Exemplo:

```text
Período:
01/08/2026 → 31/08/2026
```

Exportar somente:

```text
dados desse período
```

Também permitir:

```text
Todos os dados
```

---

# 36. Export Metadata

Quando a exportação for filtrada, registrar no JSON:

```text
exportScope
period
filters
```

Exemplo conceitual:

```json
{
  "version": 1,
  "exportScope": {
    "glucose": true,
    "meals": true
  },
  "period": {
    "start": "2026-08-01",
    "end": "2026-08-31"
  }
}
```

---

# 37. Web Share API

Implementar compartilhamento utilizando:

```text
navigator.share()
```

quando disponível.

A API deve ser encapsulada:

```text
ShareService
```

A UI não deve chamar `navigator.share()` diretamente.

---

# 38. Share Capability Detection

Criar:

```ts
canShare();
```

e verificar suporte antes de mostrar:

```text
Compartilhar
```

Não presumir que todos os navegadores suportam compartilhamento de arquivos.

---

# 39. Compartilhar arquivo

Quando suportado:

```text
File
 ↓
navigator.share({
  files: [...]
})
```

Exemplo de uso:

```text
Relatório
 ↓
PDF/CSV/JSON
 ↓
Compartilhar
```

A implementação deve seguir exatamente as capacidades suportadas pelo navegador.

---

# 40. Fallback

Se:

```text
Web Share API
```

não estiver disponível:

mostrar:

```text
Baixar arquivo
```

e não:

```text
Erro ao compartilhar
```

Fluxo:

```text
Web Share disponível
→ Compartilhar

Web Share indisponível
→ Baixar
```

---

# 41. Web Share com dados sensíveis

Nunca compartilhar automaticamente.

Sempre exigir ação explícita:

```text
[ Compartilhar ]
```

Antes de compartilhar, mostrar uma confirmação contextual:

> "Este arquivo contém dados pessoais. Deseja continuar?"

---

# 42. Share Target

Avaliar futuramente suporte a:

```text
Web Share Target API
```

para permitir que o DiaBem receba arquivos compartilhados de outros aplicativos.

Não é obrigatório implementar nesta sprint.

Documentar como evolução futura.

---

# 43. Compartilhamento de relatório

O Web Share pode ser utilizado para compartilhar:

```text
Resumo do período
```

em vez de compartilhar o banco inteiro.

Exemplo:

```text
Resumo — últimos 7 dias

Registros: 28
Média: ...
Período analisado: ...
```

Quando o relatório possuir dados de saúde, tratá-lo como informação sensível.

---

# 44. Não compartilhar insights automaticamente

O usuário deve escolher explicitamente.

Não:

```text
Insight
 ↓
Compartilhar automaticamente
```

Preferir:

```text
Insight
 ↓
[ Compartilhar ]
```

---

# 45. Compartilhar JSON vs CSV

Regras:

### JSON

Melhor para:

```text
Backup
Migração
Transferência
```

### CSV

Melhor para:

```text
Excel
Google Sheets
Análise
```

### Relatório

Melhor para:

```text
Compartilhamento humano
```

---

# 46. UI de Data Ownership

Criar uma seção:

```text
Configurações
  └── Seus dados
```

Com:

```text
Exportar dados
Importar dados
Compartilhar
```

Exemplo:

```text
Seus dados

Seus dados ficam armazenados neste dispositivo.

[ Exportar dados ]

[ Importar dados ]

[ Compartilhar resumo ]

Saiba como seus dados são armazenados →
```

---

# 47. Export Dialog

Criar um dialog:

```text
Exportar seus dados

Formato

○ JSON
○ CSV

Dados

☑ Glicemia
☑ Alimentação
☑ Atividade
☑ Observações

Período

○ Todos
○ Período atual

[ Cancelar ] [ Exportar ]
```

---

# 48. Import Dialog

Fluxo:

```text
Importar dados

Arraste um arquivo aqui
ou

[ Selecionar arquivo ]
```

Depois:

```text
Validando arquivo...
```

Depois:

```text
Preview da importação
```

Finalmente:

```text
[ Cancelar ]
[ Importar ]
```

---

# 49. Drag and Drop

Adicionar suporte opcional a:

```text
dragover
drop
```

Garantir que também funcione:

```text
mobile
keyboard
screen reader
```

Não depender apenas de drag-and-drop.

Sempre disponibilizar:

```text
Selecionar arquivo
```

---

# 50. File Input

Utilizar:

```html
<input type="file" />
```

com:

```text
accept=".json,.csv,application/json,text/csv"
```

Mas lembrar:

> `accept` é apenas uma indicação para o navegador, não uma validação de segurança.

O conteúdo precisa ser validado posteriormente.

---

# 51. Progress

Para arquivos maiores:

```text
Importando...

██████████░░░░ 72%

128 / 180 registros
```

Se processamento em Worker for utilizado, comunicar progresso:

```text
Worker
 ↓
Progress Event
 ↓
UI
```

---

# 52. Cancelamento

Permitir cancelar importações grandes.

Fluxo:

```text
Importação
 ↓
[ Cancelar ]
 ↓
Worker cancelado
 ↓
Nenhuma alteração parcial
```

---

# 53. Estados

Definir estados:

```text
idle
selecting
reading
validating
preview
importing
success
error
cancelled
```

Não espalhar esses estados por vários componentes.

---

# 54. Feedback de sucesso

Após exportação:

```text
Seus dados foram exportados.
```

Após importação:

```text
Importação concluída.

128 registros adicionados.
14 duplicados ignorados.
```

---

# 55. Feedback de erro

Exemplo:

```text
Não foi possível importar este arquivo.

O formato não é compatível com o DiaBem.
```

Quando possível:

```text
Ver detalhes
```

para mostrar erros de validação.

---

# 56. Segurança de arquivos

Nunca executar conteúdo importado.

Um arquivo importado deve ser tratado exclusivamente como:

```text
data
```

Nunca:

```text
HTML
JavaScript
```

Não utilizar:

```text
eval()
```

ou mecanismos equivalentes.

---

# 57. XSS

Dados importados podem conter conteúdo malicioso.

Principalmente:

```text
observações
nomes
descrições
```

Garantir:

- React escaping;
- nenhuma execução de HTML;
- sanitização quando realmente necessário;
- nenhuma renderização arbitrária.

---

# 58. CSV Injection

Tratar especificamente o risco de **CSV Injection**.

Valores iniciados por caracteres como:

```text
=
+
-
@
```

podem ser interpretados como fórmulas por planilhas.

Na exportação, avaliar sanitização/escaping desses valores para evitar execução de fórmulas quando o arquivo for aberto em aplicações de planilha.

Documentar a estratégia adotada.

---

# 59. Importação e User ID

Nunca confiar no `userId` vindo do arquivo.

Ao importar:

```text
Arquivo
 ↓
User ID externo
```

não deve permitir que ele determine o proprietário local.

Associar os registros ao usuário atualmente autenticado/local.

---

# 60. Importação de dados de outro usuário

Se o arquivo possuir:

```text
userId: ABC
```

e o usuário atual for:

```text
userId: XYZ
```

o sistema deve:

```text
ignorar/substituir userId externo
```

conforme o modelo de domínio.

Nunca permitir cross-user access.

---

# 61. IDs importados

Decidir se os IDs originais serão preservados.

Para backups do próprio DiaBem:

```text
preservar ID
```

pode ser importante para deduplicação.

Para dados externos:

```text
gerar novo ID
```

pode ser mais seguro.

Criar estratégia explícita.

---

# 62. Timestamps

Preservar:

```text
createdAt
updatedAt
timestamp
```

quando disponíveis.

Validar:

- timezone;
- datas futuras;
- datas inválidas;
- formatos desconhecidos.

Não alterar silenciosamente timestamps válidos.

---

# 63. Dados derivados

Não exportar cegamente dados derivados da Sprint 5 como se fossem dados primários.

Distinguir:

```text
Raw User Data
```

de:

```text
Derived Analytics
```

Preferir exportar os dados primários.

Analytics podem ser recalculados após importação.

---

# 64. Insights

Não tratar insights como fonte de verdade.

Após importação:

```text
Raw Data
 ↓
Analytics Engine
 ↓
Rule Engine
 ↓
New Insights
```

Se insights forem exportados, tratá-los como dados derivados/informativos.

---

# 65. Compatibilidade futura

O formato JSON deve ser pensado para:

```text
DiaBem v1
 ↓
DiaBem v2
 ↓
DiaBem v3
```

Criar migradores:

```text
v1 → current
v2 → current
```

quando necessário.

Não quebrar backups antigos sem necessidade.

---

# 66. Documentação do formato

Criar documentação:

```text
docs/data-format/
```

ou local equivalente contendo:

```text
JSON schema
CSV schema
Versioning
Import rules
Export rules
```

Isso será importante para:

- interoperabilidade;
- debugging;
- futuras integrações;
- IA;
- MCP;
- sincronização.

---

# 67. Preparação para MCP

O sistema de Data Ownership deve expor serviços bem definidos que futuramente possam ser utilizados por MCP.

Exemplos:

```ts
exportUserData();
importUserData();
getDataSummary();
getExportableRecords();
```

Futuramente:

```text
MCP
 ↓
Data Ownership Service
 ↓
Repositories
```

Nunca:

```text
MCP
 ↓
IndexedDB diretamente
```

---

# 68. Preparação para IA

A futura IA deverá trabalhar sobre dados controlados.

Exemplo:

```text
User
 ↓
Seleciona dados
 ↓
Structured Context
 ↓
AI
```

Não:

```text
AI
 ↓
Banco inteiro
```

O usuário deve possuir controle explícito sobre o que será compartilhado com qualquer serviço de IA futuro.

---

# 69. Privacidade

Adicionar uma página/seção:

```text
Como seus dados são armazenados
```

Explicar de maneira simples:

```text
✓ Dados armazenados localmente
✓ Funcionamento offline
✓ Dados protegidos no armazenamento local
✓ Exportação disponível
✓ Você pode excluir seus dados
```

Não fazer promessas absolutas de segurança.

---

# 70. Delete All Data

Como complemento natural de Data Ownership, adicionar:

```text
Excluir todos os meus dados
```

Fluxo:

```text
Configurações
 ↓
Seus dados
 ↓
Excluir todos os dados
 ↓
Confirmação explícita
 ↓
Backup opcional
 ↓
Delete
```

A confirmação deve ser forte.

Exemplo:

> "Esta ação excluirá os dados armazenados neste dispositivo e não poderá ser desfeita."

Não implementar recuperação falsa.

---

# 71. Export Before Delete

Antes de apagar:

```text
Deseja exportar seus dados antes de continuar?
```

Opções:

```text
[ Exportar e continuar ]
[ Excluir sem exportar ]
[ Cancelar ]
```

Isso reforça o conceito de ownership.

---

# 72. Storage Cleanup

Ao excluir os dados:

```text
IndexedDB
 ↓
User Data
 ↓
Delete
```

Avaliar também:

- caches específicos da aplicação;
- chaves criptográficas;
- dados temporários;
- analytics cache;
- Worker state.

Não apagar recursos estáticos da PWA sem necessidade.

---

# 73. Testes de Export

Testar:

```text
Empty database
Small dataset
Large dataset
Special characters
Unicode
Accents
Quotes
Commas
Newlines
Dates
```

Especialmente:

```text
José
Refeição "especial"
Texto, com vírgula
Texto
com quebra de linha
```

---

# 74. Testes de Import

Testar:

```text
Valid JSON
Invalid JSON
Valid CSV
Invalid CSV
Empty file
Huge file
Wrong extension
Wrong MIME
Unknown version
Missing fields
Invalid fields
Duplicate records
```

---

# 75. Round-trip Test

Teste obrigatório:

```text
Create Data
 ↓
Export JSON
 ↓
Clear Database
 ↓
Import JSON
 ↓
Compare
```

Os dados relevantes devem ser equivalentes.

---

# 76. CSV Round-trip

Também testar:

```text
Create Data
 ↓
Export CSV
 ↓
Clear Database
 ↓
Import CSV
 ↓
Compare
```

Alguns metadados podem não ser preservados dependendo do formato.

Documentar explicitamente o que é preservado.

---

# 77. Testes de criptografia

Validar:

```text
Import
 ↓
Encrypt
 ↓
IndexedDB
```

Confirmar que dados sensíveis não estão armazenados em texto puro.

---

# 78. Testes de isolamento

Testar:

```text
User A
 ↓
Export
```

e:

```text
User B
 ↓
Import
```

garantindo que:

- IDs;
- ownership;
- dados;
- sessão

não sejam misturados.

---

# 79. Testes do Web Share

Testar:

### Suportado

```text
canShare()
→ true
```

### Não suportado

```text
canShare()
→ false
→ Download fallback
```

### Cancelamento pelo usuário

O cancelamento do share não deve ser tratado como erro fatal.

---

# 80. Testes de acessibilidade

Validar:

- teclado;
- screen readers;
- foco;
- dialogs;
- file input;
- drag and drop;
- progress;
- erros;
- confirmação;
- mensagens de sucesso.

Utilizar `aria-live` para:

```text
Importação concluída.
```

e:

```text
Erro na importação.
```

quando apropriado.

---

# 81. Mobile

Validar principalmente:

```text
Android
iOS
PWA standalone
```

Testar:

```text
Selecionar arquivo
Download
Share
```

porque o comportamento das APIs de arquivos e compartilhamento pode variar entre navegadores.

---

# 82. Offline

Todas as operações devem funcionar offline:

```text
Export JSON
Export CSV
Import JSON
Import CSV
Share quando o navegador suportar
Delete data
```

A Web Share API não deve exigir internet por parte do DiaBem; ela apenas delega o compartilhamento ao sistema/navegador.

---

# 83. Performance

Não bloquear a UI durante:

```text
CSV parsing
JSON parsing
Validation
Deduplication
Encryption
```

Para datasets grandes:

```text
Web Worker
```

deve ser considerado.

---

# 84. Critérios de aceite

A Sprint 7 somente será considerada concluída quando:

## Export

- [ ] Exportação JSON implementada.
- [ ] Exportação CSV implementada.
- [ ] Exportação completa implementada.
- [ ] Exportação parcial implementada.
- [ ] Exportação por período implementada.
- [ ] JSON possui versionamento.
- [ ] Schema documentado.
- [ ] CSV schema documentado.
- [ ] UTF-8 validado.
- [ ] Caracteres especiais testados.
- [ ] Aviso de privacidade implementado.

## Import

- [ ] Importação JSON implementada.
- [ ] Importação CSV implementada.
- [ ] Validação implementada.
- [ ] Normalização implementada.
- [ ] Preview implementado.
- [ ] Deduplicação implementada.
- [ ] Importação associada ao usuário atual.
- [ ] userId externo não é confiável.
- [ ] Transação implementada.
- [ ] Falhas não deixam dados parcialmente importados.
- [ ] Limite de tamanho implementado.
- [ ] Erros são apresentados de forma compreensível.

## Web Share

- [ ] Web Share API encapsulada.
- [ ] Detecção de suporte implementada.
- [ ] Compartilhamento de arquivos implementado quando suportado.
- [ ] Fallback para download implementado.
- [ ] Cancelamento tratado.
- [ ] Confirmação antes de compartilhar dados sensíveis.

## Privacy

- [ ] Dados importados passam pela camada de criptografia.
- [ ] Dados exportados são tratados como sensíveis.
- [ ] Nenhuma chave criptográfica é exportada.
- [ ] Nenhum token é exportado.
- [ ] Nenhuma sessão é exportada.
- [ ] Nenhum segredo é exportado.
- [ ] userId externo não pode causar cross-user access.

## Ownership

- [ ] Usuário consegue exportar seus dados.
- [ ] Usuário consegue importar seus dados.
- [ ] Usuário consegue excluir seus dados.
- [ ] Usuário consegue compartilhar dados explicitamente.
- [ ] Dados derivados são diferenciados dos dados primários.
- [ ] Formato de dados é versionado.
- [ ] Documentação do formato criada.

## Offline

- [ ] Export funciona offline.
- [ ] Import funciona offline.
- [ ] Delete funciona offline.
- [ ] Share funciona offline quando suportado pelo navegador.

## Testes

- [ ] Unit tests.
- [ ] Validation tests.
- [ ] Import tests.
- [ ] Export tests.
- [ ] Round-trip tests.
- [ ] Deduplication tests.
- [ ] Encryption tests.
- [ ] Isolation tests.
- [ ] Web Share tests.
- [ ] Accessibility tests.
- [ ] Mobile tests.
- [ ] E2E tests.

---

# 85. Resultado esperado

Ao final da Sprint 7, o DiaBem deverá permitir que o usuário tenha um ciclo completo de controle dos seus dados:

```text
                     DIA BEM
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
          Registrar             Analisar
              │                   │
              ↓                   ↓
          IndexedDB           Analytics
              │                   │
              └─────────┬─────────┘
                        ↓
                  Seus dados
                        │
             ┌──────────┼──────────┐
             ↓          ↓          ↓
          Export      Import      Share
             │          │          │
             ↓          ↓          ↓
           JSON       JSON       Web Share
           CSV        CSV        / Download
```

O usuário deverá conseguir:

```text
Registrar
    ↓
Armazenar localmente
    ↓
Analisar
    ↓
Exportar
    ↓
Compartilhar
    ↓
Importar novamente
```

sem depender de uma infraestrutura de backend para possuir e transportar seus próprios dados.

---

# 86. Princípio arquitetural final

A camada de Data Ownership deve ficar entre a aplicação e os mecanismos de persistência:

```text
UI
 ↓
Data Ownership Services
 ↓
Domain Services
 ↓
Repositories
 ↓
Crypto
 ↓
IndexedDB
```

Nunca:

```text
UI
 ↓
IndexedDB
```

e nunca:

```text
UI
 ↓
navigator.share()
```

diretamente.

Todas as APIs do navegador devem estar encapsuladas.

---

# 87. Visão final das Sprints 2–7

Ao concluir esta sprint, o DiaBem terá uma fundação bastante sólida:

```text
SPRINT 2
Local Data
    ↓
SPRINT 3
Core Features
    ↓
SPRINT 4
Experience
    ↓
SPRINT 5
Intelligence
    ↓
SPRINT 6
Offline + Privacy
    ↓
SPRINT 7
Data Ownership
```

Resultando em:

```text
                 DIA BEM
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      Local       Offline     Private
       Data        PWA        Storage
        │           │           │
        └───────────┼───────────┘
                    ↓
              Core Features
                    │
                    ↓
              Analytics
                    │
                    ↓
               Insights
                    │
                    ↓
             Data Ownership
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       Import     Export     Share
```
