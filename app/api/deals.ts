import apiClient from "./client"
import type { Deal } from "@/app/types"

export interface DealResponse {
  success: boolean
  data: {
    deal: Deal
    submitted: boolean | null
  }
}

export const dealsApi = {
  getByInvoice: async (invoiceId: string): Promise<DealResponse> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/deal`)
    return response.data
  },

  updateByInvoice: async (
    invoiceId: string,
    payload: { discountRate?: number; transactionFee?: number; sourceSystem?: string },
  ): Promise<DealResponse> => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/deal`, payload)
    return response.data
  },

  submitByInvoice: async (invoiceId: string): Promise<DealResponse> => {
    const response = await apiClient.post(`/invoices/${invoiceId}/deal/submit`)
    return response.data
  },
}
