export type TaskType = 'email' | 'coding' | 'research' | 'document' | 'schedule' | 'analytics' | 'sns';
export type TaskStatus = 'pending' | 'ready' | 'in_progress' | 'done' | 'blocked';
export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface EmailResult {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

// 実際に動作するコードファイルを格納する
export interface CodingResult {
  description: string;
  files: Array<{
    filename: string;
    language: string;
    content: string;
  }>;
  setupInstructions: string;
  risks: string[];
}

// AIの知識で執筆したリサーチレポート本文
export interface ResearchResult {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  conclusion: string;
  risks: string[];
}

// 完成した文書（マークダウン形式）
export interface DocumentResult {
  title: string;
  content: string;
  summary: string;
  risks: string[];
}

// 具体的な日付・タスク入りスケジュール表
export interface ScheduleResult {
  title: string;
  items: Array<{
    date: string;
    task: string;
    assignee?: string;
    milestone?: boolean;
  }>;
  notes: string;
  risks: string[];
}

// データ分析結果（グラフ表示用）
export interface AnalyticsResult {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  summary: string;
  risks: string[];
}

// SNS投稿結果
export interface SNSResult {
  platform: 'twitter' | 'instagram' | 'linkedin';
  content: string;
  hashtags: string[];
  scheduledAt?: string;
  imageUrl?: string;
}

export interface ExecutionResult {
  type: TaskType;
  email?: EmailResult;
  coding?: CodingResult;
  research?: ResearchResult;
  document?: DocumentResult;
  schedule?: ScheduleResult;
  analytics?: AnalyticsResult;
  sns?: SNSResult;
  generatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  rawInput: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  deadline?: string;
  projectId?: string;
  subTasks: SubTask[];
  createdAt: string;
  executionResult?: ExecutionResult;
}

export interface TaskRecord {
  taskId: string;
  title: string;
  completedAt: string;
}

export interface Decision {
  id: string;
  description: string;
  decidedAt: string;
}

export interface CodeRecord {
  id: string;
  description: string;
  snippet: string;
  language: string;
  createdAt: string;
}

export interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  summary: string;
  sentAt: string;
}

export interface ProjectMemory {
  projectId: string;
  projectName: string;
  description: string;
  currentProgress: number;
  completedTasks: TaskRecord[];
  currentPhase: string;
  nextRecommendedStep: string;
  keyDecisions: Decision[];
  codeSnippets: CodeRecord[];
  emailHistory: EmailRecord[];
  lastUpdated: string;
}

export type AgentRole = 'orchestrator' | 'manager' | 'executor' | 'risk';
export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentStep {
  role: AgentRole;
  label: string;
  status: AgentStepStatus;
}
