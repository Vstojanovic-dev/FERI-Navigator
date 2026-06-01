# Backup and restore

Ovaj workflow pokriva trenutni production/staging model gde PostgreSQL radi kao container u `docker-compose.prod.yml`, a javni runtime ne izlaze `5432` na host interfejs.

## Pravila

- Radi nightly `pg_dump` backup.
- Cuvaj najmanje jednu recentnu proverenu restore proceduru po okruzenju.
- Test restore radi u disposable bazi pre nego sto smatras backup ispravnim.
- Backup fajlovi ne ulaze u git repozitorijum.

## Pre-deploy backup

Pokreni backup pre svake release migracije ili veceg data importa:

```powershell
docker compose -f docker-compose.prod.yml exec -T postgres `
  pg_dump -U "$env:DB_USERNAME" -d "$env:POSTGRES_DB" -Fc `
  > ".\backups\feri-navigator-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
```

Ako koristis `.env` fajl za produkciju, ucitaj ga pre komande u istoj PowerShell sesiji ili eksplicitno exportuj `DB_USERNAME` i `POSTGRES_DB`.

## Nightly backup

Minimalna operativna praksa:

- Zakazati jedan nocni `pg_dump -Fc`.
- Kopirati dump van servera ili na managed object storage.
- Rotirati backup-e tako da zadrzis dnevne, nedeljne i poslednji poznato-dobar pre-release dump.

## Test restore

Restore proverava da li je dump stvarno upotrebljiv, ne samo da li je napravljen.

1. Podigni disposable bazu, lokalno ili na staging hostu.
2. Kreiraj praznu target bazu.
3. Vrati dump.
4. Startuj backend nad tom bazom i proveri `GET /actuator/health/readiness`.

Primer restore-a u disposable Postgres container:

```powershell
docker run --rm --name feri-restore-check `
  -e POSTGRES_PASSWORD=restore `
  -e POSTGRES_DB=feri_restore `
  -p 55432:5432 `
  -d postgis/postgis:17-3.5
```

```powershell
pg_restore `
  --clean `
  --if-exists `
  --no-owner `
  --host localhost `
  --port 55432 `
  --username postgres `
  --dbname feri_restore `
  .\backups\feri-navigator-YYYYMMDD-HHMMSS.dump
```

## Production restore

Restore radi samo kada imas potvrden rollback plan i kada znas koji dump vracas.

```powershell
docker cp .\backups\feri-navigator-YYYYMMDD-HHMMSS.dump feri-navigator-postgres-prod:/tmp/restore.dump
docker compose -f docker-compose.prod.yml exec -T postgres `
  pg_restore --clean --if-exists --no-owner -U "$env:DB_USERNAME" -d "$env:POSTGRES_DB" /tmp/restore.dump
```

Posle restore-a:

- restartuj backend container,
- proveri `docker compose -f docker-compose.prod.yml ps`,
- proveri `GET /actuator/health/readiness`,
- odradi osnovni smoke test glavne navigacije.

## Minimum checklist

- Backup napravljen neposredno pre deploy-a.
- Restore testiran bar na disposable bazi.
- Lokacija backup fajla i timestamp su zabelezeni u release belesci.
- Post-deploy health check je prosao.
