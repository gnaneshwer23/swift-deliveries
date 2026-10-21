-- lovable-cron-fallback-reviewed: uptime detection is inherently time-based; nothing in the database changes when the site goes down, so only an external periodic probe can detect it. 5-minute cadence keeps outage detection within the window the user needs for a live paid product.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'deliverx-uptime-health-check',
  '*/5 * * * *',
  $$SELECT net.http_get(
      url := 'https://project--15fd0b54-40c6-4b43-80d8-fc4b8758ad7c.lovable.app/api/public/monitoring/health',
      timeout_milliseconds := 15000
  );$$
);