# Sprint 3 — Core Health Features

## Objetivo

Implementar as funcionalidades centrais do DiaBem para registro e gerenciamento de:

- 🩸 Glicemia
- 🍽️ Alimentação
- 🏃 Atividade física
- 📝 Observações

A implementação deve utilizar a infraestrutura criada na **Sprint 2 — Local Data & Authentication**, mantendo a arquitetura **local-first, privacy-first e offline-first**.

As informações devem ser persistidas localmente utilizando **IndexedDB + Dexie**, através da camada de **repositories**, sem acesso direto ao banco pelos componentes React.

A Sprint 3 deve entregar uma experiência funcional e consistente para criação, visualização, edição e exclusão dos registros.

---

# 1. Analisar a implementação existente

Antes de realizar qualquer alteração, faça uma análise completa da implementação atual.

Verifique especificamente o que foi implementado na Sprint 2:

- IndexedDB;
- Dexie;
- database/schema;
- migrations/versionamento;
- repositories;
- User;
- LocalSession;
- AuthProvider;
- autenticação;
- validações Zod;
- estrutura de features;
- componentes shadcn/ui;
- layouts;
- navegação;
- tratamento de erros;
- testes;
- PWA/offline, caso já exista.

Não recrie funcionalidades que já existem.

Não crie uma nova camada de persistência.

Não acesse Dexie/IndexedDB diretamente dentro dos componentes.

A implementação deve evoluir a arquitetura existente.

Antes de implementar, apresente brevemente:

1. arquitetura atual encontrada;
2. repositories existentes que serão reutilizados;
3. arquivos que precisarão ser modificados;
4. novos arquivos que precisarão ser criados;
5. possíveis riscos ou conflitos;
6. estratégia de implementação.

---

# 2. Arquitetura esperada

Manter a separação:

```text
UI
 ↓
Hooks
 ↓
Services
 ↓
Repositories
 ↓
Dexie
 ↓
IndexedDB
```

Exemplo:

```text
GlucoseForm
    ↓
useGlucose()
    ↓
glucoseService
    ↓
glucoseRepository
    ↓
Dexie
    ↓
IndexedDB
```

Não permitir:

```text
GlucoseForm
    ↓
db.glucoseReadings.add()
```

---

# 3. Modelo de domínio

Criar as entidades necessárias para:

```text
GlucoseReading
Meal
Activity
Note
```

Todas devem estar associadas ao usuário autenticado através de:

```ts
userId: string;
```

Nenhum registro de saúde deve existir sem uma referência ao usuário.

---

# 4. Feature — Glicemia

## Objetivo

Permitir que o usuário registre rapidamente uma medição de glicemia.

Criar uma entidade semelhante a:

```ts
type GlucoseReading = {
  id: string;
  userId: string;
  value: number;
  unit: "mg/dL";
  context: "fasting" | "before_meal" | "after_meal" | "bedtime" | "other";
  measuredAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

Adapte o modelo caso a codebase possua padrões diferentes.

---

## 4.1 Registro

Criar uma interface de registro rápido.

Exemplo:

```text
┌───────────────────────────┐
│ Nova medição              │
│                           │
│ Glicemia                  │
│ ┌───────────────────────┐ │
│ │        128            │ │
│ └───────────────────────┘ │
│                           │
│ Contexto                  │
│ ○ Jejum                   │
│ ○ Antes da refeição      │
│ ○ Após a refeição        │
│ ○ Ao deitar              │
│ ○ Outro                   │
│                           │
│ Data e horário            │
│ [ 28/08/2026 08:30 ]      │
│                           │
│ Observação opcional       │
│ [_______________________] │
│                           │
│ [ Cancelar ] [ Salvar ]   │
└───────────────────────────┘
```

Utilizar componentes do shadcn/ui.

---

## 4.2 Validação

Utilizar Zod.

Validar:

- valor obrigatório;
- valor numérico;
- valor positivo;
- contexto válido;
- data válida;
- observação opcional;
- limites razoáveis para impedir entradas claramente inválidas.

Não transformar limites de validação em diagnóstico médico.

Exemplo:

```text
Valor inválido
→ bloquear

