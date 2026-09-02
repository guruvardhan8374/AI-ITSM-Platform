# Frontend - AI-Powered ITSM Platform

Modern, enterprise-grade IT Service Management frontend dashboard built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Lucide React Icons**, and **Recharts**.

## Architecture & Structure

```
frontend/
├── src/
│   ├── components/      # Shared UI & layout components
│   ├── pages/           # Module pages (Dashboard, Incidents, Assets, AI Tools)
│   ├── layouts/         # Sidebar, Header, and Main Container layouts
│   ├── routes/          # React Router v6 setup
│   ├── services/        # Axios API client & health check handlers
│   ├── hooks/           # Custom React hooks
│   ├── context/         # Auth & Global State Context
│   ├── types/           # Strict TypeScript interface definitions
│   ├── utils/           # Helper functions & constants
│   ├── assets/          # Static assets & icons
│   ├── App.tsx          # Root application component
│   ├── main.tsx         # React DOM mount entry point
│   └── index.css        # Tailwind CSS imports & global design tokens
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build production distribution
npm run build
```
