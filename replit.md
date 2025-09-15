# Overview

This is a full-stack SMS webhook application built with React frontend and Express backend. The application receives SMS messages via Twilio webhooks and displays them in a real-time dashboard. It features a clean, modern UI built with shadcn/ui components and provides functionality to view incoming messages, clear message history, and copy phone numbers for easy access.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Development Setup**: Hot reload with Vite integration for development
- **API Design**: RESTful endpoints for message management
- **Storage**: Dual storage strategy with in-memory fallback and database persistence

## Database Schema
- **Users Table**: Basic user authentication structure with username/password
- **Messages Table**: SMS message storage with Twilio integration fields
  - Stores sender, recipient, message body, timestamp, and Twilio SID
  - Prevents duplicate message processing via unique Twilio SID constraint

## External Integrations
- **Twilio Webhooks**: Receives incoming SMS messages via POST endpoint
- **Neon Database**: PostgreSQL database hosting (based on @neondatabase/serverless dependency)
- **Duplicate Prevention**: Uses Twilio message SID to prevent processing duplicate webhooks

## Key Design Patterns
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: End-to-end TypeScript with shared type definitions
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Responsive Design**: Mobile-first approach with responsive UI components
- **Real-time Updates**: Polling-based message refresh with manual and auto-refresh options

# External Dependencies

- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **SMS Service**: Twilio for SMS webhook processing
- **UI Framework**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling
- **Validation**: Zod for runtime type validation and schema parsing
- **State Management**: TanStack Query for server state synchronization
- **Development Tools**: Vite for fast development and building, tsx for TypeScript execution