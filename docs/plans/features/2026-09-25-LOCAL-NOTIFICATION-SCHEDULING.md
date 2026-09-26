# Sprint 15 — Local Notification Scheduling

## 1. Objetivo

Implementar um sistema de **lembretes e notificações locais** no DiaBem, permitindo que o usuário configure horários específicos para receber lembretes relacionados ao acompanhamento de seus registros.

A funcionalidade deverá funcionar prioritariamente de forma **local**, sem Supabase, backend, API externa ou envio dos dados do usuário para terceiros.

O sistema deverá permitir configurações como:

```text
☀️ Manhã       08:00
🍽️ Meio-dia    12:00
🌆 Tarde       17:00
🌙 Noite       20:00
```

Os horários deverão ser totalmente configuráveis pelo usuário.

A implementação também deverá ser preparada para uma futura evolução para notificações inteligentes baseadas no `DataContext`, sem implementar inteligência ou IA nesta sprint.

---

# 2. Contexto arquitetural

O DiaBem possui como princípios:

- Local-first
- Privacy-first
- Offline-first
- Controle dos dados pelo usuário
- Progressive Enhancement
- Separação entre domínio, persistência e APIs do navegador

Portanto, esta sprint **não deverá introduzir Supabase, backend ou qualquer serviço externo**.

O fluxo esperado é:

```text
Notification Feature
        │
        ▼
Notification Settings
        │
        ▼
Notification Scheduler
        │
        ▼
Local Persistence
        │
        ▼
Browser / Service Worker
        │
        ▼
🔔 Notification
```

A implementação deverá respeitar a arquitetura existente do projeto e utilizar as abstrações já existentes sempre que possível.

Antes de implementar qualquer alteração:

1. Ler `AGENTS.md`.
2. Ler `docs/architecture/APPLICATION-ARCHITETURE.md`.
3. Ler `docs/architecture/COMPONENT-ARCHITECTURE.md`.
4. Analisar as features existentes.
5. Identificar como IndexedDB/Dexie, repositories, services, hooks e componentes estão estruturados.
6. Identificar o que já foi implementado na Sprint 08 relacionado a Notifications e Service Worker.
7. Identificar o `DataContext` criado na Sprint 13.
8. Reutilizar abstrações existentes em vez de criar duplicações.

---

# 3. Objetivo funcional

O usuário deverá conseguir:

- Ativar/desativar notificações.
- Configurar horários.
- Escolher períodos do dia.
- Definir os dias da semana.
- Definir quais tipos de registro deseja lembrar.
- Editar lembretes.
- Excluir lembretes.
- Ativar/desativar um lembrete individualmente.
- Configurar período de silêncio.
- Visualizar o status da permissão de notificações.
- Receber notificações quando a plataforma suportar o mecanismo necessário.

Exemplo:

```text
Configurações
└── Notificações

Notificações
────────────────────────────

[✓] Ativar lembretes

Períodos

☀️ Manhã
   08:00
   Medições + Alimentação
   [Ativo]

🍽️ Meio-dia
   12:00
   Alimentação
   [Ativo]

🌆 Tarde
   17:00
   Atividades
   [Ativo]

🌙 Noite
   20:00
   Medições + Alimentação + Observações
   [Ativo]

Período silencioso

22:00 → 07:00
```

---

# 4. Modelo de domínio

Criar ou adaptar o modelo de domínio para representar os lembretes.

Exemplo:

```ts
type ReminderPeriod = "morning" | "afternoon" | "evening" | "night";

type ReminderType = "glucose" | "meal" | "activity" | "medication" | "note";

interface NotificationSchedule {
  id: string;

  userId: string;

  period: ReminderPeriod;

  time: string;

  daysOfWeek: number[];

  reminderTypes: ReminderType[];

  enabled: boolean;

  createdAt: string;

  updatedAt: string;
}
```

O modelo deverá ser adaptado às convenções existentes no projeto.

Não duplicar tipos ou estruturas que já existam.

