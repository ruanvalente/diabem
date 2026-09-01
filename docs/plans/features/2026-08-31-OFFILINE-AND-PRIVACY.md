# Sprint 6 — Offline + Privacy

## Objetivo

Transformar o DiaBem em uma aplicação **PWA offline-first**, capaz de continuar funcionando quando o usuário estiver sem conexão com a internet, mantendo seus dados disponíveis localmente e protegendo informações sensíveis armazenadas no navegador.

Nesta sprint, implementar:

- PWA;
- Web App Manifest;
- Service Worker;
- estratégias de cache;
- experiência offline;
- detecção de conectividade;
- Web Crypto API;
- proteção dos dados locais;
- gerenciamento seguro de chaves;
- limpeza segura de dados;
- indicadores de estado offline/online;
- testes de instalação e funcionamento offline.

A aplicação deve continuar funcional sem conexão para as principais funcionalidades do MVP.

---

# 1. Princípios fundamentais

O DiaBem deve seguir o conceito:

> **Local-first + Offline-first + Privacy-first**

Arquitetura:

```text
                    Next.js
                       │
              ┌────────┴────────┐
              ↓                 ↓
         Service Worker      Application
              │                 │
            Cache             Dexie
              │                 │
              ↓                 ↓
           Assets           IndexedDB
                                │
                                ↓
                           Web Crypto
```

A conexão com a internet não deve ser requisito para:

- abrir a aplicação;
- visualizar dados já registrados;
- criar registros;
- editar registros;
- excluir registros;
- visualizar dashboard;
- visualizar timeline;
- executar analytics;
- executar regras;
- visualizar insights já calculados.

---

# 2. Analisar a codebase antes de implementar

Antes de qualquer implementação, analisar as Sprints anteriores.

Verificar:

### Sprint 2

- autenticação;
- criação de usuário;
- IndexedDB;
- Dexie;
- repositories;
- schemas;
- isolamento por `userId`;
- estratégia atual de persistência.

### Sprint 3

- glicemia;
- alimentação;
- atividade;
- observações.

### Sprint 4

- dashboard;
- timeline;
- filtros;
- gráficos.

### Sprint 5

- Analytics Engine;
- Web Worker;
- Rule Engine;
- Insights;
- transformação de dados.

Também verificar:

- configuração atual do Next.js;
- `app/`;
- layouts;
- metadata;
- assets;
- fonts;
- dependências;
- estratégia de cache existente;
- APIs externas;
- autenticação;
- armazenamento local;
- testes.

Antes de modificar arquivos, apresentar:

1. arquitetura atual;
2. estratégia PWA existente;
3. dependências que podem ser reutilizadas;
4. recursos que precisam funcionar offline;
5. dados que precisam de criptografia;
6. riscos de segurança;
7. estratégia de cache proposta.

Não duplicar funcionalidades existentes.

---

# 3. Arquitetura Offline-first

A aplicação deve seguir:

```text
                User
                  │
                  ↓
              Next.js UI
                  │
          ┌───────┴────────┐
          ↓                ↓
       Cache            Local Data
          │                │
          ↓                ↓
   Service Worker        Dexie
                           │
                           ↓
                       Web Crypto
```

A regra principal:

> A UI nunca deve depender diretamente da rede para funcionar.

Quando existir uma API futura, a arquitetura deverá permitir:

```text
UI
 ↓
Service
 ↓
Local Repository
 ↓
IndexedDB
```

e posteriormente:

```text
Local Repository
      ↓
Sync Layer
      ↓
Remote API
```

---

# 4. PWA

Transformar o DiaBem em uma Progressive Web App instalável.

Implementar:

```text
manifest.webmanifest
```

com:

- nome da aplicação;
- nome curto;
- descrição;
- ícones;
- tema;
- background;
- `display`;
- `start_url`;
- orientação adequada;
- escopos corretos.

Validar instalação:

- Chrome;
- Edge;
- navegadores baseados em Chromium;
- Safari quando aplicável.

