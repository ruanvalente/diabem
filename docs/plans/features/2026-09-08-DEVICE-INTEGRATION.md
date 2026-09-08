## Sprint 9 — Device Integrations

### Objetivo

Permitir que a aplicação, quando houver suporte do navegador e do dispositivo, possa **importar dados diretamente de dispositivos compatíveis**, mantendo:

- local-first;
- privacy-first;
- Data Ownership;
- funcionamento sem dispositivos externos;
- progressive enhancement;
- arquitetura baseada em adapters;
- nenhuma dependência de fabricante específico no domínio.

A arquitetura ideal seria:

```text
                    ┌──────────────────────┐
                    │      UI / Feature    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Device Integration   │
                    │      Service         │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Device Adapter       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       Web Bluetooth      Web Serial       File Import
              │                │                │
       Bluetooth LE          USB/Serial      CSV/JSON
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Normalization Layer  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Domain / Repository  │
                    └──────────────────────┘
```

Isso é particularmente importante porque **Web Bluetooth e Web Serial possuem suporte limitado entre navegadores**. Portanto, eu não faria uma arquitetura onde o domínio sabe que existe Bluetooth, USB ou um fabricante específico.

---

# 1. Primeiro objetivo: Device Capability Detection

Antes de qualquer integração, criar uma camada capaz de responder:

```ts
deviceCapabilities.bluetooth;
deviceCapabilities.serial;
deviceCapabilities.camera;
deviceCapabilities.fileSystem;
```

E, futuramente:

```ts
deviceCapabilities.nfc;
```

A aplicação poderia então apresentar:

```text
Integração com dispositivos

✓ Importação de arquivos
✓ Câmera
✓ Bluetooth
⚠ USB/Serial não disponível neste navegador
```

Mas isso não deve ser apenas visual.

A própria arquitetura deve impedir que uma feature tente utilizar uma API inexistente.

---

# 2. Device Integration Service

Criaria uma abstração central:

```ts
interface DeviceIntegrationService {
  getAvailableDevices(): Promise<Device[]>;
  connect(deviceId: string): Promise<DeviceConnection>;
  disconnect(deviceId: string): Promise<void>;
  sync(deviceId: string): Promise<SyncResult>;
}
```

Mas **não colocaria Bluetooth/Serial diretamente nesse serviço**.

Utilizaria adapters.

Por exemplo:

```text
DeviceIntegrationService
        │
        ├── BluetoothAdapter
        ├── SerialAdapter
        ├── FileAdapter
        └── FutureAdapter
```

Isso permite adicionar novos dispositivos sem alterar as features existentes.

---

# 3. Device Adapter Pattern

Essa provavelmente seria a parte arquitetural mais importante da Sprint 9.

Criar uma interface comum:

```ts
interface DeviceAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  discover(): Promise<Device[]>;
  connect(device: Device): Promise<void>;
  disconnect(): Promise<void>;
  read(): Promise<RawDeviceData>;
  normalize(data: RawDeviceData): NormalizedData[];
}
```

Cada fabricante/protocolo poderia posteriormente ter seu próprio adapter.

Exemplo:

```text
devices/
├── core/
│   ├── device-adapter.ts
│   ├── device-manager.ts
│   └── device-types.ts
│
├── bluetooth/
│   └── bluetooth-adapter.ts
│
├── serial/
│   └── serial-adapter.ts
│
└── adapters/
    ├── generic-glucose/
    └── ...
```

O domínio nunca deveria saber:

```ts
if (device.manufacturer === "X")
```

Esse conhecimento deve ficar no adapter.

---

# 4. Web Bluetooth

Seria uma das principais APIs a serem avaliadas.

Possível utilização:

```text
Glicosímetro
     ↓ Bluetooth LE
Browser
     ↓
BluetoothAdapter
     ↓
Parser
     ↓
Normalized Glucose Record
     ↓
Repository
     ↓
IndexedDB
```

O fluxo seria:

```text
Conectar dispositivo
       ↓
Solicitar permissão
       ↓
Selecionar dispositivo
       ↓
Conectar
       ↓
Ler dados
       ↓
Interpretar protocolo
       ↓
Normalizar
       ↓
Preview
       ↓
Confirmar importação
       ↓
IndexedDB
```

### Importante

Não assumir que qualquer glicosímetro Bluetooth funcionará.

Existem diferenças de:

- fabricante;
- modelo;
- GATT services;
- characteristics;
- protocolos;
- formato dos dados;
- autenticação;
- compatibilidade do navegador.

