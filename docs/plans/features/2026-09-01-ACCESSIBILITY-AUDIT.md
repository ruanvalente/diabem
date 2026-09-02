# Prompt — Auditoria e Melhoria de Acessibilidade

Analise a aplicação atual desenvolvida com **Next.js, TypeScript, Tailwind CSS e shadcn/ui** com o objetivo de identificar e implementar melhorias de **acessibilidade (a11y)**, buscando elevar a pontuação e, principalmente, a conformidade e usabilidade da aplicação para pessoas que utilizam teclado, leitores de tela e outras tecnologias assistivas.

## Objetivo

Realizar uma auditoria completa dos componentes existentes e identificar problemas de acessibilidade que possam ser detectados pelo **Lighthouse**, além de problemas que possam não aparecer diretamente no Lighthouse, mas que representam más práticas de acessibilidade.

A análise deve priorizar:

- HTML semântico
- Navegação por teclado
- Leitores de tela
- Gerenciamento de foco
- Nomes e descrições acessíveis
- Formulários
- Contraste e legibilidade
- Estados interativos
- Componentes do shadcn/ui
- Responsividade e acessibilidade mobile
- Uso correto de ARIA
- Hierarquia de headings
- Elementos interativos
- Modais, dialogs, dropdowns e popovers
- Feedback visual e textual para estados da interface

---

# 1. Análise inicial

Antes de modificar qualquer código, faça uma análise da estrutura atual da aplicação.

Identifique:

- Componentes reutilizáveis
- Componentes baseados em `shadcn/ui`
- Componentes customizados
- Componentes com comportamento interativo
- Formulários
- Modais e dialogs
- Dropdowns
- Menus
- Tabs
- Tooltips
- Toasts/alerts
- Sidebars
- Navegação
- Botões e links
- Inputs
- Selects
- Checkboxes
- Radios
- Switches
- Sliders
- Elementos com ícones
- Componentes que dependem exclusivamente de comunicação visual

Não altere código imediatamente.

Primeiro apresente os problemas encontrados e classifique-os por prioridade.

---

# 2. Auditoria Lighthouse

Verifique todos os problemas relacionados às seguintes categorias:

### Accessibility

- Buttons do not have an accessible name
- Links do not have a discernible name
- Form elements do not have associated labels
- Images do not have alt attributes
- Insufficient color contrast
- Missing document language
- Heading order
- Duplicate IDs
- ARIA attributes with invalid values
- Invalid ARIA roles
- Elements with inaccessible names
- Focusable elements that are not keyboard accessible
- Interactive elements that are not keyboard accessible
- Missing landmarks
- Missing main landmark
- Missing navigation landmarks
- Missing form labels
- Empty links
- Empty buttons

Caso algum problema não seja aplicável à aplicação, não force uma alteração apenas para satisfazer uma regra automática.

---

# 3. HTML semântico

Verifique se os componentes estão utilizando corretamente elementos HTML nativos.

Priorize:

```html
button a nav main header footer aside section article form label fieldset legend
h1 h2 h3
```

Evite padrões como:

```tsx
<div onClick={...}>
```

quando o elemento representa uma ação.

Prefira:

```tsx
<button onClick={...}>
```

Da mesma forma, links devem utilizar `<a>` ou `Link` do Next.js quando representarem navegação.

Não utilize ARIA para substituir elementos HTML nativos quando o elemento nativo já oferece a semântica necessária.

---

# 4. Botões e elementos interativos

Analise todos os botões.

Verifique:

- Possuem accessible name?
- Possuem texto visível?
- Caso tenham somente ícone, possuem `aria-label` apropriado?
- O `aria-label` descreve a ação e não apenas o ícone?
- O estado do botão é comunicado?
- Botões disabled são utilizados corretamente?
- O elemento possui foco visível?
- Pode ser acionado utilizando teclado?

Exemplo problemático:

```tsx
<Button>
  <Trash />
</Button>
```

Avalie a necessidade de:

```tsx
<Button aria-label="Excluir item">
  <Trash aria-hidden="true" />
</Button>
```

Não adicione `aria-label` quando o botão já possui um nome acessível adequado através do texto.

---

# 5. Ícones

Audite todos os ícones utilizados na aplicação.

Diferencie:

### Ícones decorativos

Devem ser ignorados por leitores de tela.

Exemplo:

```tsx
<Icon aria-hidden="true" />
```

### Ícones informativos

Devem possuir uma alternativa textual apropriada.

