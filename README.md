# Ecommify Monorepo

Phase 1 scaffold for the Ecommify multi-tenant e-commerce platform.

## Apps

- api: Laravel API with Sanctum, Stancl Tenancy, Spatie Permission
- admin-front: Next.js admin dashboard
- store-front: Next.js customer storefront

## Quick Start

1. Copy root environment template:

   cp .env.example .env

2. Build and run services:

   docker compose up --build

3. App URLs:

- API: http://localhost:8000
- Admin: http://localhost:3000
- Store: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