---

# 5. Manifest

Exemplo conceitual:

```json
{
  "name": "DiaBem",
  "short_name": "DiaBem",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "...",
  "background_color": "..."
}
```

Adaptar às convenções do projeto.

Não colocar informações pessoais no manifest.

---

# 6. Ícones

Criar os tamanhos necessários para instalação.

Considerar pelo menos:

```text
192x192
512x512
```

Adicionar suporte para:

```text
maskable
```

quando apropriado.

Validar os ícones através das ferramentas de auditoria PWA do navegador.

---

# 7. Service Worker

Implementar um Service Worker responsável por:

- interceptar requisições apropriadas;
- armazenar assets;
- disponibilizar recursos offline;
- controlar versões de cache;
- invalidar caches antigos;
- permitir atualização controlada.

Não colocar regras de negócio no Service Worker.

O Service Worker não deve conhecer:

- glicemia;
- refeições;
- atividades;
- insights;
- usuários;
- regras médicas.

Ele trabalha apenas com recursos da aplicação e estratégias de cache.

---

# 8. Estratégia de cache

Definir estratégias diferentes para cada tipo de recurso.

### Static Assets

Preferir:

```text
Cache First
```

Para:

- JavaScript;
- CSS;
- fontes;
- ícones;
- imagens estáticas.

---

### Navegação

Avaliar:

```text
Network First
```

ou estratégia compatível com Next.js e a arquitetura atual.

Quando offline:

```text
Network
   ↓
Falha
   ↓
Cached fallback
```

---

### Recursos dinâmicos

Não cachear indiscriminadamente.

Dados pessoais armazenados no IndexedDB **não devem ser tratados como cache HTTP**.

Separar:

```text
Application Cache
```

de:

```text
User Data
```

---

# 9. Cache versioning

Criar versões explícitas.

Exemplo:

```ts
const CACHE_VERSION = "v1";
```

Caches:

```text
diabem-static-v1
diabem-runtime-v1
```

Quando houver atualização:

```text
v1
 ↓
v2
 ↓
remover v1
```

Não deixar caches antigos acumularem indefinidamente.

---

# 10. Atualização do Service Worker

Implementar estratégia segura de atualização.

Quando existir uma nova versão:

```text
Nova versão disponível
```

Informar o usuário de maneira discreta.

Exemplo:

```text
Uma nova versão do DiaBem está disponível.

[ Atualizar ]
```

Não interromper uma operação de registro em andamento.

---

# 11. Experiência Offline

Criar um indicador de conexão.

Exemplo:

```text
● Online
```

e:

```text
○ Offline
```

No offline:

```text
Você está offline.
Seus dados continuam disponíveis neste dispositivo.
```

Não utilizar mensagens alarmistas.

---

# 12. Network Status

Criar hook:

```ts
useNetworkStatus();
```

ou equivalente.

Utilizar:

```ts
navigator.onLine;
```

e eventos:

```text
online
offline
```

Não considerar `navigator.onLine` uma garantia absoluta de conectividade.

Ele representa o estado de conectividade reportado pelo navegador.

---

# 13. Offline Banner

Criar componente reutilizável:

```text
OfflineIndicator
```

Exemplo:

```text
┌─────────────────────────────────────────┐
│ Você está offline. Seus dados locais    │
│ continuam disponíveis.                  │
└─────────────────────────────────────────┘
```

Quando voltar:

```text
Conexão restaurada.
```

A mensagem deve desaparecer automaticamente após alguns segundos.

---

# 14. Indicador de persistência local

Adicionar uma indicação discreta de que os dados estão sendo armazenados localmente.

Exemplo:

```text
🔒 Dados armazenados neste dispositivo
```

Esse indicador deve levar a uma explicação sobre privacidade.

---

# 15. Funcionalidades offline obrigatórias

Validar que funcionam sem internet:

### Autenticação local

Caso a arquitetura de autenticação já permita sessão local:

```text
Login
 ↓
Sessão
 ↓
Aplicação
```

