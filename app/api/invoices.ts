import apiClient from "./client"
import type { ApiResponse, Deal, Invoice, InvoiceCreateRequest, InvoiceCreateResponse, InvoiceEvent } from "@/app/types"

export interface DealResponse {
  success: boolean
  message?: string
  data: {
    deal: Deal
    submitted: boolean | null
    workflowCreated?: boolean | null
    approvalTasks?: {
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
    }[]
  }
}

export const invoicesApi = {
  getAll: async (): Promise<ApiResponse<Invoice[]>> => {
    const response = await apiClient.get("/invoices")
    return response.data
  },

  getById: async (id: string): Promise<InvoiceCreateResponse> => {
    const response = await apiClient.get(`/invoices/${id}`)
    return response.data
  },

  create: async (payload: InvoiceCreateRequest): Promise<InvoiceCreateResponse> => {
    const response = await apiClient.post("/invoices", payload)
    return response.data
  },

  getDeal: async (invoiceId: string): Promise<DealResponse> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/deal`)
    return response.data
  },

  updateDeal: async (
    invoiceId: string,
    payload: { discountRate?: number; transactionFee?: number; sourceSystem?: string },
  ): Promise<DealResponse> => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/deal`, payload)
    return response.data
  },

  submitDeal: async (invoiceId: string): Promise<DealResponse> => {
    const response = await apiClient.post(`/invoices/${invoiceId}/deal/submit`)
    return response.data
  },

  getEvents: async (invoiceId: string): Promise<ApiResponse<InvoiceEvent[]>> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/events`)
    return response.data
  },
}
