// sentry.client.config.ts — burkinavista-ng
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a928893bb96d922ef61be09f9bad3a4c@o4511334237929472.ingest.de.sentry.io/4511334343770192",

  // Enregistre les replays de session en cas d'erreur
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Désactivé en développement
  enabled: process.env.NODE_ENV !== "development",

  debug: false,
});
