# Sprint 4 — Experience

## Objetivo

Evoluir o DiaBem de uma aplicação de registro de dados para uma experiência de acompanhamento clara, intuitiva e contextual.

Nesta sprint, implementar:

- Dashboard;
- Timeline unificada;
- Filtros;
- Gráficos;
- Resumos visuais;
- Estados de carregamento, vazio e erro;
- Experiência responsiva e acessível.

A experiência deve permitir que o usuário compreenda rapidamente:

- o que registrou recentemente;
- como seus registros estão distribuídos;
- como os valores de glicemia variam ao longo do tempo;
- quais informações estão associadas a determinados períodos;
- como encontrar registros específicos.

A Sprint 4 **não deve implementar diagnóstico, recomendações médicas, IA ou análise preditiva**.

A camada de Analytics/Insights deverá ser implementada posteriormente.

---

# 1. Analisar a codebase antes de implementar

Antes de qualquer alteração, analise a implementação atual.

Verifique especialmente:

### Sprint 2

- IndexedDB;
- Dexie;
- repositories;
- services;
- autenticação;
- sessão;
- isolamento por `userId`;
- schemas Zod.

### Sprint 3

- Glucose;
- Meal;
- Activity;
- Note;
- repositories;
- services;
- hooks;
- formulários;
- timeline, caso já exista;
- componentes reutilizáveis.

Também verificar:

- arquitetura atual;
- componentes shadcn/ui;
- sistema de navegação;
- layout;
- responsividade;
- tema;
- tokens de design;
- testes;
- gerenciamento de estado;
- estratégias de loading/error.

Não recriar funcionalidades existentes.

Não duplicar repositories.

Não acessar IndexedDB diretamente nos componentes.

Antes da implementação, apresente:

1. arquitetura atual;
2. componentes que podem ser reutilizados;
3. dados já disponíveis;
4. pontos que precisam ser adaptados;
5. novos componentes necessários;
6. riscos técnicos;
7. estratégia de implementação.

---

# 2. Princípios de UX

A experiência deve seguir o conceito de:

> **Personal Health Companion**

O sistema deve parecer um companheiro pessoal de acompanhamento, e não um sistema hospitalar.

Priorizar:

- simplicidade;
- clareza;
- baixa carga cognitiva;
- feedback contextual;
- hierarquia visual;
- leitura rápida;
- consistência;
- acessibilidade;
- mobile-first.

Evitar:

- excesso de cards;
- excesso de cores;
- dashboards visualmente carregados;
- gráficos sem contexto;
- tabelas complexas;
- linguagem excessivamente médica;
- informações sem utilidade prática.

---

# 3. Estrutura da experiência

Criar ou evoluir a navegação principal:

```text id="7f0a7f"
Dashboard
│
├── Resumo
├── Atalhos
├── Glicemia
├── Timeline
├── Alimentação
├── Atividade
└── Observações
```

A dashboard deve ser o ponto de entrada principal após o login.

---

# 4. Dashboard

Criar/evoluir:

```text id="bxkjbr"
/dashboard
```

A dashboard deve responder rapidamente:

> "Como estão meus registros recentemente?"

---

# 5. Header da Dashboard

Exemplo:

```text id="jpd6rm"
Bom dia, Ruan 👋

Aqui está um resumo dos seus registros.

[ Registrar ]
```

Não utilizar informações médicas presumidas.

O texto deve ser contextualizado de acordo com o horário do usuário.

Exemplo:

```text
Bom dia
Boa tarde
Boa noite
```

---

# 6. Quick Actions

Adicionar uma seção de ações rápidas:

```text id="t74w1r"
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

No mobile, utilizar uma composição confortável para toque.

Os componentes devem reutilizar os formulários da Sprint 3.

Não duplicar lógica de criação.

---

# 7. Resumo dos últimos registros

Criar uma seção com os registros mais recentes.

Exemplo:

```text id="5cmgwu"
Últimos registros

🩸 128 mg/dL
Hoje · 08:30
Jejum

🍽️ Café da manhã
Hoje · 08:45

🏃 Caminhada · 30 min
Ontem · 18:20
```

Adicionar:

```text
[ Ver timeline ]
```

O resumo deve utilizar os repositories/services existentes.

---

# 8. Card de glicemia

Criar um componente reutilizável:

```text id="p4w4hj"
GlucoseSummaryCard
```

Exemplo:

```text id="q0w8kj"
Glicemia

128 mg/dL

Último registro
Hoje · 08:30

[ Ver histórico ]
```

Caso não existam dados:

```text id="1h4kby"
Glicemia

