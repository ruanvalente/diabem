---
name: Companion Health
colors:
  surface: "#f8f9ff"
  surface-dim: "#cbdbf5"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eff4ff"
  surface-container: "#e5eeff"
  surface-container-high: "#dce9ff"
  surface-container-highest: "#d3e4fe"
  on-surface: "#0b1c30"
  on-surface-variant: "#3f484c"
  inverse-surface: "#213145"
  inverse-on-surface: "#eaf1ff"
  outline: "#6f787d"
  outline-variant: "#bec8cd"
  surface-tint: "#006781"
  primary: "#005a71"
  on-primary: "#ffffff"
  primary-container: "#0e7490"
  on-primary-container: "#d3f1ff"
  inverse-primary: "#81d1f0"
  secondary: "#516162"
  on-secondary: "#ffffff"
  secondary-container: "#d4e6e7"
  on-secondary-container: "#576769"
  tertiary: "#794602"
  on-tertiary: "#ffffff"
  tertiary-container: "#965e1c"
  on-tertiary-container: "#ffe8d6"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#b9eaff"
  primary-fixed-dim: "#81d1f0"
  on-primary-fixed: "#001f29"
  on-primary-fixed-variant: "#004d62"
  secondary-fixed: "#d4e6e7"
  secondary-fixed-dim: "#b8cacb"
  on-secondary-fixed: "#0e1e1f"
  on-secondary-fixed-variant: "#394a4b"
  tertiary-fixed: "#ffdcbd"
  tertiary-fixed-dim: "#ffb86f"
  on-tertiary-fixed: "#2c1600"
  on-tertiary-fixed-variant: "#693c00"
  background: "#f8f9ff"
  on-background: "#0b1c30"
  surface-variant: "#d3e4fe"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Marca e Estilo

O sistema de design é centrado no conceito de um **"Companheiro Pessoal de Saúde"**. Ele se afasta da estética clínica e de alta fricção dos softwares médicos tradicionais, adotando uma interface acolhedora, acessível e encorajadora. O público-alvo inclui pessoas que gerenciam condições crônicas e precisam interagir frequentemente com a interface ao longo do dia; portanto, reduzir a carga cognitiva e a fadiga visual é uma prioridade fundamental.

O estilo visual é um híbrido de **Modern Corporate** e **Soft Minimalism**. Ele utiliza espaços em branco generosos, formas geométricas arredondadas e uma paleta de cores suave para transmitir sensações de tranquilidade, confiabilidade e otimismo. As animações devem ser sutis e funcionais, proporcionando um reforço visual delicado para hábitos positivos relacionados à saúde.

## Cores

A paleta foi projetada para comunicar o estado de saúde de forma intuitiva, sem provocar ansiedade.

- **Primary (Teal):** Utilizado para as principais ações e para a identidade visual da aplicação. Equilibra o profissionalismo do azul com a vitalidade do verde.

- **Success (Emerald):** Representa leituras **"Dentro da Faixa" (In-Range)**. Deve possuir saturação suficiente para ser claramente identificável, mas ser suave o bastante para manter uma aparência amigável.

- **Warning/Alert:** Utilizado de forma moderada para indicar oscilações **"Fora da Faixa" (Out-of-Range)**. A cor de alerta utiliza um coral quente em vez de um vermelho puro e intenso, mantendo a sensação de "companheiro" da aplicação.

- **Surface & Background:** No modo claro, as superfícies utilizam branco puro sobre um fundo azul-acinzentado muito claro, criando uma sensação sutil de profundidade.

### Estratégia para Dark Mode

Fazer a transição para tons de azul-marinho profundo e carvão. As superfícies devem utilizar uma tonalidade ligeiramente mais clara do que o fundo para preservar a hierarquia baseada em cards.

Evitar o uso de preto puro para reduzir o cansaço visual durante registros realizados à noite.

## Tipografia

Este sistema de design utiliza a fonte **Inter** devido à sua excelente legibilidade em contextos com grande quantidade de dados e ao seu estilo moderno e neutro.

- **Hierarquia:** Um alto contraste entre títulos e textos de corpo garante que os usuários consigam visualizar rapidamente suas métricas de saúde mais recentes.

- **Acessibilidade:** As alturas de linha devem ser definidas em **1,5x** para textos de corpo, melhorando a legibilidade para usuários que possam estar apresentando visão turva, um sintoma que pode estar associado a oscilações de glicose.

