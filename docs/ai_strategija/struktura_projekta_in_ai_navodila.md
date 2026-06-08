# Struktura projekta in navodila za AI pomočnike

## Struktura projekta

```
FERI-Navigator/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/navigator/backend/
│   │   │   │   ├── admin/          # admin API, modeli, repozitoriji
│   │   │   │   ├── config/         # CORS, varnost, mape
│   │   │   │   ├── controller/     # REST kontrolerji
│   │   │   │   ├── dto/            # API DTO
│   │   │   │   ├── model/          # JPA entitete
│   │   │   │   ├── repository/     # Spring Data repozitoriji
│   │   │   │   └── service/        # poslovna logika
│   │   │   └── resources/
│   │   │       ├── application*.yml
│   │   │       └── db/migration/   # Flyway migracije
│   │   └── test/                   # JUnit testi
│   ├── pom.xml
│   ├── Dockerfile
│   └── mvnw, mvnw.cmd
├── frontend/
│   ├── public/
│   │   ├── maps/                   # načrti za prikaz v brskalniku
│   │   ├── images/                 # npr. zemljevidFERI.png
│   │   ├── feri-logo.png
│   │   └── favicon.svg
│   ├── admin/                      # ločen admin panel (Vite)
│   │   └── src/
│   ├── src/
│   │   ├── app/                    # AppRouter, App
│   │   ├── pages/                  # HomePage, BuildingsPage, NavigationPage
│   │   ├── components/             # skupne UI komponente
│   │   ├── features/
│   │   │   └── navigation/         # navigacijski UI (karta, koraki, deljenje)
│   │   ├── services/               # API klici
│   │   ├── types/                  # TypeScript tipi
│   │   ├── utils/                  # iskanje, imena, filtri, opisi
│   │   └── hooks/                  # npr. useBackNavigation
│   ├── tests/                      # Playwright e2e
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── database/
│   ├── init/                       # SQL shema in seed (docker-entrypoint-initdb.d)
│   ├── maps/                       # izvorne slike načrtov
│   ├── images/                     # rezervirano za slike prostorov (trenutno prazno)
│   └── assets/
├── docs/                           # dokumentacija
├── deploy/                         # nginx konfiguracije, skripte
├── docker-compose.yml
├── docker-compose.alpha.yml
├── docker-compose.prod.yml
└── README.md
```

## Opis glavnih map

### `backend/`

Spring Boot backend: REST API, entitete, repozitoriji, servisi, kontrolerji. Izračunava navigacijske poti (A*), streže katalog objektov in prostorov, upravlja deljene povezave. Admin podmodul omogoča urejanje navigacijskega grafa in SQL izvoz.

### `frontend/`

React/Vite uporabniška aplikacija: UI, strani, komponente, klici API-ja. Mobile-first spletni vmesnik v slovenščini.

### `frontend/public/`

Statične datoteke, dostopne neposredno iz brskalnika (`/maps/...`, `/images/...`).

### `frontend/public/maps/`

Slike načrtov nadstropij in objektov za prikaz v navigaciji, na strani objektov in v podrobnostih prostora.

### `frontend/public/images/`

Slike za frontend, npr. `zemljevidFERI.png` za popup na začetni strani.

### `frontend/src/pages/`

Strani aplikacije:

| Datoteka | Pot | Vloga |
|----------|-----|-------|
| `HomePage.tsx` | `/` | Začetna stran, iskanje prostorov |
| `BuildingsPage.tsx` | `/objekti` | Vsi objekti, podrobnosti objekta |
| `NavigationPage.tsx` | `/navigacija`, `/share/:code` | Navigacija |

Podrobnosti prostora (`SpaceDetailsView`) niso ločena pot — prikažejo se znotraj `HomePage` ali `BuildingsPage` prek `location.state`.

### `frontend/src/components/`

Skupne komponente: meni (`MainMenuOverlay`), iskalno polje (`SearchField`), glava podstrani (`SubPageHeader`), podrobnosti prostora (`SpaceDetailsView`), predogled karte (`SpaceMapPreview`), modalna okna (`OverlayModal`), itd.

### `frontend/src/features/navigation/`

Navigacijski UI: izbira lokacij, prikaz poti na načrtu (`RouteMap`), koraki (`StepList`), deljenje (`SharePanel`), PDF poti.

### `frontend/src/services/`

- `api.ts` — osnovni `fetch` wrapper in obravnava napak
- `catalogService.ts` — objekti in prostori
- `navigationService.ts` — lokacije, poti, deljenje

### `frontend/src/utils/`

Pomožne funkcije: iskanje (`search.ts`), krajša prikazna imena (`displayNames.ts`), filtri tipov (`spaceTypeFilter.ts`), opisi prostorov (`spaceDescription.ts`), poti do slik načrtov (`buildingPlanImages.ts`), lokacija na karti (`spaceMapLocation.ts`).

### `frontend/admin/`

Ločen Vite projekt za admin panel — urejanje navigacijskega grafa. Ni del glavne uporabniške aplikacije.

### `database/init/`

SQL skripte za inicializacijo baze ob prvem zagonu PostgreSQL v Dockerju: shema, seed podatki, navigacijski vozli in povezave, metapodatki map.

### `database/maps/`

Izvorne slike načrtov (PNG). Backend jih lahko servira ali referencira; za frontend je treba imeti ustrezne kopije v `frontend/public/maps/`.

### `database/images/`

Predvideno za prihodnje slike prostorov. Trenutno se v UI ne uporabljajo.

### `docs/`

Projektna dokumentacija. Za funkcionalni opis aplikacije glej `opis_aplikacije.md`, za tehnologije `opis_tehnologij.md`. Globlji tehnični dokumenti: `backend.md`, `navigation.md`, `admin_panel.md`.

