-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    dealer_code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'company_admin',
    'employee'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    notification_email VARCHAR(255),
    UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vin VARCHAR(17) UNIQUE NOT NULL,
    stock_number VARCHAR(50),
    make VARCHAR(255),
    model VARCHAR(255),
    trim VARCHAR(255),
    color VARCHAR(255),
    mileage INTEGER,
    status VARCHAR(50),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE issue_status AS ENUM (
    'open',
    'closed'
);

CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status issue_status DEFAULT 'open',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    closed_by_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Set session variable for current company ID
ALTER DATABASE lotwalker SET app.current_company_id TO '';

-- RLS Policies

-- Companies table policies
CREATE POLICY company_isolation_on_companies ON companies
    USING (id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (id = current_setting('app.current_company_id')::uuid);

-- Users table policies
CREATE POLICY company_isolation_on_users ON users
    USING (company_id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (company_id = current_setting('app.current_company_id')::uuid);

-- Departments table policies
CREATE POLICY company_isolation_on_departments ON departments
    USING (company_id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (company_id = current_setting('app.current_company_id')::uuid);

-- Technicians table policies
CREATE POLICY company_isolation_on_technicians ON technicians
    USING (company_id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (company_id = current_setting('app.current_company_id')::uuid);

-- Inventory table policies
CREATE POLICY company_isolation_on_inventory ON inventory
    USING (company_id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (company_id = current_setting('app.current_company_id')::uuid);

-- Issues table policies
CREATE POLICY company_isolation_on_issues ON issues
    USING (company_id = current_setting('app.current_company_id')::uuid)
    WITH CHECK (company_id = current_setting('app.current_company_id')::uuid);

-- Grant permissions to lotwalker_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lotwalker_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lotwalker_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO lotwalker_admin;

-- Grant usage on schemas and types
GRANT USAGE ON SCHEMA public TO lotwalker_admin;
GRANT USAGE ON TYPE user_role TO lotwalker_admin;
GRANT USAGE ON TYPE issue_status TO lotwalker_admin;
