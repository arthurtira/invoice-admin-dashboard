"use client"

import axios from "axios"
import { getConfiguredApiBase } from "./client"

export interface AuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user_info: {
    sub: string
    name: string
    roles: string[]
  }
  usage: string
}

export type UserType = "admin" | "junior" | "senior" | "executive"

export async function requestDevToken(userType: UserType) {
  const { apiBase } = getConfiguredApiBase()
  const response = await axios.get<AuthTokenResponse>(`${apiBase}/auth/token/${userType}`)
  return response.data
}
