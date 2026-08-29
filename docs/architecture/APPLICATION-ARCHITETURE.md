Sim. Para complementar o `COMPONENT-ARCHITETURE.md`, eu criaria um documento mais amplo, responsável por definir **como a aplicação inteira deve ser arquitetada**. Ele pode ser a referência principal para novos módulos/features, refatorações, testes, segurança, acesso a dados e organização da codebase.

Sugestão de arquivo:

```text
docs/
└── architecture/
    ├── APPLICATION-ARCHITETURE.md
    └── COMPONENT-ARCHITETURE.md
```

Abaixo está um documento já estruturado para **Next.js + App Router + TypeScript**, utilizando **Feature Module Architecture**.

# Arquitetura da Aplicação

## Visão geral

Este documento define os princípios, padrões e boas práticas arquiteturais para desenvolvimento, manutenção e evolução da aplicação.

A arquitetura deve priorizar:

- Separação de responsabilidades;
- Modularidade;
- Feature Module Architecture;
- Baixo acoplamento;
- Alta coesão;
- Testabilidade;
- Segurança;
- Tipagem forte;
- Manutenibilidade;
- Reutilização consciente;
- Performance;
- Acessibilidade;
- Observabilidade;
- Clareza estrutural.

A aplicação utiliza **Next.js com App Router e TypeScript**.

As decisões arquiteturais devem respeitar as características do Next.js, especialmente:

- Server Components;
- Client Components;
- Server Actions;
- Route Handlers;
- Middleware/Proxy;
- Streaming;
- Suspense;
- Cache;
- Data fetching server-side.

---

# 1. Princípios fundamentais

Toda implementação deve seguir os seguintes princípios:

### 1.1 Alta coesão

Código relacionado à mesma responsabilidade deve permanecer próximo.

### 1.2 Baixo acoplamento

Uma feature não deve depender desnecessariamente de detalhes internos de outra feature.

### 1.3 Separação de responsabilidades

Cada módulo deve possuir uma responsabilidade clara.

### 1.4 Código orientado à funcionalidade

A organização deve priorizar o domínio e as funcionalidades da aplicação, e não apenas o tipo técnico do arquivo.

Prefira:

```text id="r2k5h8"
features/
├── dashboard/
├── authentication/
├── profile/
└── books/
```

em vez de concentrar toda a aplicação em:

```text id="v3b9x1"
components/
hooks/
services/
utils/
types/
```

sem uma relação clara com as funcionalidades.

### 1.5 Simplicidade

Não introduza abstrações antes que exista uma necessidade real.

### 1.6 Segurança por padrão

Toda funcionalidade deve considerar segurança desde sua implementação, e não apenas como uma etapa posterior.

### 1.7 Testabilidade

A arquitetura deve permitir que regras e comportamentos sejam testados de maneira isolada.

---

# 2. Feature Module Architecture

A aplicação deve utilizar **Feature Modules** como principal estratégia de organização das funcionalidades.

Uma feature representa uma capacidade real do produto.

Exemplos:

```text id="w0qz48"
authentication
dashboard
profile
settings
books
library
notifications
payments
```

Cada feature deve possuir autonomia sobre seus componentes, regras e comportamentos.

Estrutura conceitual:

```text id="6cl8ar"
components/
└── features/
    └── <feature>/
        ├── ui/
        ├── widget/
        ├── hooks/
        ├── services/
        ├── repositories/
        ├── actions/
        ├── schemas/
        ├── types/
        └── index.ts
```

Nem todas as pastas precisam existir.

**Crie somente as camadas necessárias para a feature.**

---

# 3. Estrutura da aplicação

Uma estrutura recomendada:

```text id="2q8j4m"
app/
├── (public)/
├── (auth)/
├── (app)/
├── api/
├── layout.tsx
├── error.tsx
├── not-found.tsx
└── ...

components/
├── features/
│   ├── authentication/
│   ├── dashboard/
│   ├── profile/
│   └── ...
│
├── ui/
└── shared/

lib/
├── auth/
├── db/
├── security/
├── validation/
├── observability/
└── ...

docs/
├── architecture/
├── design/
└── plans/

tests/
├── unit/
├── integration/
└── e2e/
```

A estrutura exata deve respeitar a arquitetura já existente no projeto.

Não mova arquivos simplesmente para atingir uma estrutura visualmente perfeita.

---

# 4. Responsabilidade do diretório `app/`

O diretório:

```text id="h4w5av"
app/
```

é responsável principalmente pela **estrutura de rotas e composição do Next.js**.