---

# 5. Períodos do dia

A aplicação deverá trabalhar com períodos sem obrigar o usuário a utilizar horários fixos.

Períodos sugeridos:

```text
morning
afternoon
evening
night
```

Os horários sugeridos inicialmente podem ser:

```text
morning   → 08:00
afternoon → 12:00
evening   → 17:00
night     → 20:00
```

Esses valores devem ser apenas **defaults de UX**.

O usuário deverá poder alterá-los.

Exemplo:

```text
Manhã
08:00 → 07:30

Tarde
17:00 → 18:30
```

---

# 6. Tipos de lembrete

Permitir associar um ou mais tipos de registro ao horário:

```text
☑ Medições
☑ Alimentação
☐ Atividades
☐ Medicamentos
☑ Observações
```

Os tipos devem corresponder aos domínios já existentes no projeto.

Não criar novos domínios apenas para suportar notificações.

---

# 7. Persistência local

Os agendamentos deverão ser persistidos localmente utilizando a infraestrutura existente de IndexedDB/Dexie.

Criar uma estrutura equivalente a:

```text
notification_schedules
```

ou seguir a convenção de naming já utilizada pelo projeto.

A persistência deverá respeitar:

- User ownership.
- Isolamento entre usuários.
- CRUD completo.
- Versionamento do schema quando necessário.
- Migração segura.
- Validação.
- Integridade dos registros.

Nenhum dado de notificação deverá exigir persistência remota.

---

# 8. Repository

Criar ou adaptar um repository específico:

```ts
NotificationScheduleRepository;
```

Responsabilidades:

```text
create
findById
findByUser
update
delete
deleteAll
```

Também deverá permitir consultas necessárias para o scheduler.

Exemplo:

```ts
getEnabledSchedules(userId);
```

Não permitir acesso direto ao IndexedDB pelos componentes.

Fluxo:

```text
UI
 ↓
Hook
 ↓
Service
 ↓
Repository
 ↓
IndexedDB
```

---

# 9. Notification Service

Criar uma abstração para as APIs de notificação.

Exemplo:

```ts
interface NotificationService {
  requestPermission(): Promise<NotificationPermission>;

  getPermission(): NotificationPermission;

  isSupported(): boolean;

  show(notification: NotificationPayload): Promise<void>;
}
```

O domínio da aplicação não deverá depender diretamente de:

```ts
window.Notification
navigator.serviceWorker
Notification API
```

Essas APIs deverão ficar isoladas em uma camada apropriada.

---

# 10. Notification Scheduler

Criar uma abstração específica para o agendamento:

```ts
interface NotificationScheduler {
  schedule(schedule: NotificationSchedule): Promise<void>;

  cancel(scheduleId: string): Promise<void>;

  cancelAll(): Promise<void>;

  getScheduled(): Promise<NotificationSchedule[]>;
}
```

A implementação deverá avaliar as capacidades reais do ambiente.

Não assumir que todo navegador oferece o mesmo nível de suporte.

---

# 11. Capability Detection

Implementar detecção progressiva de capacidades:

```text
Notification API
Service Worker
Push capability
Scheduling capability
Permission status
```

A aplicação deverá conseguir identificar cenários como:

```text
Notificações não suportadas
Notificações suportadas, mas sem permissão
Permissão concedida
Service Worker indisponível
Scheduling não disponível
```

A interface deverá apresentar mensagens claras para o usuário.

Exemplo:

> Seu navegador não oferece suporte a notificações neste ambiente.

ou:

> As notificações estão bloqueadas. Altere as permissões do navegador para ativá-las.

Não criar falsa indicação de que uma notificação foi agendada quando o ambiente não possui capacidade real para isso.

---

# 12. Service Worker

Avaliar o Service Worker já existente no projeto.

Não criar um segundo Service Worker.

Integrar o mecanismo de notificações ao Service Worker existente.

Responsabilidades:

- Receber eventos de notificação quando suportado.
- Exibir notificações.
- Processar clique na notificação.
- Abrir a rota apropriada do DiaBem.
- Respeitar o contexto da aplicação.

Exemplo:

```text
Notification
      ↓
Service Worker
      ↓
notificationclick
      ↓
/dashboard
```

---

# 13. Persistência do estado de permissão

O estado real de permissão deve ser obtido da API do navegador sempre que possível.

Não utilizar apenas:

```text
IndexedDB → permission = true
```

A permissão real pertence ao browser/OS.

O armazenamento local pode guardar apenas preferências da aplicação.

Separar:

```text
Browser Permission
        ≠
Application Preference
```

Exemplo:

```text
enabled = true
permission = denied
```

A interface deverá tratar corretamente esse estado.

---

# 14. Configuração dos dias da semana

O usuário deverá poder escolher os dias em que deseja receber determinado lembrete.

Exemplo:

```text
Repetir:

☑ Seg
☑ Ter
☑ Qua
☑ Qui
☑ Sex
☐ Sáb
☐ Dom
```

Também oferecer presets quando fizer sentido:

```text
Todos os dias
Dias úteis
Fim de semana
Personalizado
```

---

# 15. Período silencioso

Adicionar configuração:

```text
Período silencioso

[✓] Ativado

Início: 22:00
Fim:    07:00
```

O scheduler deverá considerar essa configuração.

Exemplo:

```text
Lembrete: 23:00
Silêncio: 22:00 → 07:00

Resultado:
não notificar
```

O período silencioso também deverá suportar corretamente a virada do dia.

---

# 16. Timezone

Os horários deverão ser tratados como horários locais do usuário.

O sistema deverá identificar o timezone do dispositivo quando necessário.

Não converter simplesmente:

```text
08:00
```

para UTC sem considerar o timezone local.

Caso o timezone seja persistido, utilizar uma representação adequada, por exemplo:

```text
America/Belem
```

A solução deve considerar mudanças de timezone sem corromper os horários configurados.

---

# 17. UX da configuração

Criar uma interface simples e acessível.

Exemplo:

```text
Notificações

Receba lembretes para manter seus registros atualizados.

[✓] Ativar lembretes

────────────────────────

☀️ Manhã
08:00
Medições
[Ativo]

────────────────────────

🍽️ Meio-dia
12:00
Alimentação
[Ativo]

────────────────────────

🌆 Tarde
17:00
Atividades
[Desativado]

────────────────────────

🌙 Noite
20:00
Medições · Alimentação
[Ativo]

[ + Adicionar lembrete ]
```

Priorizar:

- Mobile-first.
- Touch targets adequados.
- Feedback visual.
- Estados loading/error/empty.
- Navegação por teclado.
- Labels associados.
- Contraste.
- Screen readers.

---

# 18. Criar/editar lembrete

O formulário deverá permitir:

```text
Período
[Manhã ▼]

Horário
[08:00]

Repetição
[Todos os dias ▼]

Lembrar de
☑ Medições
☑ Alimentação
☐ Atividades
☐ Medicamentos
☐ Observações

[Cancelar] [Salvar]
```

Validar:

- Horário válido.
- Pelo menos um dia selecionado.
- Pelo menos um tipo de lembrete.
- Período válido.
- ID do usuário válido.
- Não permitir configurações inconsistentes.

---

# 19. Notificações

As mensagens devem ser neutras e não alarmistas.

Exemplos:

### Manhã

> Bom dia! Reserve um momento para registrar seus dados de hoje.

### Alimentação

> Lembre-se de registrar sua alimentação.

### Medição

> Lembre-se de registrar sua medição.

### Atividade

> Reserve um momento para registrar sua atividade.

### Noite

> Confira seus registros antes de encerrar o dia.

Evitar mensagens que façam diagnóstico, prescrição ou interpretação médica.

---

# 20. Integração futura com DataContext

Nesta sprint não implementar inteligência avançada.

