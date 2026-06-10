# Namestitev in vzdrževanje

Ta dokument opisuje trenutno produkcijsko osnovo, varen release, preverjanje delovanja, backup in obnovitev. `docker-compose.prod.yml` je produkcijski približek, ne celotna infrastruktura.

## Produkcijski model

Produkcijski Compose zažene:

- PostgreSQL/PostGIS v zasebnem Compose omrežju;
- Spring Boot backend v profilu `prod`;
- Nginx z javnim frontend buildom in proxyjem za `/api/` ter `/maps/`.

Javno je objavljen samo Nginx na portu `80`. Backend in baza uporabljata samo `expose`.

Admin je izklopljen. Endpointa `/api/graph/import` in `/api/graph/cross-floor` pa trenutno nista zaščitena z admin guardom, zato ju je treba pred javno produkcijo blokirati na reverse proxyju ali odstraniti oziroma zaščititi v aplikaciji.

Tlorisi iz `database/maps/` se med backend Docker buildom kopirajo v image. Produkcijski Compose jih ne sme prekriti z lokalnim bind mountom. To pravilo preveri:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\deploy\verify-prod-maps-mount.ps1
```

Po spremembi tlorisa je zato potreben nov backend image.

## Okoljske spremenljivke

Začnite s kopijo `.env.example`, vendar resničnih skrivnosti ne commitajte.

| Spremenljivka | Namen |
|---|---|
| `SPRING_PROFILES_ACTIVE` | Za staging in produkcijo naj bo `prod` |
| `POSTGRES_DB` | Ime baze; privzeto `feri_navigator` |
| `DB_URL` | JDBC povezava; Compose ima varen interni privzeti naslov |
| `DB_USERNAME` | Uporabnik baze |
| `DB_PASSWORD` | Geslo baze |
| `APP_CORS_ALLOWED_ORIGINS` | Točen seznam dovoljenih frontend originov |
| `APP_SHARE_BASE_URL` | Javni osnovni URL za deljene poti |
| `VITE_API_BASE_URL` | Build-time nastavitev, potrebna samo, ko API ni dostopen prek istega origina |

`APP_ADMIN_ENABLED` produkcijski Compose vedno nastavi na `false`.

Trenutni produkcijski Docker build uporablja isti origin in Nginx proxy, zato `VITE_API_BASE_URL` ni potreben. Če frontend in API razdelite na različna origina, je treba vrednost posredovati v frontend build; samo runtime nastavitev v Compose okolju že zgrajenega frontenda ne spremeni.

## Pred namestitvijo

1. CI mora biti zelen za isti commit, ki se namešča.
2. Preglejte vse nove Flyway migracije.
3. Naredite in zabeležite backup baze.
4. Preverite produkcijske skrivnosti, CORS in javni share URL.
5. Preverite Compose konfiguracijo:

```powershell
docker compose -f docker-compose.prod.yml config
```

6. Določite osebo in postopek za rollback.

## Namestitev

Na strežniku z varno nastavljenim `.env`:

```powershell
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Backend ob zagonu uporabi Flyway migracije. Init SQL se izvede samo ob ustvarjanju novega praznega DB volume-a.

Ne brišite produkcijskega volume-a kot način nadgradnje.

## Preverjanje po namestitvi

Preverite:

```text
GET /actuator/health
GET /actuator/health/readiness
```

Nato izvedite kratek uporabniški smoke test:

1. začetna stran se naloži;
2. iskanje vrne lokacije;
3. znana pot vrne tloris in korake;
4. deljena povezava se ustvari in ponovno odpre;
5. backend log nima novih `5xx` napak.

Če je bil spremenjen graf, preverite pot v obe smeri čez spremenjeni del.

## Logi in stanje

```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 200 backend
docker compose -f docker-compose.prod.yml logs --tail 200 frontend
docker compose -f docker-compose.prod.yml logs --tail 200 postgres
```

Health endpoint pove, ali je aplikacija pripravljena sprejemati promet. Ne nadomesti preverjanja dejanske navigacijske poti.

## Backup

Naredite `pg_dump`:

- pred vsako podatkovno migracijo ali večjim importom;
- najmanj enkrat dnevno;
- v custom formatu `-Fc`;
- na lokacijo zunaj Git repozitorija in po možnosti zunaj istega strežnika.

Primer iz produkcijskega DB containerja:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
docker compose -f docker-compose.prod.yml exec -T postgres `
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/feri-navigator.dump'
docker cp feri-navigator-postgres-prod:/tmp/feri-navigator.dump `
  ".\backups\feri-navigator-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
docker compose -f docker-compose.prod.yml exec -T postgres `
  rm -f /tmp/feri-navigator.dump
```

Redno preverjajte obnovitev na ločeni začasni bazi. Obstoj dump datoteke sam po sebi ne dokazuje, da je backup uporaben.

## Obnovitev

Obnovitev produkcije je izredni postopek. Pred začetkom določite:

- kateri dump se vrača;
- koliko podatkov bo izgubljenih;
- ali morajo biti aplikacijski write-i ustavljeni;
- kdo potrdi zaključek.

Primer prenosa in obnovitve:

```powershell
docker cp .\backups\feri-navigator-YYYYMMDD-HHMMSS.dump `
  feri-navigator-postgres-prod:/tmp/restore.dump

docker compose -f docker-compose.prod.yml exec -T postgres `
  pg_restore --clean --if-exists --no-owner `
  -U "$env:DB_USERNAME" -d "$env:POSTGRES_DB" /tmp/restore.dump
```

Po obnovitvi ponovno zaženite backend, preverite readiness in izvedite uporabniški smoke test.

## Rollback

- Spremembo aplikacije vrnite z namestitvijo prejšnje preverjene slike oziroma commita.
- Podatkovne migracije praviloma niso samodejno reverzibilne.
- Če nova koda ni združljiva s spremenjeno shemo, uporabite vnaprej pripravljen rollback SQL ali obnovite potrjen backup.
- Nikoli ne popravljajte že izvedene Flyway migracije, da bi prikrili neuspešen release.

## Redno vzdrževanje

- dnevni backup in nadzor uspešnosti;
- periodičen test restore-a;
- pregled porabe diska, DB volume-a in logov;
- spremljanje health/readiness in `5xx` napak;
- posodabljanje runtime slik ter odvisnosti po testiranju;
- pregled veljavnosti CORS, javnega URL-ja in TLS certifikata;
- preverjanje znanih navigacijskih poti po spremembi podatkov.

## Trenutne produkcijske omejitve

Repozitorij še ne zagotavlja:

- TLS terminacije;
- centralnega upravljanja skrivnosti;
- rate limiting-a;
- avtentikacije admin orodja;
- monitoringa, alarmiranja in centralnih logov;
- resource limitov in log rotation politike;
- zaščite razvojnih `/api/graph` write endpointov.

Te odgovornosti mora prevzeti infrastruktura ali dodatna aplikacijska sprememba pred javno produkcijsko uporabo.

## Povezana dokumentacija

- [`architecture.md`](architecture.md) za trust meje;
- [`development.md`](development.md) za lokalni zagon in teste;
- [`data-and-navigation.md`](data-and-navigation.md) za migracije in spremembe grafa;
- [`backend-and-api.md`](backend-and-api.md) za endpoint varnostne opombe.
