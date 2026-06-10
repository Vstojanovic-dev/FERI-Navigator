# Struktura repozitorija in tehnologije

Ta dokument je tehnična referenca za uporabljene tehnologije, najpomembnejše mape, vstopne točke in vire resnice v projektu FERI Navigator.

Za razumevanje sodelovanja med komponentami najprej preberite [`architecture.md`](architecture.md).

## Tehnološki sklad

| Področje | Tehnologija | Različica | Vir |
|---|---|---:|---|
| Backend jezik | Java | 21 | `backend/pom.xml` |
| Backend ogrodje | Spring Boot | 3.3.0 | `backend/pom.xml` |
| Backend build | Maven | 3.9 v Docker image-u | `backend/Dockerfile` |
| JPA in podatki | Spring Data JPA, Hibernate Spatial | različico upravlja Spring Boot | `backend/pom.xml` |
| Migracije | Flyway | različico upravlja Spring Boot | `backend/pom.xml` |
| Podatkovna baza | PostgreSQL + PostGIS | 17 + 3.5 | `docker-compose.yml` |
| Frontend runtime | Node.js | 22 | `frontend/Dockerfile`, CI |
| Javni frontend | React | 19.2.x | `frontend/package.json` |
| Usmerjanje | React Router | 7.16.x | `frontend/package.json` |
| Javni frontend build | TypeScript + Vite | 6.0.x + 8.0.x | `frontend/package.json` |
| Admin frontend | React, TypeScript, Vite | 19.2.x, 6.0.x, 8.0.x | `frontend/admin/package.json` |
| End-to-end testi | Playwright | 1.60.x | `frontend/package.json` |
| Statični strežnik in proxy | Nginx | 1.27 | `frontend/Dockerfile` |

Različice npm paketov so v `package.json` zapisane kot dovoljeni razponi. Točno nameščene različice določata:

- `frontend/package-lock.json`;
- `frontend/admin/package-lock.json`.

Projekt nima nastavljenega polja npm `engines`. Node.js 22 je pričakovana različica, ker jo uporabljata frontend Docker image in GitHub Actions.

## Struktura repozitorija

```text
FERI-Navigator/
├── .github/workflows/               # CI, buildi, testi in preverjanje zagona
├── backend/                         # Spring Boot aplikacija
│   ├── src/main/java/.../backend/
│   │   ├── admin/                   # Backend lokalnega urejevalnika grafa
│   │   ├── config/                  # Security, CORS, napake in serviranje zemljevidov
│   │   ├── controller/              # Javni REST kontrolerji
│   │   ├── dto/                     # Oblike API zahtev in odgovorov
│   │   ├── model/                   # JPA domenski modeli
│   │   ├── repository/              # Dostop do podatkovne baze
│   │   └── service/                 # Poslovna logika in izračun poti
│   ├── src/main/resources/
│   │   ├── db/migration/            # Flyway migracije po začetnem bootstrapu
│   │   └── application*.properties  # Skupna in profilna konfiguracija
│   ├── src/test/                    # Backend avtomatizirani testi
│   ├── Dockerfile                   # Build in runtime backend containerja
│   └── pom.xml                      # Maven odvisnosti in build nastavitve
├── database/
│   ├── init/                        # Začetna shema in podatki nove baze
│   └── maps/                        # Tlorisi, ki jih servira backend
├── deploy/                          # Preverjanja in pripomočki za namestitev
├── docs/                            # Trenutna dokumentacija
│   └── superpowers/                 # Zgodovinske zasnove in implementacijski načrti
├── frontend/
│   ├── src/
│   │   ├── app/                     # Korenska React aplikacija in router
│   │   ├── components/              # Splošne uporabniške komponente
│   │   ├── features/navigation/     # Navigacijski prikaz in interakcije
│   │   ├── i18n/                    # Slovenščina, angleščina in jezikovni runtime
│   │   ├── pages/                   # Glavne strani aplikacije
│   │   ├── services/                # API odjemalci
│   │   ├── types/                   # Frontend pogodbe in tipi
│   │   └── utils/                   # Iskanje, prikaz imen in pomožna logika
│   ├── tests/                       # Playwright testi in fixture-i
│   ├── public/                      # Statični asseti javnega frontenda
│   ├── admin/                       # Ločena lokalna React admin aplikacija
│   ├── Dockerfile                   # Build frontenda in Nginx runtime
│   ├── nginx.conf                   # SPA serviranje ter `/api` in `/maps` proxy
│   └── package.json                 # Javni frontend skripti in odvisnosti
├── .env.example                     # Primer produkcijskih spremenljivk
├── docker-compose.yml               # Lokalni razvojni stack
└── docker-compose.prod.yml          # Produkcijski oziroma staging-like stack
```

Mapi `.idea/` in `.worktrees/` nista del aplikacijske arhitekture. Prva vsebuje lokalne IDE nastavitve, druga pa lokalne Git worktree direktorije.

## Glavne vstopne točke

### Javni frontend

Tok zagona:

```text
frontend/index.html
  -> frontend/src/main.tsx
  -> frontend/src/App.tsx
  -> frontend/src/app/App.tsx
  -> frontend/src/app/AppRouter.tsx
```

`frontend/src/App.tsx` je kratek preusmeritveni modul do dejanske korenske aplikacije v `frontend/src/app/App.tsx`.

