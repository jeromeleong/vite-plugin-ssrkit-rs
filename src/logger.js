import colors from 'picocolors';

const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

function formatMessage(level, message) {
  const levelColor = getLevelColor(level);
  const messageColor = getMessageColor(level);
  
  if (message.startsWith('  ')) {
    // 對於縮進的消息，不添加日誌級別
    return messageColor(message);
  } else {
    return `${levelColor(`[${level.toUpperCase()}]`)} ${messageColor(message)}`;
  }
}

function getLevelColor(level) {
  switch (level) {
    case LogLevel.INFO:
      return colors.blue;
    case LogLevel.WARN:
      return colors.yellow;
    case LogLevel.ERROR:
      return colors.red;
    case LogLevel.DEBUG:
      return colors.gray;
    default:
      return colors.white;
  }
}

function getMessageColor(level) {
  switch (level) {
    case LogLevel.INFO:
      return colors.cyan;
    case LogLevel.WARN:
      return colors.magenta;
    case LogLevel.ERROR:
      return colors.white;
    case LogLevel.DEBUG:
      return colors.green;
    default:
      return colors.white;
  }
}

function log(level, message) {
  console.log(formatMessage(level, message));
}

export default {
  info: (message) => log(LogLevel.INFO, message),
  warn: (message) => log(LogLevel.WARN, message),
  error: (message) => log(LogLevel.ERROR, message),
  debug: (message) => log(LogLevel.DEBUG, message)
};