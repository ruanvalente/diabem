### Prompt — Integração das Estatísticas com dados reais do usuário

````text
Analise a aplicação como um todo e implemente a substituição dos dados mockados da área de Estatísticas pelos dados reais registrados pelo usuário.

### Contexto

A aplicação é uma PWA de acompanhamento pessoal de diabetes desenvolvida com:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- armazenamento local/offline
- arquitetura baseada em features/modules
- gráficos e componentes de visualização já existentes na aplicação

Atualmente, a área de Estatísticas apresenta dados mockados/estáticos.

O objetivo é fazer com que a aplicação utilize os dados reais do usuário, respeitando a arquitetura existente, o armazenamento local e os componentes já disponíveis.

---

## Objetivo principal

Remover a dependência de dados mockados da área de Estatísticas e utilizar exclusivamente os dados reais registrados pelo usuário.

A implementação deve considerar todos os tipos de dados disponíveis na aplicação, como:

- Glicemias
- Refeições
- Atividades físicas
- Medicamentos, caso estejam disponíveis
- Observações
- Registros relacionados ao acompanhamento diário
- Datas e horários dos registros

Não crie novos mocks para substituir os mocks atuais.

A fonte de verdade deve ser o armazenamento de dados já utilizado pela aplicação.

---

# 1. Auditar a aplicação antes da implementação

Antes de alterar o código, faça uma análise da estrutura atual da aplicação.

Identifique:

- Onde os dados do usuário são armazenados.
- Quais repositories/services já existem.
- Quais hooks/composables são utilizados para acessar os dados.
- Quais tipos/interfaces representam os registros.
- Como os dados são filtrados por período.
- Como o Dashboard acessa os dados.
- Como a Timeline acessa os dados.
- Como a área de Estatísticas está atualmente implementada.
- Quais dados estão mockados.
- Quais gráficos já existem.
- Quais componentes de gráficos podem ser reutilizados.
- Se existem funções/utilitários para agregação ou cálculo de métricas.

Não crie uma nova camada de persistência caso já exista uma solução adequada.

Reutilize a arquitetura existente sempre que possível.

---

# 2. Estatísticas devem utilizar dados reais

Substitua os dados mockados da área de Estatísticas por dados reais do usuário.

As métricas devem ser calculadas dinamicamente a partir dos registros existentes.

Exemplos de informações que podem ser apresentadas:

### Glicemia

- Média glicêmica
- Menor valor
- Maior valor
- Quantidade de medições
- Evolução ao longo do período
- Distribuição das medições por faixa
- Valores dentro/abaixo/acima da faixa configurada
- Tendência da glicemia

### Alimentação

Caso os dados estejam disponíveis:

- Quantidade de refeições
- Distribuição das refeições por período do dia
- Relação entre refeições e glicemia
- Frequência de registros
- Evolução ao longo do período

### Atividade

Caso os dados estejam disponíveis:

- Quantidade de atividades
- Tempo total de atividade
- Distribuição por tipo
- Frequência por dia
- Relação temporal entre atividade e glicemia

### Observações

Caso seja possível extrair informações relevantes:

- Quantidade de observações
- Distribuição temporal
- Relação com outros registros, quando aplicável

Não invente métricas caso os dados necessários não estejam disponíveis.

---

# 3. Utilizar os gráficos existentes

Faça uma auditoria dos componentes de gráficos já existentes na aplicação.

Se já existirem gráficos utilizados em outras partes da aplicação:

- reutilize-os;
- adapte-os para receber dados reais;
- mantenha o mesmo padrão visual;
- preserve responsividade;
- preserve acessibilidade;
- evite criar uma segunda implementação do mesmo tipo de gráfico.

Não crie uma nova biblioteca de gráficos caso a aplicação já possua uma.

Se houver gráficos atualmente utilizando dados mockados, substitua a fonte desses dados pelos dados reais.

Os gráficos devem ser alimentados por dados derivados dos registros reais do usuário.

---

# 4. Identificar outras áreas que ainda utilizam mocks

Não limite a implementação à página de Estatísticas.

Faça uma busca em toda a aplicação por:

- arrays mockados;
- objetos estáticos utilizados como dados do usuário;
- fixtures utilizadas diretamente na interface;
- valores hardcoded;
- dados fictícios em componentes;
- informações de demonstração;
- gráficos alimentados por dados estáticos.

Para cada ocorrência encontrada, determine se aquele dado poderia ser populado com informações reais do usuário.

Se puder, substitua o mock pela fonte real de dados.

Priorize principalmente:

