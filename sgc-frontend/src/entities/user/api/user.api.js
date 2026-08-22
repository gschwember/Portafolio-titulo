import { apiDelete, apiGet, apiPatch, apiPost } from '@shared/api/client'
import { USER_ENDPOINTS } from '@features/auth/model/auth.constants'

const listUsersRequest = async (accessToken) => {
  return apiGet(USER_ENDPOINTS.base, { accessToken })
}

const createUserRequest = async (payload, accessToken) => {
  return apiPost(USER_ENDPOINTS.base, payload, { accessToken })
}

const updateUserRequest = async (userId, payload, accessToken) => {
  return apiPatch(`${USER_ENDPOINTS.base}${userId}`, payload, { accessToken })
}

const deleteUserRequest = async (userId, accessToken) => {
  return apiDelete(`${USER_ENDPOINTS.base}${userId}`, { accessToken })
}

export { createUserRequest, deleteUserRequest, listUsersRequest, updateUserRequest }
