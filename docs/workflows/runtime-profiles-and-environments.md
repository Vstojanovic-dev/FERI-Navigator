# Runtime profiles and environments

Ovaj dokument je centralna referenca za:

- Spring profile model (`dev`, `test`, `prod`)
- local development startup
- Docker Compose runtime razlike
- admin workflow model
- staging/production ogranicenja i pravila koriscenja

Ako menjas startup, environment varijable, Flyway workflow ili hosting model, ovaj dokument treba azurirati u istom radu.

## 1. Mentalni model

Projekat sada ima tri odvojena runtime konteksta:

1. `dev`
   - lokalni razvoj
   - admin moze biti ukljucen
   - Flyway sme da radi `baseline-on-migrate`
   - `localhost` vrednosti su prihvatljive

2. `test`
   - automated test context
   - admin testovi i MVC slice testovi treba da budu izolovani od realne baze kad god je moguce
   - koristi sigurnije test-specific vrednosti

3. `prod`
   - staging i production-like hosting
   - admin je po default-u ugasen
   - nema tihih lokalnih fallback vrednosti za kriticne runtime URL-ove
   - koristi eksplicitne secrets i production env varijable

Bitna razlika:

- `docker-compose.yml` je lokalni development stack
- `docker-compose.prod.yml` je staging/production-like runtime stack

Ne treba ih mesati.

## 2. Backend profile ponasanje

### Base config

Base config je u [backend/src/main/resources/application.properties](D:/Feri%20Navigator/FERI-Navigator/backend/src/main/resources/application.properties).

Tu zive neutralne postavke:

- datasource preko `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Hibernate `validate`
- Flyway ukljucen
- Actuator health/info
- shared app properties za CORS, admin mode i share base URL

Base config nije ni development ni production policy. Ona samo definise zajednicki contract.

### Dev profile

Dev config je u [backend/src/main/resources/application-dev.properties](D:/Feri%20Navigator/FERI-Navigator/backend/src/main/resources/application-dev.properties).

Dev radi sledece:

- `spring.flyway.baseline-on-migrate=true`
- `app.admin.enabled=true`
- verbose-niji lokalni rad kroz `spring.jpa.show-sql=true`

Zasto je ovo bitno:

- lokalna baza se i dalje bootstrapuje kroz `database/init`
- posle toga Flyway mora da ume da prihvati vec-popunjenu semu i da napravi `flyway_schema_history`
- bez `baseline-on-migrate`, backend ce pasti na lokalnom compose stack-u ako baza vec ima semu iz init SQL-a

### Test profile

Test config je u [backend/src/main/resources/application-test.properties](D:/Feri%20Navigator/FERI-Navigator/backend/src/main/resources/application-test.properties).

Test profil postoji da:

- admin i navigation testovi imaju stabilnije profile-specific vrednosti
- testovi ne koriste production share URL
- actuator ne pravi nepotrebnu buku u test context-u

Napomena:

- nije svaki test full application boot
- deo testova je namerno MVC slice (`@WebMvcTest`) sa `addFilters = false` kada test proverava controller contract, ne security
- security-specific testovi ostaju zasebni

### Prod profile

Prod config je u [backend/src/main/resources/application-prod.properties](D:/Feri%20Navigator/FERI-Navigator/backend/src/main/resources/application-prod.properties).

Production pravila:

- `app.admin.enabled=false`
- `APP_CORS_ALLOWED_ORIGINS` mora biti eksplicitno zadat
- `APP_SHARE_BASE_URL` mora biti eksplicitno zadat
- nema implicitnog `localhost` ponasanja za javni runtime

To znaci da `prod` treba koristiti i za staging i za production-like okruzenja.

## 3. Frontend runtime model

### Public frontend

Public frontend koristi [frontend/src/utils/runtimeConfig.ts](D:/Feri%20Navigator/FERI-Navigator/frontend/src/utils/runtimeConfig.ts).

Pravilo:

- u production buildu `VITE_API_BASE_URL` je potreban samo ako frontend ne koristi isti origin kao backend proxy
- frontend vise ne sme tiho da padne na `http://localhost:8080` u production kontekstu

To znaci:

- same-origin nginx proxy moze bez `VITE_API_BASE_URL`, pa frontend koristi relativne `/api/...` i `/maps/...` putanje
- ako je API na drugom hostu ili drugom domenu, `VITE_API_BASE_URL` mora biti eksplicitno zadat

