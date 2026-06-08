# Opis tehnologij

## Pregled

FERI Navigator je večslojni projekt: spletni frontend (React + Vite), backend API (Java + Spring Boot), relacijska baza z prostorskimi razširitvami (PostgreSQL + PostGIS), statične slike načrtov in Docker za lokalni ter produkcijski zagon. Poleg glavne uporabniške aplikacije obstaja ločen admin panel za urejanje navigacijskega grafa.

| Sloj | Tehnologije |
|------|-------------|
| Frontend (uporabnik) | React, TypeScript, Vite |
| Frontend (admin) | React, TypeScript, Vite |
| Backend | Java 21, Spring Boot 3, Maven |
| Baza | PostgreSQL, PostGIS |
| Migracije | Flyway (v backendu) |
| Kontejnerizacija | Docker, docker-compose |
| Testiranje frontenda | Playwright (e2e) |

## Frontend

### Tehnološki sklad

- **React** — uporabniški vmesnik in komponente
- **TypeScript** — tipiziran JavaScript za varnejši razvoj
- **Vite** — razvojni strežnik in orodje za produkcijski build
- **react-router-dom** — usmerjanje med glavnimi stranmi (`/`, `/objekti`, `/navigacija`, `/share/:shareCode`)

Aplikacija je **spletna web aplikacija**, ki se izvaja v brskalniku. **Ni** React Native in **ni** Expo. Oblikovanje je **mobile-first**, vendar se ne namešča kot native aplikacija.

### Struktura in podatki

- Glavna koda je v `frontend/src/`.
- Strani: `frontend/src/pages/` (`HomePage`, `BuildingsPage`, `NavigationPage`).
- Skupne komponente: `frontend/src/components/`.
- Navigacijska logika UI: `frontend/src/features/navigation/`.
- Klici API-ja: `frontend/src/services/` (`api.ts`, `catalogService.ts`, `navigationService.ts`).
- Tipi: `frontend/src/types/`.
- Pomožne funkcije: `frontend/src/utils/` (iskanje, prikazna imena, filtri tipov, opisi prostorov).

Frontend komunicira z backendom prek REST API-ja (`fetch` prek `apiFetch`). Osnovni URL API-ja se nastavi prek konfiguracije v `frontend/src/utils/runtimeConfig.ts`.

### Statične datoteke

Slike in načrti za prikaz v brskalniku morajo biti v `frontend/public/`:

- `frontend/public/images/` — npr. `zemljevidFERI.png`
- `frontend/public/maps/` — slike načrtov nadstropij in objektov
- `frontend/public/feri-logo.png` — logotip na začetni strani

V kodi se te datoteke referencirajo z absolutno potjo od korena, npr. `/images/zemljevidFERI.png` ali `/maps/objekt_c.png`.

**Frontend ne sme neposredno brati iz mape `database/` v brskalniku.** Izvorne slike načrtov so v `database/maps/`; za prikaz v UI jih je treba imeti (ali kopirati) v `frontend/public/maps/`.

### Demo podatki in odvisnost od backenda

Ko je backend zagnan, frontend pridobiva katalog objektov, prostore in navigacijske podatke prek API-ja. V `BuildingsPage` obstajajo še **rezervni demo podatki** (`DEMO_SPACES_BY_BUILDING`), ki se uporabijo, če API klic za prostore objekta ne uspe.

Za polno funkcionalnost (iskanje, navigacija, deljenje poti) morata biti zagnana backend in baza.

### Pomembne odvisnosti

- `qrcode.react` — prikaz QR kode pri deljenju poti
- `@react-pdf/renderer` — generiranje PDF-ja poti (kjer je uporabljeno)

## Backend

### Tehnološki sklad

- **Java 21**
- **Spring Boot 3.3**
- **Maven** (`backend/pom.xml`)
- **Spring Web** — REST API
- **Spring Data JPA / Hibernate** — dostop do baze in entitete
- **Spring Security** — varnost (admin način, CORS)
- **Spring Validation** — validacija vhodnih podatkov
- **Flyway** — verzionirane migracije sheme
- **PostgreSQL driver**

Backend je samostojen servis v mapi `backend/`. Vstopna točka: `FeriNavigatorApplication.java`.

### Glavne komponente

| Paket / mapa | Namen |
|--------------|-------|
| `controller/` | REST kontrolerji (`CatalogController`, `NavigationController`, …) |
| `service/` | Poslovna logika (izračun poti, katalog, deljenje) |
| `repository/` | JPA repozitoriji |
| `model/` | Entitete (Building, Floor, Space, NavNode, NavEdge, …) |
| `dto/` | DTO za API odgovore in zahteve |
| `admin/` | Admin API za urejanje grafa in SQL izvoz |
| `config/` | CORS, varnost, mape, izjeme |

### REST API (izbor)

Backend izpostavlja med drugim:

- `/api/catalog/buildings` — seznam objektov
- `/api/catalog/buildings/{id}/spaces` — prostori v objektu
- `/api/navigation/spaces` — iskanje prostorov/lokacij
- `/api/navigation/route` — izračun poti
- `/api/navigation/share` — ustvarjanje in razreševanje deljenih poti

Podrobnosti pogodb in DTO-jev so v `docs/backend.md` in `docs/navigation.md`.

### Pravilo za spremembe

