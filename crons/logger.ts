import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, 'cron.log');

export enum LogLevel {
    INFO = 'INFO',
    ERROR = 'ERROR',
    WARN = 'WARN'
}

export function log(message: string, level: LogLevel = LogLevel.INFO, error?: any) {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const logEntry = `[${timestamp}] [${level}] ${message}${error ? ` | Error: ${error.message || error}` : ''}\n`;

    // Always log to console for visibility during manual runs
    if (level === LogLevel.ERROR) {
        console.error(logEntry.trim());
    } else {
        console.log(logEntry.trim());
    }

    // Append to log file
    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

export const logger = {
    info: (msg: string) => log(msg, LogLevel.INFO),
    error: (msg: string, err?: any) => log(msg, LogLevel.ERROR, err),
    warn: (msg: string) => log(msg, LogLevel.WARN),
};
