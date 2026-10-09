import "server-only";
import { createPool, type Pool } from "mariadb";

const globalForDb = globalThis as typeof globalThis & { portfolioDbPool?: Pool };

export function getDatabasePool(): Pool {
  // 개발 중 파일이 다시 로드되어도 연결 풀을 계속 만들어 DB 연결이 쌓이지 않게 한다.
  if (globalForDb.portfolioDbPool) return globalForDb.portfolioDbPool;

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = Number(process.env.DB_PORT ?? "3306");
  if (!user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_CONFIG_MISSING");
  }

  // NEXT_PUBLIC_을 붙이지 않는다. 비밀번호와 접속 정보는 브라우저로 전달하지 않는다.
  globalForDb.portfolioDbPool = createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port,
    database: process.env.DB_NAME ?? "portfolio",
    user,
    password,
    charset: "utf8mb4",
    connectionLimit: 3,
    connectTimeout: 5000,
    acquireTimeout: 6000,
    minimumIdle: 0,
  });
  return globalForDb.portfolioDbPool;
}
