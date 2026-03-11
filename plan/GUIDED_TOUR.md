# Guided Tour — Plano de Implementacao

> Onboarding guiado dentro da area logada usando [onborda](https://github.com/uixmat/onborda) (Next.js + Framer Motion + shadcn/ui).

---

## Stack & Compatibilidade

| Dependencia | Requerido | Status |
|-------------|-----------|--------|
| `onborda` | ^1.2.5 | Instalar |
| `framer-motion` | ^12.x | Ja instalado |
| `react` | ^18+ | Ja instalado (19.2.3) |
| `next` | ^13+ | Ja instalado (16.1.6) |
| Tailwind CSS | ^3+ | Ja instalado (4.x) |

**Zero conflitos** — todas as peer deps ja existem.

---

## Arquitetura

```
dashboard/layout.tsx
  └─ OnbordaProvider
       └─ Onborda (steps + cardComponent)
            └─ {children}

stores/tour-store.ts          ← Zustand: controle de tours vistos
components/tour/
  ├─ tour-card.tsx            ← Card customizado (shadcn/ui)
  ├─ tour-steps.ts            ← Definicao de todos os steps
  └─ tour-trigger.tsx         ← Botao "?" no header pra replay
```

### Fluxo

1. Usuario faz login → `dashboard/layout.tsx` verifica `tourStore.hasSeenTour('onboarding')`
2. Se nunca viu → inicia tour automaticamente (delay 1s pra DOM estabilizar)
3. Tour progride com next/prev, navega entre paginas via `nextRoute`/`prevRoute`
4. Ao completar ou fechar → `tourStore.markTourSeen('onboarding')` salva em `localStorage`
5. Botao "?" no header permite replay manual a qualquer momento

---

## Tours Planejados

### Tour 1: `onboarding` (primeira visita)

Percorre os elementos essenciais do dashboard. Multi-pagina.

| # | Pagina | Selector | Titulo | Side | nextRoute |
|---|--------|----------|--------|------|-----------|
| 1 | `/dashboard` | `#welcome-header` | Bem-vindo ao BestSellers AI | bottom | — |
| 2 | `/dashboard` | `#stats-summary` | Seus livros num relance | bottom | — |
| 3 | `/dashboard` | `#quick-action-create` | Crie seu primeiro livro | right | — |
| 4 | `/dashboard` | `#credits-card` | Seus creditos | left | — |
| 5 | `/dashboard` | `#sidebar-nav` | Navegacao | right | `/dashboard/books` |
| 6 | `/dashboard/books` | `#books-create-btn` | Crie um livro aqui | bottom | — |
| 7 | `/dashboard/books` | `#books-filters` | Filtre e busque | bottom | `/dashboard/wallet` |
| 8 | `/dashboard/wallet` | `#wallet-balance` | Saldo de creditos | bottom | — |
| 9 | `/dashboard/wallet` | `#wallet-transactions` | Historico de transacoes | top | `/dashboard/settings` |
| 10 | `/dashboard/settings` | `#settings-section` | Configuracoes da conta | bottom | — |

> **Nota**: Os selectors sao IDs que serao adicionados aos elementos existentes. Nao muda layout, so adiciona `id="..."`.

### Tour 2: `create-wizard` (futuro, ao criar primeiro livro)

Guia o usuario pelo wizard de criacao. Pode ser implementado depois.

| # | Selector | Titulo |
|---|----------|--------|
| 1 | `#mode-simple` | Modo Simples |
| 2 | `#mode-guided` | Modo Guiado (IA) |
| 3 | `#mode-advanced` | Modo Avancado |

### Tour 3: `book-detail` (futuro, ao ver primeiro livro)

Guia o usuario pelas features de visualizacao do livro (KDP viewer, toggle, etc).

---

## Arquivos a Criar

### 1. `apps/web/src/stores/tour-store.ts`

```typescript
import { create } from 'zustand';

interface TourState {
  seenTours: Record<string, boolean>;
  hasSeenTour: (tourId: string) => boolean;
  markTourSeen: (tourId: string) => void;
  resetTour: (tourId: string) => void;
  resetAllTours: () => void;
}

// Persiste em localStorage manualmente (nao usa zustand/persist pra manter leve)
const STORAGE_KEY = 'bestsellers-tours-seen';

function loadSeenTours(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export const useTourStore = create<TourState>((set, get) => ({
  seenTours: loadSeenTours(),
  hasSeenTour: (tourId) => !!get().seenTours[tourId],
  markTourSeen: (tourId) => {
    const updated = { ...get().seenTours, [tourId]: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ seenTours: updated });
  },
  resetTour: (tourId) => {
    const updated = { ...get().seenTours };
    delete updated[tourId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ seenTours: updated });
  },
  resetAllTours: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ seenTours: {} });
  },
}));
```

### 2. `apps/web/src/components/tour/tour-card.tsx`

Card customizado usando shadcn/ui, consistente com o design system do app.

```typescript
'use client';

import type { CardComponentProps } from 'onborda';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useOnborda } from 'onborda';

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const t = useTranslations('tour');
  const { closeOnborda } = useOnborda();

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="relative w-[320px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-5">
      {/* Arrow */}
      <div className="absolute">{arrow}</div>

      {/* Close button */}
      <button
        onClick={closeOnborda}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {step.icon && <div className="text-2xl">{step.icon}</div>}
        <h3 className="text-base font-semibold">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex gap-2">
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={prevStep}>
              {t('prev')}
            </Button>
          )}
          <Button size="sm" onClick={isLast ? closeOnborda : nextStep}>
            {isLast ? t('finish') : t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3. `apps/web/src/components/tour/tour-steps.ts`

Define os steps usando keys i18n. Cada step referencia `t('tour.stepX.title')` etc.

```typescript
import type { Step } from 'onborda';

export function getOnboardingSteps(
  t: (key: string) => string,
  locale: string,
): Step[] {
  const prefix = `/${locale}/dashboard`;

  return [
    {
      tour: 'onboarding',
      icon: <>👋</>,
      title: t('onboarding.welcome.title'),
      content: t('onboarding.welcome.content'),
      selector: '#welcome-header',
      side: 'bottom',
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 16,
    },
    {
      tour: 'onboarding',
      icon: <>📊</>,
      title: t('onboarding.stats.title'),
      content: t('onboarding.stats.content'),
      selector: '#stats-summary',
      side: 'bottom',
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 16,
    },
    {
      tour: 'onboarding',
      icon: <>✨</>,
      title: t('onboarding.createBook.title'),
      content: t('onboarding.createBook.content'),
      selector: '#quick-action-create',
      side: 'right',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      tour: 'onboarding',
      icon: <>💰</>,
      title: t('onboarding.credits.title'),
      content: t('onboarding.credits.content'),
      selector: '#credits-card',
      side: 'left',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
    },
    {
      tour: 'onboarding',
      icon: <>🧭</>,
      title: t('onboarding.navigation.title'),
      content: t('onboarding.navigation.content'),
      selector: '#sidebar-nav',
      side: 'right',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 16,
      nextRoute: `${prefix}/books`,
    },
    {
      tour: 'onboarding',
      icon: <>📚</>,
      title: t('onboarding.booksList.title'),
      content: t('onboarding.booksList.content'),
      selector: '#books-create-btn',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
      prevRoute: `${prefix}`,
    },
    {
      tour: 'onboarding',
      icon: <>🔍</>,
      title: t('onboarding.filters.title'),
      content: t('onboarding.filters.content'),
      selector: '#books-filters',
      side: 'bottom',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
      nextRoute: `${prefix}/wallet`,
    },
    {
      tour: 'onboarding',
      icon: <>💳</>,
      title: t('onboarding.wallet.title'),
      content: t('onboarding.wallet.content'),
      selector: '#wallet-balance',
      side: 'bottom',
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 16,
      prevRoute: `${prefix}/books`,
    },
    {
      tour: 'onboarding',
      icon: <>📋</>,
      title: t('onboarding.transactions.title'),
      content: t('onboarding.transactions.content'),
      selector: '#wallet-transactions',
      side: 'top',
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      tour: 'onboarding',
      icon: <>🎉</>,
      title: t('onboarding.done.title'),
      content: t('onboarding.done.content'),
      selector: '#wallet-balance',
      side: 'bottom',
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 16,
    },
  ];
}
```

### 4. `apps/web/src/components/tour/tour-trigger.tsx`

Botao no header pra replay do tour.

```typescript
'use client';

import { HelpCircle } from 'lucide-react';
import { useOnborda } from 'onborda';
import { useTourStore } from '@/stores/tour-store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

export function TourTrigger() {
  const t = useTranslations('tour');
  const { startOnborda } = useOnborda();
  const resetTour = useTourStore((s) => s.resetTour);

  function handleReplay() {
    resetTour('onboarding');
    startOnborda('onboarding');
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleReplay}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('replay')}</TooltipContent>
    </Tooltip>
  );
}
```

---

## Arquivos a Modificar

### 5. `apps/web/src/app/[locale]/dashboard/layout.tsx`

Adicionar `OnbordaProvider` + `Onborda` wrapper:

```diff
+ import { OnbordaProvider, Onborda } from 'onborda';
+ import { TourCard } from '@/components/tour/tour-card';
+ import { TourInitializer } from '@/components/tour/tour-initializer';

  // Dentro do return:
  <ProtectedRoute>
