Como essa feature envolve **Local Data + autenticação**, analise primeiro a codebase existente e depois implemente a solução, evitando criar uma segunda arquitetura de persistência caso o projeto já tenha alguma.

Importante: **o login identifica o usuário, enquanto o IndexedDB armazena os dados localmente**. Para o MVP, o usuário pode conseguir utilizar o app localmente e, após autenticar, os dados podem ficar associados ao `userId` local. A sincronização com backend pode ser adicionada posteriormente.

# Sprint 2 — Local Data & Authentication

## Objetivo

Implementar a fundação de persistência local e gerenciamento de identidade do DiaBem, preparando a aplicação para funcionar com uma arquitetura **local-first, privacy-first e offline-first**.

A implementação deve utilizar:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- IndexedDB
- Dexie
- Zod
- Web Crypto API quando apropriado

A solução deve ser construída de forma modular, tipada e preparada para futuras funcionalidades de sincronização com backend, IA, MCP e integração com dispositivos.

---

# 1. Antes de implementar

Faça uma análise completa da codebase atual.

Verifique:

- estrutura do projeto;
- App Router;
- layouts;
- providers;
- gerenciamento de estado;
- sistema de autenticação existente;
- componentes shadcn/ui já disponíveis;
- configuração do Tailwind;
- configuração do TypeScript;
- tratamento de erros;
- testes existentes;
- variáveis de ambiente;
- persistência existente;
- arquitetura de services/repositories;
- padrões de nomenclatura;
- convenções de código.

Não substitua tecnologias ou padrões existentes sem necessidade.

Caso já exista alguma implementação relacionada a autenticação ou persistência, reutilize e evolua a arquitetura existente em vez de criar uma segunda solução paralela.

Antes de modificar arquivos, apresente:

1. resumo da arquitetura atual;
2. arquivos relevantes encontrados;
3. pontos de integração;
4. riscos técnicos;
5. proposta de implementação.

---

# 2. Arquitetura de dados

Criar uma camada dedicada para persistência local.

Sugestão:

```text
src/
├── lib/
│   ├── db/
│   │   ├── database.ts
│   │   ├── schema.ts
│   │   ├── migrations.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       └── ...
│   │
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.types.ts
│   │   └── auth.storage.ts
│   │
│   └── crypto/
│       └── ...
│
├── features/
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       └── services/
│
└── types/
```

Adapte a estrutura às convenções já existentes na codebase.

---

# 3. IndexedDB + Dexie

Adicionar Dexie como camada de abstração sobre IndexedDB.

Criar um banco local versionado.

Exemplo conceitual:

```ts
class DiaBemDatabase extends Dexie {
  users!: Table<User, string>;
  sessions!: Table<LocalSession, string>;
  glucoseReadings!: Table<GlucoseReading, string>;
  meals!: Table<Meal, string>;
  activities!: Table<Activity, string>;
}
```

Nesta sprint, implemente efetivamente apenas as entidades necessárias para:

- usuário;
- sessão local;
- preparação para futuras entidades de saúde.

Não implemente todas as funcionalidades de glicemia/alimentação nesta sprint.

---

# 4. Schema do usuário

Criar um modelo local de usuário.

Exemplo:

```ts
type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
```

Avalie a necessidade de adicionar:

```ts
avatarUrl?: string
timezone?: string
locale?: string
```

Não adicionar informações médicas ao perfil de usuário nesta sprint.

Dados relacionados à saúde devem possuir suas próprias entidades e referências.

---

# 5. Identidade local

Definir claramente a diferença entre:

```text
User
```

e

```text
Local Session
```

A sessão deve representar o usuário atualmente autenticado no dispositivo.

Exemplo:

```ts
type LocalSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
};
```

Criar uma abstração para:

```ts
getCurrentUser();
getCurrentSession();
isAuthenticated();
setSession();
clearSession();
```

Evitar que componentes React acessem IndexedDB diretamente.

---

# 6. Repository Layer

Criar repositories para encapsular o acesso ao banco.

Exemplo:

```ts
userRepository.create();
userRepository.findById();
userRepository.findByEmail();
userRepository.update();
userRepository.delete();
```

Para sessão:

```ts
sessionRepository.create();
sessionRepository.getCurrent();
sessionRepository.delete();
```

Os componentes não devem executar:

```ts
db.users.add(...)
```

diretamente.

O acesso deve seguir:

```text
Component
   ↓
Hook / Service
   ↓
Repository
   ↓
Dexie
   ↓
IndexedDB
```

---

# 7. Schemas com Zod

Criar schemas Zod para validação de:

- criação de usuário;
- login;
- atualização de perfil;
- sessão;
- entidades persistidas quando apropriado.

Exemplo:

```ts
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
```

Não confiar exclusivamente na validação dos formulários.

Toda entrada que chegar à camada de domínio deve ser validada.

---

# 8. Sistema de criação de usuário

