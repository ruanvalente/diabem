# DiaBem — Acompanhamento Pessoal de Diabetes

> **Diário pessoal inteligente de diabetes.** Registre, acompanhe e entenda sua rotina de saúde — offline, privado e no seu bolso.

DiaBem é uma **Progressive Web App (PWA)** de acompanhamento pessoal de diabetes, construída com foco em experiência mobile-first, armazenamento local criptografado e funcionamento offline. A aplicação permite registrar glicemia, refeições, atividades físicas, medicamentos e observações, visualizando evolução, padrões e estatísticas ao longo do tempo.

**Aviso importante:** DiaBem é uma ferramenta de acompanhamento e organização de dados pessoais. Não realiza diagnóstico médico e não substitui orientação de profissionais de saúde.

---

## Funcionalidades

| Recurso                         | Descrição                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Glicemia**                    | Registro rápido com valor, unidade, data/hora, contexto (jejum, antes/após refeição, etc.) e observação |
| **Refeições**                   | Registro de tipo, descrição, carboidratos, quantidade e observação                                      |
| **Atividade Física**            | Registro de atividade, duração, intensidade, distância e observações                                    |
| **Medicamentos**                | Registro de medicamento, dose, unidade, tipo e horário                                                  |
| **Observações**                 | Notas livres com suporte a reconhecimento de voz                                                        |
| **Timeline**                    | Visualização cronológica de todos os eventos do dia com filtros por tipo e período                      |
| **Dashboard**                   | Visão geral com último valor de glicemia, tendência, resumo diário e ações rápidas                      |
| **Estatísticas**                | Gráficos de glicemia ao longo do tempo, distribuição por contexto, atividade física e alimentação       |
| **Insights**                    | Motor de regras local que identifica padrões (tendências, variabilidade, relações temporais)            |
| **Relatórios**                  | Geração de relatórios em PDF, JSON e CSV com período e categorias selecionáveis                         |
| **Exportação/Importação**       | Backup completo dos dados em JSON/CSV, importação com validação e deduplicação                          |
| **Compartilhamento**            | Web Share API com fallback para download e clipboard                                                    |
| **Câmera**                      | Captura de fotos de refeições via câmera do dispositivo                                                 |
| **Integração com Dispositivos** | Conexão com medidores de glicemia via Web Bluetooth e Web Serial                                        |
| **Notificações**                | Lembretes e notificações do navegador para registros e medicamentos                                     |
| **Modo Escuro**                 | Suporte completo a tema claro, escuro e automático (sistema)                                            |
| **Acessibilidade**              | Navegação por teclado, foco visível, ARIA, contraste adequado, suporte a leitores de tela               |
| **Offline**                     | Funcionamento completo sem internet com Service Worker e cache                                          |
| **PWA Instalável**              | Instalação no Android, iOS e desktop como aplicativo nativo                                             |

---

## Fluxo da Aplicação

```text
Landing Page
     ↓
Login / Criar conta
     ↓
Onboarding (opcional)
     ↓
Dashboard
     ↓
┌───────────────┬────────────────┐
│               │                │
Timeline    Registro rápido   Estatísticas
│               │                │
├── Glicemia    ├── Refeição     │
├── Refeição    ├── Atividade    │
├── Atividade   ├── Medicamento  │
├── Medicamento └── Observação   │
└───────────────┴────────────────┘
     ↓
Relatórios
     ↓
Exportação / Compartilhamento
     ↓
Configurações
```

---

## Stack Tecnológica

