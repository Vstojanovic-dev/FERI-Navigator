# Release Checklist

Koristi ovu listu pre svakog staging ili production release-a.

## Pre-deploy

1. CI je zelen za trenutni commit.
2. Sve nove Flyway migracije su pregledane i numerisane ispravno.
3. Ako postoji admin graf promena, export je pretvoren u novu migraciju; nije menjan rezervisani placeholder fajl.
4. Backup baze je napravljen po [backup-and-restore](./backup-and-restore.md) workflow-u.
5. `APP_CORS_ALLOWED_ORIGINS`, `APP_SHARE_BASE_URL`, DB kredencijali i ostale production env varijable su proverene.
6. `docker compose config` i `docker compose -f docker-compose.prod.yml config` prolaze bez greske.

## Staging gate

1. Deploy na staging je zavrsen bez rollback-a.
2. `/actuator/health` i `/actuator/health/readiness` vracaju healthy status.
3. Smoke test je prosao:
   - home page se ucitava,
   - pretraga lokacije radi,
   - route flow vraca korake,
   - share route flow radi ako je ukljucen,
   - nema 5xx gresaka u backend logu tokom probe.
4. Ako je menjan graf, proverena je bar jedna poznata ruta preko izmenjenog dela mape.

## Production gate

1. Staging verifikacija je zavrsena na istom commit-u koji ide u production.
2. Termin deploy-a i rollback owner su dogovoreni.
3. Post-deploy health check je zelen.
4. Kratki post-deploy smoke test je prosao.
5. Ako je potrebno, release note ili interni changelog je azuriran.
