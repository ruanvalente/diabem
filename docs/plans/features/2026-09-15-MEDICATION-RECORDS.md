# Sprint 12 — Registro de Medicamentos

## Objetivo

Implementar e estabilizar a funcionalidade de **Registro de Medicamentos**, garantindo que o cadastro de medicamentos funcione corretamente e siga o mesmo padrão de arquitetura, fluxo de dados, experiência de uso, validações, persistência e gerenciamento de registros já estabelecido para funcionalidades existentes, como:

* Glicemia
* Alimentação
* Refeições
* Atividades
* Observações

O objetivo desta sprint **não é criar uma arquitetura específica para medicamentos**, mas integrar medicamentos ao ecossistema de registros já existente na aplicação.

A implementação deve preservar os princípios atuais da aplicação:

* Local-first
* Offline-first
* Privacidade
* Propriedade dos dados pelo usuário
* Persistência local
* Arquitetura baseada em domínio
* Separação entre UI, lógica, serviços e persistência

---

# 1. Investigação da Implementação Atual

Antes de realizar alterações, investigar detalhadamente o funcionamento atual da seção de medicamentos.

Comparar a implementação de medicamentos com as funcionalidades que já funcionam:

* Glicemia
* Alimentação
* Refeições
* Atividades
* Observações

Identificar os padrões utilizados atualmente para:

* Estrutura de features
* Modelos de domínio
* Tipos TypeScript
* Schemas de validação
* Formulários
* Hooks
* Services
* Repositories
* IndexedDB/Dexie
* Estado da aplicação
* Identificação do usuário
* Datas e horários
* Criação de registros
* Atualização
* Exclusão
* Timeline
* Filtros
* Dashboard
* Importação
* Exportação
* Data Quality
* Proveniência
* Testes

O objetivo inicial é descobrir **por que o registro de medicamentos atualmente não funciona**.

Investigar possíveis problemas em:

```text
UI
 ↓
Formulário
 ↓
Validação
 ↓
Estado
 ↓
Service
 ↓
Repository
 ↓
IndexedDB/Dexie
 ↓
Consulta
 ↓
Timeline/Dashboard
```

Não corrigir apenas o sintoma visual.

O problema deve ser entendido de ponta a ponta.

---

# 2. Princípio Arquitetural

Medicamentos deve seguir o mesmo padrão dos demais tipos de registros.

O fluxo esperado deve ser:

```text
Interface
   ↓
Feature / Hook
   ↓
Service
   ↓
Repository
   ↓
IndexedDB / Dexie
```

Caso a aplicação já possua abstrações genéricas para registros, elas devem ser reutilizadas.

Evitar criar:

```text
Medication Architecture
```

quando já existir uma abstração capaz de atender:

```text
Record Architecture
```

A implementação deve preferir:

```text
Abstração existente
        ↓
Registro de Medicamentos
```

em vez de:

```text
Abstração existente
        ↓
Nova abstração exclusiva
        ↓
Registro de Medicamentos
```

---

# 3. Modelo de Domínio

Criar ou corrigir o modelo de domínio de medicamentos de acordo com as convenções existentes na aplicação.

Uma estrutura conceitual mínima pode ser:

```ts
interface MedicationRecord {
  id: string;
  userId: string;

  name: string;
  dosage?: string;
  unit?: string;

  frequency?: string;
  route?: string;

  date: string;
  time: string;

  notes?: string;

  createdAt: string;
  updatedAt?: string;
}
```

Essa estrutura é apenas uma referência.

O modelo definitivo deve respeitar o padrão já utilizado pelos demais registros.

Não duplicar campos que já possuam equivalentes no domínio atual.

---

# 4. Informações do Medicamento

O registro deve permitir cadastrar informações relevantes sem transformar o MVP em um sistema completo de prescrição ou acompanhamento médico.

## Campos obrigatórios

* Nome do medicamento
* Data
* Horário

## Campos opcionais

* Dosagem
* Unidade
* Frequência
* Via de administração
* Observações

Exemplo:

```text
Medicamento: Metformina
Dosagem: 500
Unidade: mg
Via: Oral
Horário: 08:00
```

Outro exemplo:

```text
Medicamento: Insulina
Dosagem: 10
Unidade: unidades
Via: Subcutânea
Horário: 12:30
```

A aplicação deve armazenar o dado informado pelo usuário.

Não deve tentar determinar se uma dosagem é clinicamente adequada.

---

