import { USER_ROLES } from '@features/auth/model/auth.constants'

const roleLabelMap = {
  [USER_ROLES.superadmin]: 'Super Admin',
  [USER_ROLES.admin]: 'Administrador',
  [USER_ROLES.conserje]: 'Conserje',
  [USER_ROLES.residente]: 'Residente',
}

const roleBadgeMap = {
  [USER_ROLES.superadmin]: 'bg-red-100 text-red-800 border border-red-200',
  [USER_ROLES.admin]: 'bg-blue-100 text-blue-800 border border-blue-200',
  [USER_ROLES.conserje]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [USER_ROLES.residente]: 'bg-stone-100 text-stone-800 border border-stone-200',
}

const toDisplayRole = (role) => roleLabelMap[role] || role
const toBadgeClass = (role) => roleBadgeMap[role] || 'bg-stone-100 text-stone-800 border border-stone-200'

const mapUserToRow = (user) => {
  return {
    id: user.id,
    rut: user.rut || '-',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre',
    email: user.email,
    role: user.role,
    roleLabel: toDisplayRole(user.role),
    isActive: user.is_active,
  }
}

export { mapUserToRow, toBadgeClass, toDisplayRole }
