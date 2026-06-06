# Nexus Academic — Plataforma de Gestão de PD&I

> Plataforma integrada para gestão e visibilidade de projetos de Pesquisa, Desenvolvimento e Inovação da FATEC Pompéia.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Objetivo do Projeto](#objetivo-do-projeto)
3. [Como o Projeto Foi Desenvolvido](#como-o-projeto-foi-desenvolvido)
4. [Tecnologias](#tecnologias)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Pasta a Pasta](#pasta-a-pasta)
7. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
8. [Instalação e Execução](#instalação-e-execução)
9. [Comandos Disponíveis](#comandos-disponíveis)
10. [Considerações Finais](#considerações-finais)

---

## Visão Geral

O **Nexus Academic** é uma aplicação full stack que permite o gerenciamento de projetos de pesquisa e desenvolvimento dentro de uma instituição acadêmica.

Ela integra:
- cadastro e autenticação de usuários;
- gestão de projetos de professores;
- submissão e revisão de propostas de alunos;
- controle de competências e membros de projeto;
- dashboards com indicadores e notificações.

---

## Objetivo do Projeto

Este projeto foi desenvolvido para:
- demonstrar uma solução full stack moderna;
- conectar frontend React com backend Node.js/Express e tRPC;
- aplicar um modelo de dados relacional com Drizzle ORM;
- suportar papéis distintos: aluno, professor e admin;
- simular um fluxo completo de PD&I em ambiente acadêmico.

---

## Como o Projeto Foi Desenvolvido

O desenvolvimento seguiu estas etapas principais:
1. montar a estrutura de projeto com `pnpm`, `vite`, `React` e `TypeScript`;
2. projetar o esquema de dados em `drizzle/schema.ts` para refletir usuários, projetos, demandas e aprovações;
3. criar o backend em `server/_core/index.ts` e `server/routers.ts` usando Express e tRPC;
4. implementar autenticação local com cookie de sessão segura em `auth-local.ts`;
5. construir o frontend em `client/src`, com rotas públicas e protegidas e componentes reutilizáveis;
6. compartilhar configurações críticas em `shared/const.ts` para garantir consistência;
7. validar o código com testes `vitest` e checagens TypeScript.

---

## Tecnologias

### Frontend
- React 19
- TypeScript 5.9
- Vite
- Wouter
- Tailwind CSS
- shadcn/ui
- Recharts
- @tanstack/react-query
- tRPC Client

### Backend
- Node.js 22
- Express
- tRPC Server
- Drizzle ORM
- Zod
- bcrypt
- jose
- dotenv

---

## Estrutura de Pastas

```
nexus_academic/
├── client/                     # Frontend React com Vite
├── drizzle/                    # Schema de banco de dados Drizzle
├── server/                     # Backend Express e tRPC
├── shared/                     # Constantes e tipos compartilhados
├── check-db.js                 # Utilitário de verificação de banco de dados
├── migrate.js                  # Script de migração customizado
├── migrate-tasks.ts            # Tarefas de migração
├── package.json                # Scripts e dependências
├── tsconfig.json               # Configuração TypeScript
├── vite.config.ts              # Configuração Vite
└── README.md                   # Documentação do projeto
```

---

## Pasta a Pasta

### `client/`

Esta pasta contém o frontend em React.

- `client/public/`
  - arquivos estáticos expostos diretamente pelo servidor.

- `client/src/main.tsx`
  - ponto de entrada do React.
  - inicializa o app e monta no DOM.

- `client/src/App.tsx`
  - define o roteamento da aplicação com `wouter`.
  - envolve a UI em providers globais como `ThemeProvider`, `TooltipProvider` e `Toaster`.
  - separa rotas públicas de rotas protegidas por autenticação.

- `client/src/index.css`
  - estilos globais e reset CSS.
  - define o design system básico do aplicativo.

- `client/src/components/`
  - componentes reutilizáveis.
  - `layout/`: componentes de layout como `Navbar`, `Footer` e `AppLayout`.
  - `projects/`: componentes relacionados a projetos e aprovação.
  - `auth/ProtectedRoute.tsx`: bloqueia rotas para usuários não autenticados.
  - `ui/`: componentes compartilhados de interface.

- `client/src/contexts/ThemeContext.tsx`
  - gerencia tema claro/escuro da interface.

- `client/src/hooks/`
  - hooks customizados para lógica reutilizável.
  - `useComposition.ts`: composição de funções.
  - `useMobile.tsx`: detecção de dispositivo móvel.
  - `usePersistFn.ts`: mantém funções estáveis entre renderizações.

- `client/src/lib/trpc.ts`
  - configura o cliente tRPC para chamadas tipadas ao backend.

- `client/src/pages/`
  - páginas principais da interface.
  - cada arquivo representa uma rota distinta da aplicação.

### `drizzle/`

Define o modelo de dados do banco.

- `drizzle/schema.ts`
  - declara todas as tabelas e seus relacionamentos usando Drizzle ORM.
  - modela entidades como usuários, projetos, competências e solicitações.

O esquema inclui tabelas para:
- usuários (`users`);
- competências (`skills`);
- competências de usuário (`user_skills`);
- projetos de professores (`projects`);
- propostas de alunos (`student_projects`);
- demandas de projeto (`project_skills`);
- membros de projeto (`project_members`);
- solicitações de participação (`participation_requests`);
- eventos de cronograma (`project_timeline`);
- notificações (`notifications`);
- tarefas de projeto (`project_tasks`).

### `server/`

Contém o backend e a API.

- `server/_core/index.ts`
  - inicializa o servidor Express.
  - configura parsers para JSON e URL-encoded.
  - registra rotas de OAuth e proxy de armazenamento.
  - monta o middleware tRPC em `/api/trpc`.
  - em modo dev, integra Vite; em produção, serve arquivos estáticos.

- `server/_core/trpc.ts`
  - configura o tRPC com `superjson`.
  - exporta `router`, `publicProcedure`, `protectedProcedure` e `adminProcedure`.
  - `protectedProcedure` exige que o usuário esteja autenticado.
  - `adminProcedure` exige que o usuário tenha papel `admin`.

- `server/_core/context.ts`
  - constrói o contexto para cada requisição tRPC.
  - faz leitura do cookie de sessão e busca dados do usuário.

- `server/_core/cookies.ts`
  - define as opções do cookie de sessão na aplicação.

- `server/_core/oauth.ts`
  - implementa rotas de OAuth para autenticação externa.

- `server/_core/storageProxy.ts`
  - gerencia uploads/downloads de arquivos através de proxy.

- `server/auth-local.ts`
  - implementa autenticação local.
  - valida senha, gera hash bcrypt e controla bloqueios de login.

- `server/db.ts`
  - abstrai operações de banco de dados usando Drizzle.
  - implementa funções de CRUD e consultas específicas.

- `server/routers.ts`
  - agrupa as procedures tRPC da aplicação.
  - define endpoints de autenticação, projetos, notificações e mais.

- `server/storage.ts`
  - helpers de armazenamento de arquivos.

- `server/auth-local.test.ts` e `server/auth.logout.test.ts`
  - testes de autenticação e logout.

### `shared/`

Código utilizado tanto pelo frontend quanto pelo backend.

- `shared/const.ts`
  - constantes e whitelists compartilhadas.
  - ex.: áreas temáticas, categorias de competência, nomes de cookie e mensagens de erro.

- `shared/types.ts`
  - tipos TypeScript globais usados por ambas as camadas.

---

## Fluxo de Funcionamento

### Autenticação

1. O usuário submete email e senha na tela de login.
2. O frontend envia a requisição ao endpoint tRPC `auth.login`.
3. `server/auth-local.ts` valida as credenciais e cria um token JWT.
4. O token é gravado como cookie seguro no navegador.
5. Cada requisição tRPC subsequente usa `server/_core/context.ts` para carregar o usuário.
6. Rotas protegidas usam `protectedProcedure` para exigir login.

### Projetos e Propostas

- Professores criam e editam projetos.
- Alunos podem criar propostas de projeto.
- Professores e admins revisam propostas e aprovam ou rejeitam.
- Propostas aprovadas podem ser vinculadas a projetos oficiais.
- Os dados são persistidos em tabelas normalizadas no banco.

### Proteção de Rotas

- `client/src/App.tsx` controla acessos com `ProtectedRoute`.
- Rotas como `/dashboard`, `/perfil`, `/minhas-propostas` e `/admin` exigem autenticação.
- A verificação de papel ocorre tanto no frontend quanto no backend.

### Dados Compartilhados

- `shared/const.ts` mantém listas comuns entre frontend e backend.
- Isso evita divergências entre valores permitidos e validação.

---

## Instalação e Execução

### Requisitos

- Node.js >= 22
- pnpm >= 10
- SQLite/MySQL/TiDB conforme configuração
- Variáveis de ambiente configuradas

### Passos

```bash
pnpm install
pnpm dev
```

### Produção

```bash
pnpm build
pnpm start
```

---

## Comandos Disponíveis

- `pnpm dev`: inicia servidor de desenvolvimento.
- `pnpm build`: compila o frontend e empacota o backend.
- `pnpm start`: executa a aplicação de produção.
- `pnpm check`: verifica tipos TypeScript.
- `pnpm format`: formata o código com Prettier.
- `pnpm test`: executa testes.
- `pnpm db:push`: gera e aplica migrações Drizzle.

---

## Considerações Finais

Este projeto foi concebido como uma plataforma completa de PD&I para um ambiente acadêmico, combinando:
- experiência de usuário responsiva;
- autenticação e autorização segura;
- arquitetura de dados bem definida;
- integração entre frontend e backend tipados.

Ele pode ser apresentado ao professor como uma solução robusta e extensível para gestão de projetos acadêmicos.

### Rotas da API (tRPC)

| Namespace | Procedures |
|---|---|
| `auth` | `me`, `logout` |
| `projects` | `list`, `byId`, `create`, `update`, `delete`, `myProjects`, `addMember`, `removeMember`, `addSkill`, `removeSkill`, `addTimelineEvent` |
| `requests` | `create`, `listByProject`, `myRequests`, `allPending`, `review` |
| `skills` | `list`, `create`, `mySkills`, `addToProfile`, `removeFromProfile` |
| `dashboard` | `stats` |
| `profile` | `get`, `update` |
| `admin` | `users`, `updateUserRole`, `allProjects` |

---

## Licença

MIT — Projeto Integrador FATEC Pompéia · 2026
