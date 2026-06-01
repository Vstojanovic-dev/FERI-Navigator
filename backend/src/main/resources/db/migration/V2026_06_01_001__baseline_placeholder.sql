-- Baseline placeholder for the Flyway migration chain.
-- Fresh databases still require the legacy database/init bootstrap before post-bootstrap Flyway migrations are applied.
-- Existing staging/production databases require an intentional baseline/cutover procedure before relying on Flyway for ongoing changes.
SELECT 1;
