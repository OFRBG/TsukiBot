// @flow
const winston = require('winston');

const labelMap = {
  error: 'ERR ',
  warn: 'WARN',
  info: 'INFO',
  verbose: 'VERB',
  debug: 'DEBG',
  silly: 'SLLY'
};

const colors = {
  info: 'bold green',
  debug: 'white',
  warn: 'bold yellow',
  error: 'bold red white'
};

winston.addColors(colors);

/**
 * Format console logs
 *
 * @param info Info object
 */
const logFormat = info =>
  `${info.level}:\t[${info.timestamp}] ${info.message}${
    info.durationMs ? ` - ${info.durationMs}s` : ''
  }`;

/**
 * Write console logs with uppercase levels
 *
 * @param info Info object
 */
const setUpperCase = info => {
  // eslint-disable-next-line no-param-reassign
  info.level = ` ${labelMap[info.level]} `;
  return info;
};

const options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format(setUpperCase)(),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(logFormat)
    )
  },
  file: {
    level: 'info',
    filename: `${process.cwd()}/logs/app.log`,
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }
};

module.exports = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console(options.console),
    new winston.transports.File(options.file)
  ]
});