Nenhum registro ainda.

[ Registrar glicemia ]
```

Não classificar automaticamente o usuário como saudável/doente.

Evitar mensagens como:

> "Sua glicemia está ótima."

O componente deve apresentar dados, não diagnósticos.

---

# 9. Resumo de registros

Criar indicadores simples:

```text id="w7ux2k"
Registros

Glicemia       18
Refeições      12
Atividades      7
Observações     4
```

Permitir período:

```text
Hoje
7 dias
30 dias
```

Esses valores devem ser calculados a partir dos dados reais.

---

# 10. Timeline unificada

Criar uma timeline consolidada:

```text id="oq2r0p"
/timeline
```

A timeline deve combinar:

```text
GlucoseReading
Meal
Activity
Note
```

Exemplo:

```text id="75o2hw"
Hoje

08:00
🩸 Glicemia
128 mg/dL
Jejum

08:30
🍳 Café da manhã
Ovos, pão integral e café

10:00
🏃 Caminhada
30 minutos

14:20
🩸 Glicemia
143 mg/dL
Após refeição

18:30
📝 Observação
"Dia mais corrido que o normal"
```

---

# 11. Modelo de TimelineItem

Criar uma representação visual comum.

Exemplo:

```ts id="m4f5lo"
type TimelineItem = {
  id: string;
  userId: string;
  type: "glucose" | "meal" | "activity" | "note";
  timestamp: string;
  data: unknown;
};
```

Não modificar desnecessariamente os modelos de domínio existentes.

Criar um adapter/mapper se necessário:

```text id="6m2n1p"
Domain Entities
      ↓
Timeline Mapper
      ↓
TimelineItem
      ↓
Timeline UI
```

Isso evita acoplar a interface aos modelos específicos de cada feature.

---

# 12. Ordenação da Timeline

A timeline deve:

- ordenar por data/hora;
- agrupar por dia;
- mostrar registros mais recentes primeiro;
- utilizar timezone do usuário;
- lidar corretamente com mudanças de data;
- lidar com registros históricos.

Exemplo:

```text id="bqg3oc"
Hoje
────────────────────

Ontem
────────────────────

27 de agosto
────────────────────
```

---

# 13. Filtros

Criar um sistema de filtros reutilizável.

Filtros mínimos:

```text id="d7fs9z"
Período
Tipo de registro
```

Períodos:

```text
Hoje
7 dias
30 dias
Personalizado
```

Tipos:

```text
Todos
Glicemia
Alimentação
Atividade
Observações
```

---

# 14. Filtro de período personalizado

Permitir:

```text id="xck5cm"
De
[ 01/08/2026 ]

Até
[ 29/08/2026 ]

[ Aplicar ]
```

Validar:

```text
data inicial <= data final
```

Não permitir intervalos inválidos.

---

# 15. Estado dos filtros

Os filtros devem possuir um estado centralizado.

Evitar que cada componente mantenha sua própria versão dos filtros.

Exemplo conceitual:

```ts id="5ik7kf"
type TimelineFilters = {
  startDate?: string;
  endDate?: string;
  types?: TimelineItemType[];
};
```

Criar hooks/utilitários quando apropriado:

```ts id="e15v9x"
useTimelineFilters();
```

---

# 16. UX dos filtros

Desktop:

```text id="x6m2f9"
Período: [ Últimos 7 dias ▼ ]

Tipo:
[ Todos ] [ 🩸 ] [ 🍽️ ] [ 🏃 ] [ 📝 ]
```

Mobile:

```text id="78wrlu"
[ Filtrar ]
```

Abrir:

```text
┌───────────────────────┐
│ Filtros               │
│                       │
│ Período               │
│ ○ Hoje                │
│ ○ 7 dias              │
│ ○ 30 dias             │
│ ○ Personalizado       │
│                       │
│ Tipo                  │
│ ☑ Glicemia            │
│ ☑ Alimentação         │
│ ☐ Atividade            │
│ ☐ Observação           │
│                       │
│ [ Limpar ] [ Aplicar ]│
└───────────────────────┘
```

Utilizar `Sheet`, `Popover`, `Select`, `Checkbox`, `RadioGroup` e outros componentes shadcn/ui conforme apropriado.

---

# 17. Gráficos

Criar uma camada de visualização para dados históricos.

Utilizar uma biblioteca de gráficos adequada e compatível com React/Next.js.

Antes de adicionar uma dependência nova, verificar se já existe alguma biblioteca na codebase.

Os gráficos devem ser:

- responsivos;
- acessíveis quando possível;
- legíveis em mobile;
- consistentes visualmente;
- independentes da camada de persistência.

---

# 18. Gráfico de glicemia

Criar:

```text id="5l6z8m"
Glicemia ao longo do tempo
```

Exemplo conceitual:

```text id="7h2g0x"
mg/dL