Backend **ne sme** biti predmet sprememb, ko je nalogo mogoče rešiti samo na frontendu. Ob uvajanju povezave z bazo ali spremembah podatkov je treba preveriti obstoječe entitete, servise, repozitorije in kontrolerje, da se ohranijo API pogodbe.

## Baza podatkov

### Tehnologije

- **PostgreSQL 17**
- **PostGIS** — prostorske geometrije in koordinate na načrtih (lokalni koordinatni sistem, ne GPS)

### Vsebina

Baza vsebuje podatke o:

- objektih (`buildings`),
- nadstropjih (`floors`) z metapodatki načrtov,
- prostorih (`spaces`),
- tipih prostorov, vozlišč in povezav,
- navigacijskih vozliščih (`navigation_nodes`) in povezavah (`navigation_edges`),
- lokacijah za iskanje (`navigation_locations`),
- deljenih poteh (`navigation_route_shares`).

Shema in začetni podatki so v `database/init/` (SQL skripte, naložene ob prvem zagonu PostgreSQL v Dockerju). Dodatne migracije tečejo prek Flyway v backendu (`backend/src/main/resources/db/migration/`).

### Slike in načrti

- **`database/maps/`** — izvorne slike načrtov (PNG), vir za backend in za kopiranje v frontend
- **`database/images/`** — predvideno za prihodnje slike prostorov; trenutno prazno (le `.gitkeep`)
- **`frontend/public/maps/`** — kopije načrtov za prikaz v brskalniku

Koordinate na načrtih so v internem koordinatnem sistemu (ne piksli slike neposredno v bazi); frontend jih preslika na prikazano sliko.

### Povezava s frontendom

V polnem lokalnem zagonu (`docker compose up`) frontend, backend in baza delujejo skupaj. Frontend ne bere baze neposredno — vse gre prek REST API-ja.

## Docker in zagon

Projekt uporablja **docker-compose**:

- `docker-compose.yml` — lokalni razvoj (postgres, backend, frontend)
- `docker-compose.alpha.yml`, `docker-compose.prod.yml` — druga okolja

Storitve:

| Storitev | Vloga |
|----------|-------|
| `postgres` | PostGIS baza, init skripte iz `database/init/` |
| `backend` | Spring Boot na portu 8080, dostop do `database/maps/` |
| `frontend` | Zgrajen Vite build, serviran prek nginx v kontejnerju (port 5173 → 80) |

Za spremembe samo na frontendu običajno **ni potrebno** spreminjati Docker datotek — zadostuje lokalni `npm run dev` v mapi `frontend/`.

Docker konfiguracije **ne spreminjaj** brez jasne potrebe (npr. nov port, nova okoljska spremenljivka, sprememba odvisnosti storitev).

## Slike, zemljevidi in statične datoteke

| Lokacija | Namen |
|----------|-------|
| `database/maps/` | Izvorne slike načrtov (vir resnice za backend in migracije) |
| `frontend/public/maps/` | Načrti za prikaz v UI (navigacija, objekti, podrobnosti prostora) |
| `frontend/public/images/zemljevidFERI.png` | Splošni zemljevid FERI-ja (popup na začetni strani) |
| `frontend/public/feri-logo.png` | Logotip na začetni strani |
| `database/images/` | Rezervirano za slike prostorov — trenutno se ne uporabljajo |

**Slike posameznih prostorov se trenutno ne uporabljajo** v uporabniškem vmesniku. Prikazujejo se načrti objektov in nadstropij z markerji in potmi.

## Demo podatki in kasnejša povezava z backendom

Trenutno stanje:

- **Katalog in navigacija** — zasnovana za delo prek backend API-ja in baze.
- **Rezervni demo podatki** — v frontendu (`BuildingsPage`) za primere, ko API za prostore objekta ni na voljo.
- **Admin panel** (`frontend/admin/`) — ločena aplikacija za urejanje grafa; spremembe se izvažajo v SQL in commitajo v repozitorij.

Pri novih funkcijah najprej preveri, ali API endpoint že obstaja. Ne uvajaj lažnih klicev ali mockov, če je backend že implementiran.

## Pravila pri delu z AI pomočniki

1. **Ne predlagaj React Native ali Expo** — projekt je React web aplikacija z Vite.
2. **Ne dodajaj novih knjižnic brez potrebe** — vsaka nova odvisnost zahteva odobritev in posodobitev `package.json` ali `pom.xml`.
3. **Ne uvajaj dodatnih routing knjižnic** — `react-router-dom` je že v uporabi; spremembe usmerjanja naj bodo usklajene z obstoječim `AppRouter.tsx`.
4. **Ne uvajaj backend klicev**, če endpoint še ne obstaja — preveri `backend/src/.../controller/`.
5. **Če je naloga frontend** — spreminjaj predvsem `frontend/src` in po potrebi `frontend/public`; ne spreminjaj backenda, baze ali Dockerja.
6. **Če je naloga dokumentacija** — spreminjaj samo `docs/`.
7. **Ne brskaj neposredno po `database/` iz browser kode** — statične datoteke morajo biti v `frontend/public/`.
8. **Ohrani slovenski jezik UI** — novi uporabniški teksti morajo biti v slovenščini.
9. **Ne spreminjaj `package.json` / `pom.xml` / Docker datotek** brez izrecnega razloga ali odobritve.
