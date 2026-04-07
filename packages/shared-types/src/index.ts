export type Plan = 'STARTER' | 'PRO' | 'MAX';
export type UserRole = 'OWNER' | 'MEMBER' | 'VIEWER';
export type AgentDepartment = 'SALES' | 'MARKETING' | 'ACCOUNTING' | 'GENERAL';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskType = 'PII_DETECTED' | 'HARMFUL_CONTENT' | 'ANOMALY' | 'COST_ANOMALY';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  orgId: string;
  title: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  department: AgentDepartment | null;
  createdAt: string;
}

export interface Task {
  id: string;
  orgId: string;
  title: string;
  status: TaskStatus;
  department: AgentDepartment;
  input: string;
  output: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  createdAt: string;
}

export interface AILog {
  id: string;
  orgId: string;
  department: AgentDepartment;
  provider: string;
  model: string;
  inputText: string;
  outputText: string | null;
  tokens: number | null;
  latencyMs: number | null;
  riskScore: number | null;
  createdAt: string;
}

export interface RiskEvent {
  id: string;
  orgId: string;
  aiLogId: string | null;
  type: RiskType;
  description: string;
  severity: RiskSeverity;
  resolved: boolean;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  orgId: string;
  uploadedBy: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  sub: string;
  orgId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
