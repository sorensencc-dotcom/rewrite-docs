import fs from 'fs-extra';
import path from 'path';

export interface LogEntry {
  level: string;
  timestamp: string;
  component: string;
  message: string;
  [key: string]: any;
}

export class Logger {
  private component: string;
  private logDir: string;

  constructor(component: string, logDir: string = './logs') {
    this.component = component;
    this.logDir = logDir;
    this.ensureLogDir();
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  private log(level: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      component: this.component,
      message,
      ...data,
    };

    const logLine = JSON.stringify(entry);

    // Console
    console.log(`[${level}] [${this.component}] ${message}`, data ? data : '');

    // File
    const logPath = path.join(this.logDir, `${this.component}.log`);
    fs.appendFileSync(logPath, logLine + '\n');
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
}