+   <OnbordaProvider>
+     <Onborda
+       steps={steps}
+       cardComponent={<TourCard />}
+       shadowRgb="0,0,0"
+       shadowOpacity="0.6"
+     >
        {/* layout existente */}
+       <TourInitializer />
+     </Onborda>
+   </OnbordaProvider>
  </ProtectedRoute>
```

> **`TourInitializer`**: componente client-only que checa `hasSeenTour` e chama `startOnborda('onboarding')` com delay 1s. Separado pra nao poluir o layout.

### 6. `apps/web/src/components/dashboard/header.tsx`

Adicionar `<TourTrigger />` ao lado do sino de notificacoes.

```diff
+ import { TourTrigger } from '@/components/tour/tour-trigger';

  // No right section, antes do NotificationPopover:
+ <TourTrigger />
  <NotificationPopover />
```

### 7. Paginas — Adicionar IDs aos elementos

Mudancas minimas: so adicionar atributos `id` aos elementos existentes.

**`dashboard/page.tsx`:**
```diff
- <div className="...">  {/* welcome section */}
+ <div id="welcome-header" className="...">

- <div className="grid ...">  {/* stats cards */}
+ <div id="stats-summary" className="grid ...">

- <Link href=".../create" ...>  {/* create button */}
+ <Link id="quick-action-create" href=".../create" ...>

