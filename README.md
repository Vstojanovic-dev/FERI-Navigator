# FERI Navigator

FERI Navigator je namenjen študentom, zaposlenim in obiskovalcem FERI. Omogoča iskanje prostorov in uporabnika po tlorisih ter razumljivih korakih vodi do cilja, tudi med različnimi nadstropji.

Repozitorij vsebuje javno aplikacijo, backend, podatkovni in navigacijski model ter lokalno administratorsko orodje za urejanje navigacijskega grafa.

## Ključne zmožnosti

- iskanje objektov in prostorov FERI;
- navigacija med izbrano začetno in ciljno lokacijo;
- prikaz poti na tlorisu aktivnega nadstropja;
- navodila po korakih in prehodi med nadstropji;
- izbira uporabe dvigala;
- iskanje najbližjega stranišča;
- deljenje poti s povezavo ali QR-kodo;

## Hiter začetek

### Predpogoji

Za priporočeni način zagona potrebujete:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/);
- podporo za ukaz `docker compose`.

### Zagon

V korenu repozitorija zaženite:

```powershell
docker compose up -d --build
```

Docker Compose zažene PostgreSQL/PostGIS podatkovno bazo, Spring Boot backend in javni React frontend.

| Storitev | Naslov |
|---|---|
| Aplikacija | <http://localhost:5173> |
| Backend API | <http://localhost:8080> |
| Zdravje backenda | <http://localhost:8080/actuator/health> |
| PostgreSQL | `localhost:5432` |

Stanje storitev:

```powershell
docker compose ps
```

Ustavitev:

```powershell
docker compose down
```

## Dokumentacija

Za celoten pregled začnite v [`docs/README.md`](docs/README.md), nato pa izberite dokument glede na svoje delo:

- **uporaba aplikacije:** [`docs/user-guide.md`](docs/user-guide.md);
- **prvi pregled za razvijalce:** [`docs/architecture.md`](docs/architecture.md), nato [`docs/repository-structure.md`](docs/repository-structure.md) in [`docs/development.md`](docs/development.md);
- **javni ali administratorski frontend:** [`docs/frontend.md`](docs/frontend.md);
- **backend ali API:** [`docs/backend-and-api.md`](docs/backend-and-api.md);
- **podatkovna baza, zemljevidi ali navigacijski graf:** [`docs/data-and-navigation.md`](docs/data-and-navigation.md);
- **namestitev in vzdrževanje:** [`docs/deployment-and-operations.md`](docs/deployment-and-operations.md).

## Struktura repozitorija

```text
FERI-Navigator/
├── frontend/                 # Javni React uporabniški vmesnik
│   ├── src/                  # Strani, komponente, funkcije in API odjemalci
│   ├── public/               # Statične slike, ikone in tlorisi
│   └── admin/                # Lokalno orodje za urejanje navigacijskega grafa
├── backend/                  # Spring Boot API, poslovna logika in izračun poti
│   └── src/                  # Produkcijska koda, konfiguracija, migracije in testi
├── database/
│   ├── init/                 # Začetna shema in podatki nove podatkovne baze
│   └── maps/                 # Izvorni tlorisi za navigacijo
├── docs/                     # Projektna dokumentacija in zgodovinski načrti
├── deploy/                   # Pripomočki za preverjanje namestitve
├── docker-compose.yml        # Lokalno razvojno okolje
└── docker-compose.prod.yml   # Osnova za produkcijsko okolje
```

## Kontakt

Za vprašanja o projektu pišite na `veljko.stojanovic@student.um.si`.
