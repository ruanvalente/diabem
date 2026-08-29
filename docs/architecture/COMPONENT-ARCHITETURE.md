# Arquitetura e Diretrizes de Componentes

## Visão geral

Este documento define as regras arquiteturais e convenções para **criação, organização e refatoração de componentes** na aplicação Next.js.

O objetivo é manter uma codebase:

- Simples;
- Previsível;
- Testável;
- Manutenível;
- Reutilizável;
- Acessível;
- Consistente com o Next.js App Router;
- Baseada em uma separação clara de responsabilidades.

Estas diretrizes devem ser utilizadas tanto para **novos componentes** quanto para **componentes existentes que precisem ser refatorados**.

---

# 1. Princípio fundamental

Os componentes devem possuir responsabilidades claras e bem definidas.

Para funcionalidades complexas, a arquitetura preferencial é:

```text
Page
  ↓
Widget
  ↓
UI
```

Onde:

| Camada | Responsabilidade                                |
| ------ | ----------------------------------------------- |
| Page   | Ponto de entrada da rota e composição da página |
| Widget | Lógica, estado, comportamento e orquestração    |
| UI     | Apresentação e renderização                     |

Essa arquitetura deve ser aplicada **quando houver uma necessidade real baseada na complexidade da funcionalidade**.

Não crie camadas adicionais apenas para seguir um padrão.

---

# 2. Componentes de página

As páginas ficam dentro do App Router do Next.js:

```text
app/
```

Uma página é representada por:

```text
page.tsx
```

Exemplo:

```text
app/
└── dashboard/
    └── page.tsx
```

A principal responsabilidade de um `page.tsx` é funcionar como o **ponto de entrada da rota**.

Uma página deve, preferencialmente, ser responsável por:

- Composição da rota;
- Recebimento de parâmetros da rota;
- Recebimento de search params;
- Composição server-side;
- Conectar a rota à feature correspondente;
- Passar dados ou parâmetros necessários para os componentes da feature.

Evite colocar lógica complexa diretamente dentro do `page.tsx`.

---

# 3. Quando uma página deve ser refatorada?

Um `page.tsx` deve ser considerado para refatoração quando possuir múltiplas responsabilidades independentes.

Alguns indicadores:

- Gerenciamento de estado complexo;
- Muitos hooks;
- Effects complexos;
- Chamadas de API misturadas com apresentação;
- Regras de negócio;
- Event handlers complexos;
- Transformação de dados;
- Múltiplas seções independentes da interface;
- Loading states complexos;
- Error states complexos;
- Empty states complexos;
- Grandes blocos de renderização condicional;
- Interações complexas;
- Componentes definidos diretamente dentro da página;
- Lógica difícil de testar;
- Lógica que poderia ser reutilizada;
- Forte acoplamento entre UI e comportamento.

Entretanto:

> **O tamanho do arquivo, por si só, não é motivo suficiente para realizar uma refatoração.**

Uma página grande pode possuir uma responsabilidade clara.

Uma página pequena pode possuir uma separação de responsabilidades ruim.

A decisão deve considerar principalmente **responsabilidade, complexidade e acoplamento**.

---

# 4. Páginas simples

Páginas simples devem continuar simples.

Por exemplo:

```tsx
export default function AboutPage() {
  return (
    <main>
      <h1>Sobre</h1>
      <p>Informações sobre a aplicação.</p>
    </main>
  );
}
```

Não é necessário criar:

```text
components/features/about/
├── ui/
└── widget/
```

apenas para seguir uma convenção.

Evite abstrações desnecessárias.

---

# 5. Arquitetura baseada em Feature

Quando uma página possuir uma funcionalidade complexa, a funcionalidade deve ser isolada em:

```text
components/features/<nome-da-feature>/
```

Exemplo:

```text
components/
└── features/
    └── dashboard/
        ├── ui/
        └── widget/
```

Outros exemplos:

```text
components/features/
├── dashboard/
├── profile/
├── settings/
├── checkout/
├── books/
└── authentication/
```

