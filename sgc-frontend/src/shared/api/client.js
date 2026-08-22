import { API_CONFIG } from '../config/api'

const createUrl = (path) => `${API_CONFIG.baseUrl}${path}`

const extractFirstErrorMessage = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return extractFirstErrorMessage(value[0])
  if (typeof value === 'object') {
    const first = Object.values(value)[0]
    return extractFirstErrorMessage(first)
  }
  return ''
}

const parseApiError = async (response) => {
  const fallbackMessage = `Error API (${response.status})`
  let rawData = {}

  try {
    const data = await response.json()
    rawData = data

    if (typeof data === 'string') {
      return { message: data, rawData }
    }

    const knownMessage =
      extractFirstErrorMessage(data?.detail) ||
      extractFirstErrorMessage(data?.non_field_errors) ||
      extractFirstErrorMessage(data?.message)

    if (knownMessage) {
      return { message: knownMessage, rawData }
    }

    const firstEntry = Object.entries(data || {})[0]
    if (!firstEntry) {
      return { message: fallbackMessage, rawData }
    }

    const [, firstValue] = firstEntry
    const extractedMessage = extractFirstErrorMessage(firstValue)

    return {
      message: extractedMessage || fallbackMessage,
      rawData,
    }
  } catch {
    return { message: fallbackMessage, rawData }
  }
}

const request = async (path, options = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)
  const isFormDataBody = options.body instanceof FormData

  try {
    const response = await fetch(createUrl(path), {
      method: options.method ?? 'GET',
      headers: {
        ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? (isFormDataBody ? options.body : JSON.stringify(options.body)) : undefined,
      signal: controller.signal,
    })

    if (!response.ok) {
      const { message, rawData } = await parseApiError(response)
      const error = new Error(message)
      error.fieldErrors = rawData
      throw error
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud tardo demasiado. Intenta nuevamente.')
    }

    if (error instanceof TypeError) {
      throw new Error('No fue posible conectar con el servidor.')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const apiGet = async (path, options = {}) => request(path, { ...options, method: 'GET' })
const apiPost = async (path, body, options = {}) => request(path, { ...options, method: 'POST', body })
const apiPostForm = async (path, body, options = {}) => request(path, { ...options, method: 'POST', body })
const apiPatch = async (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body })
const apiDelete = async (path, options = {}) => request(path, { ...options, method: 'DELETE' })

export { apiDelete, apiGet, apiPatch, apiPost, apiPostForm }
