# Segurança

O DiaBem é um PWA **local-first** e **privacy-first** de gerenciamento de diabetes.
Todos os dados de saúde permanecem no dispositivo do usuário (IndexedDB) e são
criptografados em repouso. Não existe backend, servidor de autenticação ou
sincronização automática.

Este documento resume a postura de segurança do projeto. Os documentos
detalhados vivem em [`docs/security/`](docs/security/).

## Princípios

1. **Security by Design** — a segurança é parte da arquitetura, não um recurso.
2. **Privacy by Design** — os dados de saúde são tratados como confidenciais.
3. **Least Privilege** — mínimo de permissões (câmera, microfone) e de APIs
   acessíveis.
4. **Defense in Depth** — criptografia + CSP + validação + isolamento de usuário.
5. **Local-First** — nada é enviado ao servidor sem ação explícita do usuário.

## Postura rápida (TL;DR)

| Área | Status |
| --- | --- |
| Autenticação | Local (PBKDF2-SHA512 + AES-256-GCM). Chave em memória. |
| Dados em repouso | Criptografados no IndexedDB via `crypto-field`. |
| Rede | Nenhuma sincronização automática. Nenhuma chamada a API externa. |
| XSS | React (auto-escaping), CSP estrita, sem `dangerouslySetInnerHTML`. |
| CSV Injection | Prevenção no export e strip no import. |
| Import/Export | Validação por registro (JSON e CSV), envelope assinado. |
| Dependências | Auditadas no CI (`bun audit`). |
| Headers | CSP, HSTS (produção), COOP, CORP, Permissions-Policy. |

## Leitura recomendada

- [`docs/security/THREAT-MODEL.md`](docs/security/THREAT-MODEL.md) — modelo de ameaças
- [`docs/security/SECURITY-AUDIT.md`](docs/security/SECURITY-AUDIT.md) — auditoria (Sprint 10)
- [`docs/security/DEPENDENCY-POLICY.md`](docs/security/DEPENDENCY-POLICY.md) — política de dependências
- [`docs/security/DATA-SECURITY.md`](docs/security/DATA-SECURITY.md) — tratamento de dados
- [`docs/security/INCIDENT-RESPONSE.md`](docs/security/INCIDENT-RESPONSE.md) — resposta a incidentes
- [`docs/security/SECURITY-CHECKLIST.md`](docs/security/SECURITY-CHECKLIST.md) — checklist de desenvolvimento

## Como reportar vulnerabilidades

Para vulnerabilidades críticas, **não abra issue pública**. Use o reporte privado
do GitHub (Security → Report a vulnerability). Para problemas menores de higiene
de segurança, abra uma issue normal com o rótulo `security`.

Veja detalhes em [`docs/security/INCIDENT-RESPONSE.md`](docs/security/INCIDENT-RESPONSE.md).