O nome da feature deve representar uma **funcionalidade real do produto**, e não apenas um agrupamento arbitrário de componentes.

---

# 6. Componentes de UI

A pasta:

```text
ui/
```

deve conter exclusivamente componentes focados em **apresentação**.

Estrutura:

```text
components/features/<feature>/ui/
```

### Convenção de nomenclatura

Todos os componentes devem utilizar:

```text
<nome-do-componente>.ui.tsx
```

Exemplos:

```text
summary-card.ui.tsx
activity-list.ui.tsx
profile-header.ui.tsx
empty-state.ui.tsx
book-card.ui.tsx
```

## Características de um componente UI

Um componente UI deve:

- Ser focado em apresentação;
- Receber dados através de props;
- Não possuir regras de negócio;
- Não realizar chamadas de API;
- Não realizar data fetching;
- Não possuir efeitos colaterais;
- Não realizar orquestração da feature;
- Evitar estado relacionado à lógica da feature;
- Poder ser testado isoladamente.

Exemplo:

```tsx
type SummaryCardProps = {
  title: string;
  value: string;
  description?: string;
};

export function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      <strong>{value}</strong>

      {description && <p>{description}</p>}
    </article>
  );
}
```

O componente recebe através de props tudo aquilo que precisa para renderizar sua interface.

---

# 7. Componentes Widget

A pasta:

```text
widget/
```

deve conter componentes responsáveis por **lógica, comportamento e orquestração**.

Estrutura:

```text
components/features/<feature>/widget/
```

### Convenção de nomenclatura

Todos os componentes devem utilizar:

```text
<nome-do-componente>.widget.tsx
```

Exemplos:

```text
dashboard-overview.widget.tsx
user-list.widget.tsx
profile-form.widget.tsx
book-reader.widget.tsx
checkout-summary.widget.tsx
```

## Características de um Widget

Um Widget pode:

- Gerenciar estado;
- Utilizar hooks;
- Utilizar effects;
- Controlar interações;
- Coordenar componentes;
- Manipular dados;
- Consumir APIs;
- Utilizar hooks específicos da feature;
- Controlar loading;
- Controlar error;
- Controlar success;
- Aplicar regras específicas da feature;
- Coordenar múltiplos componentes UI.

Exemplo:

```tsx
"use client";

import { SummaryCard } from "../ui/summary-card.ui";
import { ActivityList } from "../ui/activity-list.ui";

export function DashboardOverviewWidget() {
  const data = useDashboardData();

  return (
    <>
      <SummaryCard title="Total" value={data.total} />

      <ActivityList items={data.activities} />
    </>
  );
}
```

O Widget conecta dados, comportamento e componentes de apresentação.

---

# 8. Relação Page → Widget → UI

Para funcionalidades complexas, utilize preferencialmente:

```text
app/
└── dashboard/
    └── page.tsx
          │
          ▼
components/
└── features/
    └── dashboard/
        └── widget/
            └── dashboard-overview.widget.tsx
                    │
                    ├── summary-card.ui.tsx
                    ├── activity-list.ui.tsx
                    └── empty-state.ui.tsx
```

A direção das dependências deve ser preferencialmente:

```text
Page
  ↓
Widget
  ↓
UI
```

Evite:

```text
UI
  ↓
Widget
```

e evite dependências circulares.

---

# 9. Server Components e Client Components

A aplicação utiliza o **Next.js App Router**.

Server Components devem ser o padrão sempre que possível.

Não adicione:

```tsx
"use client";
```

sem uma necessidade real.

Um Client Component pode ser necessário quando houver:

- `useState`;
- `useEffect`;
- Event handlers;
- APIs do navegador;
- Interações client-side;
- Estado exclusivamente client-side;
- Bibliotecas que dependem do navegador.

Mantenha a fronteira Client Component o menor possível.

Não transforme uma feature inteira em Client Component simplesmente porque um de seus componentes necessita de comportamento client-side.

---

# 10. Data Fetching

