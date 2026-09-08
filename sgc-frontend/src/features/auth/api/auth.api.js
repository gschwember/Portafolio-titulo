import { apiPost } from '@shared/api/client'
import { AUTH_ENDPOINTS } from '../model/auth.constants'

const registerRequest = async ({ email, rut, password, passwordConfirmation, firstName, lastName }) => {
  return apiPost(AUTH_ENDPOINTS.register, {
    email,
    rut,
    password,
    password_confirmation: passwordConfirmation,
    first_name: firstName,
    last_name: lastName,
  })
}

const loginRequest = async ({ email, password }) => {
  return apiPost(AUTH_ENDPOINTS.login, { email, password }, { credentials: 'include' })
}

const refreshTokenRequest = async () => {
  return apiPost(AUTH_ENDPOINTS.refresh, {}, { credentials: 'include' })
}

const logoutRequest = async () => {
  return apiPost(AUTH_ENDPOINTS.logout, {}, { credentials: 'include' })
}

export { loginRequest, logoutRequest, refreshTokenRequest, registerRequest }
