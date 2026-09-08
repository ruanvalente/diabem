# Sprint 8 — Progressive Web APIs

## Objetivo

Implementar uma camada de **Progressive Web APIs** na aplicação, utilizando recursos nativos do navegador para melhorar a experiência do usuário sem comprometer compatibilidade, acessibilidade, privacidade, funcionamento offline ou a experiência em navegadores que não oferecem suporte às APIs utilizadas.

As funcionalidades deste sprint são:

- Notifications API
- Speech Recognition API
- Camera API
- Integração com Service Worker quando necessária
- Detecção de capabilities do navegador
- Fallbacks para todos os recursos opcionais

> **Princípio fundamental:** nenhuma Progressive Web API deve ser requisito obrigatório para utilizar a aplicação.

A aplicação deve continuar funcionando normalmente em navegadores que não suportam uma determinada API.

---

# 1. Diretrizes arquiteturais

Manter a arquitetura definida nos documentos:

- `AGENTS.md`
- `docs/architecture/APPLICATION-ARCHITETURE.md`
- `docs/architecture/COMPONENT-ARCHITETURE.md`

Respeitar também a arquitetura orientada a features/módulos já adotada na aplicação.

As APIs do navegador **não devem ser acessadas diretamente pelos componentes de UI**.

Utilizar uma camada de abstração:

```text
UI
 ↓
Feature Services / Hooks
 ↓
Browser API Services
 ↓
Native Browser API
```

Exemplo:

```text
ReminderSettings
 ↓
NotificationService
 ↓
Notification API
```

e:

```text
VoiceInput
 ↓
SpeechRecognitionService
 ↓
SpeechRecognition API
```

e:

```text
CameraCapture
 ↓
CameraService
 ↓
MediaDevices / getUserMedia
```

Isso deve permitir substituir, testar ou desabilitar cada implementação sem alterar a camada de apresentação.

---

# 2. Capability Detection

Criar uma estratégia centralizada para verificar suporte às APIs.

Não espalhar verificações como:

```ts
if ("Notification" in window)
```

por toda a aplicação.

Criar uma camada responsável por capabilities, por exemplo:

```text
browser/
├── capabilities/
│   ├── notifications.ts
│   ├── speech-recognition.ts
│   ├── camera.ts
│   └── index.ts
```

Ou estrutura equivalente de acordo com a arquitetura existente.

Exemplo conceitual:

```ts
browserCapabilities.notifications;
browserCapabilities.speechRecognition;
browserCapabilities.camera;
```

A detecção deve considerar:

- existência da API;
- disponibilidade no ambiente atual;
- SSR;
- browser context;
- permissões;
- secure context (`HTTPS`);
- possíveis diferenças entre navegadores.

Nunca acessar APIs exclusivamente de browser durante Server-Side Rendering.

---

# 3. Notifications

## Objetivo

Adicionar suporte a notificações do navegador para situações úteis da aplicação, principalmente lembretes configurados pelo próprio usuário.

Exemplos:

- lembrete para registrar uma informação;
- lembrete de rotina;
- lembrete configurado pelo usuário;
- notificações relacionadas a ações previamente configuradas.

Não criar notificações invasivas ou excessivas.

---

## 3.1 NotificationService

Criar um serviço responsável por encapsular a Notifications API.

Responsabilidades:

- verificar suporte;
- verificar estado da permissão;
- solicitar permissão;
- enviar notificação;
- tratar erros;
- verificar secure context;
- fornecer fallback quando não houver suporte.

API conceitual:

```ts
interface NotificationService {
  isSupported(): boolean;
  getPermission(): NotificationPermission | "unsupported";
  requestPermission(): Promise<NotificationPermission>;
  notify(options: NotificationOptions): Promise<void>;
}
```

A implementação pode ser adaptada à arquitetura real da aplicação.

---

## 3.2 Permissões

Nunca solicitar permissão automaticamente ao carregar a aplicação.

O usuário deve iniciar explicitamente a ação.

Exemplo:

```text
Configurações
  ↓
Lembretes
  ↓
Ativar notificações
  ↓
Solicitar permissão
```

Explicar claramente ao usuário:

- por que a permissão está sendo solicitada;
- o que será notificado;
- que a permissão pode ser revogada pelo navegador.

---

## 3.3 Estados da permissão

Tratar explicitamente:

```text
unsupported
default
granted
denied
```

A UI deve apresentar estados diferentes para cada situação.

Exemplo:

```text
Notificações disponíveis
[Ativar notificações]
```

ou:

```text
Notificações bloqueadas

As notificações foram bloqueadas pelo navegador.
Verifique as permissões do site nas configurações do navegador.
```

---

## 3.4 Service Worker

