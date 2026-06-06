export const ENV = {
  appId: process.env.VITE_APP_ID || "nexus_academic_dev",
  cookieSecret: process.env.JWT_SECRET || "default_local_secret_for_dev_only",
  databaseUrl: process.env.DATABASE_URL || "file:./sqlite.db",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
