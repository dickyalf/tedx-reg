const winston = require('winston');
const path = require('path');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
  winston.format.colorize({ all: true })
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),
  new winston.transports.File({ 
    filename: path.join('logs', 'all.log'),
    level: 'info',
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;