180 ┤                 ●
160 ┤       ●     ●
140 ┤   ●       ●
120 ┤ ●     ●
100 ┤
    └────────────────────
      24  25  26  27  28
```

Exibir:

- eixo temporal;
- valores;
- tooltip;
- período selecionado;
- quantidade de registros.

Não desenhar linhas ou faixas que representem "normalidade clínica" sem uma base e contexto apropriados.

---

# 19. Gráfico de distribuição

Criar uma visualização da distribuição dos registros.

Exemplo:

```text id="f3gqz7"
Registros por período

Manhã     ███████████
Tarde     ██████████████
Noite     ███████
```

O objetivo é mostrar **distribuição dos registros**, não avaliar clinicamente o usuário.

---

# 20. Gráfico de atividades

Mostrar:

```text id="a9o4kj"
Atividade nos últimos 7 dias

Seg  ███
Ter  █████
Qua  ██
Qui  ████
Sex  ██████
```

Métrica inicial:

```text
minutos registrados
```

Posteriormente, outras métricas poderão ser adicionadas.

---

# 21. Gráfico de refeições

Mostrar quantidade de refeições registradas por dia/período.

Exemplo:

```text id="wq1b9x"
Refeições registradas

Seg  ████
Ter  ███
Qua  █████
Qui  ██
Sex  ████
```

Não interpretar automaticamente a qualidade da alimentação.

---

# 22. Período global

Dashboard e gráficos devem possuir um período consistente.

Opções:

```text
Hoje
Últimos 7 dias
Últimos 30 dias
Personalizado
```

Quando o usuário mudar o período:

```text id="9v3m5g"
Dashboard
   ↓
Filter State
   ↓
Repositories / Services
   ↓
Data
   ↓
Charts
   ↓
Summary
```

Evitar cada gráfico consultar períodos diferentes sem uma razão explícita.

---

# 23. Camada de transformação dos dados

Não colocar lógica complexa de transformação dentro dos componentes.

Criar uma camada:

```text id="lhv7d8"
lib/
└── analytics/
    ├── aggregators/
    ├── mappers/
    └── types/
```

Exemplo:

```ts id="jczgkl"
getGlucoseChartData();
getActivityChartData();
getMealChartData();
getTimelineData();
getDashboardSummary();
```

Essa camada deverá preparar os dados para apresentação.

Importante:

> Não implementar ainda algoritmos de análise clínica ou geração de insights.

---

# 24. Dashboard Data Model

Criar um modelo de dados específico para a dashboard quando necessário.

Exemplo:

```ts id="n84bzy"
type DashboardSummary = {
  period: {
    start: string;
    end: string;
  };

  glucose: {
    count: number;
    latest?: GlucoseReading;
  };

  meals: {
    count: number;
  };

  activities: {
    count: number;
    totalMinutes: number;
  };

  notes: {
    count: number;
  };
};
```

Esse modelo deve ser independente da UI.

---

# 25. Empty States

A dashboard precisa funcionar para um usuário que acabou de criar a conta.

Exemplo:

```text id="2y4m6e"
Ainda estamos começando 🌱

Você ainda não possui registros.

Comece adicionando sua primeira informação.

[ Registrar glicemia ]
```

Não mostrar:

```text
0%
Nenhum dado suficiente
Status desconhecido
```

de maneira fria ou clínica.

---

# 26. Dashboard progressiva

Não mostrar dezenas de gráficos quando não existem dados suficientes.

Exemplo:

```text id="w4v7pw"
0 registros

→ mostrar CTA
```

```text
5 registros

→ mostrar resumo simples
```

```text
30+ registros

→ mostrar gráficos mais completos
```

A experiência deve evoluir conforme o usuário acumula dados.

---

# 27. Loading States

Implementar skeletons para:

- dashboard;
- cards;
- timeline;
- gráficos;
- filtros quando necessário.

Evitar spinner global sempre que possível.

Exemplo:

```text id="e2v9hy"
┌────────────────────┐
│ █████████████      │
│ ███████            │
│                    │
│ ███████████████    │
└────────────────────┘
```

---

# 28. Error States

Exemplo:

```text id="o2f4js"
Não foi possível carregar
seus registros.