To je namerno uvedeno da staging/prod ne bi slucajno radili sa lokalnim ili pogresnim API target-om.

### Admin frontend

Admin frontend koristi [frontend/admin/src/config.ts](D:/Feri%20Navigator/FERI-Navigator/frontend/admin/src/config.ts).

Za admin je fallback na `http://localhost:8080` i dalje prihvatljiv jer je admin:

- lokalni alat
- ne stalno hostovan servis
- ne deo javnog runtime-a

To nije kontradikcija sa public frontend pravilom. To je namerno razdvojen trust model.

## 4. Local development: kako se koristi `dev`

### Preporuceni lokalni stack

Za standardni lokalni rad koristi:

```powershell
docker compose up -d --build
```

To sada radi ovako:

- `postgres` se podize lokalno
- `backend` se podize sa `SPRING_PROFILES_ACTIVE=dev`
- `frontend` ide kroz svoj Docker/Nginx path

Backend lokalno koristi:

- `DB_URL=jdbc:postgresql://postgres:5432/feri_navigator`
- `DB_USERNAME=feri`
- `DB_PASSWORD=feri`
- `APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174`
- `APP_SHARE_BASE_URL=http://localhost:5173`
- `APP_ADMIN_ENABLED=true`

### Zasto je ovo bitno

Pre ovog uskladjivanja backend je padao pod `docker compose up` jer compose nije aktivirao `dev` profil. To je znacilo:

- backend krece sa default/base profilom
- Flyway vidi ne-praznu semu iz `database/init`
- nema `baseline-on-migrate`
- aplikacija pada na startup-u

To je sada popravljeno u [docker-compose.yml](D:/Feri%20Navigator/FERI-Navigator/docker-compose.yml).

### Ako menjas lokalni startup

Ako menjas `docker-compose.yml`, cuvaj sledece invariante:

- lokalni compose mora da koristi `SPRING_PROFILES_ACTIVE=dev`
- lokalni compose mora da koristi `DB_*` env imena, ne stari `SPRING_DATASOURCE_*` model
- admin lokalno moze biti ukljucen
- public runtime URL-ovi za dev smeju biti `localhost`

## 5. Admin workflow: kako se koristi sada

Admin vise nije zamisljen kao stalno hostovan panel.

Ispravan workflow je:

1. lokalno podignes bazu + backend + admin frontend
2. napravis izmene u admin UI-ju
3. exportujes SQL snapshot
4. od tog exporta pravis novu Flyway migraciju
5. commitujes migraciju
6. staging/prod dobijaju promenu kroz deploy

To znaci:

- admin UI nije source of truth
- git + migracije su source of truth
- live baza se ne menja kroz browser kao standardni workflow

Relevantni dokumenti:

- [docs/admin_panel.md](D:/Feri%20Navigator/FERI-Navigator/docs/admin_panel.md)
- [docs/admin.md](D:/Feri%20Navigator/FERI-Navigator/docs/admin.md)
- [docs/workflows/admin-export-to-migration.md](D:/Feri%20Navigator/FERI-Navigator/docs/workflows/admin-export-to-migration.md)

## 6. Staging and production: kako treba koristiti `prod`

### Compose model

Production-like stack je u [docker-compose.prod.yml](D:/Feri%20Navigator/FERI-Navigator/docker-compose.prod.yml).

On podrazumeva:

- `SPRING_PROFILES_ACTIVE=prod`
- backend nije javno published, samo `expose`
- postgres nije javno published, samo `expose`
- samo frontend/Nginx izlazi na javni port
- backend readiness ide kroz `/actuator/health/readiness`

### Minimalne env varijable

Primer contract-a je u [.env.example](D:/Feri%20Navigator/FERI-Navigator/.env.example).

