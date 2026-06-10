# Obvezna pravila za AI agente

Ta dokument je namenjen agentom, ki analizirajo ali spreminjajo repozitorij. Pravila so obvezna, razen če uporabnik izrecno zahteva drugače.

## Pred začetkom

1. Preberite `README.md`, `docs/README.md` in dokument področja naloge.
2. Preglejte trenutno stanje repozitorija z `git status --short`.
3. Obstoječe spremembe obravnavajte kot uporabnikovo delo.
4. Pred spremembo poiščite dejanski vir resnice v kodi, testih, konfiguraciji ali shemi.
5. Ne sklepajte, da zgodovinski načrt v `docs/superpowers/` opisuje trenutno implementacijo.

## Obseg spremembe

- Spreminjajte samo datoteke, potrebne za nalogo.
- Ne izvajajte nepovezanih refaktorjev, preimenovanj ali formatiranja.
- Uporabite obstoječe vzorce in meje modulov.
- Nove abstrakcije dodajte samo, če odstranijo resnično podvajanje ali kompleksnost.
- Ne spreminjajte javne pogodbe brez uskladitve vseh odjemalcev, testov in dokumentacije.

## Prepovedana dejanja

Brez izrecnega navodila uporabnika agent ne sme:

- commitati, pushati, ustvariti ali združiti pull requesta;
- uporabiti `git reset --hard`, `git checkout --` ali drugega ukaza, ki izgubi spremembe;
- izbrisati ali povoziti uporabnikovih nepovezanih sprememb;
- spreminjati že uporabljene Flyway migracije;
- ročno spreminjati produkcijske podatke kot nadomestilo za migracijo;
- dodati skrivnosti, gesel, dumpov ali `.env` datotek v repozitorij;
- javno izpostaviti admin frontend, admin API, bazo ali backend port;
- trditi, da je funkcija zaključena brez preverjanja.

## Frontend

- Uporabniško besedilo mora uporabljati oba slovarja v `frontend/src/i18n/messages/`.
- API dostop naj poteka prek `frontend/src/services/`.
- API tipi v `frontend/src/types/` morajo ostati usklajeni z backend DTO-ji.
- Frontend ne računa lastne poti in ne ugiba manjkajoče geometrije.
- Tloris, koordinatne dimenzije in točke uporabljajo isti koordinatni sistem.
- Sprememba navigacijskega prikaza zahteva ciljni Playwright test.
- PDF generator ni uporabniško dostopna funkcija, dokler ni povezan v UI in testiran.

## Backend in API

- Kontrolerji naj ostanejo tanki; poslovna logika sodi v servise.
- Poizvedbe sodijo v repozitorije, HTTP oblike pa v DTO-je.
- Stabilno razlikovanje napak uporablja `code`, ne besedila `message`.
- Sprememba API-ja zahteva uskladitev backend testov, frontend tipov, servisov in dokumentacije.
- `allowElevator` je trenutno preferenca z možnim fallbackom, ne stroga prepoved.
- `/api/graph/import` in `/api/graph/cross-floor` sta nezaščitena razvojna write endpointa.

## Podatki in navigacija

- `database/init/` velja samo za novo prazno bazo.
- Nova sprememba obstoječe baze dobi novo Flyway migracijo.
- `external_id` navigacijskega vozlišča je stabilen identifikator.
- Dvosmerna pot zahteva oba usmerjena zapisa povezave.
- Teža povezave mora biti pozitivna.
- Sprememba tlorisa zahteva preverjanje koordinat, dimenzij, vozlišč in poti.
- Admin izvoz je treba pregledati in pretvoriti v migracijo; ne izvaja se slepo v produkciji.
- Rezervirana placeholderja migracij se ne uporabljata za nove spremembe.

## Varnost in produkcija

- Produkcija uporablja profil `prod` in `APP_ADMIN_ENABLED=false`.
- CORS mora vsebovati eksplicitne dovoljene origine, ne wildcarda.
- Skrivnosti morajo priti iz okolja oziroma sistema za upravljanje skrivnosti.
- Javno naj bo izpostavljen samo reverse proxy/frontend.
- Spremembe deploya morajo ohraniti health/readiness preverjanje.
- Pred podatkovno migracijo je potreben preverjen backup in rollback načrt.
- Trenutni Compose ni dokaz popolne produkcijske pripravljenosti; upoštevajte omejitve iz `deployment-and-operations.md`.

## Dokumentacija

- Dokumentirajte vedenje, ki obstaja, ne načrtovanega vedenja.
- Pišite v slovenščini, kratko in za bralca, ki mora opraviti nalogo.
- Ne podvajajte podrobnosti, če je dovolj povezava na en vir resnice.
- Ob spremembi zagona, API-ja, strukture, migracij ali operacij posodobite pripadajoči dokument.
- `docs/superpowers/plans/` in `docs/superpowers/specs/` se ohranita kot zgodovina.
- Navodila agentom ne sodijo v uporabniško kazalo `docs/README.md`.

## Obvezno preverjanje

Izberite preverjanje glede na obseg:

| Sprememba | Minimalno preverjanje |
|---|---|
| Backend | ciljni test in `backend\mvnw.cmd test` |
| Javni frontend | ciljni test, build in lint |
| Navigacijski UI | build in ustrezni Playwright testi |
| Admin frontend | admin build |
| Compose ali okolje | `docker compose config` za prizadeto datoteko |
| Migracija ali graf | backend testi ter znane poti v obe smeri |
| Dokumentacija | povezave, ukazi, poti in skladnost s trenutno kodo |

Če preverjanja ni mogoče izvesti, agent mora navesti točen razlog in preostalo tveganje. Uspeha ne sme sklepati iz samega pregleda kode.

## Zaključek naloge

Agent mora poročati:

1. kaj je spremenil;
2. katera preverjanja je izvedel in njihov rezultat;
3. katere omejitve ali tveganja ostajajo;
4. da commit ni bil ustvarjen, če ga uporabnik ni zahteval.