O acesso a dados deve permanecer na camada arquitetural apropriada.

Antes de mover uma operação de data fetching, avalie se ela pertence a:

- Server Component;
- Widget;
- Hook;
- Service;
- Repository;
- Server Action;
- Outra abstração existente no projeto.

Não mova data fetching para o client apenas para facilitar a extração de componentes.

Preserve a arquitetura server-side existente quando ela for adequada.

---

# 11. Hooks

Hooks específicos de uma feature podem ficar próximos da própria feature.

Exemplo:

```text
components/
└── features/
    └── dashboard/
        ├── hooks/
        │   └── use-dashboard.ts
        ├── ui/
        └── widget/
```

Extraia um hook quando ele representar uma responsabilidade clara ou um comportamento reutilizável.

Não crie hooks apenas para diminuir o tamanho de um arquivo.

Evite abstrações artificiais como:

```text
useDashboardTitle()
useDashboardValue()
useDashboardButton()
```

quando esses hooks não possuem uma responsabilidade significativa.

Prefira abstrações que representem comportamentos reais:

```text
useDashboardData()
useDashboardFilters()
useDashboardPermissions()
```

---

# 12. Componentes compartilhados

Antes de criar um novo componente, pesquise a codebase.

Verifique:

```text
components/
components/ui/
components/shared/
components/features/
```

Determine se já existe um componente que possa ser reutilizado.

Evite duplicação.

Não mova componentes globais para uma feature apenas para facilitar uma refatoração.

Quando um componente for realmente compartilhado entre múltiplas features, ele deve permanecer em uma localização compartilhada apropriada.

---

# 13. Regras para extração de componentes

Ao refatorar um componente existente, identifique primeiro suas responsabilidades.

Por exemplo, se uma página contém:

```text
Data fetching
Estado
Regras de negócio
Formulário
Apresentação
```

não divida o arquivo de maneira arbitrária.

Identifique limites reais:

```text
Page
  ↓
Feature Widget
  ├── Form UI
  ├── Summary UI
  └── List UI
```

Cada componente extraído deve possuir uma responsabilidade clara.

---

# 14. Evitar Over-engineering

Não crie abstrações sem uma justificativa concreta.

Evite:

- Componentes com poucas linhas e nenhuma responsabilidade própria;
- Hooks que apenas encapsulam outra função;
- Providers desnecessários;
- Contextos desnecessários;
- Pastas excessivamente aninhadas;
- Abstrações genéricas sem reutilização;
- Componentes criados apenas para diminuir o número de linhas;
- Widgets que não possuem lógica significativa.

A arquitetura deve facilitar a compreensão do código, e não torná-lo mais complexo.

---

# 15. TypeScript

Todos os componentes devem manter boas práticas de TypeScript.

Regras:

- Não introduzir `any`;
- Utilizar props explicitamente tipadas;
- Reutilizar tipos existentes;
- Evitar duplicação de tipos;
- Evitar type assertions desnecessárias;
- Não utilizar casts para esconder problemas;
- Preservar o TypeScript strict;
- Manter os tipos próximos ao domínio ao qual pertencem.

Exemplo:

```tsx
type UserCardProps = {
  name: string;
  email: string;
  avatarUrl?: string;
};
```

---

# 16. Acessibilidade

Nenhuma refatoração deve reduzir a acessibilidade existente.

Preserve:

- HTML semântico;
- Navegação por teclado;
- Gerenciamento de foco;
- Atributos ARIA;
- Nomes acessíveis;
- Labels de formulários;
- Comportamento para leitores de tela;
- Contraste;
- Semântica dos elementos interativos.

Não substitua elementos semânticos por elementos genéricos apenas para facilitar a implementação.

---

# 17. Testes

Componentes que possuem comportamento significativo devem ser testáveis isoladamente.

Priorize testes para:

- Widgets com lógica complexa;
- Interações do usuário;
- Formulários;
- Transformação de dados;
- Regras de negócio;
- Loading states;
- Error states;
- Empty states;
- Renderizações condicionais importantes.

