/* eslint-disable @typescript-eslint/restrict-template-expressions */
import winston from "winston";

const labelMap: { readonly [level: string]: string } = {
  error: "ERR ",
  warn: "WARN",
  info: "INFO",
  verbose: "VERB",
  debug: "DEBG",
  silly: "SLLY"
};

const colors = {
  info: "bold green",
  debug: "white",
  warn: "bold yellow",
  error: "bold red white"
};

winston.addColors(colors);

/**
 * Format console logs
 */
const logFormat = (info: winston.Logform.TransformableInfo): string =>
  `${info.level}:\t[${info.timestamp}] ${info.message}${
    info.durationMs ? ` - ${info.durationMs}s` : ""
  }`;

/**
 * Write console logs with uppercase levels
 */
const setUpperCase: winston.Logform.TransformFunction = info => {
  info.level = ` ${labelMap[info.level]} `;
  return info;
};

const options = {
  console: {
    level: "debug",
    handleExceptions: true,
    format: winston.format.combine(
      winston.format(setUpperCase)(),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(logFormat)
    )
  },
  file: {
    level: "info",
    filename: `${process.cwd()}/logs/app.log`,
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }
};

const logger = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console(options.console),
    new winston.transports.File(options.file)
  ]
});

export default logger;