Bitne varijable:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_SHARE_BASE_URL`
- `APP_ADMIN_ENABLED=false`
- `VITE_API_BASE_URL`

### Production pravila

U `prod` rezimu:

- admin ne treba da bude ukljucen
- CORS ne sme biti wildcard
- share URL mora pokazivati na stvarni hostovani frontend
- secrets ne smeju ostati na `change_me`

## 7. Flyway i baza: sta je trenutno podrzano

Trenutni model je kompromis izmedju postojeceg projekta i hosting readiness-a.

### Sta radi danas

- sveza lokalna baza se i dalje inicijalizuje kroz `database/init`
- Flyway je uveden za sve naredne promene
- `dev` sme da baseline-uje postojecu lokalnu semu
- `prod` ocekuje kontrolisan migration workflow

### Sta to znaci operativno

Za lokalni rad:

- bootstrap SQL + Flyway mogu ziveti zajedno

Za staging/prod:

- ne oslanjaj se na "pregazi init SQL i restartuj"
- koristi reviewed migracije
- admin export postaje nova migracija

### Limitacija

Ovo jos nije potpuno cist "greenfield Flyway-only" sistem.

I dalje postoji prelazni model:

- `database/init` ostaje bootstrap path
- Flyway je authoritative za post-bootstrap promene

To je prihvatljivo u ovom prelaznom staging/production-like modelu, ali treba ga drzati disciplinovano.

## 8. Sta je sada verifikovano

Posle hardening ciklusa, sledece je provereno:

- backend Maven test suite prolazi
- public frontend build prolazi
- admin frontend build prolazi
- Playwright smoke test prolazi
- `docker compose config` prolazi
- `docker compose -f docker-compose.prod.yml config` prolazi kad se zadate potrebne env varijable
- lokalni `docker compose up` backend sada se dize ispravno kroz `dev` profil

## 9. Production limitations koje i dalje postoje

Ovo je najvazniji deo za realna ocekivanja.

Sistem je sada mnogo blize staging-ready stanju, ali jos postoje otvorene production stavke.

### Jos nije zatvoreno

- TLS/HTTPS terminacija nije implementirana u repou
- secrets management za stvarna hostovana okruzenja nije zavrsen
- rate limiting nije dodat
- write/import endpoint policy van glavnog admin flow-a jos treba finalno zakljucati
- resource limits i log rotation jos nisu deo runtime manifesta
- monitoring i alerting jos nisu uvedeni
- admin auth nije uveden kao runtime feature

### Sta to znaci prakticno

Mozes ici ka staging-u, ali ne treba jos tvrditi da je sistem "full production hardening done".

Ispravan opis trenutnog stanja je:

- `development workflow` je uskladjen
- `staging readiness` je znacajno popravljena
- postoje jos operativni production follow-up koraci

## 10. Pravila za developere

Ako dodajes novu funkcionalnost:

- backend i frontend promene smeju normalno da se deploy-uju i kada je aplikacija hostovana
- ako menjas bazu, radi to kroz novu Flyway migraciju
- ako menjas graf kroz admin, radi lokalni export pa novu migraciju
- ne vracaj lokalni compose na stari startup model
- ne uvodi tihi production fallback na `localhost`
- ne pretvaraj admin nazad u stalno hostovan public panel bez nove security odluke

## 11. Brza komanda mapa

### Local dev stack

```powershell
docker compose up -d --build
```

### Local backend logs

```powershell
docker compose logs --tail 200 backend
```

### Public frontend build

```powershell
cd frontend
npm.cmd run build
```

### Admin frontend build

```powershell
cd frontend/admin
npm.cmd run build
```

### Backend tests

```powershell
cd backend
.\mvnw.cmd test
```

### Prod-like compose validation

```powershell
$env:DB_USERNAME='ci'
$env:DB_PASSWORD='ci'
$env:POSTGRES_DB='feri_navigator'
$env:APP_CORS_ALLOWED_ORIGINS='https://staging.example.com'
$env:APP_SHARE_BASE_URL='https://staging.example.com'
docker compose -f docker-compose.prod.yml config
```

## 12. Povezani dokumenti

- [docs/pre_production_chechklist.md](D:/Feri%20Navigator/FERI-Navigator/docs/pre_production_chechklist.md)
- [docs/workflows/release-checklist.md](D:/Feri%20Navigator/FERI-Navigator/docs/workflows/release-checklist.md)
- [docs/workflows/backup-and-restore.md](D:/Feri%20Navigator/FERI-Navigator/docs/workflows/backup-and-restore.md)
- [docs/workflows/admin-export-to-migration.md](D:/Feri%20Navigator/FERI-Navigator/docs/workflows/admin-export-to-migration.md)
- [docs/admin_panel.md](D:/Feri%20Navigator/FERI-Navigator/docs/admin_panel.md)
- [docs/admin.md](D:/Feri%20Navigator/FERI-Navigator/docs/admin.md)