Avaliar a integração das notificações com o Service Worker existente da PWA.

Não duplicar Service Workers.

Se já existir um Service Worker, utilizar a implementação existente.

Centralizar:

```text
NotificationService
        ↓
Service Worker
        ↓
Notification API
```

quando essa arquitetura for necessária.

Não implementar Background Sync ou Periodic Background Sync como requisito desta sprint.

---

## 3.5 Fallback

Caso notificações não estejam disponíveis:

- utilizar feedback visual dentro da aplicação;
- utilizar toast;
- manter os lembretes configurados;
- não quebrar nenhuma funcionalidade.

---

# 4. Speech Recognition

## Objetivo

Adicionar entrada de dados por voz como recurso opcional para reduzir a necessidade de digitação.

Possíveis aplicações:

- observações;
- anotações;
- contexto de uma medição;
- descrição de refeições;
- registros livres;
- notas da timeline.

Exemplo:

```text
Observação

[ 🎙 Falar ]

"Depois do almoço senti bastante cansaço"

[Salvar]
```

O reconhecimento de voz deve apenas transformar fala em texto.

Não interpretar automaticamente a fala como diagnóstico ou recomendação médica.

---

# 4.1 SpeechRecognitionService

Criar uma abstração para a API de reconhecimento de voz.

Exemplo conceitual:

```ts
interface SpeechRecognitionService {
  isSupported(): boolean;
  start(options?: SpeechRecognitionOptions): void;
  stop(): void;
  abort(): void;
}
```

A implementação deve encapsular diferenças entre implementações disponíveis nos navegadores.

Considerar:

```ts
SpeechRecognition;
webkitSpeechRecognition;
```

quando aplicável.

---

# 4.2 Estados do reconhecimento

Modelar explicitamente estados como:

```text
idle
starting
listening
processing
error
unsupported
```

A UI deve deixar claro quando o microfone está ativo.

Exemplo:

```text
🎙 Ouvindo...

Fale sua observação.

[Parar]
```

---

# 4.3 Permissão do microfone

Nunca iniciar captura sem ação explícita do usuário.

O usuário deve clicar/tocar para iniciar.

Tratar:

- permissão concedida;
- permissão negada;
- microfone indisponível;
- API não suportada;
- erro durante reconhecimento;
- usuário interrompendo o reconhecimento.

---

# 4.4 Privacidade

O usuário deve ser informado de forma clara sobre o funcionamento do reconhecimento de voz.

Não armazenar áudio.

O objetivo é armazenar somente o texto resultante quando o usuário confirmar o registro.

Não enviar áudio para backend próprio.

Não criar armazenamento permanente de gravações.

---

# 4.5 Fallback

Quando Speech Recognition não estiver disponível:

```text
[Digite sua observação...]
```

A aplicação deve continuar funcionando normalmente.

O botão de voz pode simplesmente não ser exibido ou apresentar indicação de indisponibilidade.

---

# 5. Camera API

## Objetivo

Adicionar suporte à câmera do dispositivo para capturar imagens ou utilizar recursos visuais que possam melhorar o registro de informações.

A câmera deve ser tratada como **progressive enhancement**.

---

# 5.1 CameraService

Criar uma abstração para acesso à câmera.

Exemplo conceitual:

```ts
interface CameraService {
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  start(): Promise<MediaStream>;
  stop(): void;
  capture(): Promise<Blob>;
}
```

Utilizar:

```ts
navigator.mediaDevices.getUserMedia();
```

quando disponível.

---

# 5.2 Componente CameraCapture

Criar um componente reutilizável responsável pela experiência da câmera.

Fluxo:

```text
Abrir câmera
     ↓
Solicitar permissão
     ↓
Exibir preview
     ↓
Usuário captura
     ↓
Preview da imagem
     ↓
Confirmar / Tirar novamente
```

Não salvar automaticamente uma imagem sem confirmação do usuário.

---

# 5.3 Privacidade da câmera

A câmera deve:

- iniciar somente após ação explícita;
- solicitar permissão do navegador;
- interromper o `MediaStream` quando não estiver sendo utilizado;
- desligar as tracks ao desmontar o componente;
- não manter câmera ativa em background;
- não enviar imagens automaticamente.

Garantir:

```ts
stream.getTracks().forEach((track) => track.stop());
```

quando a captura terminar.

---

# 5.4 Tratamento de permissões

Tratar:

```text
permission granted
permission denied
permission unavailable
camera unavailable
browser unsupported
```

Exibir mensagens compreensíveis ao usuário.

Não mostrar mensagens técnicas como:

```text
NotAllowedError
OverconstrainedError
```

diretamente na interface.

Criar mensagens amigáveis.

---

