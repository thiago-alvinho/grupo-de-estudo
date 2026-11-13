# 🎓 Grupo de Estudo — Plataforma Colaborativa de Videoaulas

Plataforma web moderna construída com **AdonisJS v6**, **TypeScript**, **Lucid ORM**, **SQLite**, **Edge.js**, **Vite** e **Alpine.js**, projetada para transformar playlists e videoaulas do YouTube em trilhas de estudo estruturadas com acompanhamento individual de progresso e painel de BackOffice administrativo.

---

## 🚀 Requisitos Implementados

| Requisito | Rota(s) | Descrição |
| :--- | :--- | :--- |
| **Cadastro** | `GET /signup`<br>`POST /signup` | Cadastro de novos alunos com validação de campos, criptografia de senha via Scrypt e login automático. |
| **Listar Usuários (BO)** | `GET /admin/users` | Painel administrativo exclusivo para visualizar todos os estudantes e instrutores, métricas gerais e alteração de papéis (`admin`/`student`). |
| **Listar Vídeos (BO)** | `GET /admin/videos` | Moderação centralizada de todas as videoaulas cadastradas na plataforma, com thumbnail, vínculo de trilha e exclusão. |
| **Buscar Vídeos** | `GET /videos` | Catálogo geral com busca textual por palavra-chave, filtro por disciplina e filtro dinâmico de status (*Pendentes* / *Concluídos* via Alpine.js). |
| **Detalhar Vídeos** | `GET /videos/:id`<br>`GET /tracks/:id` | Visualização detalhada da videoaula com player embutido 16:9 (`youtube-nocookie.com`), metadados, navegação stepper e caderno de anotações pessoal. |
| **Enviar Vídeo** | `GET /videos/create`<br>`POST /videos` | Envio de videoaulas com suporte a links padrão (`watch?v=`), links curtos (`youtu.be/`), `embed` e `shorts`. |

---

## 🛠️ Tecnologias Utilizadas

* **Backend**: [AdonisJS v6](https://adonisjs.com) (Node.js >= 24)
* **Linguagem**: TypeScript
* **Banco de Dados**: SQLite via `better-sqlite3` com [Lucid ORM](https://lucid.adonisjs.com)
* **Validação**: [VineJS](https://vinejs.dev)
* **Templates & View Engine**: Edge.js com componentes reutilizáveis e ícones Lucide via `edge-iconify`
* **Frontend Interativo**: [Alpine.js](https://alpinejs.dev) (busca em tempo real, filtros dinâmicos, caderno de anotações com `localStorage`, alternância de Dark Mode)
* **Assets & Bundler**: Vite
* **Testes**: Japa Runner (`@japa/runner`, `@japa/assert`, `@adonisjs/core/services/test_utils`)

---

## 📦 Como Instalar e Rodar Localmente

### 1. Pré-requisitos
* Node.js versão 24 ou superior
* npm ou pnpm instalado

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
> * **E-mail**: `admin@grupodeestudo.com`
> * **Senha**: `admin12345`

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
* `tests/unit/study_tracks.spec.ts`: Extrator de ID do YouTube, validações do VineJS e ciclo de vida de trilhas/aulas.
* `tests/unit/videos_catalog.spec.ts`: Busca e filtros de vídeos, isolamento entre trilhas públicas e privadas.
* `tests/unit/backoffice.spec.ts`: Permissões administrativas, promoção/rebaixamento de usuários e moderação de vídeos.

---

## 📂 Estrutura de Diretórios Principal

```
grupo-de-estudo/
├── app/
│   ├── controllers/
│   │   ├── backoffice_controller.ts       # Gestão de Usuários e Vídeos (BO)
│   │   ├── lessons_controller.ts          # CRUD de aulas dentro da trilha
│   │   ├── new_account_controller.ts      # Cadastro de usuários
│   │   ├── session_controller.ts          # Login e logout
│   │   ├── study_tracks_controller.ts     # Trilhas de estudo e player principal
│   │   └── videos_catalog_controller.ts   # Busca, catálogo e envio de vídeos
│   ├── middleware/
│   │   ├── admin_middleware.ts            # Proteção de rotas BackOffice
│   │   ├── auth_middleware.ts             # Proteção de rotas autenticadas
│   │   └── guest_middleware.ts            # Redirecionamento de usuários já logados
│   ├── models/
│   │   ├── lesson.ts                      # Modelo de Videoaulas
│   │   ├── lesson_progress.ts             # Progresso de conclusão individual
│   │   ├── study_track.ts                 # Trilhas de estudo
│   │   └── user.ts                        # Usuários e papéis (student/admin)
│   └── validators/
│       ├── study_track.ts                 # Validador de trilhas e URLs do YouTube
│       └── user.ts                        # Validador de cadastro e login
├── database/
│   ├── migrations/                        # Estrutura das tabelas no banco de dados
│   └── seeders/                           # Dados iniciais da aplicação
├── resources/
│   ├── css/app.css                        # Design System completo (Light & Dark Mode)
│   ├── js/app.js                          # Configurações do Alpine.js
│   └── views/
│       ├── components/                    # Componentes reutilizáveis Edge
│       └── pages/
│           ├── admin/                     # Telas do BackOffice (Usuários e Vídeos)
│           ├── auth/                      # Telas de Login e Cadastro
│           ├── tracks/                    # Trilhas de estudo e player principal
│           └── videos/                    # Busca, catálogo e envio direto de vídeos
├── start/
│   ├── kernel.ts                          # Registro de middlewares
│   └── routes.ts                          # Definição de todas as rotas da aplicação
└── tests/
    └── unit/                              # Testes automatizados com Japa
```
