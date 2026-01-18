import apiClient from "./client"
import type { ApprovalRule, PricingRule, SystemPermission, SystemRole } from "@/app/types"

export const adminApi = {
  getApprovalRules: async (): Promise<ApprovalRule[]> => {
    const response = await apiClient.get("/admin/approval-config/rules")
    return Array.isArray(response.data) ? response.data : response.data?.data ?? []
  },

  createApprovalRule: async (payload: ApprovalRule): Promise<ApprovalRule> => {
    const response = await apiClient.post("/admin/approval-config/rules", payload)
    return response.data?.data ?? response.data
  },

  deactivateApprovalRule: async (ruleName: string): Promise<void> => {
    await apiClient.delete(`/admin/approval-config/rules/${encodeURIComponent(ruleName)}`)
  },

  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get("/admin/pricing-rules")
    return Array.isArray(response.data) ? response.data : response.data?.data ?? []
  },

  createPricingRule: async (payload: Omit<PricingRule, "id">): Promise<PricingRule> => {
    const response = await apiClient.post("/admin/pricing-rules", payload)
    return response.data?.data ?? response.data
  },

  disablePricingRule: async (ruleId: string): Promise<void> => {
    await apiClient.post(`/admin/pricing-rules/${ruleId}/disable`)
  },

  getPermissions: async (): Promise<SystemPermission[]> => {
    const response = await apiClient.get("/admin/system/permissions")
    return Array.isArray(response.data) ? response.data : response.data?.data ?? []
  },

  getRoles: async (): Promise<SystemRole[]> => {
    const response = await apiClient.get("/admin/system/roles")
    return Array.isArray(response.data) ? response.data : response.data?.data ?? []
  },

  createRole: async (payload: Omit<SystemRole, "id">): Promise<SystemRole> => {
    const response = await apiClient.post("/admin/system/roles", payload)
    return response.data?.data ?? response.data
  },

  updateRole: async (roleId: string, payload: Omit<SystemRole, "id">): Promise<SystemRole> => {
    const response = await apiClient.put(`/admin/system/roles/${roleId}`, payload)
    return response.data?.data ?? response.data
  },
}
