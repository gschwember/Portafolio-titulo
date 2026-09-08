import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom' // <-- AÑADIDO
import useAuth from '@features/auth/hooks/useAuth'
import { PASSWORD_MIN_LENGTH } from '@features/auth/model/auth.constants'
import { toBadgeClass } from '@entities/user/model/user.mapper'
import { createUser, deleteUser, listUsers, updateUser } from '../services/userManagement.service'
import { roleOptions } from '../data/superAdminDashboardData'

const emptyForm = {
  id: null,
  rut: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'residente',
  password: '',
  passwordConfirmation: '',
  isActive: true,
}

const UserManagementSection = () => {
  const { accessToken } = useAuth()
  const location = useLocation() // <-- AÑADIDO para interceptar el state

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // --- ESTADOS DE ERRORES ---
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  // --- ESTADOS PARA LOS OJITOS DE CONTRASEÑA ---
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  // --- ESTADOS DE BÚSQUEDA ---
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')

  const submitLabel = useMemo(() => {
    if (isSaving) {
      return modalMode === 'create' ? 'Creando...' : 'Guardando...'
    }
    return modalMode === 'create' ? 'Crear usuario' : 'Guardar cambios'
  }, [isSaving, modalMode])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const rows = await listUsers(accessToken)
      setUsers(rows)
    } catch (loadError) {
      setError(loadError.message || 'No fue posible cargar usuarios.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  // --- AÑADIDO: Envuelto en useCallback para poder usarlo en el useEffect sin warnings ---
  const openCreateModal = useCallback(() => {
    setModalMode('create')
    setFormData(emptyForm)
    setError('')
    setFieldErrors({})
    setShowPassword(false)
    setShowPasswordConfirmation(false)
    setIsModalOpen(true)
  }, [])

  useEffect(() => {
    if (accessToken) {
      loadUsers()
    }
  }, [accessToken, loadUsers])

  // --- AÑADIDO: EFECTO QUE ESCUCHA EL MENSAJE DEL PERFIL ---
  useEffect(() => {
    if (location.state?.openCreateModal) {
      openCreateModal()
      
      // Limpiamos el state para que el modal no vuelva a aparecer solo si se hace refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, openCreateModal])

  const openEditModal = (user) => {
    setModalMode('edit')
    setFormData({
      id: user.id,
      rut: user.rut === '-' ? '' : user.rut,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: '',
      passwordConfirmation: '',
      isActive: user.isActive,
    })
    setError('')
    setFieldErrors({})
    setShowPassword(false)
    setShowPasswordConfirmation(false)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData(emptyForm)
    setError('')
    setFieldErrors({})
  }

  const handleDeleteUser = async (id) => {
    const confirmation = window.confirm('¿Seguro que deseas eliminar este usuario?')
    if (!confirmation) {
      return
    }

    try {
      await deleteUser(id, accessToken)
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError.message || 'No fue posible eliminar el usuario.')
    }
  }

  const buildPayload = () => {
    const payload = {
      rut: formData.rut || null,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      role: formData.role,
      is_active: formData.isActive,
    }

    if (modalMode === 'create' || formData.password) {
      payload.password = formData.password
      payload.password_confirmation = formData.passwordConfirmation
    }

    return payload
  }

  const handleSaveUser = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (modalMode === 'create' || formData.password || formData.passwordConfirmation) {
      if (formData.password !== formData.passwordConfirmation) {
        setFieldErrors({ password_confirmation: ['Las contraseñas no coinciden.'] })
        return
      }
    }

    setIsSaving(true)

    try {
      const payload = buildPayload()
      if (modalMode === 'create') {
        await createUser(payload, accessToken)
      } else {
        await updateUser(formData.id, payload, accessToken)
      }
      closeModal()
      await loadUsers()
    } catch (saveError) {
      if (saveError.fieldErrors) {
        setFieldErrors(saveError.fieldErrors)
      } else {
        setError(saveError.message || 'Error al guardar. Verifica los datos e intenta nuevamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchRole = roleFilter === 'Todos' || user.role === roleFilter

      return matchSearch && matchRole
    })
  }, [users, searchTerm, roleFilter])

  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-3 py-2 border rounded-lg outline-none transition-all "
    return fieldErrors[fieldName] 
      ? baseClass + "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
      : baseClass + "border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
      <div className="px-6 py-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Directorio de usuarios</h3>
          <p className="text-sm text-stone-500">Gestiona accesos y roles del sistema.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="px-6 py-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm bg-white text-stone-700"
          >
            <option value="Todos">Todos los roles</option>
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!isModalOpen && error && (
        <div className="p-4 pb-0">
          <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-100/50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
              <th className="px-6 py-4 font-semibold">RUT</th>
              <th className="px-6 py-4 font-semibold">Nombre</th>
              <th className="px-6 py-4 font-semibold">Correo</th>
              <th className="px-6 py-4 font-semibold">Rol</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-stone-500">Cargando usuarios...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-stone-500 font-medium">
                    {users.length === 0 ? 'No hay usuarios registrados.' : 'No se encontraron usuarios que coincidan con la búsqueda.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-stone-700">{user.rut}</td>
                  <td className="px-6 py-4 text-sm text-stone-900">{user.fullName}</td>
                  <td className="px-6 py-4 text-sm text-stone-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${toBadgeClass(user.role)}`}>
                      {user.roleLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-3">
                    <button onClick={() => openEditModal(user)} className="font-semibold text-amber-600 hover:text-amber-800">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="font-semibold text-red-600 hover:text-red-800">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 shrink-0">
              <h3 className="text-lg font-bold text-stone-800">{modalMode === 'create' ? 'Crear usuario' : 'Editar usuario'}</h3>
            </div>

            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSaveUser} className="space-y-4">
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium mb-4">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">RUT</label>
                    <input type="text" name="rut" value={formData.rut} onChange={handleChange} className={getInputClass('rut')} placeholder="12.345.678-9" />
                    {fieldErrors.rut && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.rut[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Rol</label>
                    <select name="role" value={formData.role} onChange={handleChange} className={getInputClass('role')}>
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.role && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.role[0]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Nombre</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={getInputClass('first_name')} />
                    {fieldErrors.first_name && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.first_name[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Apellido</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={getInputClass('last_name')} />
                    {fieldErrors.last_name && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.last_name[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Correo electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={getInputClass('email')} />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.email[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required={modalMode === 'create'} 
                        minLength={PASSWORD_MIN_LENGTH}
                        autoComplete="new-password"
                        className={`${getInputClass('password')} pr-10`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword((previous) => !previous)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.password[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Confirmar contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPasswordConfirmation ? "text" : "password"} 
                        name="passwordConfirmation" 
                        value={formData.passwordConfirmation} 
                        onChange={handleChange} 
                        required={modalMode === 'create'} 
                        minLength={PASSWORD_MIN_LENGTH}
                        autoComplete="new-password"
                        className={`${getInputClass('password_confirmation')} pr-10`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPasswordConfirmation((previous) => !previous)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
                        aria-label={showPasswordConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPasswordConfirmation ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password_confirmation && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.password_confirmation[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-stone-700 pt-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" />
                    Usuario activo
                  </label>
                  {fieldErrors.is_active && <p className="text-xs text-red-500 mt-1.5 font-semibold">{fieldErrors.is_active[0]}</p>}
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-stone-100 mt-6">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg disabled:opacity-60 transition-colors shadow-sm">
                    {submitLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementSection
