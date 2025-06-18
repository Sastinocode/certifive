# replit.md

## Overview

This is a full-stack energy certification management platform built for Spanish energy auditors and certification professionals. The application provides a complete workflow from WhatsApp client contact to final certificate delivery, with automated quoting, payment processing, and report generation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with custom configuration for monorepo structure

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Dual system - Replit Auth for development + JWT for production
- **File Handling**: Multer for image uploads with validation
- **API Design**: RESTful endpoints with consistent error handling

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Session Storage**: PostgreSQL table for Replit Auth compatibility
- **Schema Management**: Drizzle migrations with versioned schema files
- **Key Entities**: Users, Certifications, Folders, Pricing Rates, Quote Requests, WhatsApp integrations, Invoices, Payments

## Key Components

### 1. Authentication System
- **Replit Auth**: Primary authentication for development environment
- **JWT Auth**: Local authentication system for production
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **User Roles**: Basic role-based access (user, admin, demo)

### 2. Certification Management
- **Wizard-based Form**: Multi-step certification creation process
- **Document Storage**: File upload system for property photos
- **Energy Ratings**: Spanish energy efficiency classification (A-G)
- **Folder Organization**: Hierarchical organization system

### 3. Quote System
- **Dynamic Pricing**: Configurable rates by property type and location
- **Public Quote Links**: Shareable links for client quote requests
- **Stripe Integration**: Payment processing for quote acceptance
- **WhatsApp Integration**: Automated quote delivery via WhatsApp Business API

### 4. Report Generation
- **Multi-format Export**: PDF, Excel, Word document generation
- **Template System**: Customizable report templates
- **Automated Calculations**: Energy consumption and CO2 emissions
- **Official Compliance**: Spanish certification standards compliance

### 5. WhatsApp Business Integration
- **Flow Editor**: Visual WhatsApp conversation flow builder
- **Automated Responses**: Template-based message automation
- **Client Management**: Conversation tracking and state management
- **Payment Links**: Direct payment integration in WhatsApp flows

## Data Flow

### Certification Workflow
1. **Initial Contact**: Client contacts via WhatsApp or direct form
2. **Quote Generation**: System generates personalized quote based on property details
3. **Payment Processing**: Client pays advance through Stripe integration
4. **Data Collection**: Certification wizard collects property information
5. **Report Generation**: System generates official certification documents
6. **Delivery**: Final certificates delivered via email/WhatsApp

### WhatsApp Automation Flow
1. **Message Reception**: WhatsApp webhook receives client message
2. **State Management**: System tracks conversation state and context
3. **Automated Response**: Pre-configured responses based on conversation flow
4. **Quote Integration**: Automatic quote link generation and delivery
5. **Payment Tracking**: Real-time payment status updates

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless
- **Payment Processing**: Stripe API for payment handling
- **Email Service**: SendGrid for transactional emails
- **WhatsApp**: WhatsApp Business API for messaging automation
- **File Storage**: Local file system with upload validation

### Development Dependencies
- **Replit Integration**: Cartographer for development environment
- **Build Tools**: ESBuild for server bundling, Vite for client bundling
- **Type Checking**: TypeScript with strict configuration
- **Database Tools**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Port 5000 mapped to external port 80
- **Auto-scaling**: Configured for Replit's autoscale deployment

### Production Build
- **Client Build**: Static assets generated via Vite
- **Server Build**: Single JavaScript bundle via ESBuild
- **Environment**: Production mode with NODE_ENV=production
- **Process Management**: Single-process deployment suitable for serverless

### Configuration Management
- **Environment Variables**: Database URL, JWT secrets, API keys
- **Session Storage**: PostgreSQL-backed sessions for horizontal scaling
- **File Uploads**: Configurable upload directory with size limits
- **CORS**: Configured for cross-origin requests in development

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 18, 2025. Initial setup
- June 18, 2025. Certificate upload system fully integrated with folder management - certificates now properly link to existing property folders with preselection, visual folder indicators, and proper validation
- June 18, 2025. Reorganized system workflow: Properties section now serves as "Final Certificate Archive" for storing completed certificates with upload functionality, while Certificates section handles "Client Form Information Reception" for processing new requests
- June 18, 2025. Created sample certification data for system preview: Added 3 complete certificate examples with different states (completed/pending/draft) and full form data including energy ratings, contact details, and property specifications
- June 18, 2025. Fixed certification display system: Resolved authentication and data mapping issues to properly show sample certification data in the "Solicitudes de Certificación" section with correct filtering and search functionality