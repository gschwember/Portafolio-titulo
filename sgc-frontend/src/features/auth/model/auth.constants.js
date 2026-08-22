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
}

export const USER_ENDPOINTS = {
  base: '/v1/users/',
}

export const AUTH_STORAGE_KEY = 'sgc.auth'
