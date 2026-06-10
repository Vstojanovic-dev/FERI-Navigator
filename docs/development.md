# Razvoj

Ta dokument je praktični vodič za lokalni razvoj, preverjanje sprememb in običajne delovne tokove.

## Priporočeni način

Za večino dela uporabite Docker Compose:

```powershell
docker compose up -d --build
docker compose ps
```

S tem se zaženejo:

| Storitev | Naslov |
|---|---|
| Javni frontend | <http://localhost:5173> |
| Backend API | <http://localhost:8080> |
| Health endpoint | <http://localhost:8080/actuator/health> |
| PostgreSQL/PostGIS | `localhost:5432` |

Lokalni Compose uporablja Spring profil `dev`, omogoči admin API in priklopi `database/maps/` v backend.

Ustavitev:

```powershell
docker compose down
```

Brisanje volume-a z `docker compose down -v` izbriše lokalno bazo. Uporabite ga samo, ko res želite ponovno izvesti celoten `database/init/` bootstrap.

## Lokalni razvoj komponent

### Predpogoji

- Docker Desktop z `docker compose`;
- Java 21 za backend zunaj Dockerja;
- Node.js 22 in npm za frontend;
- prosti porti `5432`, `8080`, `5173` in po potrebi `5174`.

### Backend zunaj Dockerja

Najprej zaženite podatkovno bazo:

```powershell
docker compose up -d postgres
```

Nato:

```powershell
Set-Location backend
$env:SPRING_PROFILES_ACTIVE='dev'
.\mvnw.cmd spring-boot:run
```

Privzete lokalne DB vrednosti so zapisane v `application.properties`. Za drugačno bazo nastavite `DB_URL`, `DB_USERNAME` in `DB_PASSWORD`.

### Javni frontend

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

Vite privzeto uporablja relativne `/api` in `/maps` poti ter jih posreduje backendu na `localhost:8080`.

### Admin frontend

Admin je lokalno orodje, ne javni produkcijski panel:

```powershell
Set-Location frontend/admin
npm.cmd ci
npm.cmd run dev
```

Backend mora teči z omogočenim `app.admin.enabled`, kar lokalni profil `dev` že zagotovi.

## Običajni delovni tok

1. Preberite dokument področja, ki ga spreminjate.
2. Zaženite najmanjši potreben del sistema.
3. Naredite ozko, pregledljivo spremembo.
4. Dodajte ali posodobite teste za spremenjeno vedenje.
5. Zaženite ciljne teste, nato širše preverjanje področja.
6. Posodobite dokumentacijo, če se je spremenila pogodba, zagon ali arhitektura.

## Preverjanje

### Backend

```powershell
Set-Location backend
.\mvnw.cmd test
```

En test:

```powershell
.\mvnw.cmd "-Dtest=NavigationRouteServiceTest" test
```

### Javni frontend

```powershell
Set-Location frontend
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:e2e
```

Playwright sam zažene Vite na `127.0.0.1:4273`. Testi uporabljajo prestrežene API odgovore in praviloma ne potrebujejo zagnanega backenda.

### Admin frontend

```powershell
Set-Location frontend/admin
npm.cmd run build
```

### Compose

```powershell
docker compose config
```

Produkcijsko konfiguracijo preverite z zahtevanimi vrednostmi:

```powershell
$env:DB_USERNAME='ci'
$env:DB_PASSWORD='ci'
$env:POSTGRES_DB='feri_navigator'
$env:APP_CORS_ALLOWED_ORIGINS='https://staging.example.com'
$env:APP_SHARE_BASE_URL='https://staging.example.com'
docker compose -f docker-compose.prod.yml config
```

## CI

GitHub Actions pri vsakem pushu in pull requestu preveri:

- celotno backend Maven zbirko;
- build javnega frontenda;
- build admin frontenda;
- Playwright smoke teste;
- veljavnost razvojne in produkcijske Compose konfiguracije.

Dodaten workflow na vejah proti `main` zgradi in zažene razvojni Compose stack ter preveri, da sta backend na portu `8080` in frontend na portu `5173` dosegljiva.

Lokalno preverjanje naj ustreza prizadetemu CI jobu. Dokumentacijska sprememba ne zahteva zagona vseh aplikacijskih testov, sprememba pogodbe ali runtime konfiguracije pa jih.

## Spremembe podatkov

- `database/init/` je samo bootstrap nove prazne baze.
- Obstoječa baza se spreminja z novo Flyway migracijo v `backend/src/main/resources/db/migration/`.
- Že uporabljene migracije se ne popravljajo.
- Admin sprememba grafa postane trajna šele po pregledu in pretvorbi izvoza v novo migracijo.

Podrobnosti so v [`data-and-navigation.md`](data-and-navigation.md).

## Diagnostika

```powershell
docker compose ps
docker compose logs --tail 200 backend
docker compose logs --tail 200 frontend
```

| Težava | Najprej preverite |
|---|---|
| Backend se ne zažene | stanje PostgreSQL, backend log in aktivni profil |
| Flyway prijavi checksum | ali je bila spremenjena že uporabljena migracija |
| Sprememba init SQL ni vidna | ali baza uporablja star Docker volume |
| Frontend ne doseže API-ja | backend port, Vite proxy in `VITE_API_BASE_URL` |
| Tloris se ne naloži | `/maps/...`, datoteko v `database/maps/` in DB URL tlorisa |
| Admin vrne `404` | ali je `APP_ADMIN_ENABLED=true` oziroma profil `dev` |

## Povezana dokumentacija

- [`repository-structure.md`](repository-structure.md) za tehnologije in vstopne točke;
- [`frontend.md`](frontend.md) za frontend pravila;
- [`backend-and-api.md`](backend-and-api.md) za backend in API;
- [`deployment-and-operations.md`](deployment-and-operations.md) za produkcijsko uvajanje.