Glavne strani:

- `frontend/src/pages/HomePage.tsx`;
- `frontend/src/pages/BuildingsPage.tsx`;
- `frontend/src/pages/NavigationPage.tsx`.

### Admin frontend

Vstopna točka je:

```text
frontend/admin/index.html
  -> frontend/admin/src/main.tsx
  -> frontend/admin/src/AdminApp.tsx
```

Admin frontend ima svoj `package.json`, TypeScript konfiguracijo, Vite konfiguracijo in lock datoteko.

### Backend

Glavni Java entrypoint je:

```text
backend/src/main/java/com/navigator/backend/FeriNavigatorApplication.java
```

Spring Boot samodejno odkrije kontrolerje, servise, repozitorije in konfiguracijo pod paketom `com.navigator.backend`.

## Konfiguracijska mapa

| Datoteka | Odgovornost |
|---|---|
| `docker-compose.yml` | Lokalni PostgreSQL, backend in frontend |
| `docker-compose.prod.yml` | Produkcijski profil, zasebni backend/baza in javni Nginx |
| `.env.example` | Primer zahtevanih produkcijskih nastavitev |
| `backend/src/main/resources/application.properties` | Skupna backend konfiguracija |
| `backend/src/main/resources/application-dev.properties` | Lokalni razvojni profil |
| `backend/src/main/resources/application-test.properties` | Testni profil |
| `backend/src/main/resources/application-prod.properties` | Produkcijske omejitve |
| `frontend/vite.config.ts` | Dev strežnik, build direktorij in API proxy |
| `frontend/nginx.conf` | Produkcijsko serviranje SPA, API-ja in tlorisov |
| `frontend/admin/vite.config.ts` | Build in razvoj admin frontenda |
| `.github/workflows/ci.yml` | Backend testi, frontend buildi, Playwright in Compose validacija |
| `.github/workflows/code-style.yml` | Build ter preverjanje zagona lokalnega stacka |

## Podatki in migracije

Projekt uporablja dva ločena mehanizma:

### `database/init/`

SQL datoteke v tej mapi Docker izvede samo pri inicializaciji novega praznega PostgreSQL volume-a. Vsebujejo začetno shemo, osnovne podatke in večje začetne posnetke navigacijskega grafa.

Sprememba teh datotek sama po sebi ne spremeni že obstoječe baze.

### `backend/src/main/resources/db/migration/`

Ta mapa vsebuje verzionirane Flyway migracije za spremembe po začetni vzpostavitvi baze. Že uporabljene migracije se ne popravljajo; nova sprememba dobi novo migracijsko datoteko.

Natančen postopek je opisan v [`data-and-navigation.md`](data-and-navigation.md).

## Zemljevidi in statični asseti

`database/maps/` je vir tlorisov, ki jih backend servira prek `/maps/`.

`frontend/public/` vsebuje statične datoteke, vključene neposredno v javni frontend build, na primer logotip, ikone in splošni zemljevid FERI. V `frontend/public/maps/` obstajajo tudi kopije nekaterih tlorisov, vendar navigacijska pogodba temelji na URL-jih in metapodatkih, ki jih vrne backend.

Pri spremembi tlorisa je treba preveriti:

- datoteko v `database/maps/`;
- zapis nadstropja v podatkovni bazi;
- URL slike;
- širino in višino koordinatnega sistema;
- vozlišča in povezave, narisane nad sliko.

## Viri resnice

| Vprašanje | Vir resnice |
|---|---|
| Kako se aplikacija trenutno obnaša? | Izvorna koda in avtomatizirani testi |
| Katere backend odvisnosti in Java različica se uporabljajo? | `backend/pom.xml` |
| Katere frontend odvisnosti se uporabljajo? | `package.json` in pripadajoči lock datoteki |
| Kako se zažene lokalno okolje? | `docker-compose.yml` |
| Kako je sestavljeno produkcijsko okolje? | `docker-compose.prod.yml`, Dockerfile-i in `frontend/nginx.conf` |
| Kakšna je začetna podatkovna struktura? | `database/init/` |
| Katere spremembe se uporabijo na obstoječi bazi? | `backend/src/main/resources/db/migration/` |
| Kateri tlorisi se servirajo za navigacijo? | `database/maps/` in metapodatki nadstropij v bazi |
| Kateri API-ji obstajajo? | Backend kontrolerji in DTO-ji |
| Katero obliko podatkov pričakuje frontend? | `frontend/src/types/` in `frontend/src/services/` |
| Kaj preverja CI? | `.github/workflows/` |
| Kako je projekt dokumentiran danes? | `README.md` in dokumenti, povezani iz `docs/README.md` |

Dokumenti v `docs/superpowers/` so zgodovinski zapisi. Uporabni so za razumevanje preteklih odločitev, vendar niso vir trenutnega vedenja.

## Povezana dokumentacija

- [`architecture.md`](architecture.md) za odnose med komponentami;
- [`frontend.md`](frontend.md) za javni in admin frontend;
- [`backend-and-api.md`](backend-and-api.md) za backend sloje in API;
- [`data-and-navigation.md`](data-and-navigation.md) za bazo, tlorise in navigacijski graf;
- [`development.md`](development.md) za namestitev odvisnosti, zagon in preverjanje.
