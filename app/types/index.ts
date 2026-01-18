// Invoice types
export interface PartyContact {
  contactName: string
  email: string
  phone: string
}

export interface PartyDetails {
  name: string
  reference: string
  address: string
  contact: PartyContact
}

export interface DiscountRateOverrides {
  proposalRef?: string | null
  discountRate: number
  transactionFee: number
  sourceSystem: string
}

export interface Deal {
  id: string
  invoiceId: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  discountRate: number
  discountFee: number
  cashPrice: number
  transactionFee: number
  proposalRef: string | null
  sourceSystem: string | null
  fundingReference: string | null
  settlementReference: string | null
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  submittedBy?: string | null
  submittedAt?: string | null
  updatedAt: string
}

export interface Invoice {
  id: string
  externalInvoiceId: string
  invoiceNumber: string
  debtorRef: string
  sellerRef: string
  invoiceAmount: number
  currency: string
  issueDate: string
  dueDate: string
  tenorDays: number
  documentRef: string
  status: "DEAL_CREATED" | "REQUIRES_DEAL_INFO" | "DRAFT"
  deal?: Deal | null
  issuerDetails: PartyDetails
  debtorDetails: PartyDetails
  createdAt: string
  updatedAt: string
}

export interface InvoiceEvent {
  eventId: string
  eventType: string
  externalInvoiceId: string
  invoiceId: string
  fromStatus: string | null
  toStatus: string | null
  actorType: string
  actorId: string
  reason: string | null
  payloadJson: string | null
  createdAt: string
}

export interface InvoiceCreateRequest {
  externalInvoiceRef?: string
  invoiceNumber: string
  debtorRef: string
  sellerRef: string
  invoiceAmount: number
  currency: string
  issueDate: string
  dueDate: string
  tenorDays: number
  documentRef: string
  issuerDetails: PartyDetails
  debtorDetails: PartyDetails
  discountRateOverrides?: DiscountRateOverrides | null
}

export interface InvoiceCreateResponse {
  success: boolean
  data: {
    invoice: Invoice
    dealCreated: boolean
    missingFields: string[]
  }
}

// Tasks
export interface ApprovalTask {
  taskId: string
  workflowId: string
  dealId: string
  invoiceId: string
  amount: number
  currency: string
  status: "PENDING_ACTIONABLE" | "PENDING_BLOCKED" | "APPROVED" | "REJECTED"
  levelNumber: number
  candidateRoles: string[]
  createdAt: string
  actionedAt: string | null
  actionedBy: string | null
  reason: string | null
}

export interface WorkflowSummary {
  pendingTasks: ApprovalTask[]
  completedTasks: ApprovalTask[]
}

// Admin types
export interface ApprovalRuleCriteria {
  dimension: string
  operator: string
  value: string
  value2?: string
}

export interface ApprovalRuleLevel {
  level: number
  roles: string[]
  requiredApprovals: number
  description: string
}

export interface ApprovalRule {
  id?: string
  ruleName: string
  priority: number
  active: boolean
  criteria: ApprovalRuleCriteria[]
  levels: ApprovalRuleLevel[]
  createdAt?: string
  updatedAt?: string
}

export interface PricingRuleDimensions {
  currency: string
  minAmount: number
  maxAmount: number
  minTenorDays: number
  maxTenorDays: number
}

export interface PricingRuleRates {
  defaultRateBps: number
  minRateBps: number
  maxRateBps: number
}

export interface PricingRuleFees {
  feeType: "BPS" | "FLAT"
  feeRateBps: number
  feeFlatAmount: number
}

export interface PricingRule {
  id: string
  name: string
  enabled: boolean
  priority: number
  dimensions: PricingRuleDimensions
  rates: PricingRuleRates
  fees: PricingRuleFees
  effectiveFrom?: string | null
  effectiveTo?: string | null
  notes?: string | null
}

export interface SystemPermission {
  id: string
  name: string
  description?: string | null
}

export interface SystemRole {
  id: string
  bankRole: string
  name: string
  description: string
  permissions: string[]
}

// Auth types
export interface DecodedToken {
  sub: string
  roles: string[]
  exp: number
  iat: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
