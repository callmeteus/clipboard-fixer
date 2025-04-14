import path from "path";
import winston from "winston";

export class Logger {
    private static instance: winston.Logger;

    private constructor() {
        Logger.instance = winston.createLogger({
            level: "info",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.colorize(),
                winston.format.splat(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
                    return `${timestamp} [${level}]: ${message} ${metaString}`;
                })
            ),
            transports: [
                // Write all logs to crash.log
                new winston.transports.File({ 
                    filename: path.join(process.cwd(), "crash.log"),
                    level: "error"
                }),
                // Write to console for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...meta }) => {
                            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
                            return `${timestamp} [${level}]: ${message} ${metaString}`;
                        })
                    )
                })
            ]
        });
    }

    public static getInstance(): winston.Logger {
        if (!Logger.instance) {
            new Logger();
        }
        return Logger.instance;
    }

    public static info(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().info(message, ...args);
        } else {
            Logger.getInstance().info(message);
        }
    }

    public static error(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().error(message, ...args);
        } else {
            Logger.getInstance().error(message);
        }
    }

    public static warn(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().warn(message, ...args);
        } else {
            Logger.getInstance().warn(message);
        }
    }

    public static debug(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().debug(message, ...args);
        } else {
            Logger.getInstance().debug(message);
        }
    }
} 