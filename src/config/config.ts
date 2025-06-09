import dotenv from "dotenv";
dotenv.config();

type Env = "development" | "testing" | "production";
const env = (process.env.NODE_ENV as Env) || "development";

const baseConfig = {
  env,
  port: process.env.PORT || 5000,
  isDev: env === "development",
  isTest: env === "testing",
  isProd: env === "production",
  superAdmin: {
    username: process.env.SUPERADMIN_USERNAME || "superadmin",
    email: process.env.SUPERADMIN_EMAIL || "superadmin@example.com",
    password: process.env.SUPERADMIN_PASSWORD || "SuperSecurePassword123",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  logs: {
    level: process.env.LOG_LEVEL || "debug",
  },
  api: {
    prefix: "/api/v1",
  },
};
const envConfig: Record<Env, any> = {
  development: {
    mongo: {
      uri: process.env.DEV_MONGO_URI || "mongodb://localhost:27017/equb-dev",
      options: {
        dbName: "equb-dev",
      },
    },
  },
  testing: {
    mongo: {
      uri: process.env.TEST_MONGO_URI || "mongodb://localhost:27017/equb-test",
      options: {
        dbName: "equb-test",
      },
    },
  },
  production: {
    mongo: {
      uri: process.env.MONGO_URI,
      options: {
        dbName: process.env.MONGO_DB_NAME || "equb-prod",
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
      },
    },
  },
};

const config = {
  ...baseConfig,
  ...envConfig[env],
};

if (config.isProd) {
  const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(
        `Environment variable ${varName} is required in production`
      );
    }
  });
}

export default config;