Evite transformar `app/` em um local onde toda a lógica da aplicação fica concentrada.

Arquivos como:

```text id="qj1p0x"
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
```

devem permanecer focados em suas responsabilidades dentro do App Router.

A lógica específica de uma funcionalidade deve preferencialmente estar dentro da respectiva Feature Module.

---

# 5. Page Components

`page.tsx` deve atuar como entry point da rota.

Preferencialmente:

```text id="a7y6fp"
Route
  ↓
Feature
  ↓
Widget
  ↓
UI
```

Uma página complexa pode seguir:

```text id="2jz8n3"
app/dashboard/page.tsx
        ↓
components/features/dashboard/
        ↓
widget/
        ↓
ui/
```

Consulte:

```text id="docs/architecture/COMPONENT-ARCHITETURE.md"

```

para as regras detalhadas de componentes.

---

# 6. Feature Module

Uma Feature Module deve encapsular o máximo possível de sua própria lógica.

Exemplo:

```text id="u8k4h1"
components/
└── features/
    └── profile/
        ├── ui/
        │   ├── profile-header.ui.tsx
        │   └── profile-form.ui.tsx
        │
        ├── widget/
        │   └── profile-form.widget.tsx
        │
        ├── hooks/
        │   └── use-profile.ts
        │
        ├── actions/
        │   └── update-profile.action.ts
        │
        ├── schemas/
        │   └── profile.schema.ts
        │
        ├── services/
        │   └── profile.service.ts
        │
        ├── types/
        │   └── profile.types.ts
        │
        └── index.ts
```

Uma feature simples pode possuir apenas:

```text id="8b2w9z"
profile/
├── ui/
└── widget/
```

Não crie todas as camadas por padrão.

---

# 7. Responsabilidade das camadas

## UI

Responsável por apresentação.

```text id="k3p5b7"
ui/
```

Não deve conter regras de negócio.

---

## Widget

Responsável por comportamento e orquestração.

```text id="v7q2h9"
widget/
```

Pode possuir:

- Estado;
- Hooks;
- Interações;
- Orquestração;
- Loading;
- Error;
- Success.

---

## Hooks

Responsáveis por comportamentos reutilizáveis.

```text id="m8r4x2"
hooks/
```

Não utilize hooks apenas para reduzir tamanho de arquivos.

---

## Actions

Responsáveis por operações que utilizam Server Actions quando essa abordagem for apropriada.

```text id="f6q9k3"
actions/
```

As Actions devem:

- Validar entrada;
- Autorizar operação;
- Executar operação;
- Retornar resultados seguros;
- Não expor informações sensíveis.

Nunca confie apenas na validação realizada pelo client.

---

## Services

Responsáveis por regras e operações específicas do domínio quando necessário.

```text id="x4n7p2"
services/
```

Services não devem depender de componentes React.

---

## Repositories

Responsáveis pelo acesso e persistência de dados quando a aplicação utilizar essa abstração.

```text id="b5m8r1"
repositories/
```

Um Repository deve encapsular detalhes de infraestrutura quando isso trouxer benefício arquitetural.

---

## Schemas

Responsáveis pela validação de dados.

```text id="j2v6k9"
schemas/
```

Sempre que apropriado, utilize validação runtime para dados externos.

Exemplos:

- Formulários;
- API requests;
- Server Actions;
- URL params;
- Search params;
- Dados provenientes de integrações externas.

---

# 8. Fluxo arquitetural

Sempre que possível, mantenha um fluxo semelhante a:

```text id="8f0m3r"
Page
 ↓
Widget
 ↓
Hook / Action / Service
 ↓
Repository
 ↓
Database / External API
```

E:

```text id="j5x8c2"
Widget
 ↓
UI
```

Evite que componentes UI acessem diretamente:

```text id="7p4k1z"
Database
API
Repository
Service
```

A apresentação não deve conhecer detalhes de infraestrutura.

---

# 9. Dependências entre Features

Features devem permanecer desacopladas.

Evite:

```text id="v1n4q7"
Feature A
   ↓
Feature B
   ↓
Feature C
```

quando isso criar dependências difíceis de manter.

Quando uma funcionalidade realmente for compartilhada, avalie se ela deve pertencer a uma camada compartilhada.

Exemplo:

```text id="q6m9s2"
components/shared/
lib/
```

Não mova automaticamente tudo para `shared`.

Um componente ou serviço só deve ser compartilhado quando possuir uma responsabilidade realmente transversal.

---

# 10. Regras de negócio

Regras de negócio não devem ficar espalhadas pela UI.

Evite:

```tsx id="p7d4z1"
if (user.role === 'admin' && account.status === 'active') {
  ...
}
```

espalhado por vários componentes.

Quando uma regra possuir significado de domínio, considere centralizá-la em:

```text id="3q8w5n"
services/
lib/
domain/
```

ou outra camada apropriada à arquitetura existente.

A UI deve consumir o resultado da regra sempre que possível.

---

# 11. Server Components

Server Components devem ser o padrão no App Router.

Utilize Server Components sempre que não houver necessidade de recursos exclusivos do client.

Benefícios:

- Menor JavaScript enviado ao navegador;
- Acesso seguro a recursos server-side;
- Data fetching próximo da fonte;
- Melhor performance;
- Menor superfície de exposição de dados.

Evite adicionar `"use client"` sem necessidade.

---

# 12. Client Components

Utilize Client Components somente quando necessário.

Casos comuns:

- `useState`;
- `useEffect`;
- Event handlers;
- Browser APIs;
- Interações client-side;
- Bibliotecas dependentes do navegador.

Mantenha a fronteira client-side pequena.

Evite transformar uma página inteira em Client Component quando somente um pequeno componente precisa de interatividade.

---

# 13. Data Fetching

O acesso a dados deve ocorrer preferencialmente no servidor quando possível.

Antes de criar um novo mecanismo de fetching:

1. Verifique a arquitetura existente;
2. Verifique serviços existentes;
3. Verifique repositories;
4. Verifique Server Actions;
5. Verifique mecanismos de cache existentes.

Evite múltiplas abstrações para resolver o mesmo problema.

---

# 14. Validação de entrada

Nunca confie em dados fornecidos pelo client.

Todos os dados externos devem ser considerados não confiáveis.

Valide:

- Formulários;
- Body de requests;
- Search params;
- Route params;
- Headers relevantes;
- Dados de integrações;
- Payloads de Server Actions.

A validação client-side melhora UX, mas **não substitui a validação server-side**.

---

# 15. Autenticação

Autenticação deve ser centralizada.

Evite implementar verificações de autenticação manualmente em dezenas de páginas.

A arquitetura deve possuir uma estratégia consistente para:

- Identificação do usuário;
- Sessão;
- Login;
- Logout;
- Expiração;
- Renovação;
- Proteção de rotas;
- Proteção de APIs;
- Proteção de Server Actions.

---

# 16. Autorização

Autenticação e autorização são responsabilidades diferentes.

Autenticação responde:

> Quem é o usuário?

Autorização responde:

> O usuário pode executar esta operação?

Toda operação sensível deve validar autorização no servidor.

Nunca considere suficiente:

```text id="2q7n9w"
Esconder botão no frontend
```

ou:

```text id="6z4m1p"
Verificar permissão apenas no Client Component
```

A autorização deve ocorrer próximo da operação protegida.

---

# 17. Segurança

A aplicação deve seguir o princípio de:

> **Nunca confiar no client.**

Boas práticas:

- Validar entradas no servidor;
- Autorizar operações no servidor;
- Evitar exposição de dados sensíveis;
- Não armazenar secrets no client;
- Utilizar variáveis de ambiente;
- Não versionar secrets;
- Sanitizar dados quando necessário;
- Utilizar queries parametrizadas;
- Evitar SQL injection;
- Evitar XSS;
- Evitar CSRF quando aplicável;
- Utilizar cookies seguros;
- Aplicar políticas de sessão adequadas;
- Não expor stack traces em produção;
- Não retornar dados desnecessários pelas APIs.

---

# 18. Variáveis de ambiente

Segredos e configurações sensíveis devem utilizar variáveis de ambiente.

Nunca coloque:

```text id="f2r9x5"
API keys
Database credentials
Private tokens
Secrets
```

diretamente no código.

Variáveis destinadas ao browser devem utilizar explicitamente o mecanismo apropriado do Next.js.

Nunca exponha uma variável privada apenas adicionando o prefixo público.

---

# 19. Tratamento de erros

Erros devem ser tratados de maneira consistente.

Utilize os mecanismos apropriados do Next.js:

```text id="w6j3t8"
error.tsx
not-found.tsx
loading.tsx
```

Quando apropriado, utilize também:

```text id="q5k8v2"
try/catch
Result patterns
Error boundaries
```

Não exponha detalhes internos para o usuário.

Evite retornar:

```text id="n8s4m1"
Stack traces
Database errors
Internal paths
Secrets
```

em respostas públicas.

---

# 20. Logging e observabilidade

Logs devem ser úteis para diagnóstico sem expor informações sensíveis.

