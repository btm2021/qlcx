# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Pawn Shop Management System** (Hệ thống Quản lý Cầm Đồ Xe) built for vehicle pawn operations. The system prioritizes speed, simplicity, and visual evidence (photos) over complex manual data entry.

### Core Philosophy
- **Visual First**: "If you can take a picture, don't write a description."
- **QR Centric**: All main operations start with scanning a QR code
- **Mobile Optimized**: UI is predominantly mobile-first for warehouse staff
- **Fast & Dull**: Prefer boring, reliable code over clever abstractions

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Infrastructure**: Vercel Serverless Functions
- **Icons**: Lucide React
- **State Management**: Zustand or React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript compiler check

# Testing
npm test             # Run all tests
npm test -- --watch # Run tests in watch mode
npm test -- <pattern> # Run specific test file
```

## Architecture

### Folder Structure

```
/
├── app/
│   ├── (auth)/             # Login, Forgot Password
│   ├── (dashboard)/        # Main App Layout
│   │   ├── contracts/      # Contract Mgmt List/Create
│   │   ├── inspections/    # Inspection Tools
│   │   └── settings/
│   ├── api/                # Next.js Route Handlers
│   └── globals.css
├── components/
│   ├── ui/                 # Shadcn Atoms (Button, Input)
│   ├── biz/                # Business widgets (ContractCard, QRScanner)
│   └── layout/             # Header, Sidebar
├── lib/
│   ├── supabase/           # Client/Server instantiation
│   ├── utils.ts            # cn, formatters
│   └── constants.ts        # Enums mirroring DB
├── types/                  # TypeScript interfaces
└── public/
```

### Component Conventions

- **Server Components**: Default to Server Components
- **Client Components**: Use `'use client'` only for interactive bits (forms, hooks)
- **Styling**: Use `clsx` and `tailwind-merge` (`cn` utility) for dynamic classes
- **Mobile-first**: `w-full md:w-1/2`

### Database Architecture (Supabase)

The database uses PostgreSQL with Row Level Security (RLS). Key architectural patterns:

#### QR Code System
- **Format**: `{VehicleType}-{ContractType}-{YYYYMMDD}-{Sequence}`
- **Example**: `CAR-RENTAL-20260206-01`
- **Generation**: Use Supabase RPC `fn_generate_qr_code()` or `fn_create_contract()`
- **Counter Table**: `daily_sequence_counters` - resets daily, tracks per category/type

#### Key Tables
- `contracts` - Central table with `qr_code` as business identifier
- `vehicles` - Vehicle basic info (brand, model, license_plate)
- `vehicle_property_values` - EAV pattern for flexible vehicle attributes
- `contract_images` - Photo evidence (replaces checklists)
- `inspection_logs` - Periodic checks with GPS (only PRESENT/MISSING)
- `activity_logs` - Minimal logging (timestamp, staff_id, contract_id only)

#### Vehicle Categories (Codes)
- `CAR` - Ô tô con (Cars)
- `MTR` - Xe máy/Mô tô (Motorcycles)
- `TRK` - Xe tải (Trucks)
- `VAN` - Xe van/Thương mại
- `BIK` - Xe đạp/Xe điện
- `SPE` - Phương tiện đặc biệt

#### Contract Types (Codes)
- `PAWN` - Cầm đồ truyền thống
- `RENTAL` - Cho thuê/Cầm xe
- `SALE` - Mua bán có điều kiện
- `LEASE` - Thuê dài hạn
- `CONSIGN` - Ký gửi bán

#### Contract Status Flow
```
DRAFT → ACTIVE → REDEEMED/LIQUIDATED
   ↓
EXTENDED (can loop)
   ↓
OVERDUE → LIQUIDATING → LIQUIDATED
```

### Security (RLS)

- RELY ON RLS - Do not duplicate security logic in API handlers if RLS covers it
- Staff authentication linked to `auth.users` via `staff.auth_user_id`
- All tables have RLS policies based on `staff.role` and `staff.is_active`

### Key Supabase Functions

```sql
-- Generate QR code
SELECT fn_generate_qr_code('CAR', 'RENTAL', '2026-02-06');

-- Create contract with auto QR
SELECT * FROM fn_create_contract(
    p_customer_id := 'uuid',
    p_vehicle_category_code := 'CAR',
    p_contract_type_code := 'RENTAL',
    p_created_by := 'staff_uuid'
);

-- Get properties for vehicle category
SELECT * FROM fn_get_category_properties('CAR');

-- Get vehicle with all properties
SELECT * FROM fn_get_vehicle_with_properties('vehicle_uuid');
```

## Business Logic Rules

### The "Simplicity" Doctrine (CRITICAL)

1. **NO CHECKLISTS**: If asked for a checklist UI, refuse and implement Photo Upload instead
   - Rule: "One photo > 1000 words"
   - Only require: confirmation checkbox + photo upload

2. **NO KPI/COMMISSIONS**: Do not build dashboards for comparing employees or calculating bonuses
   - No sales tracking per staff
   - No performance rankings
   - No commission calculations

3. **NO COMPLEX STATUS**: Simple status flow only
   - DRAFT → ACTIVE → REDEEMED/LIQUIDATED
   - No intermediate states, no complex workflows

### Inspection Logic

- **Goal**: "Is the asset here?" (Yes/No)
- **Flow**:
  1. Staff scans QR on Asset
  2. App captures GPS automatically
  3. App sends: `{ contract_id, result: 'PRESENT', lat, long }`
  4. No condition grading, no comparison with initial state

### Photo Requirements

- Minimum 1 photo, recommended 4-6
- Storage path: `{contract_qr_code}/{image_type}_{sequence}.jpg`
- Types: RECEIVING, INSPECTION, RETURNING, DAMAGE, DOCUMENT
- No EXIF metadata stored

## Development Workflow

1. **Database First**: Database is the SOURCE OF TRUTH
   - Do not mock data if DB is connected
   - Use Supabase migrations for schema changes

2. **Form Handling**:
   - Use React Hook Form + Zod for validation
   - Dynamic forms rendered from `fn_get_category_properties()`

3. **Image Handling**:
   - Supabase Storage buckets: `contract-images`, `qr-codes`, `customer-documents`
   - Max size: 5MB for photos, 100KB for QR codes

4. **Testing**:
   - Focus on "Happy Path" manual verification first
   - QR scanning flow is critical path

## Key Libraries

- `lucide-react` - Icons
- `date-fns` - Date manipulation (formatting YYYYMMDD)
- `react-hook-form` - Forms
- `zod` - Validation schema
- `html5-qrcode` or `react-qr-reader` - For scanning in browser
- `@supabase/ssr` - Next.js auth helpers
- `qrcode.react` - QR code generation for printing

## Reference Documents

- `bussines_analysic.md` - Full business analysis (Vietnamese)
- `database.md` - Complete SQL schema with seed data
- `init.md` - Initialization instructions

**Conflict Resolution**: If logic contradicts between documents, `bussines_analysic.md` wins.