deve continuar funcionando conforme o modelo definido na Sprint 2.

Caso o login dependa exclusivamente de servidor, **não inventar uma autenticação offline insegura**.

Documentar a limitação e adaptar a experiência.

---

### Registros

Offline:

```text
Criar glicemia
Criar refeição
Criar atividade
Criar observação
```

devem funcionar.

---

### Edição

Offline:

```text
Editar registro
```

deve funcionar.

---

### Exclusão

Offline:

```text
Excluir registro
```

deve funcionar.

---

### Dashboard

Offline:

```text
Dashboard
 ↓
IndexedDB
 ↓
Analytics
```

deve funcionar.

---

### Timeline

Offline:

```text
Timeline
 ↓
IndexedDB
```

deve funcionar.

---

### Analytics

Offline:

```text
IndexedDB
 ↓
Web Worker
 ↓
Analytics
```

deve funcionar.

---

### Insights

Offline:

```text
Analytics
 ↓
Rule Engine
 ↓
Insights
```

deve funcionar.

---

# 16. Web Crypto API

Implementar proteção criptográfica para os dados sensíveis armazenados localmente.

Utilizar a:

```text
Web Crypto API
```

e APIs nativas do navegador sempre que possível.

Não implementar criptografia manual.

Não criar algoritmos próprios.

Não utilizar:

```text
Base64
```

como mecanismo de proteção.

Base64 não é criptografia.

---

# 17. Objetivo da criptografia

A camada de persistência deve permitir:

```text
Dados em memória
      ↓
Encrypt
      ↓
IndexedDB
```

e:

```text
IndexedDB
      ↓
Decrypt
      ↓
Application
```

O objetivo é evitar que os dados sejam armazenados em texto puro dentro do IndexedDB.

---

# 18. Algoritmo criptográfico

Utilizar algoritmos suportados nativamente pela Web Crypto API.

Preferir uma construção autenticada como:

```text
AES-GCM
```

com nonce/IV único por operação de criptografia.

Nunca reutilizar IV com a mesma chave.

---

# 19. Encryption Service

Criar uma abstração:

```text
src/
└── lib/
    └── crypto/
        ├── crypto.service.ts
        ├── key-manager.ts
        ├── encryption.ts
        ├── decryption.ts
        └── crypto.types.ts
```

Adaptar à arquitetura atual.

A aplicação não deve chamar diretamente:

```text
crypto.subtle.encrypt()
```

em dezenas de lugares.

Centralizar a implementação.

---

# 20. Crypto API

Criar API semelhante a:

```ts
encrypt(data, key);
decrypt(payload, key);
generateKey();
exportKey();
importKey();
```

As funções devem ser:

- tipadas;
- testáveis;
- assíncronas;
- independentes da UI.

---

# 21. Estrutura do payload criptografado

Criar um formato versionado.

Exemplo conceitual:

```ts
type EncryptedPayload = {
  version: number;
  algorithm: "AES-GCM";
  iv: string;
  data: string;
};
```

A versão permite evoluir o mecanismo posteriormente.

---

# 22. Gerenciamento de chaves

Essa é uma parte crítica.

Não armazenar uma chave secreta fixa diretamente no código:

```ts
// ❌ Nunca fazer
const SECRET_KEY = "minha-chave";
```

Não colocar chave de criptografia em:

- `.env` client-side;
- código JavaScript;
- `localStorage`;
- IndexedDB em texto puro;
- cookies acessíveis por JavaScript.

---

# 23. Estratégia de chave

Projetar o gerenciamento da chave considerando a arquitetura atual de autenticação.

Idealmente:

```text
Credencial do usuário
       ↓
Key Derivation
       ↓
Encryption Key
       ↓
AES-GCM
```

A chave derivada não deve ser armazenada diretamente.

Utilizar uma função de derivação de chave adequada disponível na Web Crypto API.

Exemplo:

```text
PBKDF2
```

ou outra construção suportada e adequada ao modelo de ameaça.