Nunca registre:

```text id="b3x7k9"
Passwords
Tokens
Session secrets
Credit card data
Sensitive personal data
```

Utilize logs estruturados quando apropriado.

Em produção, considere mecanismos de:

- Error tracking;
- Performance monitoring;
- Request tracing;
- Métricas;
- Auditoria de operações sensíveis.

---

# 21. Testes

A arquitetura deve permitir diferentes níveis de testes.

## Testes unitários

Utilize para:

- Regras de negócio;
- Funções;
- Hooks;
- Transformações;
- Validações;
- Serviços isolados.

---

## Testes de integração

Utilize para verificar a interação entre:

```text id="t4q8n2"
Feature
Service
Repository
API
Database
```

quando necessário.

---

## Testes E2E

Utilize para validar fluxos críticos do usuário.

Exemplos:

```text id="p8r2m6"
Login
Cadastro
Checkout
Criação de conteúdo
Atualização de perfil
Fluxos principais da aplicação
```

---

# 22. Pirâmide de testes

Priorize:

```text id="j3w7q9"
          E2E
         /   \
    Integração
      /       \
     Unitários
```

Sempre que possível:

- Muitos testes unitários;
- Quantidade moderada de testes de integração;
- E2E focados em fluxos críticos.

Evite utilizar E2E para testar regras que poderiam ser verificadas de maneira muito mais rápida através de testes unitários.

---

# 23. Testabilidade como critério arquitetural

Ao criar uma nova feature, pergunte:

```text id="y4m8p2"
Consigo testar a regra sem renderizar toda a aplicação?
Consigo testar o comportamento sem depender do banco real?
Consigo testar a UI através de props?
Consigo testar o fluxo crítico através de E2E?
```

Se a resposta for não, avalie se existe um problema de separação de responsabilidades.

---

# 24. Acessibilidade

A arquitetura não deve comprometer acessibilidade.

Todos os componentes devem considerar:

- HTML semântico;
- Navegação por teclado;
- Focus management;
- Labels;
- ARIA;
- Contraste;
- Estados de erro;
- Estados de loading;
- Leitores de tela.

A acessibilidade deve fazer parte da implementação e dos testes.

---

# 25. Performance

Performance deve ser considerada desde a arquitetura.

Priorize:

- Server Components;
- Server-side data fetching;
- Streaming;
- Suspense;
- Code splitting;
- Lazy loading quando apropriado;
- Otimização de imagens;
- Redução de JavaScript client-side;
- Cache adequado;
- Evitar renders desnecessários.

Não otimize prematuramente.

Primeiro identifique o problema, depois aplique a otimização apropriada.

---

# 26. Dependências externas

Antes de adicionar uma biblioteca:

1. Verifique se o projeto já possui uma solução equivalente;
2. Avalie se a funcionalidade pode ser implementada sem dependência;
3. Avalie tamanho e impacto no bundle;
4. Avalie manutenção do projeto;
5. Avalie segurança;
6. Avalie compatibilidade com Next.js;
7. Avalie licença;
8. Avalie necessidade de Client Component.

Evite dependências redundantes.

---

# 27. Código morto e duplicação

Durante novas implementações e refatorações:

- Remova código morto;
- Remova imports não utilizados;
- Evite duplicação;
- Evite componentes equivalentes;
- Evite múltiplas implementações da mesma regra;
- Reutilize abstrações existentes quando apropriado.

Não faça grandes refatorações não relacionadas à tarefa atual.

---

# 28. Convenções

Componentes devem seguir:

```text id="v8m3q1"
*.ui.tsx
*.widget.tsx
```

conforme definido em:

```text id="docs/architecture/COMPONENT-ARCHITETURE.md"

```

Features devem seguir:

```text id="x5k9r2"
components/features/<feature>/
```

e utilizar somente as camadas necessárias.

---

# 29. Processo para criação de uma nova Feature

Ao criar uma nova funcionalidade:

### Etapa 1 — Entender o domínio

Defina:

- Qual problema a feature resolve;
- Quais são suas responsabilidades;
- Quais dados utiliza;
- Quais regras possui;
- Quais interações existem.

### Etapa 2 — Pesquisar a codebase

Antes de implementar:

- Procure componentes existentes;
- Procure hooks;
- Procure services;
- Procure repositories;
- Procure schemas;
- Procure tipos;
- Procure funcionalidades semelhantes.

### Etapa 3 — Definir o módulo

Crie:

```text id="h7v2p4"
components/features/<feature>/
```

somente com as camadas necessárias.

### Etapa 4 — Implementar

