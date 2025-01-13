import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface Logger {
  [key: string]: any;
  setLevel(level: LogLevel): void;
  log(level: LogLevel, message: string): void;
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

class LoggerImpl implements Logger {
  static level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    LoggerImpl.level = level;
  }

  log(level: LogLevel, message: string): void {
    if (level >= LoggerImpl.level) {
      console.log(`[${LogLevel[level]}] ${message}`);
    }
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }
}