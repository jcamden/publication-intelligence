/**
 * API Configuration
 *
 * Centralized configuration for backend API URLs.
 * Uses NEXT_PUBLIC_API_URL environment variable with fallback to localhost.
 */

export const getApiUrl = (): string => {
	return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

export const API_URL = getApiUrl();