# 5.5 Mobile-first

A experiência da câmera deve ser prioritariamente pensada para dispositivos móveis.

Considerar:

- orientação portrait;
- viewport;
- tamanho do preview;
- controles acessíveis com o polegar;
- botões grandes;
- `playsInline`;
- evitar zoom ou overflow inesperado;
- safe areas;
- dark/light mode.

---

# 6. Possível evolução: Barcode Detection

Avaliar a arquitetura para permitir futuramente utilização de:

```text
Barcode Detection API
```

para leitura de códigos de barras.

Porém, **não tornar Barcode Detection requisito deste sprint**.

Caso implementado como experimento, deve utilizar progressive enhancement e fallback para entrada manual.

Arquitetar o `CameraService` de forma que uma futura feature de scanner possa reutilizar o acesso à câmera.

---

# 7. Componente de Progressive Enhancement

Criar uma estratégia consistente para apresentar recursos disponíveis.

Exemplo:

```text
Recursos do dispositivo

✓ Notificações
✓ Câmera
✕ Reconhecimento de voz
```

Isso não precisa necessariamente ser uma tela específica.

Pode existir apenas nas configurações ou ser utilizado internamente pelas features.

O importante é que as features consigam consultar capabilities sem duplicar lógica.

---

# 8. UX e acessibilidade

Todas as funcionalidades devem seguir WCAG e as regras existentes do projeto.

Garantir:

- navegação completa por teclado;
- foco visível;
- labels acessíveis;
- `aria-label` somente quando necessário;
- estados anunciados por leitores de tela;
- feedback de carregamento;
- feedback de erro;
- contraste adequado;
- tamanho adequado dos controles no mobile;
- não depender exclusivamente de cor;
- não depender exclusivamente de ícones;
- suporte a `prefers-reduced-motion`.

Para câmera e reconhecimento de voz, o estado atual deve ser perceptível visualmente e semanticamente.

Exemplo:

```text
Status: Ouvindo
```

em vez de depender apenas de um ícone de microfone animado.

---

# 9. Segurança

Considerar:

- HTTPS / secure context;
- permissões do navegador;
- princípio do menor privilégio;
- nenhuma captura automática;
- nenhum envio automático de dados;
- nenhum armazenamento de áudio;
- nenhum armazenamento de stream;
- encerramento correto de recursos;
- tratamento seguro de blobs/imagens;
- evitar exposição de dados sensíveis em logs.

Nunca registrar em:

```ts
console.log();
```

conteúdo potencialmente sensível capturado pela câmera ou reconhecimento de voz.

---

# 10. Offline

As funcionalidades devem respeitar a natureza local-first da aplicação.

O funcionamento offline deve ser preservado para tudo que não depender de APIs externas.

Exemplo:

```text
Offline
 ├── Registros locais       ✓
 ├── Dashboard              ✓
 ├── Importação/exportação  ✓
 ├── Câmera                 ✓*
 ├── Notificações           ✓*
 └── Speech Recognition     depende do navegador
```

Não criar dependência artificial de internet para recursos que o navegador consegue executar localmente.

---

# 11. Integração com Data Ownership

As Progressive Web APIs não devem quebrar os princípios definidos no Sprint 7.

Dados pertencem ao usuário.

Portanto:

- imagens capturadas devem ser tratadas como dados do usuário;
- textos gerados por voz devem ser tratados como dados do usuário;
- notificações não devem conter informações sensíveis desnecessárias;
- nenhum dado deve ser compartilhado automaticamente;
- qualquer compartilhamento deve exigir ação explícita.

Evitar notificações como:

```text
Sua glicemia está em 180 mg/dL
```

quando uma mensagem genérica for suficiente:

```text
Lembrete: há um registro pendente.
```

O conteúdo das notificações deve minimizar exposição de informações sensíveis na tela bloqueada.

---

# 12. Testes

Implementar testes unitários para:

### Capability Detection

- API disponível;
- API indisponível;
- ambiente SSR;
- browser sem suporte.

### Notifications

- permissão `default`;
- permissão `granted`;
- permissão `denied`;
- API indisponível;
- erro ao solicitar permissão;
- envio de notificação;
- fallback.

### Speech Recognition

- API disponível;
- API indisponível;
- inicialização;
- finalização;
- interrupção;
- erro;
- permissão negada;
- atualização do texto reconhecido.

### Camera

- API disponível;
- API indisponível;
- permissão concedida;
- permissão negada;
- captura;
- encerramento do stream;
- desmontagem do componente;
- tratamento de erro.

---

# 13. Testes de integração

Validar fluxos completos:

### Notificações

```text
Configurações
 → Ativar notificações
 → Permitir
 → Criar lembrete
 → Receber notificação
```

