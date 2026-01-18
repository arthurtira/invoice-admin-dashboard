import apiClient from "./client"

export const workflowsApi = {
  getById: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/workflows/${id}`)
    return response.data
  },
}