- Dashboard
- Estatísticas
- Timeline
- Cards de resumo
- Gráficos
- Insights
- Resumos diários
- Resumos semanais/mensais
- Componentes de acompanhamento

Não substitua mocks que tenham finalidade legítima de:

- testes automatizados;
- Storybook;
- desenvolvimento isolado;
- exemplos/documentação;
- estados de loading/empty/error.

---

# 5. Período selecionado

A área de Estatísticas deve respeitar o período selecionado pelo usuário.

Caso a aplicação já possua filtros como:

- Hoje
- 7 dias
- 30 dias
- 90 dias
- Personalizado

utilize esses filtros como fonte para determinar quais registros serão utilizados nos cálculos.

Evite buscar/calcular dados fora do período selecionado.

Todos os cards e gráficos da página devem utilizar o mesmo contexto temporal quando isso fizer sentido.

---

# 6. Estado vazio

É obrigatório tratar corretamente o cenário em que o usuário ainda não possui dados suficientes.

Não apresente:

- números fictícios;
- gráficos com dados inventados;
- porcentagens artificiais;
- tendências falsas;
- valores padrão que possam ser interpretados como dados reais.

Quando não houver dados:

- apresente um estado vazio apropriado;
- explique ao usuário o que precisa ser registrado;
- ofereça uma ação para registrar o primeiro dado quando fizer sentido.

Exemplo:

"Você ainda não possui medições suficientes para gerar esta estatística."

ou

"Registre suas primeiras medições para visualizar sua evolução."

---

# 7. Dados insuficientes

Diferencie:

### Sem dados

O usuário não possui nenhum registro no período.

### Dados insuficientes

Existem registros, mas não há dados suficientes para determinada análise.

Por exemplo:

- existe apenas uma medição;
- não existem dados suficientes para calcular tendência;
- não existem refeições relacionadas às medições;
- não existem atividades registradas.

Nesse caso, não exiba uma análise enganosa.

Apresente a métrica somente quando houver dados suficientes para que ela faça sentido.

---

# 8. Cálculos e agregações

Evite realizar cálculos complexos diretamente dentro dos componentes de UI.

Centralize a lógica de transformação/agregação dos dados em:

- selectors;
- utilities;
- services;
- hooks especializados;
- analytics engine;
- ou outra camada já prevista pela arquitetura da aplicação.

Utilize a estrutura existente da aplicação.

Os componentes devem ser responsáveis principalmente pela apresentação.

Exemplo conceitual:

```text
Dados persistidos
       ↓
Repository
       ↓
Analytics / Selectors
       ↓
Hook
       ↓
Statistics Components
       ↓
Charts
````

Não coloque regras de negócio diretamente dentro do JSX.

---

# 9. Performance

Como os dados podem estar armazenados localmente e a aplicação possui funcionamento offline:

- evite recalcular todas as estatísticas a cada renderização;
- utilize memoização quando apropriado;
- evite múltiplas leituras desnecessárias do armazenamento;
- reutilize dados já carregados;
- evite duplicação de queries;
- prefira agregações eficientes.

Não introduza complexidade de otimização prematuramente.

A otimização deve ser aplicada onde houver necessidade real.

---

# 10. Privacidade e segurança

Os dados de saúde do usuário são privados.

A implementação deve:

- utilizar somente os dados do usuário atual;
- respeitar a arquitetura de armazenamento local existente;
- não enviar dados para APIs externas;
- não adicionar analytics externo para dados de saúde;
- não expor dados em logs;
- não armazenar cópias desnecessárias;
- respeitar os mecanismos de privacidade já existentes na aplicação.

Não altere o modelo de privacidade existente sem necessidade.

---

# 11. Tipagem

A implementação deve ser totalmente tipada com TypeScript.

Evite:

- `any`;
- casts desnecessários;
- duplicação de interfaces;
- tipos específicos criados apenas para contornar erros.

Reutilize os tipos de domínio existentes.

Se houver necessidade de novos tipos para estatísticas, eles devem representar claramente dados derivados, por exemplo:

```text
GlucoseStatistics
MealStatistics
ActivityStatistics
PeriodStatistics
TrendStatistics
```

Utilize os padrões de nomenclatura já existentes no projeto.

---

# 12. Gráficos

Para cada gráfico existente na área de Estatísticas:

1. Identifique qual dado ele representa.
2. Identifique a fonte atual.
3. Remova a fonte mockada.
4. Crie a transformação necessária a partir dos dados reais.
5. Passe os dados reais para o componente.
6. Preserve o componente visual existente.

Os gráficos devem:

- refletir o período selecionado;
- possuir labels compreensíveis;
- possuir estado vazio;
- possuir estado de dados insuficientes;
- ser responsivos;
- manter acessibilidade;
- não apresentar dados fictícios.

---

# 13. Consistência entre Dashboard, Timeline e Estatísticas

Verifique se o mesmo registro aparece de maneira consistente nas diferentes áreas da aplicação.

Por exemplo:

Se o usuário registrar:

```text
Glicemia: 145 mg/dL
Data: 03/09/2026
Horário: 08:30
```

esse registro deve ser considerado corretamente em:

- Timeline;
- Dashboard;
- Estatísticas;
- gráficos;
- resumos relacionados.

Evite implementar uma segunda fonte de dados específica para Estatísticas.

A aplicação deve possuir uma única fonte de verdade.

---

# 14. Não alterar o design sem necessidade

O objetivo principal desta tarefa é integrar dados reais.

Não faça redesign da interface.

Preserve:

- layout;
- espaçamentos;
- tipografia;
- cores;
- componentes;
- hierarquia visual;
- responsividade;
- design system;
- componentes shadcn/ui existentes.

Faça alterações visuais somente quando necessárias para:

- representar corretamente um estado vazio;
- representar ausência de dados;
- melhorar a compreensão de uma métrica;
- corrigir problemas de acessibilidade relacionados à nova implementação.

---

# 15. Testes

Adicione ou atualize testes para garantir:

- cálculo correto das estatísticas;
- filtros por período;
- estado sem dados;
- estado com dados insuficientes;
- valores mínimos/máximos;
- média;
- tendências quando aplicável;
- agregações;
- transformação dos dados para gráficos.

Também garanta que os componentes não quebrem quando:

- não existem registros;
- existe apenas um registro;
- existem muitos registros;
- existem registros em diferentes períodos.

Execute:

- testes unitários;
- testes de componentes;
- lint;
- typecheck;
- build.

---

# 16. Critérios de aceite

A tarefa somente deve ser considerada concluída quando:

- [ ] A área de Estatísticas não depende mais de dados mockados.
- [ ] As estatísticas utilizam os registros reais do usuário.
- [ ] Os gráficos utilizam dados reais.
- [ ] Os gráficos existentes foram reutilizados quando possível.
- [ ] Os filtros de período funcionam corretamente.
- [ ] O estado vazio está implementado.
- [ ] O estado de dados insuficientes está implementado.
- [ ] Nenhuma informação fictícia é apresentada como dado real.
- [ ] Outras áreas da aplicação que utilizavam mocks e podem utilizar dados reais foram identificadas.
- [ ] Mocks legítimos de testes/Storybook não foram removidos indevidamente.
- [ ] Dashboard, Timeline e Estatísticas permanecem consistentes.
- [ ] Não foi criada uma nova fonte de verdade.
- [ ] A lógica de negócio não foi colocada diretamente nos componentes de UI.
- [ ] A implementação respeita a arquitetura existente.
- [ ] A implementação permanece offline-first.
- [ ] A privacidade dos dados do usuário foi preservada.
- [ ] Não foram introduzidas dependências desnecessárias.
- [ ] TypeScript permanece sem erros.
- [ ] Lint passa.
- [ ] Testes passam.
- [ ] Build passa.

---

# Resultado esperado

Ao final, a aplicação deve deixar de parecer uma interface alimentada por dados de demonstração e passar a representar verdadeiramente os dados registrados pelo usuário.

Faça a implementação de forma incremental:

1. Audite a arquitetura e as fontes de dados.
2. Identifique todos os mocks relacionados ao domínio.
3. Mapeie quais podem ser substituídos por dados reais.
4. Implemente a camada de agregação/transformação necessária.
5. Conecte Estatísticas aos dados reais.
6. Conecte os gráficos existentes aos dados reais.
7. Verifique Dashboard, Timeline e demais áreas.
8. Implemente estados vazios e dados insuficientes.
9. Execute os testes e validações.
10. Apresente um resumo final das alterações realizadas.

Não invente dados para preencher a interface.

Quando não houver dados reais, a interface deve representar corretamente essa ausência.

````

### Uma melhoria importante em relação ao seu prompt original

Eu incluí uma exigência que considero **muito importante para essa aplicação**: não limitar o trabalho à tela de Estatísticas.

A ideia é transformar a tarefa em uma espécie de **auditoria de dados da aplicação**:

```text
                 ┌── Dashboard
                 │
Dados do usuário ├── Timeline
                 │
                 ├── Estatísticas ── Gráficos
                 │
                 └── Insights
                       ↓
                 Fonte única de verdade
````
