# Lot Walker - Phase 1: Infrastructure & Database Foundation

Phase 1 of the Lot Walker platform has been successfully completed. This phase focused on establishing a robust, multi-tenant foundation for the application's infrastructure and data storage.

## Deliverables

### 1. Docker Infrastructure
A `docker-compose.yml` file has been created to orchestrate the core services:
- **PostgreSQL 16**: The primary relational database for structured data.
- **Redis 7**: Used for caching and session management.
- **Ollama**: Local AI service for voice-to-action processing.

### 2. Multi-Tenant Database Schema
The database schema has been implemented with strict **Row-Level Security (RLS)** policies to ensure data isolation between different dealerships.

| Table | Description |
| :--- | :--- |
| `companies` | Stores dealership profiles and unique dealer codes. |
| `users` | Manages authenticated users with role-based access control (RBAC). |
| `departments` | Defines dealership departments (e.g., Service, Body Shop). |
| `technicians` | Tracks individual technicians assigned to departments. |
| `inventory` | Stores vehicle data, including VINs and stock numbers. |
| `issues` | Records identified vehicle issues and their resolution status. |

### 3. AI Service Configuration
An automated entrypoint script for Ollama ensures that the **Llama 3.1 (8B Instruct)** model is automatically pulled and available on the first boot of the infrastructure.

## Technical Highlights
- **Security**: All tenant-specific tables have RLS policies enforcing isolation based on `app.current_company_id`.
- **Integrity**: Foreign key constraints with appropriate cascading rules ensure data consistency.
- **Automation**: The infrastructure is designed to be "single-command" deployable via Docker Compose.

## Repository
All files have been pushed to the private GitHub repository: [https://github.com/davmoha/lot-walker](https://github.com/davmoha/lot-walker)
