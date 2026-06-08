# FERI Navigator

## Opis in vizija projekta

FERI Navigator je spletna aplikacija za lažje iskanje učilnic, kabinetov in drugih prostorov na FERI. Projekt združuje pregled prostorov, osnovne informacije o objektih in navigacijo skozi stavbo v eni aplikaciji, ki je prilagojena predvsem hitri uporabi na telefonu.

Vizija projekta je preprosta: obiskovalec ali študent mora čim hitreje najti pravi prostor in dobiti razumljivo pot do cilja, brez dodatnega spraševanja ali iskanja po hodnikih.

## Kdo so uporabniki in kaj lahko počnejo

Glavni uporabniki so študenti, obiskovalci in zaposleni na FERI, ki želijo hitro poiskati prostor ali preveriti podrobnosti o določeni učilnici. V aplikaciji lahko iščejo prostore, pregledujejo objekte in odprejo navigacijo do izbranega cilja.

Druga skupina uporabnikov so razvijalci in skrbniki sistema. Ti skrbijo za backend, podatke, zemljevide in administrativni del projekta, ki omogoča urejanje navigacijskih podatkov in vzdrževanje celotnega sistema.

## Slike projekta

Posnetki zaslona uporabniškega vmesnika bodo dodani naknadno.

## Kako zagnati projekt

Priporočeni način zagona je Docker.

### Predpogoji

- nameščen Docker Desktop,
- omogočen `docker compose`.

### Zagon

V korenu repozitorija zaženi:

```powershell
docker compose up --build
```

Ta ukaz zažene:

- PostgreSQL bazo z začetnimi podatki,
- Spring Boot backend API,
- uporabniški frontend.

Po uspešnem zagonu so glavne lokalne točke dostopa:

- frontend: `http://localhost:5173`
- backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Kje nadaljevati z branjem

Za širši pregled projekta in podrobnejšo dokumentacijo nadaljuj tukaj:

- `docs/README.md` za pregled dokumentacije,
- `docs/opis.md` za funkcionalni opis aplikacije,
- `docs/navigation.md` za razlago navigacijskega modela,
- `docs/backend.md` za backend arhitekturo in API kontekst,
- `docs/admin_panel.md` za administrativni del projekta.

## Struktura projekta

- `frontend/` vsebuje glavni uporabniški spletni vmesnik.
- `frontend/admin/` vsebuje administrativni vmesnik za urejanje navigacijskih podatkov.
- `backend/` vsebuje Spring Boot aplikacijo, API-je in poslovno logiko.
- `database/` vsebuje SQL inicializacijo baze, podatke in datoteke zemljevidov.
- `docs/` vsebuje projektno dokumentacijo in delovne zapise.
- `deploy/` vsebuje datoteke in pripomočke za nameščanje okolij.
- `docker-compose.yml` je glavni lokalni Docker zagon projekta.
- `docker-compose.prod.yml` je konfiguracija za produkcijsko okolje.
- `.env.example` vsebuje primer produkcijskih oziroma strežniških nastavitev.

## Kontakt razvijalca

Za vprašanja ali povratne informacije: `veljko.stojanovic@student.um.si`

Prijava napak prek Microsoft Forms: placeholder, povezava bo dodana naknadno.