Mantenha:

```text id="k3n8w6"
Page
 ↓
Widget
 ↓
UI
```

quando a complexidade justificar.

### Etapa 5 — Segurança

Verifique:

- Autenticação;
- Autorização;
- Validação;
- Dados sensíveis;
- Permissões;
- Server/Client boundary.

### Etapa 6 — Testes

Implemente:

- Unit;
- Integration;
- E2E;

conforme a necessidade da funcionalidade.

---

# 30. Processo para refatoração

Antes de refatorar:

1. Entenda o comportamento atual;
2. Identifique responsabilidades;
3. Identifique dependências;
4. Identifique riscos;
5. Verifique testes existentes;
6. Defina a arquitetura desejada;
7. Faça a menor mudança necessária;
8. Execute os testes;
9. Execute type-check;
10. Execute lint;
11. Execute build.

A refatoração deve preservar o comportamento existente.

---

# 31. Definition of Done

Uma nova feature ou refatoração só deve ser considerada concluída quando:

```text id="r7p2m5"
[ ] Responsabilidades estão claras
[ ] Feature está corretamente isolada
[ ] Page possui responsabilidade adequada
[ ] UI está separada da lógica quando necessário
[ ] Server/Client boundaries estão corretas
[ ] Dados são validados
[ ] Operações sensíveis são autorizadas
[ ] Não existem secrets expostos
[ ] Testes relevantes foram implementados
[ ] Testes existentes continuam passando
[ ] TypeScript passa
[ ] Lint passa
[ ] Build passa
[ ] Acessibilidade foi preservada
[ ] Performance foi considerada
[ ] Não existe duplicação desnecessária
[ ] Não foram criadas abstrações sem necessidade
[ ] Documentação foi atualizada quando necessário
```

---

# 32. Regra de ouro

A arquitetura deve seguir o seguinte princípio:

> **Organize o código de acordo com as responsabilidades e funcionalidades do produto, não apenas de acordo com o tipo técnico dos arquivos.**

Prefira:

```text id="b5k9x2"
Feature
├── UI
├── Widget
├── Hooks
├── Actions
├── Services
├── Repositories
├── Schemas
└── Types
```

quando essas camadas forem realmente necessárias.

Evite:

```text id="j8m3q6"
Criar todas as pastas para todas as features
```

sem necessidade.

A arquitetura deve crescer junto com a complexidade do domínio.

---

# 33. Princípio final

Sempre faça três perguntas antes de adicionar uma nova abstração:

```text id="f2q7m9"
1. Qual problema isso resolve?
2. Essa responsabilidade pertence realmente a este módulo?
3. A complexidade adicionada é menor que o benefício obtido?
```

Se não houver uma resposta clara, prefira a solução mais simples.

> **A melhor arquitetura não é a que possui mais camadas. É a que torna as responsabilidades do sistema mais claras, testáveis, seguras e fáceis de evoluir.**

### Eu usaria os dois documentos juntos

A arquitetura geral ficaria:

```text
docs/
└── architecture/
    ├── APPLICATION-ARCHITETURE.md
    └── COMPONENT-ARCHITETURE.md
```

Com uma relação hierárquica:

```text
APPLICATION-ARCHITETURE.md
        │
        ├── Feature Modules
        ├── Segurança
        ├── Testes
        ├── Data fetching
        ├── Server/Client
        └── Organização da aplicação
                  │
                  ▼
COMPONENT-ARCHITETURE.md
        │
        ├── Page
        ├── Widget
        ├── UI
        └── Convenções de componentes
```

**Uma melhoria importante:** eu evitaria transformar `Feature Module` em uma regra que obrigatoriamente exige `services`, `repositories`, `hooks`, `schemas`, etc. em toda feature. O princípio **“crie somente as camadas necessárias”** é fundamental para evitar over-engineering.

E no `AGENTS.md`, você pode ter uma seção central apontando para os dois:

```md
## Arquitetura

Antes de criar, modificar ou refatorar código, consulte:

- `docs/architecture/APPLICATION-ARCHITETURE.md`
  - Arquitetura geral da aplicação
  - Feature Modules
  - Segurança
  - Testes
  - Data fetching
  - Server/Client Components
  - Organização da codebase

- `docs/architecture/COMPONENT-ARCHITETURE.md`
  - Page
  - Widget
  - UI
  - Criação e refatoração de componentes
  - Convenções de nomenclatura

As decisões devem priorizar simplicidade, baixo acoplamento,
alta coesão, testabilidade e segurança.

Não introduza abstrações ou camadas sem uma necessidade real.
```