| Camada                 | Tecnologia                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Framework              | [Next.js 16](https://nextjs.org/) (App Router)                                               |
| UI                     | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| Estilo                 | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first config)                               |
| Componentes            | [shadcn/ui](https://ui.shadcn.com/) (base-nova) + [@base-ui/react](https://base-ui.com/)     |
| Animações              | [Motion](https://motion.dev/) (Framer Motion)                                                |
| Ícones                 | [Lucide React](https://lucide.dev/)                                                          |
| Validação              | [Zod](https://zod.dev/) v4                                                                   |
| Armazenamento Local    | [Dexie](https://dexie.org/) v4 (IndexedDB)                                                   |
| Criptografia           | Web Crypto API (AES-GCM + PBKDF2)                                                            |
| PDF                    | [jsPDF](https://parall.ax/products/jspdf)                                                    |
| Testes Unitários       | [Vitest](https://vitest.dev/) + Testing Library                                              |
| Testes E2E             | [Playwright](https://playwright.dev/)                                                        |
| Linting                | [ESLint](https://eslint.org/) 9 + eslint-config-next                                         |
| Gerenciador de Pacotes | [Bun](https://bun.sh/)                                                                       |
| Ícones PWA             | Script personalizado (`scripts/generate-icons.mjs`)                                          |

---

## Estrutura do Projeto

```text
diabem/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fontes, providers, toaster)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Tema global (Tailwind v4 + design tokens)
│   ├── manifest.webmanifest      # Manifest PWA
│   │
│   ├── (app)/                    # Área autenticada (protegida por AuthGuard)
│   │   ├── layout.tsx            # AuthGuard > AppShell > PageTransition
│   │   ├── dashboard/
│   │   ├── glucose/
│   │   ├── meals/
│   │   ├── activity/
│   │   ├── medications/
│   │   ├── notes/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── statistics/
│   │   └── timeline/
│   │
│   └── (public)/                 # Rotas públicas
│       ├── login/
│       └── signup/
│
├── components/
│   ├── ui/                       # Primitivas UI (shadcn/ui)
│   ├── layout/                   # Shell, sidebar, bottom-nav, headers
│   ├── shared/                   # Componentes reutilizáveis (auth-guard, skeleton, etc.)
│   ├── features/                 # Módulos de feature (widget/ui/hooks)
│   │   ├── activity/
│   │   ├── camera/
│   │   ├── dashboard/
│   │   ├── data-ownership/
│   │   ├── devices/
│   │   ├── glucose/
│   │   ├── meals/
│   │   ├── notes/
│   │   ├── notifications/
│   │   ├── progressive-enhancement/
│   │   ├── reports/
│   │   ├── statistics/
│   │   ├── timeline/
│   │   └── voice-input/
│   ├── landing/                  # Seções da landing page
│   ├── motion/                   # Componentes de animação
│   └── providers/                # PWA provider
│
├── lib/
│   ├── auth/                     # Autenticação e sessão
│   ├── analytics/                # Estatísticas e gráficos
│   ├── browser/                  # Capacidades e serviços do navegador
│   ├── crypto/                   # Criptografia (AES-GCM, PBKDF2)
│   ├── data-ownership/           # Exportação, importação, compartilhamento
│   ├── db/                       # Dexie (IndexedDB) — schema, repositórios, criptografia
│   ├── devices/                  # Integração com medidores (Bluetooth/Serial)
│   ├── health/                   # Serviços de domínio (glicemia, refeições, etc.)
│   ├── intelligence/             # Motor de insights (regras, analytics, Web Worker)
│   ├── offline/                  # Status de rede e armazenamento
│   ├── pwa/                      # Registro SW, instalação, atualização
│   └── reports/                  # Construção de relatórios PDF
│
├── e2e/                          # Testes E2E (Playwright)
├── docs/
│   ├── architecture/             # Documentação de arquitetura
│   └── design/                   # Design system e especificação de UI
├── public/                       # Assets estáticos, sw.js, ícones PWA
└── scripts/                      # Scripts utilitários
```

---

## Arquitetura

### Feature Module Architecture

O projeto segue uma arquitetura **orientada a features**, onde cada módulo funcional é autocontido:

```text
components/features/<feature>/
├── widget/       # Composição, estado, comportamento
├── ui/           # Apresentação e renderização
├── hooks/        # Hooks específicos da feature
└── utils/        # Utilitários da feature
```

### Camada de Componentes

| Camada     | Responsabilidade                                 |
| ---------- | ------------------------------------------------ |
| **Page**   | Ponto de entrada da rota, composição server-side |
| **Widget** | Lógica, estado, comportamento e orquestração     |
| **UI**     | Apresentação e renderização pura                 |

### Server & Client

- **React Server Components** por padrão
- `"use client"` apenas quando necessário: estado interativo, APIs do navegador, hooks client-side, efeitos, IndexedDB, notificações
- Módulos client-only **nunca** são importados em Server Components

### Armazenamento Local

- **IndexedDB** (Dexie) como mecanismo principal para dados estruturados
- **localStorage** apenas para preferências simples (tema, configurações)
- **Criptografia no nível do campo** via Web Crypto API (AES-GCM)
- Chave de criptografia mantida **apenas em memória**, expurgada no logout

### Segurança

- Todos os dados são **escopados por `userId`** (isolamento de usuário)
- Senhas hasheadas com PBKDF2 + salt por usuário
- Criptografia AES-GCM para campos sensíveis de saúde
- Headers de segurança: CSP, X-Frame-Options: DENY, Referrer-Policy
- Nenhum dado é compartilhado automaticamente — apenas com ação explícita do usuário

### Motor de Inteligência

- Engine de regras local executada em **Web Worker**
- Regras: tendência, mudança de média, variabilidade, concentração por período, relação refeição/glicemia, frequência de atividade, dias com mais registros
- Insights gerados em português (pt-BR), apresentados como observações

---

## Design System

O design é centrado no conceito de **"Companheiro Pessoal de Saúde"** — acolhedor, acessível e encorajador.

| Elemento           | Especificação                                       |
| ------------------ | --------------------------------------------------- |
| **Fonte**          | Inter                                               |
| **Paleta Primary** | Teal (#005a71)                                      |
| **Paleta Success** | Emerald (faixa in-range)                            |
| **Paleta Warning** | Coral quente (fora da faixa)                        |
| **Border Radius**  | 0.5rem (padrão) a 1.5rem (containers grandes)       |
| **Espaçamento**    | Escala linear de 8px                                |
| **Touch targets**  | Mínimo 48px                                         |
| **Elevação**       | Sombras ambientais suaves (blur 15px, 5% opacidade) |
| **Dark Mode**      | Azul-marinho profundo e carvão, sem preto puro      |

Para mais detalhes, consulte:

- `docs/design/DESIGN.md` — sistema de design completo
- `docs/design/INTERFACE.md` — especificação de UI/UX

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ ou [Bun](https://bun.sh/) 1.3+
- [Git](https://git-scm.com/)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/ruanvalente/diabem.git
cd diabem

# Instale as dependências (recomendado: Bun)
bun install

# Ou com npm
npm install
```

---

## Comandos Disponíveis

| Comando          | Descrição                                |
| ---------------- | ---------------------------------------- |
| `bun dev`        | Inicia o servidor de desenvolvimento     |
| `bun build`      | Gera o build de produção                 |
| `bun start`      | Inicia o servidor de produção            |
| `bun lint`       | Executa o ESLint                         |
| `bun test`       | Executa testes unitários (Vitest)        |
| `bun test:watch` | Executa testes em modo watch             |
| `bun test:e2e`   | Executa testes E2E (Playwright)          |
| `bun icons`      | Gera ícones PWA a partir do SVG original |

---

## Desenvolvimento

### Servidor de Desenvolvimento

```bash
bun dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Estrutura de Rotas

| Rota           | Descrição                     |
| -------------- | ----------------------------- |
| `/`            | Landing page pública          |
| `/login`       | Autenticação                  |
| `/signup`      | Criação de conta              |
| `/dashboard`   | Dashboard principal           |
| `/timeline`    | Timeline cronológica          |
| `/glucose`     | Registros de glicemia         |
| `/meals`       | Registros de refeições        |
| `/activity`    | Registros de atividade física |
| `/medications` | Registros de medicamentos     |
| `/notes`       | Observações e notas           |
| `/statistics`  | Estatísticas e gráficos       |
| `/reports`     | Geração de relatórios         |
| `/settings`    | Configurações                 |

### Banco de Dados Local (IndexedDB)

| Tabela            | Descrição                  |
| ----------------- | -------------------------- |
| `users`           | Perfis de usuário          |
| `sessions`        | Sessões ativas             |
| `glucoseReadings` | Leituras de glicemia       |
| `meals`           | Registros de refeições     |
| `activities`      | Atividades físicas         |
| `notes`           | Observações                |
| `devices`         | Dispositivos conectados    |
| `syncHistory`     | Histórico de sincronização |

Todas as tabelas são escopadas por `userId`. Campos sensíveis são criptografados com AES-GCM.

---

## Testes

### Testes Unitários

```bash
bun test
```

Cobertura: repositórios DB, criptografia, serviços de autenticação, domínio de saúde, analytics, intelligence, dispositivos, data-ownership, capabilities do navegador, reports, offline e componentes.

### Testes E2E

```bash
bun test:e2e
```

Projetos Playwright:

- **Pixel 7** (mobile-chromium)
- **Desktop Chrome**

Specs:

- `core-health.spec.ts` — fluxos CRUD (glicemia, refeições, atividade, notas)
- `experience.spec.ts` — comportamentos de UX
- `offline.spec.ts` — comportamento offline-first
- `pwa.spec.ts` — shell PWA, precache, manifest
- `reports.spec.ts` — geração de relatórios

### CI

Pipeline em `.github/workflows/ci.yml` com dois jobs:

- **ci**: lint → testes unitários → build
- **e2e**: Playwright chromium com relatório de falhas

---

## PWA

### Instalação

O DiaBem é instalável como PWA em:

- **Android** — via prompt de instalação do Chrome
- **iOS** — via "Adicionar à Tela de Início" no Safari
- **Desktop** — via prompt de instalação no Chrome/Edge

### Service Worker

- Precache de assets estáticos
- Network-first para navegações (fallback offline para `/`)
- Cache-first para assets estáticos
- Sem dados de saúde no cache — dados ficam apenas no IndexedDB criptografado

### Manifest

- Nome: "DiaBem - Acompanhamento Pessoal de Diabetes"
- Idioma: pt-BR
- Display: standalone
- Atalhos: `/glucose`, `/timeline`, `/settings`

---

## Contribuindo

### Guia de Contribuição

1. **Fork** o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça suas alterações seguindo as convenções do projeto
4. Execute os testes (`bun test && bun lint`)
5. Crie um **commit** descritivo
6. Abra um **Pull Request**

### Convenções

#### Nomenclatura

| Tipo                  | Formato                   | Exemplo                   |
| --------------------- | ------------------------- | ------------------------- |
| Componentes (arquivo) | kebab-case                | `glucose-record-form.tsx` |
| Componentes (export)  | PascalCase                | `GlucoseRecordForm`       |
| Hooks                 | camelCase (prefixo `use`) | `useGlucoseStore`         |
| Tipos/Interfaces      | PascalCase                | `GlucoseReading`          |
| Enums                 | UPPER_SNAKE_CASE          | `GLUCOSE_CONTEXT`         |

Todos os identificadores devem estar em **inglês**.

#### Arquitetura

Antes de implementar uma nova feature:

1. Identifique o domínio de negócio e o módulo de feature correspondente
2. Consulte `docs/architecture/APPLICATION-ARCHITETURE.md` e `docs/architecture/COMPONENT-ARCHITETURE.md`
3. Defina responsabilidades e limites
4. Determine requisitos de Server/Client
5. Determine requisitos de persistência
6. Defina estados de loading, erro, vazio e offline onde aplicável
7. Implemente seguindo a arquitetura documentada
8. Valide a implementação final contra a arquitetura

#### Código

- TypeScript com **strict mode**
- ESLint + Prettier
- Sem uso desnecessário de `any`
- JSDoc para APIs públicas e funções complexas
- Não introduza abstrações sem necessidade concreta

#### Commits

- Mensagens claras e descritivas
- Formato: `<tipo>: <descrição>`
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

---

## Privacidade e Segurança

- **Armazenamento local** — dados ficam no dispositivo do usuário
- **Criptografia** — campos sensíveis protegidos com AES-GCM
- **Isolamento** — dados escopados por usuário
- **Controle total** — exportar, importar e apagar dados a qualquer momento
- **Sem compartilhamento automático** — apenas com ação explícita do usuário
- **Offline-first** — funciona sem conexão com a internet
- **Senhas** — hasheadas com PBKDF2 + salt

---

## Roadmap

Funcionalidades planejadas ou em desenvolvimento:

- [ ] Integração com APIs de alimentos
- [ ] Sincronização com backend
- [ ] Autenticação biométrica
- [ ] Notificações push
- [ ] Integração com wearables
- [ ] Suporte a múltiplos idiomas
- [ ] Modo de acompanhamento para cuidadores

---

## Documentação

| Documento                                      | Descrição                                     |
| ---------------------------------------------- | --------------------------------------------- |
| `AGENTS.md`                                    | Regras do projeto e contrato de implementação |
| `docs/architecture/APPLICATION-ARCHITETURE.md` | Arquitetura da aplicação                      |
| `docs/architecture/COMPONENT-ARCHITETURE.md`   | Arquitetura de componentes                    |
| `docs/design/DESIGN.md`                        | Design system e paleta de cores               |
| `docs/design/INTERFACE.md`                     | Especificação completa de UI/UX               |

---

## Licença

Projeto privado. Todos os direitos reservados.

---

**DiaBem** — Seu companheiro pessoal para acompanhar sua rotina de saúde.