### Ícones dentro de botões

O botão deve possuir um accessible name.

Evite fornecer simultaneamente informações redundantes para leitores de tela.

---

# 6. Links e navegação

Verifique:

- Links possuem nomes descritivos?
- O destino é compreensível fora do contexto visual?
- Links possuem foco visível?
- Links podem ser acessados pelo teclado?
- Navegação utiliza `<nav>`?
- Existe um mecanismo de skip navigation quando necessário?
- Links são utilizados para navegação e buttons para ações?

Evite links genéricos como:

```text
Clique aqui
Saiba mais
Ver
```

quando o contexto não for suficiente para compreender o destino.

---

# 7. Formulários

Faça uma auditoria completa dos formulários.

Verifique:

- Cada input possui label associado?
- `htmlFor` corresponde ao `id`?
- Campos obrigatórios são identificados?
- Erros são comunicados para leitores de tela?
- Mensagens de erro estão associadas ao campo?
- Campos possuem `aria-describedby` quando necessário?
- Estados inválidos utilizam `aria-invalid`?
- Placeholders estão sendo utilizados como substitutos de labels?
- Autofocus é utilizado de forma apropriada?
- A ordem de tabulação é lógica?

Exemplo esperado:

```tsx
<Label htmlFor="email">
  E-mail
</Label>

<Input
  id="email"
  name="email"
  type="email"
  aria-describedby="email-description"
/>

<p id="email-description">
  Utilize um endereço de e-mail válido.
</p>
```

---

# 8. Validação e mensagens de erro

Verifique como erros são apresentados.

Um erro não deve depender apenas de:

- Cor
- Ícone
- Borda vermelha
- Alteração visual

O usuário deve receber uma mensagem textual compreensível.

Analise o uso de:

```tsx
aria - invalid;
aria - describedby;
role = "alert";
aria - live;
```

Utilize-os somente quando fizer sentido.

Evite utilizar `role="alert"` indiscriminadamente.

---

# 9. Focus Management

Audite o gerenciamento de foco.

Verifique:

- Todos os elementos interativos possuem foco visível?
- `outline-none` ou `focus:outline-none` está removendo foco sem substituição?
- Existe um estado `focus-visible` adequado?
- Modais movem o foco corretamente?
- Ao fechar um Dialog, o foco retorna ao elemento que o abriu?
- Dropdowns e menus possuem comportamento de teclado correto?
- Sidebars e drawers possuem gerenciamento de foco adequado?

Procure especialmente por:

```css
outline: none;
```

```tsx
focus: outline - none;
```

```tsx
outline - none;
```

Caso estejam removendo o indicador de foco, substitua por uma alternativa acessível.

---

# 10. Navegação por teclado

Teste mentalmente e, quando possível, manualmente a aplicação utilizando apenas:

- Tab
- Shift + Tab
- Enter
- Space
- Escape
- Arrow Up
- Arrow Down
- Arrow Left
- Arrow Right
- Home
- End

Verifique especialmente:

- Sidebar
- Menus
- Dropdowns
- Dialogs
- Tabs
- Selects
- Comboboxes
- Tooltips
- Popovers
- Accordions
- Date pickers
- Componentes customizados

A ordem de foco deve seguir uma sequência lógica.

Não utilize `tabIndex` positivo para corrigir ordem de navegação.

Prefira:

```tsx
tabIndex={0}
```

somente quando realmente necessário.

---

# 11. shadcn/ui

Faça uma auditoria específica dos componentes do **shadcn/ui** utilizados no projeto.

Não assuma que utilizar shadcn/ui automaticamente garante acessibilidade.

Analise principalmente:

- Dialog
- AlertDialog
- DropdownMenu
- NavigationMenu
- Sheet
- Drawer
- Popover
- Tooltip
- Select
- Command
- Combobox
- Tabs
- Accordion
- Checkbox
- RadioGroup
- Switch
- Slider
- Form
- Input
- Label
- Button

Verifique:

- Props utilizadas corretamente
- Labels
- IDs
- Descriptions
- ARIA
- Focus management
- Keyboard navigation
- Estados
- Semântica

Evite alterar componentes base do shadcn/ui sem necessidade.

Quando possível, faça a correção no componente consumidor.

Se for necessário alterar um componente compartilhado, avalie o impacto em todas as telas que o utilizam.

---

# 12. Contraste

Analise as combinações de cores utilizadas na interface.

Verifique:

- Texto normal
- Texto pequeno
- Texto secundário
- Placeholders
- Links
- Botões
- Estados disabled
- Estados hover
- Estados focus
- Estados error
- Badges
- Backgrounds
- Borders

Não dependa somente da cor para transmitir informação.

Por exemplo, evite:

```text
Vermelho = erro
Verde = sucesso
```

sem uma informação textual, ícone ou outro indicador acessível.

Considere também os modos:

- Light
- Dark

Caso ambos existam.

---

# 13. Imagens

Audite todas as imagens.

Classifique como:

### Decorativa

Utilizar:

```tsx
alt = "";
```

### Informativa

Utilizar uma descrição objetiva:

```tsx
alt = "Descrição da imagem";
```

### Imagem funcional

O texto alternativo deve representar a função da imagem.

Evite:

```tsx
alt = "imagem";
alt = "foto";
alt = "ícone";
```

quando não agregarem informação.

---

# 14. Headings

Analise a hierarquia dos headings.

Verifique:

```text
h1
 ├── h2
 │    ├── h3
 │    └── h3
 └── h2
```

Evite escolher headings apenas pelo tamanho visual.

Não utilize:

```tsx
<h3>
```

simplesmente porque deseja uma fonte menor.

A hierarquia deve representar a estrutura semântica do conteúdo.

---

# 15. Landmarks

Verifique se a aplicação possui landmarks adequados:

```html
<header>
  <nav>
    <main>
      <aside>
        <footer></footer>
      </aside>
    </main>
  </nav>
</header>
```

Analise especialmente layouts de dashboard.

O usuário de leitor de tela deve conseguir compreender rapidamente:

- Cabeçalho
- Navegação
- Conteúdo principal
- Sidebar
- Rodapé

---

# 16. Conteúdo dinâmico

Analise componentes que alteram o conteúdo sem recarregar a página.

Exemplos:

- Toast
- Alert
- Loading
- Erro
- Sucesso
- Atualizações de dados
- Busca
- Filtros
- Paginação
- Upload
- Processamento
- Autosave

Verifique se mudanças importantes são comunicadas adequadamente para tecnologias assistivas.

Avalie o uso de:

```tsx
aria - live;
role = "status";
role = "alert";
```

somente quando apropriado.

---

# 17. Loading states

Verifique componentes de loading.

Não dependa exclusivamente de:

- Spinner
- Skeleton
- Animação

Considere informações acessíveis como:

```tsx
role="status"
aria-live="polite"
```

quando necessário.

Exemplo:

```tsx
<div role="status" aria-live="polite">
  Carregando dados...
</div>
```

---

# 18. Motion e animações

Analise animações e transições.

Verifique suporte para:

```css
prefers-reduced-motion
```

Animações não devem prejudicar usuários que solicitaram redução de movimento no sistema operacional.

Analise:

- Transições
- Sidebars
- Modais
- Skeletons
- Loading
- Carousels
- Microinterações

---

# 19. Mobile Accessibility

Faça uma análise específica para dispositivos móveis.

Verifique:

- Áreas de toque
- Botões pequenos
- Espaçamento entre elementos
- Navegação
- Sidebar
- Dialogs
- Scroll
- Conteúdo cortado
- Zoom
- Orientação
- Elementos fixos
- Sobreposição de componentes

Não desabilite zoom através de configurações como:

```html
user-scalable=no
```

---

# 20. React / Next.js

Considere características específicas do stack.

Verifique:

- Uso correto de `next/link`
- Uso correto de `next/image`
- Server Components vs Client Components
- Componentes interativos
- Hydration
- IDs estáveis
- Atributos ARIA
- HTML gerado
- Metadata
- `lang` do documento
- Estrutura de layout
- Navegação entre páginas
- Atualização do título da página

Garanta que cada página tenha um título descritivo e apropriado.

---

# 21. Não corrigir apenas o Lighthouse

Não implemente alterações simplesmente para aumentar a pontuação do Lighthouse.

A prioridade deve ser:

1. Acessibilidade real
2. Semântica HTML
3. Navegação por teclado
4. Compatibilidade com leitores de tela
5. Gerenciamento de foco
6. Formulários acessíveis
7. Contraste
8. Lighthouse

Evite soluções artificiais como:

```tsx
aria-label="..."
```

em excesso.

ARIA deve complementar a semântica, não mascarar uma implementação incorreta.

---

# 22. Classificação dos problemas

Para cada problema encontrado, classifique:

### 🔴 Critical

Impede ou dificulta significativamente o uso da aplicação por pessoas com deficiência.