# 5. Fluxo de Registro

O fluxo de cadastro deve seguir o mesmo padrão utilizado nas demais funcionalidades.

Fluxo esperado:

```text
Registrar medicamento
        ↓
Preencher formulário
        ↓
Validar informações
        ↓
Salvar
        ↓
Persistir localmente
        ↓
Atualizar estado da aplicação
        ↓
Exibir feedback de sucesso
        ↓
Limpar/fechar formulário
        ↓
Exibir registro na timeline
```

O sistema deve apresentar feedback claro para:

* Sucesso
* Erro de validação
* Falha de persistência
* Campos obrigatórios ausentes

Não permitir falhas silenciosas.

---

# 6. Validação

A validação deve utilizar a mesma estratégia adotada pelas demais funcionalidades.

Validar:

* Nome do medicamento
* Data
* Horário
* Dosagem, quando informada
* Unidade, quando informada
* Frequência, quando informada
* Via, quando informada
* Observações, quando informadas

Exemplos de dados inválidos:

```text
Nome vazio
```

```text
Data inválida
```

```text
Horário inválido
```

```text
Dosagem com formato inválido
```

A validação deve garantir **integridade dos dados**, e não realizar julgamento médico.

Por exemplo, a aplicação não deve decidir se:

```text
500 mg
```

é uma dosagem adequada.

---

# 7. Persistência

Garantir que os medicamentos sejam persistidos utilizando a mesma camada de persistência dos demais registros.

Fluxo esperado:

```text
Medication UI
      ↓
Feature Logic / Hook
      ↓
Medication Service
      ↓
Repository
      ↓
Dexie / IndexedDB
```

Caso exista um repository genérico para registros, reutilizá-lo quando adequado.

O medicamento deve:

* Ser persistido localmente
* Continuar disponível após recarregar a página
* Funcionar offline
* Pertencer ao usuário atual
* Poder ser editado
* Poder ser excluído
* Respeitar as convenções do banco existente

---

# 8. Propriedade dos Dados

O registro de medicamento deve seguir exatamente as regras de ownership já estabelecidas.

Nunca confiar em `userId` proveniente de:

* Formulário
* JSON importado
* CSV importado
* Payload controlado pelo cliente

A propriedade deve ser determinada pelo usuário atual.

Regra esperada:

```text
MedicationRecord.userId === currentUser.id
```

Um registro de outro usuário nunca deve aparecer em:

* Timeline
* Dashboard
* Histórico
* Busca
* Filtros
* Estatísticas
* Insights

---

# 9. Edição de Medicamentos

Implementar edição seguindo o mesmo padrão utilizado pelos demais registros.

Fluxo:

```text
Registro de medicamento
        ↓
Editar
        ↓
Carregar dados existentes
        ↓
Alterar informações
        ↓
Validar
        ↓
Atualizar repository
        ↓
Atualizar interface
```

Durante a atualização, preservar:

```text
id
userId
createdAt
```

Quando o padrão existente utilizar `updatedAt`, atualizar esse campo.

---

# 10. Exclusão

A exclusão deve utilizar o mesmo padrão dos demais registros.

Fluxo:

```text
Excluir
   ↓
Confirmar
   ↓
Repository.delete()
   ↓
Atualizar interface
```

Caso já exista um componente padrão de confirmação, reutilizá-lo.

Não criar um comportamento exclusivo para medicamentos.

---

# 11. Integração com a Timeline

Medicamentos devem se tornar um tipo de registro de primeira classe na timeline.

Exemplo:

```text
09:30

Medicamento

Metformina
500 mg
Oral
```

A timeline deve apresentar:

* Tipo do registro
* Ícone apropriado
* Data
* Horário
* Nome
* Dosagem, quando disponível
* Informações relevantes
* Observações, quando disponíveis
* Ação de editar
* Ação de excluir

Utilizar a arquitetura existente da timeline.

Não criar uma timeline independente para medicamentos.

---

# 12. Filtros

Adicionar medicamentos aos filtros existentes.

Exemplo:

```text
Todos
Glicemia
Alimentação
Refeições
Atividade
Medicamentos
Observações
```

O comportamento deve ser consistente com os demais tipos.

Também deve ser possível combinar filtros quando a arquitetura atual suportar essa funcionalidade.

---

# 13. Integração com o Dashboard

Avaliar a arquitetura atual do dashboard e integrar medicamentos onde fizer sentido.