Por isso, eu começaria com **um protocolo/device adapter bem definido**, e não tentaria suportar dezenas de dispositivos.

---

# 5. Web Serial

O segundo caminho seria:

```text
Dispositivo
    ↓
USB / Serial
    ↓
Web Serial
    ↓
SerialAdapter
    ↓
Parser
    ↓
NormalizedData
    ↓
IndexedDB
```

Isso pode ser útil para equipamentos que:

- possuem conexão USB;
- aparecem como porta serial;
- possuem protocolo serial documentado.

Novamente, o suporte deve ser opcional.

---

# 6. Protocolo de dados

Aqui existe uma decisão importante.

Não permitir que cada adapter salve diretamente no banco.

Criar uma representação intermediária:

```ts
interface DeviceMeasurement {
  type: "glucose" | "weight" | "bloodPressure" | "other";
  value: number;
  unit: string;
  measuredAt: string;
  source: {
    deviceId: string;
    manufacturer?: string;
    model?: string;
  };
}
```

Assim:

```text
Device
 ↓
Raw Data
 ↓
Parser
 ↓
DeviceMeasurement
 ↓
Domain Entity
 ↓
Repository
```

Isso deixa o sistema preparado para outros dispositivos no futuro.

---

# 7. Deduplicação

Essa parte deve reutilizar o trabalho da **Sprint 7 — Data Ownership**.

Imagine que o usuário sincronize o mesmo dispositivo duas vezes:

```text
Sync #1
10:00 → 120
10:30 → 130
11:00 → 125

Sync #2
10:00 → 120
10:30 → 130
11:00 → 125
```

A aplicação não pode criar seis registros.

Criar uma estratégia de deduplicação baseada em algo como:

```text
source
+
device identifier
+
measurement timestamp
+
measurement type
+
value
```

Idealmente utilizar um `sourceRecordId` quando o dispositivo fornecer um identificador confiável.

---

# 8. Preview antes da importação

Eu manteria exatamente o conceito utilizado no Sprint 7.

Nunca:

```text
Conectar
 ↓
Importar automaticamente
```

Preferir:

```text
Conectar
 ↓
Ler dispositivo
 ↓
Encontrar 143 registros
 ↓
Validar
 ↓
Mostrar preview
 ↓
"143 registros encontrados"
 ↓
Importar
```

Exemplo:

```text
Sincronização concluída

143 registros encontrados
137 novos
6 já existentes

[Ver registros]

[Importar 137 registros]
```

Isso mantém o usuário no controle dos próprios dados.

---

# 9. Data Ownership

Essa sprint deve ampliar o conceito de Data Ownership.

Todo registro importado deve saber sua origem.

Por exemplo:

```ts
source: {
  type: "device",
  adapter: "bluetooth",
  deviceId: "...",
  manufacturer: "...",
  model: "..."
}
```

Isso permitirá futuramente:

- filtrar dados por dispositivo;
- excluir dados importados de determinado dispositivo;
- auditar origem;
- refazer sincronização;
- detectar problemas;
- exportar informações de origem.

---

# 10. Device Registry

Criaria uma pequena tabela/coleção local:

```text
devices
```

Com informações como:

```ts
interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  transport: "bluetooth" | "serial";
  manufacturer?: string;
  model?: string;
  lastConnectedAt?: string;
  lastSyncAt?: string;
}
```

Mas **não armazenaria credenciais ou secrets do dispositivo de forma insegura**.

---

# 11. Tela de dispositivos

Criaria uma nova área:

```text
Configurações
└── Dispositivos
```

Exemplo:

```text
Dispositivos

┌─────────────────────────────┐
│ Glicosímetro                │
│ Bluetooth                   │
│                             │
│ Última sincronização        │
│ Hoje às 09:42               │
│                             │
│ [Sincronizar] [Configurar]  │
└─────────────────────────────┘

[+ Adicionar dispositivo]
```

Caso nenhum dispositivo seja suportado:

```text
Seu navegador não oferece suporte
a conexões com dispositivos.

Você ainda pode importar seus dados
por CSV ou JSON.

[Importar dados]
```

---

# 12. Sincronização manual inicialmente

Eu **não implementaria sincronização automática nesta sprint**.

Começaria com:

```text
[Sincronizar agora]
```

Isso reduz bastante a complexidade de:

- permissões;
- background execution;
- bateria;
- Service Worker;
- conexões Bluetooth;
- reconexão;
- sincronização duplicada.