### Voz

```text
Observação
 → Pressionar microfone
 → Falar
 → Texto reconhecido
 → Confirmar
 → Salvar observação
```

### Câmera

```text
Feature
 → Abrir câmera
 → Permitir
 → Capturar
 → Visualizar
 → Confirmar
 → Salvar
```

---

# 14. Testes E2E

Criar cenários para:

- navegador com suporte;
- navegador sem suporte;
- permissão negada;
- fallback;
- mobile viewport;
- interrupção inesperada;
- reload durante utilização;
- navegação para outra página durante captura;
- fechamento do modal enquanto câmera está ativa.

Mocks devem ser utilizados para APIs do navegador quando o ambiente de testes não possuir implementação real.

---

# 15. Performance

As Progressive Web APIs não devem aumentar significativamente o bundle inicial.

Considerar:

- lazy loading;
- dynamic import;
- carregamento sob demanda;
- evitar inicialização das APIs antes da necessidade;
- não manter streams ativos;
- cleanup adequado;
- evitar listeners permanentes desnecessários.

Especialmente a câmera e reconhecimento de voz devem ser inicializados apenas quando utilizados.

---

# 16. Estrutura sugerida

Adaptar à arquitetura existente, mas considerar uma organização semelhante:

```text
src/
├── features/
│   ├── notifications/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── tests/
│   │
│   ├── voice-input/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── tests/
│   │
│   └── camera/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── tests/
│
├── lib/
│   └── browser/
│       ├── capabilities/
│       └── services/
│
└── ...
```

Não criar essa estrutura cegamente.

Antes da implementação, analisar a estrutura atual do projeto e seguir os padrões existentes.

---

# 17. Documentação

Documentar:

- APIs utilizadas;
- compatibilidade;
- permissões;
- limitações;
- fallback;
- decisões arquiteturais;
- comportamento offline;
- considerações de privacidade.

Adicionar documentação específica caso alguma API possua comportamento diferente entre navegadores.

---

# 18. Critérios de aceite

O Sprint 8 será considerado concluído quando:

- [ ] Notifications API estiver encapsulada em um serviço;
- [ ] permissões forem solicitadas somente mediante ação do usuário;
- [ ] notificações possuírem fallback;
- [ ] Speech Recognition estiver encapsulado em um serviço;
- [ ] entrada por voz puder preencher campos compatíveis;
- [ ] áudio não seja armazenado;
- [ ] câmera estiver encapsulada em um serviço;
- [ ] câmera puder capturar uma imagem;
- [ ] streams forem encerrados corretamente;
- [ ] permissões sejam tratadas corretamente;
- [ ] todas as APIs possuam capability detection;
- [ ] nenhuma API seja acessada diretamente pela UI;
- [ ] SSR não seja quebrado;
- [ ] funcionalidades continuem funcionando sem suporte às APIs;
- [ ] mobile seja tratado como prioridade;
- [ ] acessibilidade seja validada;
- [ ] testes unitários estejam implementados;
- [ ] testes de integração estejam implementados;
- [ ] testes E2E dos fluxos principais estejam implementados;
- [ ] não existam dados sensíveis em logs;
- [ ] não exista captura automática;
- [ ] não exista compartilhamento automático;
- [ ] bundle inicial não seja desnecessariamente aumentado;
- [ ] documentação seja atualizada.

---

# 19. Restrições importantes

Não:

- adicionar dependências externas sem necessidade;
- criar backend para funcionalidades que o navegador consegue executar localmente;
- tornar Notifications, Speech Recognition ou Camera obrigatórios;
- solicitar permissões no carregamento da aplicação;
- manter câmera ou microfone ativos sem necessidade;
- armazenar áudio;
- compartilhar dados automaticamente;
- expor dados sensíveis em notificações;
- acessar APIs do browser diretamente nos componentes;
- quebrar SSR;
- ignorar navegadores sem suporte;
- criar funcionalidades específicas de um navegador sem capability detection;
- comprometer o funcionamento offline.

Priorizar sempre:

```text
Privacidade
    ↓
Data Ownership
    ↓
Progressive Enhancement
    ↓
Acessibilidade
    ↓
Mobile-first
    ↓
Performance
    ↓
Compatibilidade
```

---

# Resultado esperado

Ao final do Sprint 8, a aplicação deverá utilizar recursos nativos do dispositivo para oferecer uma experiência mais rica, mantendo a filosofia:

> **"Use o poder do navegador quando ele estiver disponível, mas nunca dependa dele para que o produto funcione."**

O resultado deve ser uma aplicação capaz de aproveitar notificações, voz e câmera de maneira segura, acessível, privada, performática e integrada à arquitetura local-first existente.
