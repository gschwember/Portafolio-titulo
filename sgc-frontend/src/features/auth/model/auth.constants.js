export const USER_ROLES = {
  superadmin: 'superadmin',
  admin: 'admin',
  conserje: 'conserje',
  residente: 'residente',
}

export const AUTH_ENDPOINTS = {
  register: '/v1/auth/register',
  login: '/v1/auth/login',
  refresh: '/v1/auth/token/refresh',
  logout: '/v1/auth/logout',
}

export const USER_ENDPOINTS = {
  base: '/v1/users/',
}

export const AUTH_STORAGE_KEY = 'sgc.auth'
export const AUTH_STORAGE_VERSION = 2
export const PASSWORD_MIN_LENGTH = 12
