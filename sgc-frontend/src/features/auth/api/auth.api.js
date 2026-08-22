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
  return apiPost(AUTH_ENDPOINTS.login, { email, password })
}

const refreshTokenRequest = async (refresh) => {
  return apiPost(AUTH_ENDPOINTS.refresh, { refresh })
}

export { loginRequest, refreshTokenRequest, registerRequest }