[ Tentar novamente ]
```

O erro de uma seção não deve necessariamente quebrar toda a dashboard.

Por exemplo:

```text
Dashboard
 ├── Summary       ✓
 ├── Timeline      ✓
 ├── Glucose Chart ✕
 └── Activity      ✓
```

O gráfico pode apresentar seu próprio estado de erro.

---

# 29. Performance

A dashboard poderá consultar muitos registros no futuro.

Portanto:

- evitar consultas redundantes;
- evitar reprocessar todos os dados sem necessidade;
- memoizar transformações quando apropriado;
- paginar listas longas;
- limitar inicialmente registros exibidos;
- utilizar queries eficientes no Dexie;
- evitar renderizações desnecessárias.

Para a timeline, não carregar milhares de registros de uma vez.

---

# 30. Web Worker — preparação

Caso a transformação de dados se torne pesada, preparar a arquitetura para posteriormente mover cálculos para um Web Worker.

Não é obrigatório implementar o Worker nesta sprint se o volume atual de dados não justificar.

A arquitetura deve permitir:

```text id="a9d1zk"
Dashboard
   ↓
Analytics Adapter
   ↓
Local calculation
   ↓
Future Web Worker
```

Isso será evoluído na próxima sprint.

---

# 31. Mobile UX

A experiência mobile deve ser prioridade.

No mobile:

```text id="1s7x3c"
Header

Quick Actions

Resumo

Glicemia

Timeline

Gráficos

Atalhos
```

Evitar:

- tabelas horizontais;
- gráficos pequenos demais;
- filtros sempre expostos;
- cards excessivamente largos;
- múltiplas colunas difíceis de ler.

---

# 32. Desktop UX

No desktop, aproveitar o espaço.

Exemplo:

```text id="v2k7d9"
┌─────────────────────────────────────────────┐
│ Header                                      │
├───────────────────┬─────────────────────────┤
│ Resumo            │ Últimos registros       │
│                   │                         │
├───────────────────┴─────────────────────────┤
│                                             │
│ Glicemia ao longo do tempo                  │
│                                             │
├─────────────────────┬───────────────────────┤
│ Atividade            │ Refeições             │
└─────────────────────┴───────────────────────┘
```

Não forçar essa estrutura no mobile.

---

# 33. Acessibilidade

Garantir:

- navegação por teclado;
- foco visível;
- headings hierárquicos;
- labels;
- aria-labels;
- aria-describedby;
- feedback acessível;
- contraste adequado;
- não depender exclusivamente de cor;
- gráficos acompanhados por informações textuais equivalentes.

Para gráficos, disponibilizar uma alternativa textual ou tabela/resumo quando possível.

Exemplo:

```text
Glicemia nos últimos 7 dias:
24/08: 128 mg/dL
25/08: 134 mg/dL
26/08: 121 mg/dL
...
```

---

# 34. Internacionalização e formatação

Respeitar:

- locale do usuário;
- formato de data;
- formato de hora;
- separador decimal;
- timezone.

Para o MVP, manter a unidade de glicemia:

```text
mg/dL
```

mas estruturar o domínio para permitir suporte futuro a outras unidades.

---

# 35. Segurança e privacidade

Dashboard e timeline devem trabalhar exclusivamente com os dados do usuário autenticado.

Nunca buscar:

```text
todos os registros
```

e filtrar apenas no componente.

Preferir:

```text id="1o2j8x"
currentUser
   ↓
repository
   ↓
query scoped by userId
```

Evitar colocar dados de saúde desnecessários:

- em URLs;
- em logs;
- em analytics externos;
- em mensagens de erro;
- em localStorage.

---

# 36. Testes

Criar testes para:

### Dashboard

- renderização com dados;
- renderização sem dados;
- resumo correto;
- período correto;
- ações rápidas.

### Timeline

- combinação dos diferentes tipos;
- ordenação;
- agrupamento por dia;
- timezone;
- estado vazio.

### Filtros

- hoje;
- 7 dias;
- 30 dias;
- período personalizado;
- tipo de registro;
- múltiplos tipos;
- limpar filtros.

### Gráficos

Testar principalmente a transformação dos dados:

```text
Domain Data
    ↓
Chart Data
```

Não depender excessivamente de snapshots visuais.

---

# 37. Testes de isolamento

Obrigatório.

Criar:

```text id="j4x1cm"
User A
 ├── glucose A
 ├── meals A
 └── activity A

User B
 ├── glucose B
 ├── meals B
 └── activity B
```

Dashboard do User A:

```text
→ somente A
```

Dashboard do User B:

```text
→ somente B
```

---

# 38. Testes E2E

Criar pelo menos:

### Dashboard

```text id="b9k7yz"
Login
 ↓