Entretanto, preparar a arquitetura para:

```text
Notification Scheduler
        ↓
Notification Rules
        ↓
DataContext
```

Futuramente será possível verificar:

```text
08:00
↓
Usuário possui lembrete de glicemia
↓
Já existe registro correspondente?
├── SIM → não notificar
└── NÃO → notificar
```

Essa regra não deve ser implementada como requisito principal desta sprint.

O objetivo agora é garantir que a infraestrutura permita essa evolução.

---

# 21. Smart Reminder Foundation

Criar uma abstração simples para futuras regras:

```ts
interface NotificationRule {
  shouldNotify(context: NotificationContext): Promise<boolean>;
}
```

Nesta sprint, a primeira implementação pode ser:

```text
ScheduledNotificationRule
```

que simplesmente verifica se o horário configurado corresponde ao momento atual.

Não implementar:

- IA.
- LLM.
- MCP.
- Machine Learning.
- Diagnóstico.
- Regras médicas.

---

# 22. Evitar polling agressivo

Não implementar uma solução baseada em:

```ts
setInterval(() => {
  checkNotifications();
}, 1000);
```

ou polling contínuo.

O sistema deverá utilizar as APIs e mecanismos disponíveis no ambiente de forma eficiente.

Se determinada plataforma não oferecer agendamento local confiável, a aplicação deverá:

1. Detectar a limitação.
2. Informar o usuário.
3. Evitar afirmar que o lembrete foi garantidamente agendado.
4. Manter a configuração salva para uma futura estratégia compatível.

---

# 23. Offline-first

Os lembretes devem continuar disponíveis sem conexão.

```text
Internet
   │
   ├── disponível → funciona
   │
   └── indisponível → continua funcionando
```

Nenhuma operação de notificação deverá depender de:

- Supabase.
- API externa.
- Internet.
- Backend.

---

# 24. Privacy-first

Garantir que:

- Horários permanecem localmente.
- Preferências permanecem localmente.
- Tipos de lembrete permanecem localmente.
- Nenhum dado de saúde seja enviado.
- Nenhum analytics de notificações seja enviado.
- Nenhum identificador desnecessário seja transmitido.

Não adicionar SDK de terceiros.

---

# 25. Segurança

Revisar:

- Isolamento por usuário.
- Validação dos dados persistidos.
- Sanitização de mensagens quando necessário.
- Manipulação segura de `notificationclick`.
- URLs permitidas ao abrir a aplicação.
- Não permitir que conteúdo externo controle a notificação.
- Não expor dados desnecessários na payload.

Evitar colocar informações sensíveis diretamente no conteúdo da notificação.

Por exemplo, preferir:

```text
"Hora de registrar seus dados."
```

em vez de uma mensagem contendo informações detalhadas do usuário.

---

# 26. Testes unitários

Criar testes para:

### Domain

- Criação de schedule.
- Validação de horário.
- Validação de dias.
- Validação de tipos.
- Períodos.
- Período silencioso.
- Regras de repetição.

### Repository

- Create.
- Read.
- Update.
- Delete.
- User isolation.
- Enabled schedules.

### Notification Service

- Permission granted.
- Permission denied.
- Unsupported browser.
- Service Worker indisponível.

### Scheduler

- Schedule.
- Cancel.
- Cancel all.
- Horários válidos.
- Dias da semana.
- Quiet hours.
- Timezone.

---

# 27. Testes de integração

Validar:

```text
UI
 ↓
Hook
 ↓
Service
 ↓
Repository
 ↓
IndexedDB
```

E:

```text
Notification Settings
 ↓
Notification Service
 ↓
Scheduler
 ↓
Service Worker
```

Garantir que nenhuma camada ultrapasse sua responsabilidade.

---

# 28. Testes E2E

Criar cenários principais:

### Cenário 1

```text
Usuário acessa configurações
↓
Ativa notificações
↓
Concede permissão
↓
Cria lembrete às 08:00
↓
Salva
↓
Lembrete aparece na lista
```

