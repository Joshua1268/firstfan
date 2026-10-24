/**
 * URL de l'API Django vue depuis le serveur Next (SSR et rewrites).
 * En dev, Django écoute sur 127.0.0.1:8010 : le port 8000 est souvent déjà publié par un autre projet.
 */
export const DEFAULT_API_URL = "http://127.0.0.1:8010";

export function apiBaseUrl(): string {
  return process.env.API_INTERNAL_URL || DEFAULT_API_URL;
}
