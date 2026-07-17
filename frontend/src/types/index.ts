export type UserRole = 'super_admin' | 'company_admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
}

export interface Company {
  id: string;
  name: string;
  dealer_code: string;
  logo_url?: string;
  contact_info?: Record<string, string>;
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  company: Company | null;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  notification_email?: string;
}

export interface Technician {
  id: string;
  company_id: string;
  department_id?: string;
  name: string;
  active: boolean;
  department_name?: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  vin: string;
  stock_number?: string;
  make?: string;
  model?: string;
  trim?: string;
  color?: string;
  mileage?: number;
  status?: string;
  imported_at: string;
}

export interface Issue {
  id: string;
  company_id: string;
  inventory_id: string;
  department_id?: string;
  description: string;
  status: 'open' | 'closed';
  created_by: string;
  closed_by_technician_id?: string;
  opened_at: string;
  closed_at?: string;
  // Joined fields
  vin?: string;
  stock_number?: string;
  make?: string;
  model?: string;
  trim?: string;
  department_name?: string;
  closed_by_tech_name?: string;
}
