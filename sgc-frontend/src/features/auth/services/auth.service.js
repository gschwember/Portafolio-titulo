import { loginRequest, refreshTokenRequest, registerRequest } from '../api/auth.api'

const authService = {
  register: registerRequest,
  login: loginRequest,
  refreshToken: refreshTokenRequest,
}

export default authService
