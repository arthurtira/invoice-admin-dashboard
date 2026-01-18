import apiClient from "./client"
import type { ApprovalTask, WorkflowSummary } from "@/app/types"

export const tasksApi = {
  getAll: async (status?: string): Promise<ApprovalTask[]> => {
    const response = await apiClient.get("/approval-tasks", {
      params: { status },
    })
    return Array.isArray(response.data) ? response.data : response.data?.data ?? []
  },

  performAction: async (
    id: string,
    action: "APPROVE" | "REJECT",
    reason: string,
  ): Promise<WorkflowSummary> => {
    const response = await apiClient.post(`/approval-tasks/${id}/actions`, {
      action,
      reason,
    })
    return response.data
  },
}