No mínimo, a aplicação deve ser capaz de identificar:

* Registro de medicamento mais recente
* Quantidade de registros no período selecionado
* Atividade de registros de medicamentos no período

Não implementar métricas clínicas ou de adesão sem que exista um modelo de domínio apropriado.

Por exemplo, não criar automaticamente:

```text
Adesão ao medicamento: 92%
```

sem possuir informações suficientes sobre:

* Prescrição
* Horários esperados
* Frequência
* Doses previstas
* Doses realizadas

---

# 14. Integração com Analytics

Os registros de medicamentos devem ser compatíveis com a arquitetura de analytics existente.

O fluxo futuro deve permitir:

```text
Medication Records
       ↓
Data Context
       ↓
Analytics
       ↓
Insights
       ↓
Futuro uso de IA
```

Esta sprint **não deve implementar IA**.

Também não devem ser criados insights médicos baseados em medicamentos nesta sprint.

---

# 15. Importação e Exportação

Medicamentos devem ser integrados ao sistema de Data Ownership existente.

O JSON versionado deve incluir os registros de medicamentos.

Exemplo conceitual:

```json
{
  "version": 1,
  "application": "DiaBem",
  "exportedAt": "2026-09-15T00:00:00.000Z",
  "data": {
    "glucose": [],
    "meals": [],
    "food": [],
    "activities": [],
    "notes": [],
    "medications": []
  }
}
```

O formato final deve respeitar o contrato de exportação existente.

Para CSV:

* Seguir o padrão atual
* Preservar UTF-8
* Preservar datas
* Preservar horários
* Escapar corretamente valores
* Prevenir CSV Injection

---

# 16. Importação

A importação deve seguir o pipeline já definido:

```text
Leitura
   ↓
Detecção
   ↓
Validação
   ↓
Normalização
   ↓
Deduplicação
   ↓
Preview
   ↓
Confirmação
   ↓
Transação
```

O `userId` presente no arquivo importado nunca deve substituir o usuário atual.

A importação deve ser associada ao usuário atual.

---

# 17. Deduplicação

Medicamentos devem respeitar a estratégia de deduplicação existente.

Quando necessário, considerar uma combinação de:

```text
userId
+
nome
+
data
+
horário
+
dosagem
```

A chave definitiva deve seguir o mecanismo de deduplicação já estabelecido na aplicação.

Não criar uma lógica específica se já existir um mecanismo genérico reutilizável.

---

# 18. Data Quality

Integrar medicamentos ao sistema de Data Quality implementado na Sprint 11.

Detectar problemas técnicos como:

* Campo obrigatório ausente
* Data inválida
* Horário inválido
* Registro duplicado
* Dados importados malformados
* Proveniência ausente
* Ownership inválido
* Timestamp inconsistente

Exemplo conceitual:

```ts
quality: {
  level: "high" | "medium" | "low" | "unknown";
  issues: [];
}
```

O Data Quality não deve determinar se um medicamento é clinicamente adequado.

---

# 19. Proveniência

Medicamentos devem utilizar o sistema de proveniência existente.

Fontes possíveis:

```ts
type DataSource =
  | "manual"
  | "import"
  | "device"
  | "camera"
  | "speech"
  | "system";
```

Nesta sprint, a maioria dos registros provavelmente será:

```text
manual
```

Registros importados devem preservar ou normalizar a proveniência conforme as regras existentes.

---

# 20. Acessibilidade

A interface de medicamentos deve seguir os padrões de acessibilidade existentes na aplicação.

Garantir:

* Labels corretamente associados
* Navegação por teclado
* Foco visível
* Semântica correta dos formulários
* Mensagens de erro acessíveis
* Estados de carregamento acessíveis
* Compatibilidade com leitores de tela
* Não depender apenas de cores
* Áreas de toque adequadas
* Gerenciamento correto de foco em dialogs

A funcionalidade deve funcionar tanto em:

* Desktop
* Tablet
* Mobile

---

# 21. Responsividade

Seguir o padrão visual e responsivo existente.

Prioridade:

```text
Mobile
 ↓
Tablet
 ↓
Desktop
```

Evitar:

* Overflow horizontal
* Campos ultrapassando a tela
* Botões sobrepostos
* Dialogs quebrados
* Formulários com largura fixa inadequada

A ação principal de salvar deve permanecer facilmente acessível no mobile.

---

# 22. Tratamento de Erros

Operações de persistência devem possuir tratamento explícito de erros.

