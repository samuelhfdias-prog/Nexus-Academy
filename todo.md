# Nexus Academic - TODO

## Design System & Configuração Base
- [x] Configurar CSS variables com cores exatas do design system (#24B68E, #1E9A78, #38C69F, #0F1624, #F3F9F6)
- [x] Configurar fonte Nunito via Google Fonts
- [x] Criar tokens de design no index.css

## Schema de Banco de Dados
- [x] Tabela users (com role: aluno/professor/admin)
- [x] Tabela projects (título, descrição, área, status, responsável, data início)
- [x] Tabela skills (competências)
- [x] Tabela user_skills (relação usuário-competência)
- [x] Tabela project_skills (demandas de competências por projeto)
- [x] Tabela project_members (membros de cada projeto)
- [x] Tabela participation_requests (solicitações de participação)
- [x] Tabela project_timeline (linha do tempo do projeto)

## Backend (tRPC Procedures)
- [x] Router de projetos: CRUD completo
- [x] Router de competências: listar, criar, associar
- [x] Router de membros: adicionar, remover
- [x] Router de solicitações: criar, aprovar, rejeitar
- [x] Router de dashboard: estatísticas e indicadores
- [x] Router de perfil: dados do usuário, histórico
- [x] Router admin: gestão de usuários e projetos

## Frontend - Landing Page
- [x] Navbar com logo, menu e botões de autenticação
- [x] Hero Section com curva SVG e botões CTA
- [x] Cards de destaque (3 cards de funcionalidades)
- [x] Seção de funcionalidades com ícones
- [x] Seção CTA final
- [x] Footer com links e informações

## Frontend - Autenticação e Layout
- [x] Layout principal com navbar persistente
- [x] Contexto de autenticação com roles
- [x] Página de login/redirect OAuth
- [x] Proteção de rotas por role

## Frontend - Projetos
- [x] Listagem de projetos com cards
- [x] Filtros por área, status, período, competências
- [x] Busca por texto
- [x] Formulário de criação/edição de projeto
- [x] Página de detalhes do projeto
- [x] Linha do tempo do projeto
- [x] Membros da equipa
- [x] Botão de solicitar participação

## Frontend - Dashboard
- [x] Cards de indicadores (total projetos, ativos, membros)
- [x] Gráfico de distribuição por área temática
- [x] Gráfico de projetos por status
- [x] Lista de projetos recentes

## Frontend - Competências
- [x] Página de competências do usuário
- [x] Formulário para adicionar competências
- [x] Visualização de demandas por projeto

## Frontend - Perfil
- [x] Página de perfil do usuário
- [x] Histórico de participações
- [x] Competências cadastradas
- [x] Conquistas académicas

## Frontend - Painel Admin
- [x] Gestão de projetos (aprovar, arquivar)
- [x] Gestão de usuários (alterar roles)
- [x] Aprovação de solicitações de participação

## Testes e Documentação
- [x] Testes Vitest para procedures principais (20 testes passando)
- [x] README com instruções de execução
- [x] Checkpoint final

## Autenticação Local com Segurança (Novas Exigências)
- [ ] Adicionar campos passwordHash e salt na tabela users
- [ ] Instalar bcrypt e implementar hash seguro de senhas
- [ ] Implementar validação de força de senha (mín. 8 chars, maiúscula, minúscula, número, especial)
- [ ] Criar procedures tRPC de register e login local
- [ ] Tratamento seguro de erros (não revelar se email existe)
- [ ] Rate limiting para tentativas de login
- [ ] Criar página de Login com formulário seguro
- [ ] Criar página de Registro com indicador visual de força de senha
- [ ] Testes Vitest para fluxo de autenticação local
- [ ] Documentação técnica de segurança (SECURITY.md) com justificativas
