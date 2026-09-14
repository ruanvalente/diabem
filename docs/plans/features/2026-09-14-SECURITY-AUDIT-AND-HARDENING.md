# Sprint 10 — Security Audit & Hardening

## Objetivo

Realizar uma auditoria completa de segurança na aplicação, identificando e corrigindo possíveis vulnerabilidades, configurações inseguras, dependências desatualizadas, problemas de arquitetura, exposição indevida de dados, falhas de validação, riscos relacionados ao navegador e possíveis vulnerabilidades introduzidas pelas funcionalidades implementadas nos Sprints anteriores.

O objetivo não é apenas corrigir vulnerabilidades conhecidas, mas estabelecer uma **baseline de segurança sustentável para a aplicação**, evitando regressões futuras.

A auditoria deve considerar simultaneamente:

* Segurança;
* Privacidade;
* Data Ownership;
* Performance;
* Acessibilidade;
* UX;
* PWA/offline;
* Compatibilidade entre navegadores;
* SSR/Client Components;
* IndexedDB;
* Web Crypto;
* Importação/exportação;
* Notifications;
* Speech Recognition;
* Camera API;
* futuras integrações com dispositivos.

---

# 1. Princípios fundamentais

Durante toda a sprint, seguir:

```text
Security by Design
Privacy by Design
Least Privilege
Defense in Depth
Secure by Default
Fail Secure
Progressive Enhancement
```

Nenhuma correção de segurança deve ser aplicada de forma que:

* prejudique significativamente o Lighthouse;
* prejudique acessibilidade;
* quebre funcionamento offline;
* introduza dependências desnecessárias;
* aumente excessivamente o bundle;
* degrade a experiência mobile;
* remova funcionalidades sem avaliar alternativas;
* comprometa a arquitetura local-first.

---

# 2. Antes de modificar o código

Executar uma etapa inicial de diagnóstico.

Não começar atualizando todas as dependências indiscriminadamente.

Primeiro criar um baseline:

```text
Security Baseline
Performance Baseline
Accessibility Baseline
Build Baseline
Test Baseline
Dependency Baseline
```

Registrar:

* versão do Node;
* versão do package manager;
* versão do Next.js;
* versão do React;
* dependências;
* dependências transitivas relevantes;
* tamanho do bundle;
* Lighthouse;
* Core Web Vitals disponíveis;
* resultados dos testes;
* erros de build;
* warnings;
* configuração PWA;
* headers atuais;
* configuração de produção.

---

# 3. Auditoria de dependências

Auditar todas as dependências do projeto.

Executar as ferramentas apropriadas ao package manager utilizado, por exemplo:

```bash
npm audit
```

ou equivalente para:

```text
pnpm
yarn
bun
```

Não simplesmente executar:

```bash
npm audit fix --force
```

sem analisar o impacto.

---

## 3.1 Classificação

Classificar vulnerabilidades encontradas:

```text
Critical
High
Moderate
Low
Informational
```

Para cada vulnerabilidade registrar:

```text
Package
Version
Vulnerability
Severity
Affected dependency
Fix available?
Breaking change?
Runtime impact?
Action
```

---

# 4. Atualização de bibliotecas

Verificar:

* dependências desatualizadas;
* dependências abandonadas;
* pacotes sem manutenção;
* vulnerabilidades conhecidas;
* versões incompatíveis;
* dependências transitivas vulneráveis;
* duplicação de bibliotecas;
* pacotes desnecessários.

Não atualizar tudo automaticamente.

Para cada atualização importante avaliar:

```text
Security benefit
+
Compatibility
+
Performance
+
Bundle size
+
Accessibility
+
Breaking changes
```

Priorizar atualizações relacionadas a:

* Next.js;
* React;
* TypeScript;
* bibliotecas de autenticação;
* bibliotecas de parsing;
* bibliotecas de sanitização;
* bibliotecas de criptografia;
* PWA/Service Worker;
* bibliotecas utilizadas para processamento de arquivos.

---

# 5. Supply Chain Security

Auditar a cadeia de dependências.

Verificar:

* dependências indiretas;
* scripts de instalação;
* `postinstall`;
* `preinstall`;
* pacotes desconhecidos;
* dependências abandonadas;
* typosquatting;
* pacotes duplicados;
* permissões excessivas;
* alterações inesperadas no lockfile.