Exemplo conceitual:

```ts
try {
  await medicationService.create(data);
} catch (error) {
  // registrar erro técnico
  // apresentar mensagem amigável
}
```

Nunca apresentar ao usuário:

* Stack trace
* Erros internos do IndexedDB
* Informações sensíveis
* Detalhes desnecessários da implementação

---

# 23. Estados de Carregamento

Impedir múltiplos envios do mesmo registro.

Fluxo:

```text
Usuário clica em Salvar
        ↓
Botão desabilitado
        ↓
Persistência
        ↓
Sucesso ou erro
        ↓
Botão novamente disponível
```

Exibir estado de carregamento apropriado.

Exemplo:

```text
Salvando...
```

---

# 24. Testes Unitários

Criar ou corrigir testes para:

* Validação
* Normalização
* Service
* Repository
* Ownership
* Deduplicação
* Importação
* Exportação
* Data Quality
* Proveniência

Exemplos:

```text
deve criar um registro de medicamento
```

```text
não deve permitir medicamento sem nome
```

```text
deve persistir medicamento
```

```text
deve retornar medicamentos apenas do usuário atual
```

```text
não deve retornar medicamentos de outro usuário
```

```text
deve atualizar medicamento
```

```text
deve excluir medicamento
```

---

# 25. Testes de Componentes

Testar:

* Renderização do formulário
* Campos obrigatórios
* Validação
* Mensagens de erro
* Estado de carregamento
* Sucesso
* Erro
* Modo de edição
* Exclusão
* Confirmação
* Responsividade quando aplicável

---

# 26. Testes de Integração

Validar o fluxo completo:

```text
Formulário
    ↓
Service
    ↓
Repository
    ↓
IndexedDB
```

O teste deve comprovar que um medicamento cadastrado realmente é persistido.

---

# 27. Testes E2E

Criar pelo menos um fluxo completo:

```text
Abrir aplicação
      ↓
Abrir registro de medicamentos
      ↓
Preencher medicamento
      ↓
Salvar
      ↓
Verificar feedback
      ↓
Abrir timeline
      ↓
Verificar medicamento
      ↓
Recarregar aplicação
      ↓
Verificar persistência
```

Também validar:

```text
Criar
 ↓
Editar
 ↓
Excluir
```

quando suportado pela infraestrutura de E2E existente.

---

# 28. Performance

A implementação não deve causar re-renderizações desnecessárias.

Revisar:

* Hooks
* Context
* Estado global
* Queries
* Repository
* Timeline
* Dashboard
* Analytics

Evitar um fluxo como:

```text
Salvar medicamento
       ↓
Recarregar todos os registros
       ↓
Recalcular tudo
       ↓
Re-renderizar aplicação inteira
```

Utilizar o mecanismo otimizado já existente.

---

# 29. Segurança e Privacidade

Medicamentos são dados pessoais sensíveis.

A implementação deve respeitar as regras de segurança estabelecidas na Sprint 10.

Verificar:

* Isolamento dos dados locais
* Ownership
* Validação de importação
* Ausência de dados sensíveis em logs
* Ausência de informações desnecessárias em telemetria
* Não exposição de medicamentos em URLs
* Proteção dos dados durante importação/exportação
* Nenhum segredo armazenado junto ao registro

Não adicionar analytics ou rastreamento de terceiros para dados de medicamentos.

---

# 30. Consistência Visual

Reutilizar os componentes já existentes:

* Buttons
* Inputs
* Selects
* Date Pickers
* Time Pickers
* Dialogs
* Cards
* Toasts
* Icons
* Empty States
* Loading States
* Error States

Medicamentos deve parecer parte do mesmo sistema.

O usuário deve perceber:

```text
Glicemia
Alimentação
Refeição
Atividade
Medicamento
Observação
```

como diferentes tipos de um mesmo sistema de registros.

---

# 31. Estrutura da Feature

Seguir a arquitetura existente do projeto.

Caso o projeto utilize estrutura baseada em features, uma estrutura conceitual pode ser:

```text
components/
└── features/
    └── medications/
        ├── ui/
        │   ├── medication-form.tsx
        │   ├── medication-card.tsx
        │   ├── medication-list.tsx
        │   └── medication-dialog.tsx
        │
        ├── hooks/
        │   └── use-medications.ts
        │
        ├── services/
        │   └── medication-service.ts
        │
        ├── repository/
        │   └── medication-repository.ts
        │
        ├── schemas/
        │   └── medication-schema.ts
        │
        └── types/
            └── medication.ts
```

