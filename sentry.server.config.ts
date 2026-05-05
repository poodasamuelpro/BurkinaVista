// sentry.server.config.ts — burkinavista-ng
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a928893bb96d922ef61be09f9bad3a4c@o4511334237929472.ingest.de.sentry.io/4511334343770192",

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Désactivé en développement
  enabled: process.env.NODE_ENV !== "development",

  debug: false,
});