Valor válido
→ permitir

Valor incomum
→ permitir registro
→ não diagnosticar
```

O sistema deve permitir que o usuário registre valores fora de uma faixa esperada, pois o objetivo é registrar os dados reais.

---

# 5. Histórico de glicemia

Criar uma página:

```text
/glucose
```

Exibir:

```text
Glicemia

[ + Registrar ]

Hoje
────────────────────

08:30
128 mg/dL
Jejum

14:20
143 mg/dL
Após refeição

21:45
119 mg/dL
Ao deitar
```

Permitir:

- visualizar;
- editar;
- excluir;
- ordenar por data;
- filtrar por contexto;
- filtrar por período.

---

# 6. Feature — Alimentação

## Objetivo

Permitir registrar refeições sem transformar o MVP em um aplicativo nutricional complexo.

Criar:

```ts
type Meal = {
  id: string;
  userId: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  consumedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 6.1 Registro de refeição

Interface:

```text
┌───────────────────────────┐
│ Nova refeição             │
│                           │
│ Tipo                      │
│ [ Café da manhã      ▼ ]  │
│                           │
│ O que você comeu?         │
│ [_______________________] │
│                           │
│ Data e horário            │
│ [ 28/08/2026 08:30 ]      │
│                           │
│ Observação                │
│ [_______________________] │
│                           │
│ [ Salvar ]                │
└───────────────────────────┘
```

Exemplo de descrição:

```text
Arroz, feijão, frango grelhado e salada
```

Não implementar ainda:

- cálculo automático de carboidratos;
- prescrição alimentar;
- recomendação de dieta;
- cálculo de dose de insulina;
- análise nutricional médica.

Essas funcionalidades não fazem parte desta sprint.

---

# 7. Histórico de alimentação

Criar:

```text
/meals
```

Permitir:

- listar refeições;
- filtrar por tipo;
- filtrar por data;
- editar;
- excluir;
- visualizar detalhes.

Exemplo:

```text
Hoje

🍳 Café da manhã
08:30

Ovos, pão integral e café

──────────────────

🍛 Almoço
12:40

Arroz, feijão, frango e salada
```

---

# 8. Feature — Atividade física

## Objetivo

Permitir registrar atividades físicas de maneira simples.

Modelo:

```ts
type Activity = {
  id: string;
  userId: string;
  type: string;
  durationMinutes: number;
  startedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

Tipos iniciais:

```text
Caminhada
Corrida
Ciclismo
Academia
Alongamento
Natação
Outro
```

Não criar uma taxonomia excessivamente complexa.

---

# 9. Registro de atividade

Interface:

```text
┌───────────────────────────┐
│ Nova atividade            │
│                           │
│ Tipo                      │
│ [ Caminhada          ▼ ]  │
│                           │
│ Duração                   │
│ [ 30 ] minutos            │
│                           │
│ Data e horário            │
│ [ 28/08/2026 18:00 ]      │
│                           │
│ Observação                │
│ [_______________________] │
│                           │
│ [ Salvar ]                │
└───────────────────────────┘
```

Permitir:

- criar;
- editar;
- excluir;
- listar;
- filtrar por período;
- filtrar por tipo.

---

# 10. Feature — Observações

## Objetivo

Permitir que o usuário registre informações livres relacionadas ao seu dia.

Exemplo:

> "Hoje acordei me sentindo cansado."

ou:

> "Tive uma rotina diferente hoje."

Modelo:

```ts
type Note = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
```

---

# 11. Quick Actions

Integrar as quatro funcionalidades ao dashboard.

Criar uma área:

```text
Registrar rapidamente

┌─────────────┐
│ 🩸          │
│ Glicemia    │
└─────────────┘

┌─────────────┐
│ 🍽️          │
│ Refeição    │
└─────────────┘

┌─────────────┐
│ 🏃          │
│ Atividade   │
└─────────────┘

┌─────────────┐
│ 📝          │
│ Observação  │
└─────────────┘
```

No mobile:

```text
┌─────────────────────────┐
│ Registrar               │
├───────────┬─────────────┤
│ 🩸        │ 🍽️          │
│ Glicemia  │ Refeição    │
├───────────┼─────────────┤
│ 🏃        │ 📝          │
│ Atividade │ Observação  │
└───────────┴─────────────┘
```

---

# 12. Timeline unificada

Criar ou preparar a timeline para consolidar:

```text
Glicemia
Refeição
Atividade
Observação
```

Exemplo:

```text
Hoje

08:00
🩸 Glicemia
128 mg/dL · Jejum

08:30
🍳 Café da manhã
Ovos, pão e café

10:00
🏃 Caminhada
30 minutos

14:20
🩸 Glicemia
143 mg/dL · Após refeição

18:30
📝 Observação
"Dia mais corrido que o normal"
```

A timeline deve ser baseada em dados do usuário atual.

---

# 13. Repositories

Criar repositories seguindo o padrão estabelecido na Sprint 2.

Exemplo:

```ts
glucoseRepository.create();
glucoseRepository.findById();
glucoseRepository.findByUser();
glucoseRepository.update();
glucoseRepository.delete();
```

Para refeições:

```ts
mealRepository.create();
mealRepository.findById();
mealRepository.findByUser();
mealRepository.update();
mealRepository.delete();
```

Para atividades:

```ts
activityRepository.create();
activityRepository.findById();
activityRepository.findByUser();
activityRepository.update();
activityRepository.delete();
```

Para observações:

```ts
noteRepository.create();
noteRepository.findById();
noteRepository.findByUser();
noteRepository.update();
noteRepository.delete();
```

Implementar métodos de consulta pensando nas necessidades da Sprint 4.

---

# 14. Services

Criar services para separar regras de negócio.

Exemplo:

```text
glucoseService
mealService
activityService
noteService
```

Responsabilidades:

- validar dados;
- aplicar regras de domínio;
- adicionar `userId`;
- gerar IDs;
- timestamps;
- chamar repositories;
- tratar erros.

---

# 15. Hooks

Criar hooks React quando fizer sentido.

Exemplo:

```ts
useGlucose();
useMeals();
useActivities();
useNotes();
```

Possíveis métodos:

```ts
create();
update();
remove();
list();
getById();
```

Evitar transformar hooks em grandes arquivos contendo toda a regra de negócio.

---

# 16. Data isolation

Esse é um requisito obrigatório.

Todos os registros devem ser associados ao usuário autenticado.

Exemplo:

```text
User A
 ├── glucose A
 ├── meals A
 └── activities A

User B
 ├── glucose B
 ├── meals B
 └── activities B
```

Garantir que:

```text
User A ≠ dados de User B
```

Mesmo quando ambos utilizarem o mesmo dispositivo.

Adicionar testes específicos para esse cenário.

---

# 17. Tratamento de exclusão

Ao excluir um registro:

```text
[ Excluir ]
     ↓
Dialog
     ↓
"Tem certeza?"
     ↓
[ Cancelar ] [ Excluir ]
```

Utilizar o AlertDialog do shadcn/ui.

Não excluir silenciosamente.

Após exclusão:

- atualizar UI;
- mostrar feedback;
- manter estado consistente.

---

# 18. Estados da interface

Todas as features devem possuir:

### Loading

```text
Skeleton
```

### Empty

Exemplo:

```text
Ainda não existem registros.

Comece registrando sua primeira glicemia.

[ Registrar glicemia ]
```

### Error

```text
Não foi possível carregar seus registros.

[ Tentar novamente ]
```

### Success

Após salvar:

```text
✓ Registro salvo
```

Utilizar componentes e padrões consistentes.

---

# 19. Responsividade

A implementação deve seguir abordagem **mobile-first**.

Priorizar:

```text
Mobile
 ↓
Tablet
 ↓
Desktop
```

No mobile:

- formulários em uma coluna;
- botões facilmente acessíveis;
- quick actions grandes;
- navegação simplificada;
- dialogs/sheets apropriados;
- evitar tabelas largas.

No desktop:

- aproveitar espaço horizontal;
- utilizar cards;
- permitir visualizações lado a lado quando fizer sentido.

---

# 20. Acessibilidade

Garantir:

- labels corretos;
- foco visível;
- navegação por teclado;
- `aria-describedby` para erros;
- mensagens de feedback acessíveis;
- dialogs acessíveis;
- contraste adequado;
- controles com tamanho adequado;
- sem dependência exclusiva de cor;
- sem emojis como único indicador semântico.

---

# 21. Datas e timezone

Não utilizar datas de maneira inconsistente.

Definir uma estratégia única para:

- armazenamento;
- exibição;
- ordenação;
- filtros.

Preferencialmente armazenar timestamps em formato consistente e realizar a apresentação de acordo com o timezone do usuário.

Evitar problemas como:

```text
Usuário registra:
28/08 23:30

Aplicação exibe:
29/08 02:30
```

quando isso não for desejado.

Criar testes para timezone.

---

# 22. Preparação para Analytics

A Sprint 3 não deve implementar o Analytics Engine completo.

Porém, os dados precisam ser estruturados para permitir posteriormente:

```text
Sprint 4
     ↓
Analytics Engine
     ↓
Web Worker
     ↓
Insights
```

Por isso, garantir que todas as entidades tenham:

```text
id
userId
timestamp
createdAt
updatedAt
```

quando aplicável.

Evitar armazenar informações importantes apenas como texto livre se elas puderem ser estruturadas.

---

# 23. Preparação para IA

Não implementar IA nesta sprint.

Porém, a estrutura deve permitir posteriormente consultas como:

```text
getRecentGlucoseReadings()
getMealsByPeriod()
getActivitiesByPeriod()
getTimeline()
```

Essas funções poderão futuramente ser utilizadas pelo Analytics Engine e pelas ferramentas MCP.

---

# 24. Testes

Implementar testes unitários e de integração.

## Glicemia

- criar;
- editar;
- excluir;
- buscar;
- filtrar;
- validação;
- isolamento por usuário.

## Alimentação

- criar;
- editar;
- excluir;
- buscar;
- filtrar;
- isolamento.

## Atividade

- criar;
- editar;
- excluir;
- buscar;
- filtrar;
- isolamento.

## Observações

- criar;
- editar;
- excluir;
- validação;
- isolamento.

---

# 25. Testes E2E

Criar fluxos completos.

### Glicemia

```text
Login
 ↓
Dashboard
 ↓
Registrar glicemia
 ↓
Salvar
 ↓
Registro aparece
 ↓
Editar
 ↓
Valor atualizado
 ↓
Excluir
 ↓
Registro desaparece
```

### Alimentação

```text
Login
 ↓
Registrar refeição
 ↓
Salvar
 ↓
Aparece na timeline
```

### Atividade

```text
Login
 ↓
Registrar atividade
 ↓
Salvar
 ↓
Aparece na timeline
```

### Observação

```text
Login
 ↓
Registrar observação
 ↓
Salvar
 ↓
Aparece na timeline
```

---

# 26. Teste offline

Caso a infraestrutura PWA/offline da Sprint 2 já esteja implementada, validar:

```text
Login
 ↓
Internet OFF
 ↓
Registrar glicemia
 ↓
Registrar refeição
 ↓
Registrar atividade
 ↓
Registrar observação
 ↓
Reload
 ↓
Todos os dados continuam disponíveis
```

Se a PWA ainda não estiver implementada, documentar este teste como requisito da Sprint 5.

---

# 27. Critérios de aceite

A Sprint 3 somente deve ser considerada concluída quando:

- [ ] Glicemia pode ser criada.
- [ ] Glicemia pode ser editada.
- [ ] Glicemia pode ser excluída.
- [ ] Glicemia pode ser filtrada.
- [ ] Refeição pode ser criada.
- [ ] Refeição pode ser editada.
- [ ] Refeição pode ser excluída.
- [ ] Refeição pode ser filtrada.
- [ ] Atividade pode ser criada.
- [ ] Atividade pode ser editada.
- [ ] Atividade pode ser excluída.
- [ ] Atividade pode ser filtrada.
- [ ] Observação pode ser criada.
- [ ] Observação pode ser editada.
- [ ] Observação pode ser excluída.
- [ ] Todas as entidades possuem `userId`.
- [ ] Dados de usuários diferentes estão isolados.
- [ ] Todas as entradas são validadas com Zod.
- [ ] Persistência utiliza Dexie/IndexedDB.
- [ ] Componentes não acessam IndexedDB diretamente.
- [ ] Repositories encapsulam o acesso aos dados.
- [ ] Services encapsulam regras de negócio.
- [ ] Timeline consegue consolidar os registros.
- [ ] Dashboard possui ações rápidas.
- [ ] Interface é mobile-first.
- [ ] Estados de loading/empty/error estão implementados.
- [ ] Feedback de sucesso está implementado.
- [ ] Exclusão possui confirmação.
- [ ] Acessibilidade foi validada.
- [ ] Testes unitários estão implementados.
- [ ] Testes E2E principais estão implementados.
- [ ] Não foram introduzidas funcionalidades médicas que não fazem parte do escopo.

---

# 28. Resultado esperado

Ao final da Sprint 3, o DiaBem deverá permitir que o usuário autenticado construa seu próprio histórico:

```text
                    DIA BEM
                       │
                    Dashboard
                       │
              ┌────────┼────────┐
              ↓        ↓        ↓
           Registrar  Timeline  Histórico
              │
      ┌───────┼────────┬─────────┐
      ↓       ↓        ↓         ↓
   Glicemia  Refeição  Atividade  Nota
      │       │        │         │
      └───────┴────────┴─────────┘
                    │
                    ↓
                 Service
                    │
                    ↓
                Repository
                    │
                    ↓
                  Dexie
                    │
                    ↓
                IndexedDB
```

O usuário deverá conseguir abrir o aplicativo, autenticar-se, registrar informações do seu dia e consultar posteriormente esses registros sem depender de um servidor para a operação básica.

---

# 29. Preparação para Sprint 4

Ao finalizar esta sprint, não implemente ainda:

- IA;
- LLM;
- MCP;
- WebGPU;
- análise preditiva;
- correlação clínica;
- recomendações médicas.

Deixe a fundação pronta para a próxima etapa:

```text
Sprint 3
Core Data
    ↓
Glucose
Meal
Activity
Note
    ↓
Sprint 4
Analytics Engine
    ↓
Web Worker
    ↓
Statistics
    ↓
Patterns
    ↓
Rule-based Insights
```

A Sprint 4 deverá consumir os dados através dos repositories/services existentes, sem acessar diretamente componentes ou criar uma nova camada de persistência.

Eu faria uma pequena mudança em relação ao roadmap anterior: **a Timeline deveria entrar já na Sprint 3**, mesmo que a análise inteligente fique para a Sprint 4. Ela é o que conecta glicemia + alimentação + atividade + observações e cria o contexto que posteriormente permitirá gerar os insights.

Também manteria a Sprint 3 **sem IA deliberadamente**. Primeiro construa dados estruturados e confiáveis; na Sprint 4 você poderá colocar o Web Worker para analisar esse conjunto e, só depois, adicionar IA para transformar os resultados em linguagem natural.