---

# 24. Salt

Quando houver derivação de chave:

```text
User Secret
   +
Random Salt
   ↓
Derived Key
```

O salt pode ser armazenado junto aos metadados criptográficos.

O salt não é secreto.

Nunca utilizar um salt fixo para todos os usuários.

---

# 25. Limitação importante

Documentar explicitamente:

> A criptografia local não protege o usuário contra um dispositivo já comprometido, malware ou código JavaScript malicioso executando com acesso à mesma sessão.

O objetivo é proteger os dados armazenados em repouso no armazenamento local do navegador.

---

# 26. Proteção contra XSS

Como os dados serão descriptografados em memória, reforçar:

- escaping;
- sanitização;
- Content Security Policy quando possível;
- uso seguro de HTML;
- evitar `dangerouslySetInnerHTML`;
- validação de inputs;
- dependências confiáveis.

Não renderizar dados de observações ou refeições como HTML arbitrário.

---

# 27. CSP

Avaliar a implementação de:

```text
Content-Security-Policy
```

compatível com Next.js.

Não quebrar:

- scripts necessários;
- Service Worker;
- fontes;
- funcionalidades do Next.js.

Documentar as diretivas adotadas.

---

# 28. Dados que devem ser criptografados

Priorizar dados pessoais e de saúde.

Exemplo:

```text
GlucoseReading
Meal
Activity
Note
```

Também avaliar:

- informações do perfil;
- observações;
- preferências que possam revelar informações sensíveis.

Separar:

```text
Application Metadata
```

de:

```text
Sensitive User Data
```

Nem todo dado técnico precisa ser criptografado.

---

# 29. Dexie + Crypto

A camada de repository deve permanecer transparente.

Arquitetura:

```text
Component
   ↓
Service
   ↓
Repository
   ↓
Crypto Layer
   ↓
Dexie
   ↓
IndexedDB
```

Exemplo:

```text
saveGlucose()
      ↓
encrypt()
      ↓
repository.save()
      ↓
IndexedDB
```

e:

```text
repository.find()
      ↓
decrypt()
      ↓
GlucoseReading
```

A UI nunca deve precisar saber se o dado está criptografado.

---

# 30. Migração dos dados existentes

Implementar estratégia para dados já existentes em IndexedDB.

Caso existam registros em texto puro:

```text
Plain Data
   ↓
Migration
   ↓
Encrypt
   ↓
Encrypted Data
```

A migração deve ser:

- idempotente;
- versionada;
- segura;
- testada.

Não perder dados durante a migração.

---

# 31. Dexie migrations

Utilizar o sistema de versionamento do Dexie.

Exemplo conceitual:

```text
Version 1
→ dados antigos

Version 2
→ estrutura criptografada
```

Não simplesmente apagar o banco para implementar criptografia.

---

# 32. Falha na descriptografia

Caso a aplicação não consiga descriptografar um registro:

Não:

```text
ignorar silenciosamente
```

Apresentar um erro controlado.

Exemplo:

```text
Não foi possível acessar este registro.

Se o problema persistir, verifique sua sessão ou restaure
seus dados a partir de um backup.
```

Não expor:

- chave;
- payload criptografado;
- detalhes internos;
- stack trace.

---

# 33. Logout

Definir claramente o comportamento da chave ao realizar logout.

Avaliar:

```text
Logout
 ↓
Limpar chave da memória
```

e manter:

```text
Dados criptografados
```

no dispositivo.

Documentar como o usuário poderá recuperar os dados ao fazer login novamente.

Se a arquitetura atual não permitir recuperação segura da chave após logout, não apagar os dados silenciosamente.

---

# 34. Lock da aplicação

Avaliar uma camada adicional:

```text
Usuário inativo
      ↓
Application Lock
      ↓
Solicitar autenticação
```

Não é obrigatório implementar caso o escopo do MVP fique grande, mas a arquitetura deve permitir futuramente.

---

# 35. Auto-lock

Preparar suporte para:

```text
5 minutos
15 minutos
30 minutos
Nunca
```

Não implementar complexidade desnecessária se a autenticação atual ainda não suporta esse fluxo.

---

# 36. Backup e recuperação

Como os dados são locais, considerar uma estratégia futura de exportação.

A Sprint 6 deve pelo menos preservar compatibilidade com:

```text
Export
 ↓
Encrypted/portable backup
```

A implementação completa de backup pode ficar para uma sprint posterior.

Nunca criar uma funcionalidade de exportação que exponha dados sensíveis sem avisar o usuário.

---

# 37. Service Worker e dados pessoais

Não armazenar dados de saúde diretamente no Cache Storage.

Evitar:

```text
fetch("/api/glucose")
 ↓
cache.put(...)
```

para dados pessoais.

O armazenamento dos dados do usuário deve continuar sendo:

```text
IndexedDB
```

protegido pela camada de criptografia.

---

# 38. Cache Storage vs IndexedDB

Manter separação clara:

```text
Cache Storage
→ arquivos da aplicação

IndexedDB
→ dados do usuário
```

Exemplo:

```text
Cache:
JS
CSS
Fonts
Icons
Static assets

IndexedDB:
Glucose
Meals
Activities
Notes
Profile
Insights/cache de analytics
```

Se insights derivados contiverem informações sensíveis, tratá-los como dados sensíveis também.

---

# 39. Analytics + Privacy

A Sprint 5 deve continuar funcionando offline.

Arquitetura:

```text
Encrypted IndexedDB
       ↓
Decrypt
       ↓
Analytics Worker
       ↓
Results
       ↓
UI
```

Avaliar cuidadosamente o ciclo de vida dos dados descriptografados.

Não manter dados sensíveis em memória por mais tempo que o necessário.

---

# 40. Web Worker + Crypto

Não mover automaticamente a chave criptográfica para o Worker.

Avaliar o modelo de ameaça antes de permitir:

```text
Main Thread
      ↓
Crypto Key
      ↓
Worker
```

Se o Worker precisar receber dados, enviar apenas o conjunto mínimo necessário.

Preferir:

```text
Repository
 ↓
Decrypt
 ↓
Analytics Worker
```

e descartar os dados após o processamento.

---

# 41. Memory Hygiene

Não existe garantia absoluta de apagar imediatamente dados da memória JavaScript.

Mesmo assim:

- limitar referências;
- evitar cópias desnecessárias;
- limpar estados quando apropriado;
- não manter datasets inteiros globalmente;
- evitar logs.

Nunca:

```ts
console.log(decryptedHealthData);
```

---

# 42. Logs

Proibir logs de:

- glicemia;
- refeições;
- observações;
- atividades;
- payloads criptografados;
- chaves;
- tokens;
- credenciais.

Durante desenvolvimento, utilizar apenas dados fictícios.

---

# 43. Erros

Criar erros genéricos para a camada de UI.

Internamente:

```ts
CryptoError;
StorageError;
MigrationError;
```

Externamente:

```text
Não foi possível acessar seus dados.
```

Não mostrar detalhes criptográficos.

---

# 44. Storage Persistence

Avaliar:

```ts
navigator.storage.persist();
```

quando suportado.

O objetivo é reduzir a possibilidade de o navegador remover dados locais sob pressão de armazenamento.

Não assumir que o navegador sempre concederá persistência.

Criar:

```text
StoragePersistenceService
```

caso faça sentido para a arquitetura.

---

# 45. Storage Estimate

Avaliar:

```ts
navigator.storage.estimate();
```

para saber:

```text
usage
quota
```

Criar aviso quando o armazenamento estiver próximo do limite.

Exemplo:

```text
O armazenamento deste dispositivo está quase cheio.
Considere exportar seus dados antes de continuar.
```

Não bloquear a aplicação prematuramente.

---

# 46. Instalação da PWA

Adicionar UX opcional para instalação.

Exemplo:

```text
Tenha o DiaBem sempre à mão.

Instale o aplicativo no seu dispositivo.

[ Instalar ]
```

Não mostrar repetidamente.

Utilizar o evento apropriado do navegador quando disponível.

---

# 47. Standalone UX

Quando instalada como PWA:

- validar navegação;
- validar viewport;
- validar safe areas;
- validar teclado mobile;
- validar dialogs;
- validar sheets;
- validar scrolling.

Considerar:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

quando apropriado.

---

# 48. Mobile-first

Testar principalmente:

- Android Chrome;
- iOS Safari;
- PWA instalada;
- modo standalone;
- orientação portrait.

Garantir que:

```text
offline
+
mobile
+
PWA
```

funcione corretamente.

---

# 49. Dark Mode

Garantir que:

```text
Online
Offline
Loading
Error
Update Available
```

funcionem corretamente no tema claro e escuro.

Não utilizar cores que dependam exclusivamente do status.

---

# 50. Acessibilidade

Garantir:

- foco;
- teclado;
- screen readers;
- aria-live para mudanças de conectividade;
- contraste;
- mensagens de erro acessíveis.

Exemplo:

```html
aria-live="polite"
```

para:

```text
Conexão restaurada.
```

---

# 51. Testes do Service Worker

Validar:

### Online

```text
App
 ↓
Network
 ↓
Response
```

### Offline após primeiro acesso

```text
App
 ↓
Cache
 ↓
Funcionamento
```

### Atualização

```text
v1
 ↓
Nova versão
 ↓
v2
 ↓
Cache antigo removido
```

---

# 52. Testes Offline E2E

Criar fluxo:

```text
Abrir aplicação online
 ↓
Carregar aplicação
 ↓
Criar dados
 ↓
Desconectar internet
 ↓
Recarregar aplicação
 ↓
Dashboard funciona
 ↓
Timeline funciona
 ↓
Criar novo registro
 ↓
Editar registro
 ↓
Executar analytics
 ↓
Visualizar insight
```

---

# 53. Testes de criptografia

Testar:

```text
plaintext
 ↓
encrypt
 ↓
decrypt
 ↓
plaintext
```

Resultado esperado:

```text
original === decrypted
```

Testar também:

- IV diferente a cada criptografia;
- chave inválida;
- payload alterado;
- payload corrompido;
- versão desconhecida;
- dados vazios;
- dados grandes.

---

# 54. Teste de adulteração

Alterar um byte do payload criptografado.

Resultado esperado:

```text
decrypt
 ↓
falha
```

O sistema não deve retornar dados parcialmente corrompidos como válidos.

---

# 55. Testes de isolamento

Validar:

```text
User A
 ↓
Encrypted Data A
```

não pode ser acessado pelo:

```text
User B
```

Mesmo que ambos utilizem o mesmo navegador/dispositivo.

---

# 56. Testes de migração

Testar:

```text
DB v1
 ↓
Migration
 ↓
DB v2
 ↓
Decrypt
 ↓
Dados preservados
```

Validar:

- quantidade de registros;
- IDs;
- timestamps;
- relacionamentos;
- campos;
- usuário associado.

---

# 57. Testes de storage

Validar:

```text
Storage disponível
Storage limitado
Storage cheio
Persistence granted
Persistence denied
API indisponível
```

A aplicação deve continuar funcionando de maneira degradada quando APIs opcionais não existirem.

---

# 58. Segurança

Realizar revisão específica procurando:

- dados sensíveis em logs;
- dados em URLs;
- dados no Cache Storage;
- chaves no código;
- chaves no localStorage;
- secrets client-side;
- XSS;
- HTML arbitrário;
- dependências suspeitas;
- Service Worker excessivamente permissivo.

---

# 59. Não utilizar Web Crypto como solução mágica

Documentar claramente:

> Criptografar dados no IndexedDB melhora a proteção dos dados em repouso, mas não transforma o navegador em um ambiente seguro contra código malicioso executado dentro da mesma origem.

A segurança deve ser composta por:

```text
HTTPS
+
CSP
+
XSS prevention
+
Secure Authentication
+
Web Crypto
+
Minimal Data Exposure
+
No Sensitive Logs
+
Dependency Security
```

---

# 60. Performance

Garantir que a criptografia não prejudique a UX.

Não criptografar e descriptografar milhares de registros individualmente durante cada renderização.

Preferir:

```text
Repository query
 ↓
Decrypt batch
 ↓
Analytics
```

quando apropriado.

Evitar:

```text
Component render
 ↓
decrypt()
 ↓
decrypt()
 ↓
decrypt()
```

---

# 61. Estados da aplicação

Definir estados globais/contextuais:

```text
online
offline
updating
storage_warning
crypto_locked
crypto_error
```

Não criar estados independentes e conflitantes em cada página.

---

# 62. Arquitetura final esperada

Ao final da sprint:

```text
                         Next.js
                            │
                    ┌───────┴────────┐
                    ↓                ↓
                   UI          Service Worker
                    │                │
                    ↓                ↓
                 Services         Cache
                    │
                    ↓
              Repositories
                    │
                    ↓
              Crypto Layer
                    │
                    ↓
                 Dexie
                    │
                    ↓
               IndexedDB
                    │
                    ↓
             Local User Data
```

Analytics:

```text
IndexedDB
   ↓
Decrypt
   ↓
Analytics Service
   ↓
Web Worker
   ↓
Rule Engine
   ↓
Insights
```

---

# 63. Estrutura sugerida

Adaptar à arquitetura existente, mas considerar:

```text
src/
├── app/
│
├── components/
│
├── features/
│
├── lib/
│   ├── crypto/
│   │   ├── crypto.service.ts
│   │   ├── key-manager.ts
│   │   └── crypto.types.ts
│   │
│   ├── offline/
│   │   ├── network-status.ts
│   │   ├── storage.service.ts
│   │   └── persistence.service.ts
│   │
│   └── pwa/
│       ├── registration.ts
│       └── update.service.ts
│
├── workers/
│   └── intelligence.worker.ts
│
└── db/
    ├── database.ts
    ├── schema.ts
    └── migrations/
```

Não criar essa estrutura cegamente.

Respeitar a arquitetura definida no `AGENTS.md` e na documentação de arquitetura do projeto.

---

# 64. Critérios de aceite

A Sprint 6 somente será considerada concluída quando:

## PWA

- [ ] Aplicação instalável.
- [ ] Manifest implementado.
- [ ] Ícones implementados.
- [ ] Display standalone validado.
- [ ] Instalação testada.
- [ ] UX de instalação implementada quando apropriado.

## Service Worker

- [ ] Service Worker implementado.
- [ ] Cache versionado.
- [ ] Assets estáticos disponíveis offline.
- [ ] Estratégia de atualização implementada.
- [ ] Cache antigo removido.
- [ ] Service Worker não contém regras de negócio.

## Offline

- [ ] Aplicação abre offline após primeiro carregamento.
- [ ] Dashboard funciona offline.
- [ ] Timeline funciona offline.
- [ ] Glicemia funciona offline.
- [ ] Alimentação funciona offline.
- [ ] Atividade funciona offline.
- [ ] Observações funcionam offline.
- [ ] Analytics funciona offline.
- [ ] Insights funcionam offline.
- [ ] Criação funciona offline.
- [ ] Edição funciona offline.
- [ ] Exclusão funciona offline.
- [ ] Estado online/offline implementado.

## Storage

- [ ] IndexedDB continua sendo a fonte dos dados do usuário.
- [ ] Cache Storage não contém dados de saúde.
- [ ] Storage quota monitorado quando possível.
- [ ] Storage persistence avaliado.
- [ ] Limites de armazenamento tratados.

## Web Crypto

