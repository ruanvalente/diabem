# Modelo de Ameaças

Ameaças identificadas para o DiaBem, priorizadas por probabilidade x impacto,
e as mitigações atuais.

---

## 1. Premissas do contexto

- Aplicação 100% local (PWA instalável), sem backend.
- Atacante com acesso local ao dispositivo OU arquivos exportados.
- Dados: registros de glicemia, refeições, atividades e anotações (dados sensíveis
  de saúde).
- Guarding: `IndexedDB` + `localStorage` + criptografia WebCrypto PWA no mesmo
  dispositivo.

---

## 2. Inventário de ativos

| Ativo | Onde vive | Sensibilidade |
| --- | --- | --- |
| Chave de dados (DataEncryptionKey) | Memória (apenas) | Alta |
| Chave de usuário (wrap) | IndexedDB (`users.passwordSalt`, `users.keyData`) | Alta |
| Hash de senha | IndexedDB | Alta |
| Registros de saúde | IndexedDB (campos sensíveis criptografados) | Alta |
| Sessão local | IndexedDB (`sessions`, expira em 24h) | Média |
| Lembretes | `localStorage` | Baixa |

---

## 3. Matriz de ameaças

### T1 — Roubo de dados em repouso (dispositivo/profil) — **Alta**

**Cenário:** atacante com acesso à pasta do perfil do navegador (`LevelDB`,
`db.sqlite`) exfiltra o IndexedDB.

**Mitigações:**

- Campos sensíveis criptografados com AES-256-GCM (chave única por campo com IV
  aleatório). `lib/db/crypto-field.ts`.
- Chave de dados **nunca** gravada em disco; derivada de senha via PBKDF2 e
  mantida apenas em memória. `lib/db/session-key.ts`.
- Envelope de chave protegido por HKDF + salt do usuário.

**Residual:** se o atacante obtiver a senha, os dados são legíveis. É a barreira
clássica de "at-rest" — aceito e documentado.

### T2 — Acesso não autorizado pela UI (outro usuário do mesmo dispositivo) — **Média**

**Cenário:** dois usuários criam contas no mesmo navegador e um tenta ler os
dados do outro.

**Mitigações:**

- Todos os repositórios filtram por `userId` (consulta `where("userId").equals(...)`).
- Testes de isolamento explícitos (`user-isolation.test.ts`).
- Sessão é por usuário; `restoreSession` só restaura para o usuário dono da conta.

### T3 — Força bruta de senha — **Média**

**Cenário:** atacante tenta vários valores de senha contra `passwordHash`.

**Mitigações:**

- PBKDF2-SHA512, 100k iterações, salt único.
- Comparação em tempo constante (XOR) para evitar timing side-channel.
- Fallback "Senha incorreta" genérico (não revela se o e-mail existe).

### T4 — Injeção de CSV (export) — **Média**

**Cenário:** valor de nota inicia com `=`, `+`, `-`, `@`, inclusive com espaços ou
tabulação inicial; ao abrir o CSV exportado no Excel/LibreOffice/Sheets, o valor
é interpretado como fórmula.

**Mitigações (corrigido na auditoria):**

- Prefixo `'` quando o primeiro char **não-espaço** é `=`, `+`, `-`, `@`, `\t` ou `\r`.
- Preservação na re-importação (`unescapeCsvInjectionGuard`).

### T5 — CSV import de terceiros — **Média**

**Cenário:** importação de arquivo que contenha valores acima dos limites de
forma/campo ou enums malformados.

**Mitigações:**

- Validação por registro (CSV e JSON) com ranges e enums; limites de tamanho.
- Deduplicação e normalização antes da gravação.

### T6 — XSS (injeção de script) — **Média (probabilidade baixa)**

**Cenário:** conteúdo malicioso inserido em nota é renderizado como HTML.

**Mitigações:**

- React auto-escaping (text nodes).
- Zero `dangerouslySetInnerHTML` / `innerHTML` / `eval`.
- CSP com `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Sanitização de URLs (schemes seguros) em `lib/security/sanitization/url.ts`.

### T7 — Vulnerabilidade em dependência — **Média**

**Cenário:** pacote npm/bun com CVE explorada.

**Mitigações:**

- `bun audit` no CI (bloqueia PR com vulnerabilidade conhecida).
- Política de atualização de dependências (`DEPENDENCY-POLICY.md`).
- Dependências de runtime mínimas e auditadas.

### T8 — Vazamento acidental via notificações/console — **Baixa**

**Cenário:** título/body de notificação ou `console.log` com dado de saúde.

**Mitigações:**

- Notificações usam títulos genéricos, sem dados de saúde.
- Nenhum `console.log` de dados sensíveis (auditado).

### T9 — Remoção de dados incompleta (RGPD/privacidade) — **Baixa**

**Cenário:** delete de "todos os dados" deixa órfãos (sessão, lembretes).

**Mitigações (corrigido):**

- `deleteUserHealthData` remove também `sessions` e `clearReminders()`.

### T10 — Estego de sessão após exclusão — **Baixa**

**Cenário:** sessão local sobrevive a logout/delete e permite reutilização.

**Mitigações:**

- Sessões têm `expiresAt` (24h) e são inspecionadas em `getCurrent()`.
- `deleteUserHealthData` purga as sessões do usuário.
- Chave de dados é em memória (perde-se ao fechar a aba).

### T11 — Roubo de arquivo exportado — **Média**

**Cenário:** backup `.json`/`.csv` em mãos erradas.

**Mitigações:**

- Export JSON contém apenas dados do usuário dono (sem `userId` dos outros).
- Sem credenciais, tokens ou chaves no export.
- **Futuro (fora de escopo):** assinatura/criptografia do arquivo exportado.

### T12 — Upload/Download de URL maliciosa (futuro) — **Baixa**

**Cenário:** futuras features (urls externas, share) usem `javascript:`/`data:`.

**Mitigação:** `lib/security/sanitization/url.ts` já bloqueia schemes perigosos
antes de virar `href`.

---

## 4. Mitigações por camada (defesa em profundidade)

| Camada | Controle |
| --- | --- |
| Rede | Nenhuma chamada externa; CSP `connect-src 'self'`. |
| Camada HTTP | Headers de segurança (CSP, HSTS, COOP, CORP, Permissions-Policy). |
| Entrada | Zod em formulários; validação por registro em import; limites de texto. |
| Armazenamento | IndexedDB criptografado; `localStorage` só para preferências. |
| Chave | Derivada por senha (PBKDF2), mantida em memória, nunca no disco. |
| Saída | React auto-escaping; CSV injection guard; URL sanitizer. |
| Build/CI | `bun audit`, lint, testes, e2e. |

---

## 5. Priorização futura

1. CSV/JSON criptografado ou assinado no export.
2. WebAuthn (passkeys) para reautenticação local.
3. Nonce-based CSP.
4. COEP `require-corp`.