### 🟠 High

Impacta significativamente a experiência de acessibilidade.

### 🟡 Medium

Problema relevante, mas com impacto limitado.

### 🟢 Low

Melhoria ou refinamento de acessibilidade.

Utilize o seguinte formato:

| Prioridade  | Componente | Problema            | Impacto                            | Solução                   |
| ----------- | ---------- | ------------------- | ---------------------------------- | ------------------------- |
| 🔴 Critical | Button     | Sem accessible name | Leitor de tela não identifica ação | Adicionar nome acessível  |
| 🟠 High     | Dialog     | Foco não retorna    | Navegação por teclado prejudicada  | Corrigir focus management |

---

# 23. Plano de implementação

Depois da auditoria, crie um plano de implementação dividido em etapas.

Exemplo:

```text
Fase 1 — Critical
- Corrigir accessible names
- Corrigir labels
- Corrigir landmarks
- Corrigir navegação por teclado

Fase 2 — High
- Corrigir focus management
- Corrigir Dialogs
- Corrigir formulários
- Corrigir contraste

Fase 3 — Medium
- Melhorar estados
- Melhorar aria-live
- Melhorar headings
- Melhorar navegação

Fase 4 — Polish
- Reduced motion
- Microinterações
- Refinamentos de UX
```

Cada item deve informar:

- Arquivo
- Componente
- Problema
- Solução proposta
- Impacto
- Risco de regressão
- Necessidade de teste

---

# 24. Testes

Para cada alteração de acessibilidade, adicione ou atualize testes quando aplicável.

Priorize:

- Unit tests
- Component tests
- Integration tests
- E2E tests

Verifique especialmente:

- Elementos possuem accessible name
- Elementos podem receber foco
- Navegação por teclado
- Estados ARIA
- Formulários
- Mensagens de erro
- Dialogs
- Menus
- Tabs

Quando disponível no projeto, considere utilizar **Testing Library** e ferramentas de análise automatizada como `jest-axe` ou `axe-core`.

---

# 25. Critérios de aceite

A implementação será considerada concluída quando:

- [ ] Não existirem problemas críticos conhecidos de acessibilidade.
- [ ] Botões possuírem accessible names adequados.
- [ ] Links possuírem nomes descritivos.
- [ ] Inputs possuírem labels associados.
- [ ] Formulários comunicarem erros adequadamente.
- [ ] Navegação por teclado funcionar corretamente.
- [ ] Foco estiver sempre visível.
- [ ] Dialogs possuírem focus management adequado.
- [ ] Sidebar for acessível por teclado.
- [ ] Ícones decorativos não poluírem leitores de tela.
- [ ] Imagens possuírem `alt` adequado.
- [ ] Hierarquia de headings estiver correta.
- [ ] Landmarks estiverem adequados.
- [ ] Contraste atender aos requisitos de acessibilidade aplicáveis.
- [ ] Estados não dependerem exclusivamente de cor.
- [ ] Componentes shadcn/ui estiverem semanticamente corretos.
- [ ] Loading e feedbacks dinâmicos forem acessíveis.
- [ ] Reduced motion for respeitado quando necessário.
- [ ] Não existirem regressões visuais.
- [ ] Testes existentes continuarem passando.
- [ ] Novos testes forem adicionados quando necessário.
- [ ] Lighthouse Accessibility atingir uma pontuação próxima de 100, sem sacrificar a implementação semântica para obter a pontuação.

---

# Regra principal

**Não faça alterações diretamente sem antes compreender o contexto do componente.**

Antes de modificar um componente:

1. Entenda sua responsabilidade.
2. Verifique onde ele é utilizado.
3. Identifique se o problema está no componente ou no consumidor.
4. Prefira HTML semântico.
5. Utilize componentes nativos quando possível.
6. Utilize ARIA apenas quando necessário.
7. Preserve a API pública dos componentes sempre que possível.
8. Evite duplicação de lógica.
9. Evite alterações visuais sem necessidade.
10. Garanta que a correção não introduza regressões.

Ao final, apresente:

1. **Resumo da auditoria**
2. **Problemas encontrados**
3. **Problemas classificados por prioridade**
4. **Componentes afetados**
5. **Plano de implementação**
6. **Arquivos que deverão ser alterados**
7. **Testes necessários**
8. **Possíveis riscos/regressões**
9. **Checklist final de acessibilidade**

Somente após essa análise deverá ser iniciada a implementação das correções.