Depois podemos criar uma Sprint 10 específica para **Smart Sync / Background Sync**, caso realmente faça sentido.

---

# 13. Histórico de sincronização

Seria interessante manter um pequeno histórico:

```text
Histórico

04/09/2026 09:42
Glicosímetro X
137 novos registros

03/09/2026 21:15
Glicosímetro X
42 novos registros

03/09/2026 08:30
Glicosímetro X
0 novos registros
```

Isso facilita muito a identificação de problemas.

---

# 14. Erros e recuperação

A integração precisa tratar:

```text
DeviceNotFound
PermissionDenied
ConnectionFailed
ConnectionLost
UnsupportedDevice
UnsupportedBrowser
InvalidData
MalformedPacket
SyncFailed
```

Mas esses erros devem ser convertidos em mensagens amigáveis.

Por exemplo:

> Não foi possível conectar ao dispositivo. Verifique se ele está ligado e próximo ao computador.

Em vez de:

> GATT Error 133.

---

# 15. Segurança e privacidade

Esse sprint precisa ser extremamente conservador.

Não:

- enviar dados para servidores;
- armazenar dados brutos desnecessariamente;
- armazenar áudio;
- armazenar credenciais em texto;
- conectar automaticamente sem ação do usuário;
- sincronizar sem consentimento;
- expor identificadores de dispositivos desnecessariamente.

O fluxo deve ser:

```text
Dispositivo
 ↓
Browser
 ↓
Parser local
 ↓
IndexedDB
```

Sempre que tecnicamente possível.

---

# 16. MCP / IA no futuro

Essa sprint também poderia preparar uma fronteira importante para a futura integração com IA/MCP.

**Não permitir que MCP converse diretamente com Bluetooth, Serial ou IndexedDB.**

Em vez disso:

```text
Device
 ↓
Device Adapter
 ↓
Domain Data
 ↓
Repository
 ↓
Scoped Data Service
 ↓
AI / MCP
```

No futuro poderiam existir ferramentas como:

```text
get_recent_glucose_records()
get_device_sync_history()
get_connected_devices()
get_measurements_from_device()
```

Com escopo e consentimento explícitos.

Isso mantém a IA desacoplada do hardware.

---

# 17. Testes

### Unitários

Testar:

- capability detection;
- adapter discovery;
- conexão;
- desconexão;
- parsing;
- normalização;
- deduplicação;
- validação;
- tratamento de erros.

### Integration

Testar:

```text
Device
 ↓
Adapter
 ↓
Parser
 ↓
Normalizer
 ↓
Repository
```

com dispositivos simulados.

### E2E

Simular:

```text
Adicionar dispositivo
 ↓
Conectar
 ↓
Sincronizar
 ↓
Preview
 ↓
Importar
 ↓
Dashboard atualizado
```

Também:

```text
Conexão perdida
 ↓
Mensagem amigável
 ↓
Tentar novamente
```

---

# 18. Escopo recomendado

Eu dividiria a Sprint 9 em **MVP + preparação futura**.

### Sprint 9 MVP

- [x] Device Capability Detection
- [x] Device Integration Service
- [x] Device Adapter Pattern
- [x] Device Registry
- [x] Web Bluetooth adapter
- [x] Web Serial adapter
- [x] Normalização de dados
- [x] Deduplicação
- [x] Preview de sincronização
- [x] Sincronização manual
- [x] Histórico de sincronização
- [x] Tratamento de erros
- [x] Testes
- [x] UI de dispositivos
- [x] Integração com Data Ownership
- [x] Documentação

### Fora do MVP

Eu deixaria para depois:

- [ ] sincronização automática;
- [ ] background sync;
- [ ] suporte a dezenas de fabricantes;
- [ ] integração com cloud;
- [ ] Apple Health/Google Health Connect;
- [ ] sincronização contínua;
- [ ] IA interpretando dados do dispositivo;
- [ ] MCP conectado diretamente aos dispositivos.

---

## E eu faria uma alteração importante no roadmap

Considerando os Sprints 7 e 8, vejo uma evolução muito boa:

```text
Sprint 7
Data Ownership
        ↓
Sprint 8
Progressive Web APIs
        ↓
Sprint 9
Device Integrations
        ↓
Sprint 10
Smart Sync & Automation
        ↓
Sprint 11
Local AI / Browser Intelligence
        ↓
Sprint 12
MCP / AI Integration
```
