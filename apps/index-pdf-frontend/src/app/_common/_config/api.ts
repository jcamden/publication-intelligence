import { env } from "../../../env";

/**
 * API Configuration
 *
 * Centralized configuration for backend API URLs.
 * Uses NEXT_PUBLIC_API_URL environment variable with fallback to localhost.
 */

export const API_URL = env.NEXT_PUBLIC_API_URL;
