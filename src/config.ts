import dotenv from "dotenv";
import * as path from "path";

dotenv.config();

export const PROJECT_ROOT: string = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : process.cwd();

export const ALLOWED_PORTS: number[] = (
  process.env.ALLOWED_PORTS || "3000,5173,8080,4200,4000"
)
  .split(",")
  .map((p) => parseInt(p.trim(), 10))
  .filter((p) => !isNaN(p));

export const ALLOWED_COMMANDS: string[] = (
  process.env.ALLOWED_COMMANDS ||
  "npm test,npm run lint,npm run build,npm run dev,npx tsc --noEmit"
)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

export const ALLOWED_WRITE_DIRS: string[] = (
  process.env.ALLOWED_WRITE_DIRS || PROJECT_ROOT
)
  .split(",")
  .map((d) => path.resolve(d.trim()));

export const BACKUP_DIR: string = path.join(PROJECT_ROOT, ".mcp-backups");

export const HTTP_PORT: number = parseInt(
  process.env.HTTP_PORT || "3333",
  10
);

export const API_KEY: string = process.env.MCP_API_KEY || "";