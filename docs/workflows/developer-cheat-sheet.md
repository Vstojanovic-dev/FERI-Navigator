# Developer cheat sheet

Kratka mapa najcescih komandi za svakodnevni rad na projektu.

## 1. Podigni ceo lokalni stack

```powershell
docker compose up -d --build
```

## 2. Proveri koji su servisi gore

```powershell
docker compose ps
```

## 3. Ugasi lokalni stack

```powershell
docker compose down
```

## 4. Pogledaj backend logove

```powershell
docker compose logs --tail 200 backend
```

## 5. Pogledaj frontend logove

```powershell
docker compose logs --tail 200 frontend
```

## 6. Restartuj samo backend

```powershell
docker compose up -d --build backend
```

## 7. Pokreni backend testove

```powershell
cd backend
.\mvnw.cmd test
```

## 8. Pokreni samo jedan backend test

```powershell
cd backend
.\mvnw.cmd "-Dtest=AdminModeGuardTest" test
```

## 9. Build public frontenda

```powershell
cd frontend
npm.cmd run build
```

## 10. Pokreni Playwright smoke testove

```powershell
cd frontend
npm.cmd run test:e2e
```

## 11. Build admin frontenda

```powershell
cd frontend/admin
npm.cmd run build
```

## 12. Pokreni admin frontend lokalno

```powershell
cd frontend/admin
npm.cmd run dev
```

## 13. Validiraj dev compose fajl

```powershell
docker compose config
```

## 14. Validiraj prod compose fajl

```powershell
$env:DB_USERNAME='ci'
$env:DB_PASSWORD='ci'
$env:POSTGRES_DB='feri_navigator'
$env:APP_CORS_ALLOWED_ORIGINS='https://staging.example.com'
$env:APP_SHARE_BASE_URL='https://staging.example.com'
docker compose -f docker-compose.prod.yml config
```

## 15. Najvaznija pravila

- Lokalni Docker stack mora da koristi `dev` profil kroz `docker-compose.yml`.
- Staging i production-like runtime koristi `docker-compose.prod.yml` i `prod` profil.
- Admin nije stalno hostovan servis; koristi se lokalno.
- Admin izmene ne idu direktno na live bazu nego kroz `export -> Flyway migration -> deploy`.
- Ako backend padne pod `docker compose up`, prvo proveri `docker compose logs --tail 200 backend`.