### Cenário 2

```text
Usuário edita horário
↓
08:00 → 09:00
↓
Salva
↓
Novo horário persistido
```

### Cenário 3

```text
Usuário desativa lembrete
↓
Schedule.enabled = false
```

### Cenário 4

```text
Usuário exclui lembrete
↓
Registro removido
```

### Cenário 5

```text
Usuário fecha/reabre aplicação
↓
Configurações permanecem
```

---

# 29. Performance

Evitar:

- Polling agressivo.
- Re-renderizações desnecessárias.
- Leituras repetidas do IndexedDB.
- Instanciação repetida de serviços.
- Registro duplicado do Service Worker.
- Operações síncronas pesadas.

Preferir:

- Repository.
- Cache quando apropriado.
- Hooks especializados.
- Event-driven architecture quando disponível.
- Inicialização única dos serviços.

---

# 30. Estrutura sugerida

Adaptar à estrutura real do projeto após análise do `AGENTS.md`.

Uma possibilidade:

```text
components/features/notifications/
├── ui/
│   ├── notification-settings.tsx
│   ├── notification-schedule-list.tsx
│   ├── notification-schedule-form.tsx
│   ├── notification-period-selector.tsx
│   ├── notification-type-selector.tsx
│   └── quiet-hours-form.tsx
│
├── widget/
│   └── notification-settings.widget.tsx
│
├── hooks/
│   ├── use-notification-settings.ts
│   ├── use-notification-schedules.ts
│   └── use-notification-permission.ts
│
└── services/
    ├── notification.service.ts
    ├── notification-scheduler.service.ts
    └── notification-capability.service.ts
```

Domínio/persistência, caso o projeto utilize separação específica:

```text
domain/notifications/
├── notification-schedule.ts
├── notification-rule.ts
└── notification-types.ts

repositories/
└── notification-schedule.repository.ts
```

Service Worker:

```text
public/
└── sw.js
```

ou seguir a implementação já existente no projeto.

**Não duplicar o Service Worker.**

---

# 31. Critérios de aceite

A sprint será considerada concluída quando:

- [ ] Usuário consegue ativar/desativar notificações.
- [ ] Usuário consegue criar lembretes.
- [ ] Usuário consegue editar lembretes.
- [ ] Usuário consegue excluir lembretes.
- [ ] Usuário consegue ativar/desativar lembretes individualmente.
- [ ] Usuário consegue escolher horário.
- [ ] Usuário consegue escolher dias da semana.
- [ ] Usuário consegue escolher tipos de registro.
- [ ] Existem períodos manhã/tarde/noite disponíveis.
- [ ] Horários padrão são apenas sugestões e podem ser alterados.
- [ ] Período silencioso funciona corretamente.
- [ ] Configurações são persistidas no IndexedDB.
- [ ] Configurações respeitam o usuário atual.
- [ ] Não existe dependência de Supabase.
- [ ] Não existe dependência de backend.
- [ ] Não existe dependência de internet.
- [ ] Notification API é validada antes do uso.
- [ ] Service Worker existente é reutilizado.
- [ ] A aplicação identifica limitações da plataforma.
- [ ] A interface não afirma suporte quando ele não existe.
- [ ] Notificações não expõem informações sensíveis desnecessariamente.
- [ ] Testes unitários estão passando.
- [ ] Testes de integração estão passando.
- [ ] Testes E2E relevantes estão passando.
- [ ] Acessibilidade foi validada.
- [ ] Performance foi validada.
- [ ] Documentação foi atualizada.

---

# 32. Definition of Done

A Sprint 15 estará concluída quando:

1. A feature estiver integrada à arquitetura existente.
2. O `AGENTS.md` estiver sendo respeitado.
3. Os documentos de arquitetura estiverem atualizados quando necessário.
4. O código não possuir duplicação desnecessária.
5. Não houver acesso direto ao IndexedDB pelos componentes.
6. O Service Worker estiver integrado corretamente.
7. As capacidades do browser forem detectadas.
8. As limitações de plataforma estiverem documentadas.
9. O sistema funcionar sem internet.
10. Nenhum dado do usuário for enviado para serviços externos.
11. Os testes estiverem passando.
12. A aplicação continuar funcionando normalmente quando as notificações estiverem desabilitadas.
13. Não houver regressões nas features existentes.

---

# 33. Restrições

Não implementar nesta sprint:

- Supabase.
- Backend.
- Web Push remoto.
- Edge Functions.
- Cron remoto.
- MCP.
- LLM.
- IA generativa.
- Agentes.
- Machine Learning.
- Diagnóstico médico.
- Recomendações médicas.
- Analytics externo.
- Tracking de notificações.
- Dependências externas desnecessárias.

Não realizar refatorações fora do escopo da feature.

Não alterar funcionalidades existentes sem necessidade.

Não criar uma nova arquitetura paralela ao projeto.

---

# 34. Fases de implementação

## Fase 1 — Análise

- Ler `AGENTS.md`.
- Ler arquitetura.
- Avaliar implementação atual de PWA.
- Avaliar Service Worker.
- Avaliar Notification API existente.
- Avaliar IndexedDB/Dexie.
- Avaliar padrões das features existentes.

## Fase 2 — Domínio

- Criar `NotificationSchedule`.
- Criar tipos.
- Criar regras de validação.
- Criar períodos.
- Criar tipos de lembrete.
- Criar configuração de quiet hours.

## Fase 3 — Persistência

- Criar schema.
- Criar migration.
- Criar repository.
- Implementar CRUD.
- Garantir user ownership.

## Fase 4 — Notification Infrastructure

- Notification Service.
- Capability Detection.
- Permission handling.
- Scheduler.
- Service Worker integration.

## Fase 5 — UI

- Settings.
- Schedule list.
- Create/edit form.
- Period selector.
- Reminder type selector.
- Quiet hours.
- Empty/loading/error states.

## Fase 6 — Integração

Integrar:

```text
Settings
 ↓
Hooks
 ↓
Services
 ↓
Repository
 ↓
IndexedDB
```

e:

```text
Scheduler
 ↓
Service Worker
 ↓
Notification
```

## Fase 7 — Testes

- Unit.
- Integration.
- E2E.
- Accessibility.
- Browser capability scenarios.

## Fase 8 — Documentação

Documentar:

- Arquitetura.
- Limitações de PWA.
- Suporte por plataforma.
- Permission flow.
- Scheduler.
- Persistência.
- Service Worker.
- Futuro Smart Reminder.

---

# 35. Resultado arquitetural esperado

Ao final da sprint:

```text
                       DiaBem
                          │
                  Notification Feature
                          │
             ┌────────────┴────────────┐
             │                         │
       Notification               Schedule
       Settings                   Management
             │                         │
             └────────────┬────────────┘
                          │
                  Notification Service
                          │
                  Capability Detection
                          │
                  Notification Scheduler
                          │
             ┌────────────┴────────────┐
             │                         │
          IndexedDB              Service Worker
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                     🔔 Usuário
```

A evolução futura poderá ser:

```text
Notification Scheduler
        │
        ▼
Notification Rules
        │
        ▼
DataContext
        │
        ▼
Smart Reminders
```

sem alterar o núcleo da feature.

---

# 36. Princípio central da Sprint

A implementação deve seguir uma regra simples:

> **O DiaBem deve saber quando lembrar o usuário, mas não precisa saber nada além do necessário para realizar esse lembrete.**

Os horários, preferências e configurações permanecem locais.

Nenhum dado clínico precisa sair do dispositivo.

Nenhum backend é necessário.

Nenhum serviço externo é necessário.

O sistema deve ser **local-first, privacy-first, offline-first e progressive enhancement**, utilizando apenas as capacidades realmente disponíveis no ambiente do usuário.
