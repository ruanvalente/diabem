# Checklist de Segurança para Desenvolvimento

Checklist obrigatório antes de qualquer PR que toque código, configuração ou
dependências no DiaBem.

---

## 1. Regras de ouro

- [ ] Sem `dangerouslySetInnerHTML` sem justificativa documentada.
- [ ] Sem `eval`, `new Function`, `document.cookie`, `innerHTML`.
- [ ] Sem `NEXT_PUBLIC_*` de segredos (chaves de API podem ser públicas; segredos
      servidor-side nunca expostos).
- [ ] Sem chamadas `fetch` a domínios externos sem aprovação de arquitetura.
- [ ] Sem API routes / server actions que processem dados de saúde (a aplicação
      é 100% local-first).

---

## 2. Código novo

### Autenticação & criptografia

- [ ] Campos sensíveis marcados como `sensitive: true` no schema Zod.
- [ ] Nenhum dado de saúde gravado em `localStorage` (usar IndexedDB criptografado).
- [ ] Chave de dados nunca persistida em disco.
- [ ] Comparação de senha sempre em tempo constante (nunca `===`).

### Validação de entrada

- [ ] Novos campos de formulário validados com Zod (min/max/enum/regex).
- [ ] Limites de texto centralizados em `lib/security/sanitization/text.ts`.
- [ ] Novos caminhos de import (CSV/JSON) usam os validadores por registro.
- [ ] Novos campos no export mantêm o guard de CSV injection (prefixo `'`).

### Isolamento

- [ ] Toda consulta passa por `userId` do contexto (nenhuma query global).
- [ ] Novo repositório respeita o padrão `findByUser`/`create({ userId })`.

---

## 3. Navegador (browser APIs)

- [ ] APIs sensíveis iniciam apenas por ação explícita do usuário.
- [ ] Permissões solicitadas com escopo mínimo (ex.: `audio: false` na câmera).
- [ ] `track.stop()` + liberação de recursos em `finally` (câmera/mic/vídeo).
- [ ] Notificações com títulos genéricos (sem dados de saúde).
- [ ] Nenhum `console.log` com dados de saúde.

---

## 4. Configuração & headers

- [ ] `next.config.ts` mantém CSP, X-Frame-Options, COOP, CORP, HSTS (produção),
      Permissions-Policy.
- [ ] Nenhuma mudança que enfraqueça CSP sem justificativa documentada.
- [ ] CORS para API routes (se um dia existirem) nunca `*`; nunca refletir Origin.

---

## 5. Dependências

- [ ] `bun audit` no CI continua bloqueando vulnerabilidades **alta/crítica**.
- [ ] Nova dependência avaliada conforme `DEPENDENCY-POLICY.md`.
- [ ] Atualização major testada (test, lint, build, e2e) antes do merge.

---

## 6. Import/Export

- [ ] Export nunca inclui `userId` de outro usuário.
- [ ] Export preserva `application` e `version` corretos.
- [ ] Import JSON valida cada registro (Zod) — não apenas o envelope.
- [ ] Import CSV stripa prefixo de injeção (`unescapeCsvInjectionGuard`).
- [ ] Deduplicação aplicada no import.

---

## 7. Exclusão

- [ ] Novo tipo de dado (tabela/localStorage) precisa ser adicionado à
      `deleteUserHealthData` + testes.
- [ ] Exclusão é transacional (sem deletação parcial).

---

## 8. Testes obrigatórios (quando aplicável ao change)

- [ ] Unit: lógica pura (sanitização, validação, criptografia).
- [ ] Integration: fluxo de import/export, isolamento, sessão.
- [ ] E2E: jornadas críticas (registro/login/export) via Playwright.
- [ ] A11y: foco, contraste, navegação por teclado.

---

## 9. Antes do merge (executar)

```bash
bun audit          # dependências sem vulnerabilidades
bun run lint        # ESLint limpo
bun run test        # todos os testes verdes
bun run build       # build de produção ok
bun run test:e2e    # jornadas críticas ok (quando aplicável)
```

---

## 10. Tratamento de exceção

Qualquer item deste checklist **não** atendido exige:

1. Justificativa escrita no PR (seção de descrição).
2. Registro em `docs/security/SECURITY-AUDIT.md` (risco aceito) ou issue.
3. Revisão por outro mantenedor antes do merge.