Entretanto, essa estrutura deve ser adaptada ao projeto real.

Antes de criar ou mover arquivos, consultar:

```text
AGENTS.md

docs/architecture/APPLICATION-ARCHITETURE.md

docs/architecture/COMPONENT-ARCHITETURE.md
```

Não reorganizar o projeto inteiro apenas para implementar medicamentos.

---

# 32. Banco de Dados

Inspecionar o schema atual do Dexie/IndexedDB.

Caso o armazenamento de medicamentos esteja ausente ou incorreto:

* Criar ou corrigir a tabela
* Criar migração
* Preservar dados existentes
* Não realizar migrações destrutivas
* Incrementar corretamente a versão do banco
* Testar a migração

Exemplo conceitual:

```ts
db.version(N).stores({
  medications: "...",
});
```

O schema real deve seguir as convenções atuais do projeto.

Não adicionar índices sem uma necessidade real de consulta.

---

# 33. Critérios de Aceite

## Registro

* [ ] Usuário consegue abrir a seção de medicamentos
* [ ] Usuário consegue informar o nome
* [ ] Usuário consegue informar dosagem
* [ ] Usuário consegue informar unidade
* [ ] Usuário consegue informar frequência
* [ ] Usuário consegue informar via
* [ ] Usuário consegue informar observações
* [ ] Usuário consegue selecionar data
* [ ] Usuário consegue selecionar horário
* [ ] Validação funciona
* [ ] Registro pode ser salvo
* [ ] Submissões duplicadas são impedidas
* [ ] Feedback de sucesso é apresentado

## Persistência

* [ ] Medicamento é persistido no IndexedDB
* [ ] Medicamento permanece após reload
* [ ] Medicamento pertence ao usuário atual
* [ ] Dados de outro usuário não são retornados

## Edição

* [ ] Medicamento pode ser editado
* [ ] Dados existentes são carregados corretamente
* [ ] Alterações são persistidas
* [ ] `id` é preservado
* [ ] `userId` é preservado
* [ ] `createdAt` é preservado

## Exclusão

* [ ] Medicamento pode ser excluído
* [ ] Confirmação é apresentada quando aplicável
* [ ] Registro é removido do IndexedDB
* [ ] Interface é atualizada

## Timeline

* [ ] Medicamento aparece na timeline
* [ ] Data está correta
* [ ] Horário está correto
* [ ] Nome é exibido
* [ ] Dosagem é exibida quando disponível
* [ ] Medicamento pode ser editado
* [ ] Medicamento pode ser excluído

## Filtros

* [ ] Medicamento aparece como tipo de filtro
* [ ] Filtro de medicamentos funciona
* [ ] Filtros existentes continuam funcionando
* [ ] Filtros combinados continuam funcionando

## Data Ownership

* [ ] Medicamentos são incluídos no JSON
* [ ] Medicamentos são incluídos no CSV quando aplicável
* [ ] Medicamentos podem ser importados
* [ ] Dados importados são validados
* [ ] Dados importados são normalizados
* [ ] Duplicidades são tratadas
* [ ] `userId` importado não sobrescreve ownership
* [ ] Importação permanece transacional

## Data Quality

* [ ] Medicamentos participam da validação de qualidade
* [ ] Dados inconsistentes são identificados
* [ ] Proveniência é registrada
* [ ] Dados derivados podem ser recalculados

## Acessibilidade

* [ ] Formulário funciona com teclado
* [ ] Labels estão corretamente associados
* [ ] Erros são acessíveis
* [ ] Foco funciona corretamente
* [ ] Não existe dependência exclusiva de cores
* [ ] Interface funciona em mobile

## Testes

* [ ] Testes unitários passam
* [ ] Testes de componentes passam
* [ ] Testes de integração passam
* [ ] Testes E2E passam
* [ ] Testes existentes continuam passando

## Regressão

* [ ] Glicemia continua funcionando
* [ ] Alimentação continua funcionando
* [ ] Refeições continuam funcionando
* [ ] Atividades continuam funcionando
* [ ] Observações continuam funcionando
* [ ] Timeline continua funcionando
* [ ] Filtros continuam funcionando
* [ ] Importação continua funcionando
* [ ] Exportação continua funcionando
* [ ] Dashboard continua funcionando

---

# 34. Definição de Pronto

A sprint será considerada concluída quando:

