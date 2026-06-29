export class MaalLogger {
  static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${level}] ${message}`, context || '');
  }
}
