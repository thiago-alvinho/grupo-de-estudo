# 🎓 Grupo de Estudo — Plataforma Colaborativa de Videoaulas

Plataforma web moderna construída com **AdonisJS v7**, **TypeScript**, **Lucid ORM**, **SQLite**, **Edge.js**, **Vite** e **Alpine.js**, projetada para transformar playlists e videoaulas do YouTube em trilhas de estudo estruturadas com acompanhamento individual de progresso, caderno de anotações sincronizado na nuvem, compartilhamento de trilhas e painel administrativo.

---

## 🚀 Funcionalidades e Rotas Implementadas

| Funcionalidade                  | Rota(s)                                                                                  | Descrição                                                                                                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação e Cadastro**     | `GET /signup` · `POST /signup`<br>`GET /login` · `POST /login`                           | Cadastro de estudantes, criptografia de senha via Scrypt, login e controle de sessão com papéis (`student` e `admin`).                                         |
| **Minhas Trilhas & Explorar**   | `GET /tracks`<br>`GET /explore`                                                          | Painel pessoal com estatísticas de progresso e catálogo da comunidade para explorar trilhas públicas ou solicitar acesso a trilhas privadas.                   |
| **Trilhas Públicas e Privadas** | `GET /tracks/create` · `POST /tracks`<br>`GET /tracks/:id/edit` · `PUT /tracks/:id`      | Criação de trilhas privadas por estudantes (com senha opcional de acesso ou aprovação manual) e criação de trilhas públicas oficiais exclusiva para `admin`.   |
| **Compartilhamento e Posse**    | `POST /tracks/:id/join` · `POST /tracks/:id/unlock`<br>`POST /tracks/:id/request-access` | Inscrição em trilhas públicas, desbloqueio de trilhas privadas por senha, aprovação/recusa de membros (`study_track_members`) e transferência de posse.        |
| **Sala de Aula & Anotações**    | `GET /tracks/:id`<br>`POST /tracks/:trackId/lessons/:id/notes`                           | Player embutido 16:9 (`youtube-nocookie.com`), marcação individual de aulas concluídas e caderno de anotações persistido no banco de dados com auto-save AJAX. |
| **Notificações em Tempo Real**  | `GET /notifications`<br>`GET /realtime/stream`                                           | Central de notificações e streaming em tempo real via Server-Sent Events (SSE) para pedidos de acesso, aprovações e novas trilhas públicas.                    |
| **Buscar, Detalhar e Enviar**   | `GET /videos` · `GET /videos/:id`<br>`GET /videos/create` · `POST /videos`               | Catálogo com busca SQL por título da aula ou trilha, filtro por disciplina e envio de vídeos (`watch?v=`, `youtu.be/`, `embed` e `shorts`).                    |
| **Listar Usuários**             | `GET /admin/users`<br>`POST /admin/users/:id/toggle-role`                                | Painel administrativo exclusivo para visualizar todos os estudantes e instrutores, métricas gerais e alternância de papéis (`admin`/`student`).                |
| **Listar Vídeos**               | `GET /admin/videos`<br>`DELETE /admin/videos/:id`                                        | Moderação centralizada de todas as videoaulas cadastradas na plataforma, com busca SQL, filtro por trilha e exclusão.                                          |

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: [AdonisJS v7](https://adonisjs.com) (Node.js >= 24)
- **Linguagem**: TypeScript
- **Banco de Dados**: SQLite via `better-sqlite3` com [Lucid ORM](https://lucid.adonisjs.com)
- **Validação**: [VineJS](https://vinejs.dev)
- **Templates & View Engine**: Edge.js com componentes reutilizáveis e ícones Lucide via `edge-iconify`
- **Frontend Interativo**: [Alpine.js](https://alpinejs.dev) + Server-Sent Events (SSE) para atualizações em tempo real, auto-save de anotações e alternância de tema (Light & Dark Mode)
- **Assets & Bundler**: Vite
- **Testes**: Japa Runner (`@japa/runner`, `@japa/assert`, `@adonisjs/core/services/test_utils`)

---

## 📦 Como Instalar e Rodar Localmente

### 1. Pré-requisitos

- Node.js versão 24 ou superior
- npm instalado

### 2. Clonar e Instalar Dependências

```bash
git clone <url-do-repositorio>
cd grupo-de-estudo
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo ou utilize o `.env` padrão:

```env
TZ=UTC
PORT=3333
HOST=localhost
NODE_ENV=development
LOG_LEVEL=info
APP_KEY=sua_chave_secreta_aqui
APP_URL=http://localhost:3333
SESSION_DRIVER=cookie
```

### 4. Executar Migrações do Banco de Dados

```bash
node ace migration:run
```

### 5. Executar o Seeder (Administrador padrão)

```bash
node ace db:seed
```

> **Credenciais do Administrador Padrão**:
>
> - **E-mail**: `admin@grupodeestudo.com`
> - **Senha**: `admin12345`

### 6. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse no seu navegador: **`http://localhost:3333`**

---

## 🧪 Como Rodar os Testes Automatizados

Para executar toda a suíte de testes unitários com o Japa:

```bash
node ace test
# ou
npm test
```

### Cobertura de Testes:

- `tests/unit/study_tracks.spec.ts`: Extrator de ID do YouTube, validações do VineJS, ciclo de vida de trilhas/aulas e restrição de criação de trilhas públicas apenas para `admin`.
- `tests/unit/private_track_sharing.spec.ts`: Desbloqueio de trilha privada com senha, solicitação/aprovação de acesso, inscrição em trilhas públicas e transferência segura de posse.
- `tests/unit/lesson_notes.spec.ts`: Persistência e atualização de anotações individuais por aula no banco de dados.
- `tests/unit/notifications.spec.ts`: Contagem e leitura de notificações do usuário.
- `tests/unit/videos_catalog.spec.ts`: Busca SQL por título de aula/trilha e isolamento entre trilhas públicas e privadas.
- `tests/unit/backoffice.spec.ts`: Permissões administrativas, promoção/rebaixamento de usuários e moderação de vídeos.

---

## 📂 Estrutura de Diretórios Principal

```text
grupo-de-estudo/
├── app/
│   ├── controllers/
│   │   ├── backoffice_controller.ts       # Gestão administrativa de Usuários e Vídeos
│   │   ├── lessons_controller.ts          # CRUD de aulas, progresso e anotações
│   │   ├── new_account_controller.ts      # Cadastro de usuários
│   │   ├── notifications_controller.ts    # Listagem e leitura de notificações
│   │   ├── realtime_controller.ts         # Stream SSE de eventos em tempo real
│   │   ├── session_controller.ts          # Login e logout
│   │   ├── study_tracks_controller.ts     # Trilhas de estudo, explorar e player principal
│   │   ├── track_access_controller.ts     # Senhas, solicitações de acesso e posse da trilha
│   │   └── videos_catalog_controller.ts   # Busca, catálogo e envio de vídeos
│   ├── middleware/
│   │   ├── admin_middleware.ts            # Proteção de rotas administrativas
│   │   ├── auth_middleware.ts             # Proteção de rotas autenticadas
│   │   ├── guest_middleware.ts            # Redirecionamento de usuários já logados
│   │   └── silent_auth_middleware.ts      # Autenticação silenciosa e contador de notificações
│   ├── models/
│   │   ├── lesson.ts                      # Modelo de Videoaulas
│   │   ├── lesson_note.ts                 # Caderno de anotações por usuário e aula
│   │   ├── lesson_progress.ts             # Progresso de conclusão individual
│   │   ├── notification.ts                # Notificações do usuário
│   │   ├── study_track.ts                 # Trilhas de estudo (públicas e privadas)
│   │   ├── study_track_member.ts          # Membros e solicitações de acesso às trilhas
│   │   └── user.ts                        # Usuários e papéis (student/admin)
│   ├── services/
│   │   └── realtime_service.ts            # Gerenciador de conexões SSE por usuário
│   └── validators/
│       ├── study_track.ts                 # Validador de trilhas e URLs do YouTube
│       └── user.ts                        # Validador de cadastro e login
├── database/
│   ├── migrations/                        # Estrutura das tabelas no banco de dados
│   └── seeders/                           # Seeder do administrador padrão
├── resources/
│   ├── css/app.css                        # Design System completo (Light & Dark Mode)
│   ├── js/app.js                          # Inicialização do Alpine.js
│   └── views/
│       ├── components/                    # Componentes reutilizáveis Edge
│       └── pages/
│           ├── admin/                     # Telas administrativas (Usuários e Vídeos)
│           ├── auth/                      # Telas de Login e Cadastro
│           ├── notifications/             # Central de notificações
│           ├── tracks/                    # Minhas trilhas, explorar, desbloqueio e player
│           └── videos/                    # Busca, catálogo e envio direto de vídeos
├── start/
│   ├── kernel.ts                          # Registro de middlewares
│   └── routes.ts                          # Definição de todas as rotas da aplicação
└── tests/
    └── unit/                              # Testes automatizados com Japa
```
