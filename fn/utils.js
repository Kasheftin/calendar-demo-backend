import config from '../config'

export function throwError (status, errorType, errorMessage) {
  return e => {
    if (!e) e = new Error(errorMessage || 'Default Error')
    e.status = status
    e.errorType = errorType
    throw e
  }
}

export function throwIf (fn, status, errorType, errorMessage) {
  return result => {
    return fn(result) ? throwError(status, errorType, errorMessage)() : result
  }
}

export function catchError (res, error) {
  if (!error) error = new Error('Default error')
  res.status(error.status || 500).json({type: 'error', message: error.message || 'Unhandled error', error})
}

export function sendSuccess (res, message) {
  return (data, globalData) => {
    res.status(200).json({type: 'success', message: message || 'Success result', data, ...globalData})
  }
}

export function sendError (res, status, message) {
  return (error, globalData) => {
    res.status(status || error.status).json({type: 'error', message: message || error.message || 'Unhandled Error', error, ...globalData})
  }
}

export default {
  throwError,
  throwIf,
  catchError,
  sendSuccess,
  sendError
}
