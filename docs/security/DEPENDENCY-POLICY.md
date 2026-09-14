# Política de Dependências

Regras para adição, atualização e remoção de dependências no projeto.

---

## 1. Princípios

- Dependências mínimas: adicionar somente quando o benefício justifica o risco.
- Runtime vs dev: identificar claramente qual camada a dependência afeta.
- Auditoria contínua: vulnerabilidades conhecidas são rejeitadas pelo CI.
- Documentação: decisões de versão significativas ficam registradas aqui ou em
  `SECURITY-AUDIT.md`.

---

## 2. Revisão de novas dependências

Antes de `bun add`, considerar:

1. **Necessidade real:** posso resolver com ≤ 10 linhas nativas?
2. **Tamanho:** o pacote puxa muitas sub-dependências? Qual o impacto no bundle?
3. **Manutenção:** última publicação há quanto tempo? Issues abertas relevantes?
4. **Segurança:** há CVEs conhecidas (checar `npm audit`, Snyk, GitHub Advisory)?
5. **Alternativas:** qual a alternativa mais leve e por que não usar?
6. **Licença:** compatível com o projeto (MIT/BSD/Apache-2)?

Documentar a decisão (justificativa, escolha de versão, trade-offs) no commit
message ou em `SECURITY-AUDIT.md`.

---

## 3. Atualização de dependências

### Atualizações de segurança (patch)

- Aplicar assim que possível.
- `bun update` respeitando `^`/`~` do `package.json`.
- Verificar changelog para breaking changes.

### Atualizações de funcionalidade (minor)

- Avaliar mensalmente, fora de sprints grandes.
- Preferir atualizações não-quebrantes.

### Atualizações maiores (major)

- Requerem revisão dedicada (sprint de manutenção).
- Rodar `bun run test`, `bun run lint`, `bun run build`, `bun run test:e2e`
  após a atualização.
- Verificar `CHANGELOG` e `UPGRADE GUIDE` (se disponível).

---

## 4. Auditoria automatizada

O CI executa `bun audit` (passo `Audit dependencies` em `ci.yml`). Qualquer
vulnerabilidade **critica** ou **alta** falha o build.

### Severidade e ação

| Severidade | Ação no CI | Ação manual |
| --- | --- | --- |
| Crítica | Bloqueio | Corrigir imediatamente |
| Alta | Bloqueio | Corrigir antes de merge |
| Moderada | Warning (não bloqueia) | Avaliar no sprint corrente |
| Baixa | Info | Backlog / ou documentar como risco aceito |

### Ignorar vulnerabilidade

Quando uma vulnerabilidade não se aplica (ex.: pacote de dev, sem vetor real de
exploração), registrar em `SECURITY-AUDIT.md`:

- ID da CVE/GHSA.
- Por que o vetor não se aplica.
- Data da revisão.
- Próxima data de reavaliação.

---

## 5. Dependências de runtime (DiaBem)

| Pacote | Função | Notas |
| --- | --- | --- |
| `next` | Framework React/SSG/PWA | Atualizado em Sprint 10 |
| `react` / `react-dom` | UI | v19 |
| `dexie` | Wrapper IndexedDB | v4, criptografia em campo |
| `zod` | Validação de esquema | Usado em formulários e import |
| `tailwind-merge` | Fusão de classes CSS | Utilitário leve, sem runtime |

Dependências de **dev**: `vitest`, `playwright`, `eslint`, `prettier`, `@types/*`.

---

## 6. Dependências não aceitas

- Pacotes com `eval`, `new Function`, ou que usem `dangerouslySetInnerHTML`
  implicitamente.
- Bibliotecas de monitoramento/tracking (Sentry, Analytics) — incompatíveis com
  privacy-by-design.
- SDKs de cloud/BaaS (Firebase, Supabase) — a aplicação é 100% local-first.