Verificar também se o projeto possui:

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lock
```

conforme o package manager utilizado.

O lockfile deve ser versionado.

---

# 6. Secrets e configuração

Procurar por possíveis secrets expostos:

```text
API keys
tokens
passwords
private keys
service credentials
JWT secrets
encryption keys
database credentials
```

Auditar:

```text
.env
.env.local
.env.production
.env.example
```

Garantir que:

```text
.env.local
.env.production
```

não sejam versionados quando contiverem secrets reais.

---

# 7. Variáveis NEXT_PUBLIC

Auditar especialmente:

```text
NEXT_PUBLIC_*
```

Nenhuma informação secreta deve ser disponibilizada através de variáveis `NEXT_PUBLIC_*`.

Classificar todas as variáveis em:

```text
Public configuration
Private configuration
Secret
```

Somente configuração realmente pública deve chegar ao client bundle.

---

# 8. Client vs Server

Auditar todos os pontos em que dados passam entre:

```text
Server
 ↓
Client
```

Verificar:

* props;
* Server Components;
* Client Components;
* Route Handlers;
* Server Actions;
* cookies;
* headers;
* query parameters;
* localStorage;
* IndexedDB.

Não enviar dados sensíveis para o client sem necessidade.

Evitar exposição acidental através de:

```ts
console.log()
```

ou payloads serializados.

---

# 9. XSS

Realizar auditoria específica contra:

```text
Stored XSS
Reflected XSS
DOM XSS
Mutation XSS
```

Verificar especialmente:

* editor rich text;
* conteúdo HTML;
* observações;
* refeições;
* importação JSON;
* importação CSV;
* query parameters;
* URLs;
* campos provenientes do usuário;
* conteúdo compartilhado.

Auditar qualquer uso de:

```tsx
dangerouslySetInnerHTML
```

Se existir, verificar:

* sanitização;
* origem do conteúdo;
* política permitida de HTML;
* possibilidade de bypass.

Nunca confiar em conteúdo importado.

---

# 10. Sanitização

Criar uma estratégia centralizada para sanitização quando necessária.

Não espalhar:

```ts
sanitize(...)
```

aleatoriamente pela aplicação.

Criar uma camada específica.

Exemplo:

```text
security/
├── sanitization/
│   ├── html.ts
│   ├── text.ts
│   └── url.ts
```

Diferenciar:

```text
Plain Text
Rich Text
URL
Filename
HTML
```

Não utilizar uma única função genérica para todos os contextos.

---

# 11. Input Validation

Auditar todos os inputs.

Principalmente:

* glicemia;
* refeições;
* atividades;
* observações;
* datas;
* horários;
* filtros;
* importação;
* exportação;
* configurações;
* dados provenientes de dispositivos.

Validar:

```text
Type
Format
Range
Length
Required fields
Unknown fields
Unexpected structures
```

Utilizar schemas centralizados quando apropriado.

---

# 12. Importação de arquivos

Realizar uma auditoria especial do sistema desenvolvido no Sprint 7.

Testar arquivos:

```text
JSON válido
JSON inválido
JSON gigante
JSON malformado
CSV válido
CSV malformado
CSV gigante
CSV com caracteres especiais
CSV com fórmulas
CSV com campos inesperados
```

Verificar:

* limite de tamanho;
* parsing seguro;
* validação;
* normalização;
* deduplicação;
* memory usage;
* possibilidade de DoS por arquivo malformado;
* prototype pollution;
* dados inesperados;
* campos desconhecidos;
* conteúdo HTML;
* URLs maliciosas.

Nunca confiar no:

```json
"userId"
```

proveniente do arquivo importado.

O usuário autenticado/local atual deve determinar a ownership dos registros.

---

# 13. CSV Injection

Auditar exportação CSV.

Campos que começam com caracteres como:

```text
=
+
-
@
```

podem ser interpretados como fórmulas por determinados programas de planilha.

Implementar proteção adequada no exportador sem alterar indevidamente os dados internos.

Testar:

```text
=SUM(...)
=HYPERLINK(...)
@...
+...
-...
```

---

# 14. JSON Security

Garantir que o formato JSON público da aplicação:

* seja versionado;
* seja validado;
* não aceite estruturas arbitrárias;
* não execute conteúdo;
* não permita prototype pollution;
* não contenha secrets;
* não contenha tokens;
* não contenha chaves criptográficas privadas.

---

# 15. IndexedDB Security

Auditar a arquitetura local-first.

Verificar:

* isolamento por usuário;
* ownership dos registros;
* acesso aos stores;
* migrações;
* deleção;
* limpeza;
* dados órfãos;
* dados de usuários anteriores;
* controle de sessão;
* exposição através do DevTools;
* tratamento de dados criptografados.

Nenhum componente deve acessar IndexedDB diretamente se a arquitetura já possui repositories.

Fluxo esperado:

```text
UI
 ↓
