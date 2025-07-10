/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present and properly typed
 */

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
}

const requiredEnvVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_VERSION',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * Validates and returns typed environment variables
 */
export function validateEnv(): EnvConfig {
  const env: Record<string, unknown> = {};
  const missingVars: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      env[varName] = value;
    }
  }

  // Add optional variables
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (value) {
      env[varName] = value;
    }
  }

  // Validate NODE_ENV specifically
  if (env.NODE_ENV && !['development', 'production', 'test'].includes(env.NODE_ENV as string)) {
    throw new Error(`Invalid NODE_ENV: ${env.NODE_ENV}. Must be development, production, or test.`);
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return env as unknown as EnvConfig;
}

/**
 * Pre-validated environment configuration
 * Use this instead of process.env for type safety
 */
export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'STAK.DEV',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

/**
 * Development mode utilities
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export default env;
