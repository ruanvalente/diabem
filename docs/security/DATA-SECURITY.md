# Segurança de Dados

Como os dados de saúde são criptografados, validados, isolados e excluídos no
DiaBem.

---

## 1. Classificação dos dados

| Tipo | Sensibilidade | Armazenamento | Criptografia |
| --- | --- | --- | --- |
| Leituras de glicemia (valor, contexto, notas) | **Alta** | IndexedDB | AES-256-GCM nos campos sensíveis |
| Refeições (descrição, notas) | **Alta** | IndexedDB | AES-256-GCM nos campos sensíveis |
| Atividades (notas) | **Alta** | IndexedDB | AES-256-GCM nos campos sensíveis |
| Anotações (conteúdo) | **Alta** | IndexedDB | AES-256-GCM |
| Hash de senha + salt | **Alta** | IndexedDB | PBKDF2 (kdf) |
| Chave de dados (DEK) | **Alta** | **Apenas em memória** | Never persisted |
| Sessão local | **Média** | IndexedDB | Não criptografada (apenas userId + expiração) |
| Lembretes (título, hora) | **Baixa** | localStorage | Não criptografados (genéricos, sem dado de saúde) |
| Preferências (tema) | **Baixa** | localStorage | Não aplicável |

---

## 2. Camada de criptografia (at-rest)

Arquivo: `lib/db/crypto-field.ts`

### Como funciona

1. O schema Zod identifica campos com `encryption: { enabled: true, sensitive: true }`.
2. `encryptSensitiveFields()` grava esses campos como `EncryptedPayload`:
   `{ version, algorithm: "AES-GCM", iv, data }`.
3. `decryptSensitiveFields()` reconstrói o plaintext quando a chave de sessão
   está em memória.
4. IV é aleatório por gravação (único por registro × campo).

### O que NÃO é criptografado

- `userId` (usado para isolamento, indexação e 查询).
- `id` (UUIDs são opacos, sem dado sensível).
- `createdAt` / `updatedAt` (timestamps não contêm dado de saúde).
- `value` / `unit` / `context` / `type` / `durationMinutes` (números/códigos
  fixos, considerados metadados estruturais — se desejar criptografar, basta
  adicionar `sensitive: true` ao schema).

---

## 3. Gerenciamento de chaves

### Derivação (PBKDF2)

Arquivo: `lib/crypto/key-derivation.ts`

```
password + salt → PBKDF2-SHA512 (100k iterações) → chave de bytes
chave de bytes → divida em:
  - dataEncryptionKey (32 bytes) — criptografia dos dados
  - keyEncryptionKey   (32 bytes) — wrap da chave via HKDF
```

### Ciclo de vida da chave

| Ação | Comportamento |
| --- | --- |
| `register()` | Deriva DEK, criptografa DEK com KEK, salva wrap em `users.keyData`. |
| `login()` | Deriva DEK, des-wrap, armazena em `session-key.ts` (variável de módulo). |
| `restoreSession()` | Após reload: DEK não existe; `getCurrent()` retorna `userId`, mas `restoreSession()` retorna `null` → usuário vê tela de login. |
| `logout()` | Limpa `clearSessionDataKey()`; DEK desaparece da memória. |
| Aba fechada | O mesmo: DEK em memória se perde. |

### O que acontece se a senha vazar?

O atacante que tiver o `db.sqlite` (ou equivalentes do IndexedDB) e a senha
pode derivar a DEK e ler os dados. **Essa é a barreira de segurança aceita:**
a senha é o segredo de longo prazo. Não existe mecanismo de recuperação de
senha; esqueceu = perdeu os dados (para sempre, por segurança).

---

## 4. Isolamento de usuário

### Regra

Todo acesso a dados passa por `WHERE userId = :currentUserId`. Nenhuma query
retorna dados de outro usuário.

### Implementação

- Repositórios: `findByUser(userId)`, `create({ userId: ... })`.
- Chamadas em UI: sempre passam o `userId` do contexto `AuthContext`.
- Testes explícitos em `user-isolation.test.ts` (User A ≠ User B).

---

## 5. Validação de entrada

### Formulários (camada de interface)

- Todos os schemas de formulário usam **Zod com validações extras**:
  - `zod.string().min(2).max(500)` para notas/descrição.
  - `z.number().min(0).max(1000)` para glicemia.
  - Enums restritivos para contexto/tipo.
  - `match(/regex/)` para validação de senha (forte).

### Importação (camada de dados)

- **CSV:** validação por tipo de registro; ranges e enums aceitos; limites de
  tamanho nos campos de texto; strip do prefixo de injeção CSV.
- **JSON:** envelope validado (version, application, exportedAt); cada registro
  validado com Zod (schemas em `lib/data-ownership/import/record-validation.ts`).
  Registros inválidos são rejeitados com erro claro.

---

## 6. Exclusão de dados

### `deleteUserHealthData(userId)`

1. `db.sessions.where("userId").equals(userId).delete()` — sessões limpas.
2. Transação: remove `glucoseReadings`, `meals`, `activities`, `notes`,
   `devices`, `syncHistory` para o userId.
3. `clearReminders()` — limpa lembretes em `localStorage`.

A **conta do usuário** (`db.users`) permanece para permitir re-login futuro.

### O que acontece depois

- Qualquer aba aberta perderá a sessão (chave de dados limpa em memória).
- Na próxima visita, o usuário vê a tela de login.
- Todos os dados de saúde foram irrecuperavelmente apagados do IndexedDB.

---

## 7. Exportação e compartilhamento

### Formatos suportados

- **JSON:** envelope DiaBem (`version`, `application`, `exportedAt`, `data`).
  Contém arrays completos dos registros (sem `userId`).
- **CSV:** um arquivo por tipo de entidade (glucose.csv, meals.csv, etc.).

### Nenhum dado é compartilhado automaticamente

O export é sempre iniciado por ação explícita do usuário (botão "Exportar").

---

## 8. Controle de acesso no dispositivo

| Medida | Descrição |
| --- | --- |
| Senha de login | Bloqueia acesso à interface; valida contra hash salvo. |
| Chave em memória | Desaparece ao fechar a aba / fazer logout. |
| Sem biometria local | PWA sem WebAuthn neste sprint. |
| Sem dados no cloud | Nada é enviado automaticamente. |