Dashboard
 ↓
Resumo aparece
 ↓
Quick Action
 ↓
Registrar glicemia
 ↓
Voltar para dashboard
 ↓
Novo registro aparece
```

### Timeline

```text id="4n6k0d"
Login
 ↓
Timeline
 ↓
Registros aparecem
 ↓
Aplicar filtro
 ↓
Somente registros filtrados aparecem
```

### Gráficos

```text id="m1w4cz"
Criar registros
 ↓
Dashboard
 ↓
Selecionar 7 dias
 ↓
Gráfico atualizado
```

---

# 39. Critérios de aceite

A Sprint 4 somente será considerada concluída quando:

- [ ] Dashboard funcional.
- [ ] Dashboard utiliza os dados reais do usuário.
- [ ] Quick Actions implementadas.
- [ ] Resumo dos registros implementado.
- [ ] Timeline unificada implementada.
- [ ] Registros agrupados por dia.
- [ ] Timeline suporta todos os tipos de registros.
- [ ] Filtro por período implementado.
- [ ] Filtro por tipo implementado.
- [ ] Período personalizado implementado.
- [ ] Limpeza de filtros implementada.
- [ ] Gráfico de glicemia implementado.
- [ ] Gráfico de atividades implementado.
- [ ] Gráfico de refeições implementado.
- [ ] Gráficos são responsivos.
- [ ] Gráficos possuem alternativa textual/resumo quando apropriado.
- [ ] Dashboard possui empty states.
- [ ] Dashboard possui loading states.
- [ ] Dashboard possui error states.
- [ ] Timeline possui empty state.
- [ ] Interface mobile-first.
- [ ] Interface desktop responsiva.
- [ ] Acessibilidade validada.
- [ ] Dados filtrados por `userId`.
- [ ] Nenhum componente acessa IndexedDB diretamente.
- [ ] Nenhuma lógica complexa de transformação está dentro da UI.
- [ ] Testes unitários implementados.
- [ ] Testes E2E principais implementados.
- [ ] Não foram adicionados diagnósticos ou recomendações médicas.
- [ ] Não foi introduzida IA prematuramente.

---

# 40. Preparação para a próxima sprint

A Sprint 4 deve terminar com uma camada clara de:

```text id="p0b4qx"
                   User Data
                      │
                      ↓
                Repositories
                      │
                      ↓
                   Services
                      │
                      ↓
              Data Transformation
                      │
             ┌────────┴────────┐
             ↓                 ↓
         Dashboard          Timeline
             │                 │
        ┌────┴────┐            │
        ↓         ↓            ↓
     Summary    Charts      Filters
```

A próxima sprint poderá adicionar:

```text id="xj3q8m"
Analytics Engine
       ↓
Web Worker
       ↓
Statistical Analysis
       ↓
Pattern Detection
       ↓
Rule Engine
       ↓
Insights
```

A camada de Experience não deve conhecer as regras de análise.

Por exemplo, evitar:

```ts id="f2d7kw"
// ❌ Não fazer no componente
if (glucose > 180) {
  showWarning(...)
}
```

Preferir futuramente:

```ts id="x7f3nv"
const insights = await insightsService.generate(...)
```

e a UI apenas apresenta o resultado.

---

# 41. Regra arquitetural principal

A Sprint 4 deve respeitar:

```text id="y4m2va"
                    UI
                     │
                     ↓
                 Hooks
                     │
                     ↓
                 Services
                     │
              ┌──────┴──────┐
              ↓             ↓
        Repositories    Analytics
              │             │
              ↓             ↓
           Dexie       Transformations
              │             │
              └──────┬──────┘
                     ↓
                 Dashboard
                 Timeline
                  Charts
```

A camada visual deve permanecer desacoplada da persistência e das futuras regras de inteligência.

---

# Resultado esperado

Ao final da Sprint 4, o usuário deverá conseguir:

1. entrar no DiaBem;
2. visualizar um resumo do seu período recente;
3. registrar rapidamente novos dados;
4. visualizar sua timeline;
5. filtrar os registros;
6. visualizar seus dados através de gráficos;
7. navegar confortavelmente pelo celular ou desktop;
8. entender seus próprios registros sem precisar interpretar uma interface complexa.

O resultado deve ser uma experiência de acompanhamento **simples, contextual e visual**, servindo como base para a próxima etapa de inteligência do produto.

O sistema deve apresentar os dados do usuário com clareza, mas **não interpretar esses dados como diagnóstico médico**.