Componentes puramente visuais devem possuir testes quando sua apresentação ou comportamento condicional justificar.

Uma refatoração nunca deve reduzir a cobertura de testes existente sem uma justificativa explícita.

---

# 18. Checklist de refatoração

Antes de refatorar um componente, responda:

```text
[ ] Qual é a responsabilidade atual deste componente?
[ ] Ele possui mais de uma responsabilidade significativa?
[ ] UI e lógica estão misturadas?
[ ] Estado e apresentação estão misturados?
[ ] Data fetching está misturado com apresentação?
[ ] Existem interações complexas?
[ ] Existem partes reutilizáveis?
[ ] Já existe um componente equivalente na codebase?
[ ] Um Widget realmente é necessário?
[ ] Componentes UI realmente são necessários?
[ ] A extração melhora a testabilidade?
[ ] A extração melhora a manutenção?
[ ] O comportamento atual será preservado?
```

Se a maioria das respostas indicar que a estrutura atual é adequada, **não refatore**.

---

# 19. Auditoria de páginas existentes

Ao realizar uma auditoria na aplicação, percorra:

```text
app/**/page.tsx
```

Para cada página, analise:

```text
Responsabilidade
Complexidade
Estado
Hooks
Effects
Data fetching
Regras de negócio
UI
Composição
Dependências
Testabilidade
Server/Client boundary
```

Cada página deve ser classificada como:

```text
KEEP
```

ou:

```text
REFACTOR
```

### KEEP

Utilize quando:

- A responsabilidade está clara;
- A complexidade é baixa ou adequada;
- Não existe mistura significativa entre lógica e apresentação;
- A extração não traria benefício relevante.

Nesse caso, não faça alterações.

### REFACTOR

Utilize quando:

- Existem responsabilidades independentes;
- Existe lógica significativa;
- Existem componentes independentes;
- UI e comportamento estão fortemente acoplados;
- A manutenção ou testabilidade está sendo prejudicada.

Nesse caso, defina uma estratégia de refatoração antes de modificar o código.

---

# 20. Convenções de nomenclatura

## Componentes UI

```text
<nome>.ui.tsx
```

Exemplos:

```text
user-card.ui.tsx
settings-header.ui.tsx
book-card.ui.tsx
```

## Componentes Widget

```text
<nome>.widget.tsx
```

Exemplos:

```text
user-list.widget.tsx
settings-form.widget.tsx
book-reader.widget.tsx
```

Evite nomes genéricos como:

```text
component.tsx
component.ui.tsx
component.widget.tsx
main.tsx
container.tsx
wrapper.tsx
```

quando existir um nome que represente melhor a responsabilidade do componente.

---

# 21. Definição de pronto

Uma refatoração é considerada concluída quando:

- As responsabilidades estão claramente separadas;
- A estrutura ficou mais fácil de compreender;
- A UI está desacoplada da lógica complexa;
- Widgets concentram o comportamento da feature;
- Pages permanecem focadas na composição da rota;
- As fronteiras Server/Client foram preservadas;
- O comportamento existente foi preservado;
- O TypeScript passa;
- Os testes passam;
- O lint passa;
- O build passa;
- Nenhuma abstração desnecessária foi introduzida;
- Nenhum componente duplicado foi criado;
- A acessibilidade foi preservada.

---

# 22. Regra de ouro

Sempre siga este princípio:

> **Não refatore porque existe um padrão. Refatore porque existe um problema de responsabilidade.**

A arquitetura existe para tornar a codebase mais fácil de:

- Entender;
- Testar;
- Manter;
- Reutilizar;
- Evoluir.

Prefira:

```text
Página simples
      ↓
Página simples
```

quando a página já estiver adequada.

E:

```text
Página complexa
      ↓
Page
  ↓
Widget
  ↓
UI
```

quando houver uma necessidade real de separação.

A melhor arquitetura é aquela que utiliza a **menor quantidade de abstrações necessárias para representar claramente as responsabilidades da funcionalidade**.