- [ ] Web Crypto implementado.
- [ ] AES-GCM utilizado para dados sensíveis.
- [ ] IV único por operação.
- [ ] Chaves não armazenadas em texto puro.
- [ ] Salt adequado quando houver derivação de chave.
- [ ] Payload criptografado versionado.
- [ ] Falhas de descriptografia tratadas.
- [ ] Dados existentes migrados de forma segura.
- [ ] Logs sensíveis removidos.

## Segurança

- [ ] Revisão de XSS.
- [ ] CSP avaliada/implementada.
- [ ] Nenhum secret client-side.
- [ ] Nenhuma chave hardcoded.
- [ ] Nenhum dado sensível em URL.
- [ ] Nenhum dado de saúde em logs.
- [ ] Dependências revisadas.

## Testes

- [ ] Testes unitários do Crypto Service.
- [ ] Testes de migração.
- [ ] Testes de Service Worker.
- [ ] Testes offline.
- [ ] Testes de armazenamento.
- [ ] Testes de isolamento de usuários.
- [ ] Testes E2E da experiência offline.
- [ ] Testes mobile.
- [ ] Testes de instalação PWA.

---

# 65. Resultado esperado

Ao final da Sprint 6, o DiaBem deverá funcionar como:

```text
             DIA BEM
                │
       ┌────────┴────────┐
       ↓                 ↓
     ONLINE            OFFLINE
       │                 │
       ↓                 ↓
    Browser          Service Worker
       │                 │
       └────────┬────────┘
                ↓
             Next.js
                │
                ↓
             Services
                │
                ↓
           Repositories
                │
                ↓
           Crypto Layer
                │
                ↓
             IndexedDB
```

O usuário deverá conseguir abrir o DiaBem mesmo sem internet, consultar seus registros, criar novos registros, utilizar dashboard, timeline e analytics, sem depender de uma API externa.

Os dados pessoais deverão permanecer armazenados localmente e protegidos por criptografia adequada.

---

# 66. Preparação para a próxima evolução

A Sprint 6 deve deixar preparada a arquitetura para uma futura sincronização:

```text
                 Local First
                     │
             ┌───────┴────────┐
             ↓                ↓
         IndexedDB         Remote API
             │                │
             └───────┬────────┘
                     ↓
                Sync Engine
                     │
                     ↓
               Conflict Resolver
```

A sincronização **não deve ser implementada nesta sprint**, a menos que já faça parte do escopo definido.

O objetivo é garantir que a arquitetura atual não impeça essa evolução.

---

# 67. Preparação para IA/MCP

A privacidade construída nesta sprint deve ser mantida nas futuras integrações com IA.

A arquitetura futura deverá ser:

```text
Encrypted Local Data
        ↓
Local Analytics
        ↓
Structured Context
        ↓
AI / MCP
```

Nunca:

```text
IndexedDB
   ↓
Enviar banco inteiro
   ↓
LLM externa
```

Quando IA/MCP forem adicionados, o usuário deverá ter controle explícito sobre quais informações poderão ser utilizadas.

---

# 68. Regra arquitetural principal

A aplicação deve respeitar:

```text
UI
 ↓
Features
 ↓
Services
 ↓
Repositories
 ↓
Crypto
 ↓
IndexedDB
```

Enquanto:

```text
Service Worker
 ↓
Cache
```

é uma infraestrutura independente da camada de domínio.

Não permitir:

```text
Component
 ↓
IndexedDB
```

nem:

```text
Component
 ↓
Cache API
```

nem:

```text
Component
 ↓
crypto.subtle
```

Todas essas responsabilidades devem estar encapsuladas nas respectivas camadas.

---

# 69. Princípio final

O objetivo da Sprint 6 não é simplesmente transformar o DiaBem em uma PWA.

O objetivo é chegar a:

> **Um aplicativo de acompanhamento pessoal que continue funcionando sem internet e mantenha os dados do usuário sob seu controle.**

A aplicação deve priorizar:

```text
Offline
   +
Local-first
   +
Privacy
   +
Security
   +
Accessibility
   +
Performance
```

sem sacrificar a simplicidade da experiência construída nas Sprints anteriores.
