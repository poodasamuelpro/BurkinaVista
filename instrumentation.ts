// instrumentation.ts — burkinavista-ng
// Fichier requis par Next.js 14 App Router pour l'initialisation de Sentry
// côté serveur et edge runtime.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: "https://a928893bb96d922ef61be09f9bad3a4c@o4511334237929472.ingest.de.sentry.io/4511334343770192",

      // Performance Monitoring
      tracesSampleRate: 1.0,

      // Désactivé en développement
      enabled: process.env.NODE_ENV !== "development",

      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: "https://a928893bb96d922ef61be09f9bad3a4c@o4511334237929472.ingest.de.sentry.io/4511334343770192",

      // Performance Monitoring
      tracesSampleRate: 1.0,

      // Désactivé en développement
      enabled: process.env.NODE_ENV !== "development",

      debug: false,
    });
  }
}