- **Dados Numéricos:** Para leituras de glicemia e doses de insulina, utilizar `headline-lg` com um espaçamento entre letras ligeiramente mais compacto para enfatizar o principal dado numérico da tela.

## Layout e Espaçamento

O layout segue um modelo de **Fluid Grid**, otimizado para uma experiência de Progressive Web App (PWA).

- **Mobile First:** A experiência principal deve utilizar um layout de coluna única com margens laterais de **20px**.

- **Desktop/Tablet:** O conteúdo deve ser limitado por um container com largura máxima — **768px** para telas focadas em leitura/registro e **1140px** para dashboards — mantendo os registros fáceis de visualizar e interpretar.

- **Ritmo:** Utilizar uma escala linear de **8px** para todos os paddings e margins, criando um ritmo vertical consistente. Os elementos devem ser agrupados em cards para separar diferentes tipos de dados, por exemplo, um card de **Registro Alimentar** e um card de **Tendência da Glicemia**.

## Elevação e Profundidade

Para alcançar uma sensação **"Suave" e "Acolhedora"**, o sistema de design evita bordas marcadas, priorizando **Sombras Ambientais (Ambient Shadows)** e **Camadas Tonais (Tonal Layers)**.

1. **Level 0 (Background):** O canvas base (`background_light`).

2. **Level 1 (Cards):** Superfícies brancas com uma sombra muito suave e difusa:
   - Blur: 15px
   - Y: 4px
   - Opacidade: 5% preto

3. **Level 2 (Interactive/Floating):** Maior elevação para botões e campos ativos:
   - Blur: 20px
   - Y: 8px
   - Opacidade: 8% da cor primária

No modo escuro, a elevação deve ser comunicada por meio de superfícies mais claras em vez de sombras, seguindo o princípio padrão de que **"mais claro significa mais próximo"**.

## Formas

A linguagem visual utiliza formas propositalmente **Arredondadas (Rounded)** para transmitir uma sensação de segurança e ergonomia.

- **Elementos padrão:** Botões e cards pequenos utilizam um raio de `0.5rem` (8px).

- **Containers de funcionalidades:** Cards grandes do dashboard e bottom sheets utilizam um raio de `1rem` (16px) ou `1.5rem` (24px), criando uma aparência mais amigável de "bolha".

- **Estados de seleção:** Checkboxes e radio buttons mantêm um leve arredondamento de **4px** para combinar com o sistema visual geral, em vez de possuírem cantos completamente retos.

## Componentes

### Botões

- **Primary:** Preenchidos com `primary_color_hex`, texto branco e `rounded-lg`.

- **Secondary:** Estilo Ghost com contorno teal ou uma tonalidade teal clara (`secondary_color_hex`).

- **Feedback tátil:** Ao pressionar, os botões devem sofrer uma pequena redução de escala (**98%**) para proporcionar uma sensação física de "clique".

### Cards

- Os cards são os principais containers para apresentação dos dados.
- Devem possuir **16px de padding interno**.
- Utilizar **20px de border-radius**.
- Utilizar cards para agrupar informações relacionadas, como **"Registro da Manhã"** ou **"Insulina Ativa"**.

### Campos de Entrada

- Os campos devem ser grandes e fáceis de tocar, com **altura mínima de 48px**.
- Utilizar um fundo cinza-claro.
- Aplicar uma borda teal de **2px** somente quando o campo estiver em foco.
- Os labels devem permanecer sempre visíveis acima do campo.

### Badges de Status (Chips)

Utilizar para representar faixas de glicemia:

- **In Range:** Success;
- **High:** Warning;
- **Critical:** Alert.

Esses elementos devem utilizar um estilo **"Soft"**, com fundo levemente colorido e texto escuro utilizando a mesma tonalidade da cor correspondente.

### Toasts e Feedback

Posicionar na parte superior da tela utilizando um formato **"Pill"**.

Utilizar para confirmar ações como:

> "Registro salvo com sucesso."

Incluir um pequeno ícone no estilo **Lucide** para reforçar visualmente a mensagem.

### Indicadores de Progresso

Utilizar traços grossos e arredondados para indicadores circulares de metas diárias, por exemplo:

- Passos;
- Limite de carboidratos;
- Metas diárias.

Evitar linhas muito finas ou com aparência excessivamente delicada.
