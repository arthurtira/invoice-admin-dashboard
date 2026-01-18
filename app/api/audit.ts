import apiClient from "./client"

export const auditApi = {
  getAll: async (entityType?: string, entityId?: string, page = 1, pageSize = 10): Promise<unknown> => {
    const response = await apiClient.get("/audit", {
      params: { entityType, entityId, page, pageSize },
    })
    return response.data
  },
}
