import { loginRequest, logoutRequest, refreshTokenRequest, registerRequest } from '../api/auth.api'

let activeRefreshRequest = null

const refreshToken = () => {
  if (!activeRefreshRequest) {
    activeRefreshRequest = refreshTokenRequest().finally(() => {
      activeRefreshRequest = null
    })
  }

  return activeRefreshRequest
}

const authService = {
  register: registerRequest,
  login: loginRequest,
  refreshToken,
  logout: logoutRequest,
}

export default authService