1. O registro de medicamentos funcionar de ponta a ponta.
2. A causa do problema atual tiver sido identificada e corrigida.
3. Medicamentos seguirem a mesma arquitetura dos demais registros.
4. Medicamentos forem persistidos corretamente no IndexedDB.
5. Ownership estiver funcionando corretamente.
6. Medicamentos aparecerem na timeline.
7. Medicamentos puderem ser editados.
8. Medicamentos puderem ser excluídos.
9. Medicamentos participarem dos filtros.
10. Medicamentos participarem do sistema de importação/exportação.
11. Medicamentos participarem do Data Quality.
12. Proveniência estiver integrada.
13. Acessibilidade estiver validada.
14. Interface funcionar corretamente em mobile e desktop.
15. Testes automatizados cobrirem os fluxos críticos.
16. Nenhuma funcionalidade existente apresentar regressão.
17. Nenhuma funcionalidade de IA for adicionada.

---

# 35. Estratégia de Implementação

Executar a sprint nas seguintes etapas.

## Fase 1 — Investigação

Consultar:

```text
AGENTS.md
docs/architecture/*
```

Depois comparar as implementações:

```text
Glicemia
Alimentação
Refeições
Atividade
Observações
Medicamentos
```

Identificar:

* O que já existe
* O que está quebrado
* O que está incompleto
* O que diverge do padrão existente
* O que pode ser reutilizado

---

## Fase 2 — Domínio e Persistência

Corrigir ou implementar:

```text
Tipos
 ↓
Schema
 ↓
Repository
 ↓
Service
```

Garantir:

```text
Create
Read
Update
Delete
```

funcionando corretamente.

---

## Fase 3 — Interface

Corrigir ou implementar:

```text
Formulário
Lista
Card
Dialog de edição
Confirmação de exclusão
```

Reutilizar os componentes existentes.

---

## Fase 4 — Integração

Integrar medicamentos com:

```text
Timeline
Filtros
Dashboard
Data Context
Importação
Exportação
Data Quality
Proveniência
```

---

## Fase 5 — Testes

Executar:

```text
Testes unitários
       ↓
Testes de componentes
       ↓
Testes de integração
       ↓
Testes E2E
       ↓
Regressão completa
```

---

## Fase 6 — Documentação

Atualizar a documentação necessária.

Documentar, quando aplicável:

```text
Domínio de medicamentos
Persistência
Importação/exportação
Proveniência
Decisões arquiteturais
```

---

# 36. Restrições

Não:

* Implementar IA
* Implementar sincronização com nuvem
* Criar backend exclusivo para medicamentos
* Criar uma segunda estratégia de persistência
* Armazenar medicamentos fora da camada de dados existente
* Criar uma timeline separada
* Duplicar lógica de Repository
* Ignorar validação
* Confiar no `userId` importado
* Criar regras médicas desnecessárias
* Inferir adesão ao tratamento sem dados suficientes
* Adicionar dependências desnecessárias
* Quebrar o funcionamento offline
* Quebrar funcionalidades existentes
* Criar uma arquitetura paralela para medicamentos

O objetivo principal é:

> **Transformar Medicamentos em um tipo de registro de primeira classe dentro da arquitetura existente do DiaBem, corrigindo o fluxo atual e garantindo consistência com Glicemia, Alimentação, Refeições, Atividades e Observações.**

---

# Resultado Esperado

Ao final da sprint, o ecossistema de registros deverá seguir um fluxo consistente:

```text
                    Sistema de Registros
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Glicemia         Alimentação       Refeições
          │                 │                 │
          ├─────────────────┼─────────────────┤
          │                 │                 │
       Atividade        Medicamentos      Observações
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     Repository Layer
                            │
                            ▼
                       IndexedDB
                            │
                 ┌──────────┴──────────┐
                 │                     │
             Data Quality         Proveniência
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                       Data Context
                            │
                            ▼
                    Futuro uso de IA
```

A Sprint 12 deve, portanto, **estabilizar o último tipo de registro fundamental antes da introdução de inteligência local/IA**, garantindo que os dados de medicamentos possuam o mesmo ciclo de vida dos demais dados da aplicação:

```text
Criar
 ↓
Validar
 ↓
Persistir
 ↓
Consultar
 ↓
Editar
 ↓
Excluir
 ↓
Filtrar
 ↓
Exportar
 ↓
Importar
 ↓
Qualificar
 ↓
Contextualizar
```