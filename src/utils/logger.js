// Utils/logger.js
// Logging utility for debugging

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const COLORS = {
  DEBUG: '🔵',
  INFO: '🟢',
  WARN: '🟡',
  ERROR: '🔴'
};

export const log = (message, data = null, level = LOG_LEVELS.INFO) => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `${COLORS[level]} [${level}] ${timestamp}`;

  if (data) {
    console.log(`${prefix} - ${message}`, data);
  } else {
    console.log(`${prefix} - ${message}`);
  }
};

export const logDebug = (message, data = null) => {
  log(message, data, LOG_LEVELS.DEBUG);
};

export const logInfo = (message, data = null) => {
  log(message, data, LOG_LEVELS.INFO);
};

export const logWarn = (message, data = null) => {
  log(message, data, LOG_LEVELS.WARN);
};

export const logError = (message, error = null) => {
  log(message, error, LOG_LEVELS.ERROR);
};

export const logApiCall = (endpoint, method, status) => {
  logInfo(`${method} ${endpoint} - ${status}`);
};

export const logScreenNavigation = (screenName) => {
  logInfo(`Navigating to: ${screenName}`);
};