Criar uma tela de cadastro.

Rota sugerida:

```text
/register
```

Campos:

```text
Nome
E-mail
Senha
Confirmar senha
```

Interface utilizando shadcn/ui:

- Card
- Input
- Label
- Button
- Form
- Alert
- Separator

Validações:

- nome obrigatório;
- e-mail válido;
- senha com requisitos mínimos;
- confirmação de senha;
- mensagens de erro acessíveis;
- prevenção de submissões duplicadas.

Após criação:

```text
Create User
     ↓
Validate
     ↓
Persist user
     ↓
Create session
     ↓
Redirect /dashboard
```

---

# 9. Sistema de Login

Criar:

```text
/login
```

Campos:

```text
E-mail
Senha
```

Fluxo:

```text
Login
 ↓
Validate input
 ↓
Find user
 ↓
Validate credentials
 ↓
Create session
 ↓
Persist session
 ↓
Redirect
```

Criar estados de:

- loading;
- sucesso;
- credenciais inválidas;
- erro inesperado;
- usuário não encontrado.

Não revelar informações desnecessárias que facilitem enumeração de usuários.

---

# 10. Segurança de credenciais

Não armazenar senhas em texto puro no IndexedDB.

Nunca fazer:

```ts
password: "123456";
```

Criar uma estratégia adequada de derivação/hash de senha.

Avaliar utilização das APIs criptográficas disponíveis no navegador, especialmente Web Crypto API.

A senha original nunca deve ser persistida.

Também não armazenar tokens ou segredos em `localStorage` simplesmente por conveniência.

Documentar claramente:

- o que é armazenado;
- onde é armazenado;
- como é protegido;
- limitações da autenticação local.

---

# 11. Web Crypto API

Criar uma camada de abstração para operações criptográficas.

Exemplo conceitual:

```text
src/lib/crypto/
├── key-derivation.ts
├── encryption.ts
└── crypto.types.ts
```

A camada deve permitir futuramente proteger dados locais de saúde.

Não implementar criptografia manual.

Utilizar primitivas criptográficas fornecidas pela Web Crypto API.

Separar:

```text
Authentication credentials
```

de:

```text
Health data encryption
```

Não assumir que uma única chave deve resolver ambos os problemas.

---

# 12. Auth Provider

Criar um contexto/provider de autenticação compatível com React.

Exemplo:

```tsx
<AuthProvider>{children}</AuthProvider>
```

Disponibilizar:

```ts
const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
```

O provider não deve conter diretamente a lógica de IndexedDB.

Ele deve utilizar services/repositories.

---

# 13. Proteção de rotas

Criar proteção para áreas autenticadas.

Exemplo:

```text
/login
/register
```

públicas.

```text
/dashboard
/glucose
/meals
/timeline
/insights
/settings
```

protegidas.

Como IndexedDB é client-side, não presumir que middleware/server-side possa validar a sessão local da mesma maneira que uma sessão tradicional baseada em cookies.

A proteção deve ser compatível com a arquitetura local-first.

Evitar falsos mecanismos de segurança baseados apenas em esconder componentes.

---

# 14. Estado inicial da aplicação

Ao iniciar a aplicação:

```text
Application
    ↓
Initialize database
    ↓
Restore local session
    ↓
Load current user
    ↓
AuthProvider ready
    ↓
Render application
```

Evitar:

```text
Tela → aparece login → depois dashboard → volta login
```

Implementar um estado inicial de carregamento.

---

# 15. Logout

Implementar:

```text
Logout
 ↓
Clear current session
 ↓
Keep user data locally
 ↓
Redirect /login
```

Por padrão, **logout não deve apagar os dados de saúde do usuário**.

Essa decisão é importante.

O usuário pode sair da sessão e posteriormente entrar novamente no mesmo dispositivo.

Criar futuramente uma funcionalidade separada:

```text
Excluir todos os dados locais
```

com confirmação explícita.

---

# 16. Multi-user local

Preparar o banco para múltiplos usuários no mesmo dispositivo.

Todas as futuras entidades de saúde devem possuir:

```ts
userId: string;
```

Exemplo:

```ts
type GlucoseReading = {
  id: string;
  userId: string;
  value: number;
  timestamp: string;
};
```

Isso evita criar um banco que pressupõe um único usuário para sempre.

---

# 17. Data isolation

Garantir que repositories aceitem o `userId` atual.

Exemplo:

```ts
glucoseRepository.findByUser(userId);
```

Evitar consultas globais como:

```ts
db.glucoseReadings.toArray();
```

nas features autenticadas.

O objetivo é garantir isolamento lógico dos dados desde o início.

---

# 18. UX do sistema de autenticação

Criar experiência mobile-first.

### Login

```text
┌─────────────────────────┐
│                         │
│        DIA BEM          │
│                         │
│  Bem-vindo novamente    │
│                         │
│  E-mail                 │
│  [___________________]  │
│                         │
│  Senha                  │
│  [___________________]  │
│                         │
│  [ Entrar ]             │
│                         │
│  Ainda não possui conta?│
│  Criar conta            │
│                         │
└─────────────────────────┘
```

### Cadastro

Manter a mesma linguagem visual.

Utilizar componentes do shadcn/ui e não criar componentes visuais duplicados.

---

# 19. Acessibilidade

Garantir:

- labels associados aos inputs;
- foco visível;
- navegação por teclado;
- mensagens de erro associadas aos campos;
- `aria-live` para estados relevantes;
- contraste adequado;
- tamanho adequado dos controles;
- suporte a leitores de tela;
- loading states acessíveis.

Não utilizar apenas placeholder como label.

---

# 20. Testes

Criar testes unitários para:

### Database

- criação do banco;
- criação de usuário;
- busca por e-mail;
- atualização;
- exclusão.

### Authentication

- registro;
- login válido;
- login inválido;
- logout;
- restauração de sessão.

### Validation

- e-mail inválido;
- senha inválida;
- confirmação diferente;
- nome inválido.

### Isolation

Testar:

```text
User A
 ↓
dados A

User B
 ↓
dados B
```

e garantir que User A nunca receba dados de User B.

### E2E

Fluxo:

```text
Abrir aplicação
 ↓
Criar conta
 ↓
Sessão criada
 ↓
Dashboard
 ↓
Logout
 ↓
Login
 ↓
Dashboard
```

---

# 21. Teste offline

Este é um requisito importante da sprint.

Validar:

```text
Criar usuário
 ↓
Login
 ↓
Desligar internet
 ↓
Recarregar aplicação
 ↓
Sessão local restaurada
 ↓
Aplicação continua funcionando
```

O objetivo é provar que o sistema não depende de conexão para sua camada fundamental.

---

# 22. Critérios de aceite

A Sprint 2 somente deve ser considerada concluída quando:

- [ ] IndexedDB está funcionando.
- [ ] Dexie está configurado.
- [ ] Banco possui versionamento.
- [ ] Repositories encapsulam o acesso ao banco.
- [ ] Schemas Zod estão implementados.
- [ ] Usuário pode criar uma conta local.
- [ ] Senha não é armazenada em texto puro.
- [ ] Usuário pode fazer login.
- [ ] Sessão local é restaurada após reload.
- [ ] Usuário pode fazer logout.
- [ ] Rotas privadas estão protegidas.
- [ ] Dados possuem `userId`.
- [ ] Usuários possuem isolamento lógico.
- [ ] Aplicação funciona sem internet após inicialização.
- [ ] Web Crypto foi encapsulada em uma camada própria quando utilizada.
- [ ] Testes unitários estão implementados.
- [ ] Fluxo de autenticação possui testes E2E.
- [ ] Não existem acessos diretos ao Dexie espalhados pelos componentes.
- [ ] Não existem senhas armazenadas em texto puro.
- [ ] Não existem tokens/segredos sensíveis armazenados de maneira insegura.
- [ ] Não foram introduzidas dependências desnecessárias.

---

# 23. Resultado esperado

Ao final da Sprint 2, a aplicação deverá possuir esta fundação:

```text
                    DIA BEM
                       │
                 AuthProvider
                       │
             ┌─────────┴─────────┐
             │                   │
          Login               Register
             │                   │
             └─────────┬─────────┘
                       ↓
                  Local Session
                       │
                       ↓
                    User
                       │
                       ↓
                 Repository
                       │
                       ↓
                    Dexie
                       │
                       ↓
                  IndexedDB
                       │
              ┌────────┴────────┐
              ↓                 ↓
          User Data        Health Data*
```

`*` Health Data será implementado nas próximas sprints.

A arquitetura deve deixar claro que **autenticação, persistência, domínio e UI são camadas diferentes**.

---

# 24. Preparação para próximas sprints

Não implementar agora, mas deixar pontos de extensão para:

```text
Sprint 3
→ Glucose Repository
→ Meal Repository
→ Activity Repository

Sprint 4
→ Analytics Engine
→ Web Workers
→ Insights

Sprint 5
→ PWA
→ Service Worker
→ Offline synchronization

Sprint 6
→ Local AI
→ WebGPU
→ ONNX/Transformers

Sprint 7
→ MCP
→ AI Assistant

Sprint 8
→ Cloud Sync
→ Device integrations
```

## Regra arquitetural principal

Durante toda a implementação, siga esta direção:

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

**Nunca:**

```text
UI
 ↓
IndexedDB
```

ou:

```text
Component
 ↓
db.users.add(...)
```

O objetivo desta sprint não é apenas "fazer login e salvar no IndexedDB". É construir uma **camada de dados local bem definida**, que permita que o DiaBem evolua posteriormente para uma aplicação offline-first, com IA local, MCP, sincronização e integração com dispositivos sem precisar reescrever sua fundação.
