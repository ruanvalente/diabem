# Auditoria de Segurança

Documento resultante da auditoria de segurança (Sprint 10) do DiaBem.

**Data:** 2026-09-14
**Escopo:** aplicação completa (código, configuração, dependências, build, CI, features).
**Baseline:** 484 testes passando, lint limpo, build ok.

---

## 1. Resumo executivo

A auditoria não encontrou vulnerabilidades **críticas** nem vetores de XSS. A
arquitetura local-first + criptografia em repouso + ausência de backend reduz a
superfície de ataque a nível do dispositivo. Foram encontrados pontos passíveis
de endurecimento (endurecimento "season"), todos corrigidos nesta sprint:

| Severidade | Qtde | Status |
| --- | --- | --- |
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 3 | Corrigido |
| Baixa / higiene | 6 | Corrigido |

---

## 2. Metodologia

1. Auditoria de dependências (`bun audit`, `npm outdated` proprietário).
2. Varredura de segredos (env, `NEXT_PUBLIC_*`, credenciais hardcoded).
3. Revisão manual da camada de criptografia e autenticação.
4. Revisão do import/export (injeção CSV, validação JSON, round-trip).
5. Revisão de APIs do navegador (câmera, microfone, notificações, SW).
6. Revisão de UI/XSS e de exclusão de dados.

---

## 3. Criptografia & Autenticação

### O que está forte

- Derivação de chave PBKDF2-SHA512, 100.000 iterações, 64 bytes, com salt
  aleatório por usuário. `lib/crypto/key-derivation.ts`.
- Criptografia AES-256-GCM com IV aleatório por registro. `lib/crypto/encryption.ts`.
- Chave de dados **apenas em memória** (nunca em `localStorage`/IndexedDB).
  `lib/db/session-key.ts`.
- Envelope de chaves com HKDF (wrapping). `lib/crypto/key-manager.ts`.
- Isolamento de usuário testado (testes de isolamento em `user-isolation.test.ts`).
- Política de senha forte (mín. 8 chars, maiúsculas, minúsculas, dígitos).
- Validação de entrada via Zod em todos os formulários.

### Correções aplicadas

| Achado | Risco | Correção |
| --- | --- | --- |
| Comparação de hash de senha com `===` (não constante em tempo) | Médio (timing side-channel teórico em dispositivo local) | Substituído por comparação constante em tempo (XOR acumulado) em `lib/crypto/key-derivation.ts`. |
| Sessões locais sem expiração | Baixo/higiene (sessão órfã) | `expiresAt = agora + 24h` em `session.repository.create()`. Expiração validada em `getCurrent()`. |

### Decisões documentadas

- **100k iterações PBKDF2:** equilíbrio entre tempo de login em dispositivo móvel
  e dificuldade de brute-force. Parâmetros configuráveis apenas por código (não
  por input do usuário).
- **Chave de dados só em memória:** troca entre persistência de sessão e
  segurança. Em reload, o usuário precisa reautenticar (comportamento intencional).
- **Sem HSM / WebAuthn neste sprint:** fora do escopo para PWA local-first;
  documentado como evolução futura.

---

## 4. Import/Export

### O que está forte

- Detecção de formato, validação de tamanho (10 MB) e de estrutura do envelope.
- Prevenção de CSV Injection no export (prefixa `'` antes de `=+-@`).
- Deduplicação no import.
- Envelope com `version` e `application`.

### Correções aplicadas

| Achado | Risco | Correção |
| --- | --- | --- |
| Bypass de CSV Injection via espaços iniciais (`  =SUM(...)`) e tabulação | Médio | Guard usa `trimStart().charAt(0)` + bloqueio de `\t`/`\r` em `csv-serializer.ts`. |
| Round-trip acumula apóstrofo no import (`'=SUM` → `'=SUM` re-importado) | Baixo/higiene | `unescapeCsvInjectionGuard()` remove o prefixo quando seguido por caractere de fórmula. |
| JSON import sem validação por registro (payloads maliciosos podiam chegar ao DB) | Médio | `record-validation.ts` (Zod) valida cada registro; registros inválidos são rejeitados com erro. |
| Campo `application` aceito como qualquer string | Baixo | Exigido `application === "DiaBem"`. |
| Campos de texto sem limite de tamanho no import | Baixo | Caps centralizados (`MAX_NOTE_LENGTH`, `MAX_DESCRIPTION_LENGTH`, `MAX_CONTENT_LENGTH`) aplicados em CSV e JSON. |

---

## 5. APIs do navegador

### Correções aplicadas

| Superfície | Achado | Ação |
| --- | --- | --- |
| Câmera | Elemento `<video>` temporário não era liberado após captura | `video.srcObject = null` + `video.remove()` em `finally`. `camera.service.ts`. |

### Revisado e considerado satisfatório

- **Câmera:** inicia somente após ação explícita do usuário; `stop()` interrompe
  tracks; stream nunca é enviado.
- **Microfone (speech recognition):** nenhum áudio é armazenado/enviado.
- **Notificações:** títulos genéricos, sem dados de saúde no corpo.
- **Service Worker:** apenas assets estáticos, caches versionados, sem fetch
  externo. `public/sw.js`.
- **localStorage:** apenas preferências simples (tema, lembretes genéricos). Dados
  de saúde nunca vão para `localStorage` (guardados via IndexedDB criptografado).
- **Geolocalização:** nunca solicitada/implementada. Bloqueada no Permissions-Policy.

---

## 6. UI / XSS

- Nenhum uso de `dangerouslySetInnerHTML`, `eval`, `new Function`,
  `document.cookie`, `.innerHTML`.
- Todo conteúdo do usuário é renderizado como texto React (auto-escaping).
- CSP estrita com `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`.
- Nenhum link `target="_blank"`.
- Sem API routes / Server Actions.

### Headers de segurança

Novos headers adicionados em `next.config.ts`:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Strict-Transport-Security` (produção): `max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy` ampliada: `battery`, `accelerometer`, `gyroscope`,
  `magnetometer`, `xr-spatial-tracking`, `serial`, `midi` bloqueadas.

### Decisões documentadas

- **Sem COEP (`require-corp`)**: quebraria carregamento de sub-recursos
  cross-origin e HMR em dev. Documentado como evolução futura.
- **`'unsafe-inline'` no CSP**: necessário para hidratação/streaming do Next.js.
  Documentado em `next.config.ts`. Não é vetor em si porque não há sinks de HTML.

---

## 7. Dependências

- `bun audit` aplicado; 3 vulnerabilidades corrigidas (`js-yaml`, `qs`), todas em
  tooling de dev/build, nenhuma em runtime.
- Atualizações aplicadas: `next@16.3.5`, `zod@4.6.5`, `dexie@4.4.6`, e demais
  dependências de runtime; ver `docs/security/DEPENDENCY-POLICY.md`.
- Adicionado passo `bun audit` ao CI (`ci.yml`).

---

## 8. Exclusão de dados

### Correções aplicadas

| Achado | Correção |
| --- | --- |
| `deleteUserHealthData` não removia sessões | Purga todas as sessões do usuário (logout implícito). |
| Lembretes em `localStorage` não eram apagados | `clearReminders()` chamado no fluxo de exclusão. |

Contas (usuário + verifiers) permanecem para permitir re-login, mas nenhum dado
de saúde, sessão, dispositivo, histórico de sync ou lembrete permanece órfão.

---

## 9. Não encontrado

- Nada de segredos em código (tokens, chaves, senhas).
- Nenhum `.env` no repositório; `.gitignore` cobre `.env*`.
- Nenhuma variável `NEXT_PUBLIC_*`.
- Nenhum armazenamento de dados de saúde fora de IndexedDB criptografado.
- Nenhuma sincronização em background ou compartilhamento automático.

---

## 10. Maturação futura (fora de escopo desta sprint)

- Nonce-based CSP (remover `'unsafe-inline'`).
- WebAuthn / passkeys para autenticação local.
- COEP `require-corp` habilitado.
- Assinatura digital de export/import (verificação de integridade fora do app).
- Integração com Gitleaks/TruffleHog no CI (hoje: secret scanning nativa do GitHub
  + revisão de PRs).

O checklist de sustentação da baseline está em
[`docs/security/SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md).