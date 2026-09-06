# VittMitra Frontend (Next.js + TypeScript)

Modern, accessible, and fintech-grade client application for the VittMitra government scheme discovery and assistance platform.

## Directory Structure
```text
frontend/
├── app/              # Next.js App Router (Layouts, Pages, Global Styles)
├── components/       # Component hierarchy
│   ├── ui/           # Atomic UI components (Buttons, Inputs, Cards, Badges)
│   └── shared/       # Navigation, Header, Footer
├── hooks/            # Custom React hooks
├── lib/              # Client utilities and helpers
├── services/         # API integration services (FastAPI REST clients)
├── styles/           # Design tokens, variables, and typography
├── types/            # TypeScript domain interfaces
├── public/           # Static assets, branding, icons
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Type-check:
```bash
npm run type-check
```

5. Production Build test:
```bash
npm run build
```
