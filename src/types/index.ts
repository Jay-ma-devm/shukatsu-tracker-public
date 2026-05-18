import type {
  User,
  Company,
  Stage,
  Event,
  CaseLog,
  Contact,
  Attachment,
  EmailTemplate,
  Setting,
  Task,
  EntrySheet,
  EsQuestion,
  InterviewLog,
  Meeting,
  Note,
  CareerEntry,
} from "@prisma/client"

export type {
  User,
  Company,
  Stage,
  Event,
  CaseLog,
  Contact,
  Attachment,
  Task,
  EntrySheet,
  EsQuestion,
  InterviewLog,
  Meeting,
  Note,
  CareerEntry,
  EmailTemplate,
  Setting,
}

// Company with relations
export type CompanyWithRelations = Company & {
  stages: Stage[]
  events: Event[]
  caseLogs: CaseLog[]
  contacts: Contact[]
  attachments: Attachment[]
  _count?: {
    stages: number
    events: number
    caseLogs: number
  }
}

// Stage with company
export type StageWithCompany = Stage & {
  company: Company
}

// Event with company
export type EventWithCompany = Event & {
  company: Company | null
}

// CaseLog with company
export type CaseLogWithCompany = CaseLog & {
  company: Company | null
}

// Status types
export type CompanyStatus =
  | "applied"
  | "screening"
  | "interview"
  | "internship"
  | "case"
  | "final"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn"

export type StageStatus = "pending" | "scheduled" | "passed" | "failed" | "cancelled"

export type EventType =
  | "interview"
  | "case_interview"
  | "deadline"
  | "task"
  | "meeting"
  | "info_session"
  | "coffee_chat"

// API response types
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Filter types
export type CompanyFilters = {
  status?: CompanyStatus | "all"
  priority?: number | "all"
  industry?: string | "all"
  starred?: boolean
  search?: string
  archived?: boolean
}

export type CompanySort = {
  field: "name" | "priority" | "status" | "createdAt" | "updatedAt"
  direction: "asc" | "desc"
}

// Form types
export type CompanyFormData = {
  name: string
  industry?: string
  position?: string
  location?: string
  size?: string
  url?: string
  priority: number
  status: CompanyStatus
  starred: boolean
  notes?: string
  appliedAt?: string
}

export type StageFormData = {
  name: string
  order: number
  status: StageStatus
  scheduledAt?: string
  result?: string
  feedback?: string
  duration?: number
  interviewer?: string
}

export type EventFormData = {
  title: string
  type: EventType
  startAt: string
  endAt?: string
  location?: string
  url?: string
  notes?: string
  reminderAt?: string
  companyId?: string
}

export type CaseLogFormData = {
  title: string
  category?: string
  prompt: string
  premise?: string
  structure?: string
  analysis?: string
  conclusion?: string
  feedback?: string
  rating?: number
  difficulty: number
  duration?: number
  practiceWith?: string
  tags?: string
  companyId?: string
}

export type EmailTemplateFormData = {
  name: string
  category?: string
  subject: string
  body: string
  tags?: string
}

// Auth
export type AuthMode = "local" | "auth"

export type LocalUser = {
  id: "local-user"
  name: string
  email: string
  image: null
}
