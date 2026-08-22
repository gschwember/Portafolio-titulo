import {
  createUserRequest,
  deleteUserRequest,
  listUsersRequest,
  updateUserRequest,
} from '@entities/user/api/user.api'
import { mapUserToRow } from '@entities/user/model/user.mapper'

const listUsers = async (accessToken) => {
  const users = await listUsersRequest(accessToken)
  return users.map(mapUserToRow)
}

const createUser = async (payload, accessToken) => {
  const user = await createUserRequest(payload, accessToken)
  return mapUserToRow(user)
}

const updateUser = async (userId, payload, accessToken) => {
  const user = await updateUserRequest(userId, payload, accessToken)
  return mapUserToRow(user)
}

const deleteUser = async (userId, accessToken) => {
  await deleteUserRequest(userId, accessToken)
}

export { createUser, deleteUser, listUsers, updateUser }