Service
 ↓
Repository
 ↓
IndexedDB
```

---

# 16. Web Crypto

Auditar a implementação de criptografia local.

Verificar:

* algoritmo utilizado;
* tamanho das chaves;
* geração segura de chaves;
* armazenamento de chaves;
* derivação de chave;
* salt;
* IV/nonce;
* autenticação;
* rotação;
* lifecycle;
* recuperação;
* destruição;
* tratamento de erros.

Nunca:

```text
hardcode encryption key
```

Nunca exportar chaves criptográficas junto com:

```text
JSON
CSV
backup
share
```

---

# 17. Autenticação e sessão

Auditar o mecanismo atual de autenticação/local login.

Verificar:

* criação de usuário;
* login;
* logout;
* sessão;
* expiração;
* persistência;
* troca de usuário;
* recuperação;
* proteção contra enumeração;
* armazenamento de credenciais;
* armazenamento de tokens;
* limpeza após logout.

Se houver senha:

```text
Nunca armazenar senha em plaintext.
```

Avaliar cuidadosamente o mecanismo de hashing utilizado.

---

# 18. Autorização e isolamento

Mesmo sendo uma aplicação local-first, garantir:

```text
User A
  ↓
não consegue acessar
  ↓
User B
```

Todos os repositories devem respeitar o contexto do usuário atual.

Testar explicitamente:

```text
create
read
update
delete
import
export
search
analytics
```

para garantir isolamento.

---

# 19. PWA e Service Worker

Auditar:

```text
Service Worker
Cache
Cache Storage
Manifest
Offline pages
Update strategy
```

Verificar risco de cachear:

```text
dados privados
tokens
respostas autenticadas
informações sensíveis
```

Separar:

```text
Static Assets
```

de:

```text
User Data
```

Nunca permitir que informações privadas sejam acidentalmente disponibilizadas através do cache público.

---

# 20. Cache Poisoning

Avaliar:

* cache keys;
* URLs;
* query parameters;
* headers;
* conteúdo dinâmico;
* atualização do Service Worker.

Garantir que um conteúdo gerado para um contexto de usuário não seja reutilizado para outro.

---

# 21. Security Headers

Avaliar headers de produção.

Entre outros:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Frame-Ancestors
```

Avaliar também:

```text
X-Frame-Options
```

quando aplicável.

Não adicionar headers simplesmente por checklist.

Cada política deve ser compatível com:

* Next.js;
* PWA;
* Service Worker;
* Web APIs;
* recursos externos utilizados;
* analytics, se existirem;
* fontes;
* imagens;
* APIs.

---

# 22. Content Security Policy

Criar uma CSP progressivamente mais restritiva.

Objetivo:

```text
default-src 'self'
```

e liberar somente os recursos realmente necessários.

Auditar:

```text
script-src
style-src
img-src
font-src
connect-src
media-src
worker-src
manifest-src
frame-src
object-src
base-uri
form-action
```

Evitar:

```text
unsafe-eval
```

quando possível.

Evitar:

```text
unsafe-inline
```

quando a arquitetura permitir.

Não quebrar:

* Next.js;
* PWA;
* Web Workers;
* câmera;
* speech recognition;
* Service Worker.

---

# 23. Permissions Policy

Como a aplicação utiliza APIs sensíveis, avaliar uma `Permissions-Policy` apropriada.

Especialmente:

```text
camera
microphone
geolocation
```

Permitir apenas o necessário.

Isso deve complementar, e não substituir, as permissões solicitadas pelo navegador.

---

# 24. Camera / Microphone Security

Auditar as funcionalidades do Sprint 8.

Garantir:

```text
User action
 ↓
Permission
 ↓
Resource
 ↓
Usage
 ↓
Cleanup
```

Nunca:

```text
Page load
 ↓
Camera ON
```

ou:

```text
Page load
 ↓
Microphone ON
```

Garantir que:

```ts
stream.getTracks().forEach(track => track.stop())
```

seja executado quando o recurso deixar de ser necessário.

---

# 25. Notifications Security

Auditar o conteúdo das notificações.

Não expor informações sensíveis desnecessariamente.

Preferir:

```text
"Você possui um lembrete pendente."
```

a:

```text
"Sua glicemia registrada às 09:30 foi 180 mg/dL."
```

Avaliar:

* tela bloqueada;
* preview;
* conteúdo;
* identificação do usuário;
* dados médicos/sensíveis.

---

# 26. Speech Recognition Security

Auditar:

* ativação manual;
* permissões;
* lifecycle;
* conteúdo reconhecido;
* armazenamento;
* logs;
* erros.

Não armazenar áudio.

Não enviar texto para terceiros sem consentimento explícito.

---

# 27. Web APIs e dispositivos

Preparar a arquitetura para a futura Sprint de Device Integrations.

Auditar qualquer uso de:

```text
Web Bluetooth
Web Serial
Web Share
Camera
Microphone
Notifications
```

Garantir:

* capability detection;
* permission boundary;
* user activation;
* cleanup;
* tratamento de erros;
* nenhum acesso automático.

---

# 28. URL e navegação

Auditar:

* links externos;
* redirects;
* query parameters;
* deep links;
* URLs importadas;
* URLs compartilhadas.

Procurar vulnerabilidades como:

```text
Open Redirect
javascript:
data:
```

e esquemas perigosos.

Validar URLs antes de utilizá-las.

---

# 29. CSRF / SSR / Server Actions

Mesmo sendo local-first, verificar todas as funcionalidades server-side existentes.

Auditar:

* Route Handlers;
* API routes;
* Server Actions;
* cookies;
* mutations;
* headers;
* origem;
* métodos HTTP.

Garantir proteção apropriada caso existam operações autenticadas.

---

# 30. Rate Limiting

Identificar endpoints que possam sofrer abuso.

Caso exista backend:

```text
authentication
registration
password operations
imports
exports
API endpoints
```

avaliar rate limiting.

Não implementar rate limiting complexo no client como se fosse proteção real.

Proteções de segurança devem existir no servidor quando houver servidor envolvido.

---

# 31. Error Handling

Auditar mensagens de erro.

Nunca expor:

```text
stack traces
database errors
internal paths
tokens
secrets
implementation details
```

para o usuário.

Separar:

```text
User-facing error
Internal diagnostic error
```

Logs internos também não devem conter dados sensíveis.

---

# 32. Logging

Auditar:

```text
console.log
console.error
console.warn
telemetry
analytics
```

Remover logs de:

* dados pessoais;
* registros;
* tokens;
* credenciais;
* conteúdo de voz;
* dados de dispositivos;
* informações sensíveis.

Criar política clara de logging.

---

# 33. Dependências client-side

Identificar bibliotecas que podem ser substituídas por APIs nativas.

Exemplo:

```text
Date manipulation
UUID
File handling
Web Share
Crypto
```

Mas não substituir uma biblioteca apenas para reduzir dependências.

Avaliar:

```text
Security
Bundle
Performance
Browser support
Maintenance
Developer Experience
```

---

# 34. Performance Security Trade-off

Toda correção deve passar por uma avaliação:

```text
Security
    +
Performance
    +
Accessibility
    +
UX
```

Exemplo:

Não introduzir uma biblioteca pesada de sanitização se uma solução segura, menor e adequada ao contexto já existir.

Não adicionar scripts externos apenas para realizar uma auditoria.

Não executar verificações pesadas no main thread quando puderem ser realizadas:

```text
Build time
Server side
Web Worker
```

---

# 35. Web Worker

Avaliar operações pesadas de segurança/processamento:

* parsing de arquivos;
* validação de grandes imports;
* sanitização pesada;
* análise de dados.

Quando apropriado:

```text
Main Thread
      ↓
Web Worker
      ↓
Validation / Processing
      ↓
Result
```

O objetivo é evitar bloqueio da UI.

---

# 36. Acessibilidade

Após todas as correções de segurança, executar regressão completa de acessibilidade.

Verificar:

* WCAG;
* teclado;
* leitores de tela;
* foco;
* contraste;
* formulários;
* mensagens de erro;
* modais;
* permissões;
* câmera;
* voz;
* notificações.

Nenhuma medida de segurança deve tornar uma funcionalidade inacessível.

---

# 37. Performance

Executar novamente:

* Lighthouse;
* bundle analyzer;
* Core Web Vitals;
* performance mobile;
* cold load;
* warm load;
* offline load.

Comparar com o baseline criado no início da sprint.

Criar tabela:

```text
Metric             Before     After      Difference
---------------------------------------------------
Performance        XX         XX         +/- X
Accessibility      XX         XX         +/- X
Best Practices     XX         XX         +/- X
Bundle             XX KB      XX KB      +/- X
LCP                XX         XX         +/- X
INP                XX         XX         +/- X
CLS                XX         XX         +/- X
```

Nenhuma regressão significativa deve ser aceita sem justificativa documentada.

---

# 38. Automated Security Checks

Adicionar ao CI/CD verificações adequadas.

Exemplo conceitual:

```text
Pull Request
     ↓
Lint
     ↓
Typecheck
     ↓
Unit Tests
     ↓
Build
     ↓
Dependency Audit
     ↓
Security Checks
     ↓
E2E
```

Avaliar ferramentas como:

```text
npm audit / pnpm audit / yarn audit / bun audit
Dependabot
Renovate
OSV Scanner
Semgrep
CodeQL
```

Não adicionar todas automaticamente.

Selecionar as ferramentas que realmente agregam valor ao projeto.

---

# 39. Secret Scanning

Adicionar secret scanning no repositório/CI.

Detectar padrões como:

```text
API keys
tokens
private keys
credentials
JWT secrets
```

Avaliar ferramentas como:

```text
Gitleaks
GitHub Secret Scanning
TruffleHog
```

Caso uma ferramenta seja escolhida, documentar a decisão.

---

# 40. SAST

Adicionar análise estática de segurança quando apropriado.

Objetivos:

* detectar XSS;
* insecure DOM usage;
* injection;
* hardcoded secrets;
* unsafe APIs;
* problemas de autenticação;
* padrões perigosos.

Não aceitar automaticamente todos os findings.

Classificar:

```text
True Positive
False Positive
Accepted Risk
Fixed
```

---

# 41. OWASP

Utilizar como referência principal as boas práticas do:

```text
OWASP
```

Considerar especialmente categorias relacionadas a:

* Broken Access Control;
* Cryptographic Failures;
* Injection;
* Insecure Design;
* Security Misconfiguration;
* Vulnerable Components;
* Identification and Authentication Failures;
* Software and Data Integrity Failures;
* Security Logging and Monitoring Failures.

Não transformar a sprint em uma implementação artificial de checklist.

Relacionar cada finding ao contexto real da aplicação.

---

# 42. Threat Modeling

Criar um pequeno Threat Model.

Mapear:

```text
User
 ↓
Browser
 ↓
PWA
 ↓
IndexedDB
 ↓
Web APIs
 ↓
Optional Backend
 ↓
External Services
```

Identificar:

```text
Assets
Threats
Attack Surface
Trust Boundaries
Mitigations
Residual Risks
```

---

# 43. Principais assets

Identificar como assets:

```text
User data
Glucose records
Meals
Activities
Notes
Images
Export files
Encryption keys
Authentication data
Device identifiers
Application configuration
```

Classificar por sensibilidade.

---

# 44. Threat Model mínimo

Avaliar cenários como:

```text
Malicious imported file
Malicious browser extension
XSS
Compromised dependency
Stolen device
Unauthorized local access
Cache poisoning
Session theft
Malicious external URL
Malicious device
Fake device data
Supply-chain attack
```

Não é necessário implementar proteção impossível contra todas as ameaças.

Registrar:

```text
Mitigated
Partially mitigated
Out of scope
```

---

# 45. Security Documentation

Criar:

```text
docs/security/
├── SECURITY-AUDIT.md
├── THREAT-MODEL.md
├── DEPENDENCY-POLICY.md
├── DATA-SECURITY.md
└── INCIDENT-RESPONSE.md
```

Adaptar os nomes à estrutura existente.

---

# 46. SECURITY.md

Criar ou revisar:

```text
SECURITY.md
```

Definir:

* versão suportada;
* como reportar vulnerabilidades;
* comportamento esperado;
* informações que não devem ser publicadas;
* processo de análise;
* contato de segurança, quando aplicável.

---

# 47. Security Checklist

Criar uma checklist reutilizável para futuras releases.

Exemplo:

```text
[ ] Dependencies audited
[ ] Secrets scanned
[ ] SAST executed
[ ] Tests passing
[ ] Build passing
[ ] CSP validated
[ ] Security headers validated
[ ] Permissions Policy validated
[ ] XSS audit completed
[ ] Input validation reviewed
[ ] IndexedDB reviewed
[ ] Web Crypto reviewed
[ ] PWA cache reviewed
[ ] Import/export reviewed
[ ] Web APIs reviewed
[ ] Accessibility regression checked
[ ] Performance regression checked
[ ] Threat model updated
```

---

# 48. Security Regression Tests

Toda vulnerabilidade corrigida deve, quando possível, possuir um teste que impeça sua regressão.

Exemplo:

```text
Vulnerability
     ↓
Fix
     ↓
Regression Test
```

Isso é obrigatório principalmente para:

* XSS;
* authorization;
* import validation;
* sanitization;
* crypto;
* cache isolation;
* authentication.

---

# 49. Definition of Done

A Sprint 10 será considerada concluída quando:

### Dependencies

* [ ] Dependências auditadas;
* [ ] vulnerabilidades classificadas;
* [ ] atualizações críticas aplicadas;
* [ ] breaking changes documentadas;
* [ ] dependências desnecessárias identificadas;
* [ ] lockfile validado.

### Application

* [ ] XSS auditado;
* [ ] inputs validados;
* [ ] imports protegidos;
* [ ] exports protegidos;
* [ ] IndexedDB auditado;
* [ ] ownership validada;
* [ ] autenticação auditada;
* [ ] autorização auditada;
* [ ] Web Crypto auditado;
* [ ] PWA auditado;
* [ ] Service Worker auditado.

### Browser APIs

* [ ] Camera auditada;
* [ ] Microphone/Speech auditado;
* [ ] Notifications auditadas;
* [ ] Web Share auditado;
* [ ] capabilities verificadas;
* [ ] permissões revisadas.

### Infrastructure

* [ ] Security Headers revisados;
* [ ] CSP revisada;
* [ ] Permissions Policy revisada;
* [ ] HTTPS validado;
* [ ] secrets scanning configurado;
* [ ] SAST configurado;
* [ ] dependency scanning configurado.

### Quality

* [ ] Unit tests passando;
* [ ] Integration tests passando;
* [ ] E2E passando;
* [ ] Security regression tests criados;
* [ ] Lighthouse sem regressão significativa;
* [ ] acessibilidade sem regressão;
* [ ] bundle sem crescimento injustificado;
* [ ] funcionamento offline validado.

### Documentation

* [ ] SECURITY.md atualizado;
* [ ] Threat Model documentado;
* [ ] Security Audit documentado;
* [ ] Dependency Policy documentada;
* [ ] checklist de segurança criada.

---

# 50. Entregáveis

Ao final da sprint, entregar:

```text
1. Security Audit Report
2. Threat Model
3. Dependency Audit
4. Vulnerability Register
5. Security Hardening
6. Security Regression Tests
7. CI Security Checks
8. Updated SECURITY.md
9. Security Checklist
10. Performance/Accessibility Regression Report
```

---

# Resultado esperado

A aplicação deve sair desta sprint não apenas "com algumas vulnerabilidades corrigidas", mas com uma **fundação de segurança sustentável**.

A arquitetura final deverá seguir:

```text
                 SECURITY
                    │
        ┌───────────┴───────────┐
        │                       │
   APPLICATION              DATA
        │                       │
   ┌────┴────┐             ┌────┴────┐
   │         │             │         │
 Browser   Server       Storage    Export
   │         │             │         │
   └────┬────┘             └────┬────┘
        │                       │
        └───────────┬───────────┘
                    │
              USER OWNERSHIP
```

A segurança deve ser tratada como uma característica transversal da aplicação, e não como uma feature isolada.

O objetivo final é:

> **Uma aplicação local-first, privacy-first e secure-by-default, sem sacrificar performance, acessibilidade, compatibilidade ou experiência do usuário.**