## Pravila za delo z AI

AI pomočnik mora pri vsaki nalogi:

1. **Najprej razumeti**, kateri del projekta se spreminja (frontend, backend, baza, dokumentacija).
2. **Spreminjati samo nujne datoteke** — najmanjši smiseln diff.
3. **Ne delati velikega refaktoriranja** brez izrecne zahteve.
4. **Ne dodajati novih knjižnic** brez odobritve.
5. **Ne spreminjati backenda**, ko je naloga frontend.
6. **Ne spreminjati frontend kode**, ko je naloga samo dokumentacija.
7. **Ne dotikati Docker konfiguracije** brez jasnega razloga.
8. **Ne spreminjati `package.json` ali `pom.xml`** brez odobritve.
9. **Ohraniti obstoječi slog kode** — imena, struktura map, CSS moduli, vzorci komponent.
10. **Izbrati najpreprostejšo stabilno rešitev** — brez nepotrebne abstrakcije.
11. **Ne brisati obstoječih funkcionalnosti**, razen če uporabnik to izrecno zahteva.
12. **Upoštevati mobile-first** oblikovanje.
13. **Upoštevati slovenski jezik UI** — novi teksti v vmesniku morajo biti v slovenščini.
14. **Komentarje v kodi** pisati kratko in jasno (lahko v slovenščini ali angleščini, skladno z okolico datoteke).
15. **Po spremembah preveriti build**, če je mogoče (`npm run build` za frontend, `mvn test` za backend).

## Pravila za frontend naloge

**Spreminjaj:**

- predvsem `frontend/src/`
- po potrebi `frontend/public/` (nove ali posodobljene slike načrtov)
- po potrebi `frontend/tests/` (e2e testi)

**Ne spreminjaj:**

- `backend/`
- `database/` (razen če je eksplicitno zahtevano)
- `docker-compose*.yml`
- `package.json` (brez odobritve)

**Preveri:**

- `npm run build` v mapi `frontend/`
- da slike za prikaz referencirajo poti v `/maps/` ali `/images/`, ne `database/`
- da novi uporabniški teksti so v slovenščini
- da navigacija ne računa poti v frontendu — pot prihaja iz API-ja

## Pravila za backend naloge

**Spreminjaj:**

- `backend/src/main/java/`
- po potrebi `backend/src/main/resources/`
- teste v `backend/src/test/`

**Preveri:**

- obstoječe entitete v `model/`
- repozitorije v `repository/`
- servise v `service/`
- kontrolerje in DTO-je — **API pogodbe morajo ostati stabilne** ali morajo biti namerno verzionirane
- ujemanje z JPA/Hibernate in shemo v `database/init/` oziroma Flyway migracijah

**Ne spreminjaj:**

- frontend (razen če je potrebna integracija ali nova polja v odgovoru)
- Docker brez potrebe

**Preveri:**

- `mvn test` ali vsaj relevantne teste v `backend/`

## Pravila za database naloge

**Spreminjaj:**

- `database/init/` za seed in začetno shemo
- `backend/src/main/resources/db/migration/` za Flyway migracije (po dogovoru)

**Preveri:**

- da spremembe ustrezajo entity razredom v backendu
- da koordinate in `map_image_url` ostanejo usklajene z datotekami v `database/maps/` in `frontend/public/maps/`
- da se podatki ne brišejo brez opozorila

**Ne:**

- briši tabele ali seed podatke brez jasne zahteve
- spreminjaj frontend samodejno ob SQL spremembah

## Pravila za dokumentacijo

**Spreminjaj:**

- samo `docs/` (in po potrebi koreninski `README.md`, če je naloga to vključuje)

**Ne spreminjaj:**

- kode aplikacije (`frontend/`, `backend/`, `database/`)

**Posodobi:**

- zastarele reference (npr. `opis.md` → `opis_aplikacije.md`)
- ne omenjaj odstranjenih strani (O FERI), React Native, ali slik prostorov, če se ne uporabljajo

## Kaj AI ne sme narediti brez dovoljenja

- dodajanje novih npm ali Maven odvisnosti
- zamenjava `react-router-dom` z drugo routing rešitvijo
- uvajanje React Native, Expo ali PWA namestitve kot glavne smeri
- sprememba Docker, nginx ali CI/CD konfiguracije
- sprememba API pogodb (DTO, URL poti) brez usklajevanja z dokumentacijo in frontendom
- brisanje obstoječih strani, menijskih postavk ali navigacijskih funkcij
- neposredno branje `database/` iz frontend kode
- uporaba fotografij prostorov v UI (trenutno niso predvidene)
- sprememba `package.json`, `pom.xml`, `docker-compose.yml` brez razloga
- velik refaktor map ali preimenovanje množice datotek
- commit ali push v git (razen če uporabnik izrecno zahteva)

## Kontrolni seznam pred zaključkom naloge

- [ ] Spremembe so v pravi mapi (frontend / backend / database / docs).
- [ ] Ni nepotrebnih sprememb v drugih modulih.
- [ ] Novi UI teksti so v slovenščini.
- [ ] Slike za prikaz so v `frontend/public/`, ne v `database/` referencah iz browserja.
- [ ] Navigacija in iskanje še vedno uporabljata API, ne lokalnega grafa v frontendu.
- [ ] Ni dodanih odvisnosti brez odobritve.
- [ ] Build ali testi so preverjeni, kjer je to smiselno.
- [ ] Dokumentacija odraža dejansko stanje (brez O FERI, brez React Native, brez slik prostorov).
- [ ] Diff je čim manjši in rešuje konkretno nalogo.