- <div className="...">  {/* credits card */}
+ <div id="credits-card" className="...">
```

**`dashboard/sidebar.tsx`:**
```diff
- <nav className="...">  {/* navigation menu */}
+ <nav id="sidebar-nav" className="...">
```

**`dashboard/books/page.tsx`:**
```diff
- <Link href=".../create" ...>  {/* create button */}
+ <Link id="books-create-btn" href=".../create" ...>

- <div className="flex gap-3 ...">  {/* filter controls */}
+ <div id="books-filters" className="flex gap-3 ...">
```

**`dashboard/wallet/page.tsx`:**
```diff
- <div className="...">  {/* balance card */}
+ <div id="wallet-balance" className="...">

- <div className="...">  {/* transactions section */}
+ <div id="wallet-transactions" className="...">
```

### 8. i18n — `apps/web/messages/{en,pt-BR,es}.json`

Adicionar namespace `tour` nos 3 arquivos:

**English (`en.json`):**
```json
{
  "tour": {
    "next": "Next",
    "prev": "Back",
    "finish": "Got it!",
    "replay": "Replay tour",
    "onboarding": {
      "welcome": {
        "title": "Welcome to BestSellers AI!",
        "content": "This is your dashboard. Here you'll find a summary of your books and quick actions."
      },
      "stats": {
        "title": "Your books at a glance",
        "content": "These cards show the status of all your books — how many are in preview, generating, or ready."
      },
      "createBook": {
        "title": "Create your first book",
        "content": "Click here to start creating a book. Choose between Simple, Guided (AI-powered), or Advanced mode."
      },
      "credits": {
        "title": "Your credits",
        "content": "Each book generation costs credits. Keep an eye on your balance here."
      },
      "navigation": {
        "title": "Navigation",
        "content": "Use the sidebar to navigate between your books, wallet, and settings."
      },
      "booksList": {
        "title": "Your books",
        "content": "Create a new book from here or browse your existing ones."
      },
      "filters": {
        "title": "Search and filter",
        "content": "Find books quickly by title, status, or sort by date."
      },
      "wallet": {
        "title": "Credit balance",
        "content": "View your total credits, broken down by source — subscription, purchased, and bonus."
      },
      "transactions": {
        "title": "Transaction history",
        "content": "Every credit movement is logged here — purchases, generations, refunds, and more."
      },
      "done": {
        "title": "You're all set!",
        "content": "You can replay this tour anytime by clicking the help icon in the header. Happy writing!"
      }
    }
  }
}
```

**Portugues (`pt-BR.json`):**
```json
{
  "tour": {
    "next": "Proximo",
    "prev": "Voltar",
    "finish": "Entendi!",
    "replay": "Repetir tour",
    "onboarding": {
      "welcome": {
        "title": "Bem-vindo ao BestSellers AI!",
        "content": "Este e o seu painel. Aqui voce encontra um resumo dos seus livros e acoes rapidas."
      },
      "stats": {
        "title": "Seus livros de relance",
        "content": "Esses cards mostram o status de todos os seus livros — quantos estao em previa, gerando ou prontos."
      },
      "createBook": {
        "title": "Crie seu primeiro livro",
        "content": "Clique aqui para comecar a criar um livro. Escolha entre modo Simples, Guiado (com IA) ou Avancado."
      },
      "credits": {
        "title": "Seus creditos",
        "content": "Cada geracao de livro custa creditos. Fique de olho no seu saldo aqui."
      },
      "navigation": {
        "title": "Navegacao",
        "content": "Use o menu lateral para navegar entre seus livros, carteira e configuracoes."
      },
      "booksList": {
        "title": "Seus livros",
        "content": "Crie um novo livro aqui ou navegue pelos existentes."
      },
      "filters": {
        "title": "Busca e filtros",
        "content": "Encontre livros rapidamente por titulo, status ou ordene por data."
      },
      "wallet": {
        "title": "Saldo de creditos",
        "content": "Veja seus creditos totais, divididos por origem — assinatura, comprados e bonus."
      },
      "transactions": {
        "title": "Historico de transacoes",
        "content": "Cada movimentacao de creditos e registrada aqui — compras, geracoes, reembolsos e mais."
      },
      "done": {
        "title": "Tudo pronto!",
        "content": "Voce pode repetir este tour a qualquer momento clicando no icone de ajuda no cabecalho. Boa escrita!"
      }
    }
  }
}
```

**Espanol (`es.json`):**
```json
{
  "tour": {
    "next": "Siguiente",
    "prev": "Atras",
    "finish": "Entendido!",
    "replay": "Repetir tour",
    "onboarding": {
      "welcome": {
        "title": "Bienvenido a BestSellers AI!",
        "content": "Este es tu panel. Aqui encontraras un resumen de tus libros y acciones rapidas."
      },
      "stats": {
        "title": "Tus libros de un vistazo",
        "content": "Estas tarjetas muestran el estado de todos tus libros — cuantos estan en vista previa, generandose o listos."
      },
      "createBook": {
        "title": "Crea tu primer libro",
        "content": "Haz clic aqui para comenzar a crear un libro. Elige entre modo Simple, Guiado (con IA) o Avanzado."
      },
      "credits": {
        "title": "Tus creditos",
        "content": "Cada generacion de libro cuesta creditos. Vigila tu saldo aqui."
      },
      "navigation": {
        "title": "Navegacion",
        "content": "Usa el menu lateral para navegar entre tus libros, billetera y configuraciones."
      },
      "booksList": {
        "title": "Tus libros",
        "content": "Crea un nuevo libro aqui o navega por los existentes."
      },
      "filters": {
        "title": "Busqueda y filtros",
        "content": "Encuentra libros rapidamente por titulo, estado u ordena por fecha."
      },
      "wallet": {
        "title": "Saldo de creditos",
        "content": "Ve tus creditos totales, desglosados por origen — suscripcion, comprados y bonus."
      },
      "transactions": {
        "title": "Historial de transacciones",
        "content": "Cada movimiento de creditos se registra aqui — compras, generaciones, reembolsos y mas."
      },
      "done": {
        "title": "Todo listo!",
        "content": "Puedes repetir este tour en cualquier momento haciendo clic en el icono de ayuda en el encabezado. Feliz escritura!"
      }
    }
  }
}
```

---

## Tailwind Config

Adicionar scan do dist do onborda (se usar estilos default — nao necessario com card customizado, mas nao custa):

```diff
// apps/web/tailwind.config.ts (ou CSS @source)
+ content: ['./node_modules/onborda/dist/**/*.{js,ts,jsx,tsx}']
```

> Com Tailwind 4 e `@source`, pode ser via `@source "../node_modules/onborda/dist";` no CSS.

---

## Resumo de Arquivos

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| **Criar** | `stores/tour-store.ts` | Zustand store (localStorage) |
| **Criar** | `components/tour/tour-card.tsx` | Card customizado shadcn/ui |
| **Criar** | `components/tour/tour-steps.ts` | Definicao dos steps com i18n |
| **Criar** | `components/tour/tour-trigger.tsx` | Botao "?" no header |
| **Criar** | `components/tour/tour-initializer.tsx` | Auto-start na primeira visita |
| **Modificar** | `dashboard/layout.tsx` | Adicionar OnbordaProvider + Onborda wrapper |
| **Modificar** | `components/dashboard/header.tsx` | Adicionar TourTrigger |
| **Modificar** | `dashboard/page.tsx` | Adicionar IDs: welcome-header, stats-summary, quick-action-create, credits-card |
| **Modificar** | `dashboard/sidebar.tsx` | Adicionar ID: sidebar-nav |
| **Modificar** | `dashboard/books/page.tsx` | Adicionar IDs: books-create-btn, books-filters |
| **Modificar** | `dashboard/wallet/page.tsx` | Adicionar IDs: wallet-balance, wallet-transactions |
| **Modificar** | `messages/en.json` | Namespace `tour` (~30 keys) |
| **Modificar** | `messages/pt-BR.json` | Namespace `tour` (~30 keys) |
| **Modificar** | `messages/es.json` | Namespace `tour` (~30 keys) |

---

## Verificacao

1. `pnpm add onborda` em `apps/web`
2. `pnpm dev` → login → tour inicia automaticamente
3. Navegar pelos 10 steps (dashboard → books → wallet)
4. Fechar tour → nao aparece de novo ao navegar
5. Clicar "?" no header → tour reinicia
6. Testar nos 3 idiomas (en, pt-BR, es)
7. Testar responsivo (mobile — sidebar nao existe, steps do sidebar devem ser skip ou adaptados)
8. Verificar que overlay nao bloqueia interacao fora do tour (clicar fora fecha)

---

## Consideracoes

### Mobile
O sidebar nao existe em mobile (< xl). O step do `#sidebar-nav` precisa de tratamento:
- **Opcao A**: Skip condicional (detectar `window.innerWidth < 1280` e filtrar step)
- **Opcao B**: Em mobile, trocar selector pra `#mobile-bottom-nav` (bottom nav)
- **Recomendacao**: Opcao A — filtrar steps baseado em breakpoint

### Performance
- Onborda e ~15kb (leve)
- Usa MutationObserver pra detectar DOM changes — sem polling
- Card customizado elimina necessidade de scanear Tailwind do onborda
- Tour state em localStorage — zero custo de rede

### Extensibilidade
- Novos tours (ex: `create-wizard`, `book-detail`) seguem o mesmo padrao
- Adicionar steps = adicionar objetos no array + IDs nos elementos
- `useTourStore` suporta multiplos tours independentes

### Delay de Navegacao
- Onborda tem 500ms de delay hardcoded ao navegar entre paginas
- Suficiente pro Next.js renderizar a nova pagina
- Se alguma pagina demorar mais, o step pode nao encontrar o selector — nesse caso aumentar o delay via fork ou aguardar fix upstream
