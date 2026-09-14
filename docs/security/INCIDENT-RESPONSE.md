# Resposta a Incidentes de Segurança

Procedimentos para identificar, conter e resolver vulnerabilidades ou violações
de segurança no DiaBem.

---

## 1. Classificação de incidentes

| Severidade | Exemplo | Tempo de resposta |
| --- | --- | --- |
| **Crítica** | Vazamento de dados de saúde em produção; acesso remoto não autorizado | Imediato (24h) |
| **Alta** | CVE em dependência runtime com vetor confirmado; bypass de criptografia | Antes de merge |
| **Moderada** | Headers ausentes; bypass teórico de timing; CSV injection parcial | Sprint corrente |
| **Baixa** | Higiene (docs, lint, warnings em audit) | Backlog |

---

## 2. Identificação

### Fontes de detecção

- `bun audit` no CI (vulnerabilidades em dependências).
- Issues de segurança reportadas no GitHub (Security Advisories ou issues públicas).
- Auditoria manual periódica (Sprint 10; repetir a cada 3–6 sprints).
- Revisão de PRs com foco em impacto de segurança (ex.: novos campos em export,
  uso de `dangerouslySetInnerHTML`, novas APIs do navegador).

### Sinais a observar

- Novo uso de `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `document.cookie`.
- Qualquer adição de `NEXT_PUBLIC_*` ou chamada `fetch` a domínio externo.
- Novas rotas de API/server action (server-side processing de dados de saúde).
- Modificações em `crypto/` sem testes de regressão.
- Atualização major de `next`, `dexie`, `zod`.

---

## 3. Contenção

| Tipo | Ação |
| --- | --- |
| Dependência comprometida | `bun audit fix`; verificar changelog; atualizar；re-testar；revisar se o fix é antes ou depois da exploração. |
| Regressão de validação | Revert do commit; re-testar; corrigir e reapresentar PR. |
| Configuração de headers | Adicionar o header faltante; verificar também em `netlify.toml` / CDN. |
| Dados de saúde expostos (se compartilhamento existisse) | N/A no estado atual (nenhum compartilhamento automático). |

---

## 4. Erro (post-mortem)

Após contenção, documentar em issue com rótulo `security`:

1. **Descrição:** o que aconteceu, quando, como foi detectado.
2. **Causa raiz:** por que a vulnerabilidade existia.
3. **Impacto:** que dados foram afetados (se aplicável).
4. **Ação corretiva:** o que foi feito para corrigir.
5. **Ação preventiva:** o que mudou para evitar recorrência.
6. **Timeline:** hora de detecção → hora de contenção → hora de correção.
7. **Responsável:** quem liderou a resposta.

---

## 5. Notificação ao usuário

O DiaBem é um aplicativo local-first. Na prática, um "incidente de dados" só
ocorre se um arquivo exportado for comprometido, ou se uma dependência vazar
dados do device local. Caso isso aconteça:

1. Criar **GitHub Security Advisory** (repositório público) com descrição clara.
2. Publicar nota no CHANGELOG/README.
3. Para dados em nuvem futuros: seguir LGPD/GDPR Art. 48.

---

## 6. Checklist pós-incidente

- [ ] Vulnerabilidade corrigida e commitado
- [ ] Testes de regressão adicionados
- [ ] `bun audit` passa limpo
- [ ] `bun run test` passa
- [ ] `bun run build` passa
- [ ] Documentação atualizada (este arquivo, SECURITY-AUDIT, ou AMEAÇAS)
- [ ] Issue de post-mortem criada (se severidade ≥ moderada)
- [ ] Dependências foram revisadas para o mesmo tipo de vulnerabilidade