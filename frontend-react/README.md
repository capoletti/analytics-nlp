# Analytics Platform - Frontend React

## 🚀 Projeto Refatorado com React + TypeScript

Migração completa do frontend vanilla JS para React + TypeScript com arquitetura moderna e escalável.

### 📦 Stack Tecnológica

- **React 18** com TypeScript
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Styling utility-first
- **TanStack Query** - Gerenciamento de estado servidor
- **Zustand** - State management leve
- **Recharts** - Biblioteca de gráficos
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones modernos

### 🏗️ Arquitetura

```
src/
├── components/       # Componentes React organizados por feature
│   ├── auth/        # Autenticação e login
│   ├── dashboard/   # Dashboards e visualizações
│   ├── charts/      # Componentes de gráficos
│   ├── catalog/     # Explorador de catálogo
│   ├── filters/     # Filtros e controles
│   ├── table/       # Tabelas de dados
│   ├── layout/      # Layout e navegação
│   └── ui/          # Componentes UI reutilizáveis
├── hooks/           # Custom hooks
├── services/        # Camada de serviços/API
├── contexts/        # React contexts
├── types/           # TypeScript types
└── utils/           # Funções utilitárias
```

### ⚡ Principais Melhorias

1. **Type Safety** - TypeScript em todo o código
2. **Componentização** - Componentes pequenos e reutilizáveis
3. **Custom Hooks** - Lógica de negócio isolada e testável
4. **Service Layer** - Separação clara entre UI e API
5. **Performance** - React Query para cache e otimizações
6. **DX** - Hot reload, linting, formatação automática

### 🛠️ Instalação

```bash
cd frontend-react
npm install
```

### 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint

# Format
npm run format

# Run Locas
cd /home/cpoletti/analytics-seniorx/frontend-react && npm run dev

cd /home/cpoletti/analytics-seniorx/frontend-react && VITE_API_URL=http://localhost:8081 npm run dev
```

### 🔧 Configuração

O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:8000`.

### 📝 Exemplos de Uso

#### Custom Hook
```typescript
const { dashboards, isLoading, createDashboard } = useDashboards(tenant);
```

#### Componente
```typescript
<DashboardGrid 
  dashboards={dashboards}
  onOpen={openDashboard}
  onCreate={handleCreate}
/>
```

### 🎨 Tailwind Utilities

Classes customizadas disponíveis:
- `.btn` - Botão base
- `.btn-primary`, `.btn-secondary`, etc.
- `.input` - Input base
- `.card` - Card container

### 🚀 Próximos Passos

- [x] Adicionar React Router para navegação
- [x] Implementar página de criação de dashboards
- [x] Persistência de autenticação no localStorage
- [ ] Adicionar testes unitários (Vitest)
- [ ] Implementar testes E2E (Playwright)
- [ ] Adicionar Storybook
- [ ] Implementar lazy loading de rotas
- [ ] Adicionar internacionalização (i18n)

### 📋 Rotas Disponíveis

- `/` ou `/dashboard` - Lista de dashboards
- `/dashboard/new` - Criar novo dashboard
- `/explore` - Explorador de catálogo de dados
- `/editor` - Editor de elementos (em desenvolvimento)
