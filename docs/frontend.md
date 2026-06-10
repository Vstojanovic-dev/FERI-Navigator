# Frontend

FERI Navigator vsebuje dva ločena React uporabniška vmesnika:

- javni frontend v `frontend/`;
- lokalni urejevalnik navigacijskega grafa v `frontend/admin/`.

Oba uporabljata isti backend, vendar imata različni vlogi in različna pravila uporabe.

## Javni frontend

Javni frontend je mobilno usmerjena SPA aplikacija. Glavne poti so določene v `frontend/src/app/AppRouter.tsx`:

| Pot | Stran | Namen |
|---|---|---|
| `/` | `HomePage` | Iskanje prostorov in prikaz podrobnosti |
| `/objekti` | `BuildingsPage` | Pregled objektov in prostorov v objektu |
| `/navigacija` | `NavigationPage` | Izbor lokacij in prikaz poti |
| `/share/:shareCode` | `NavigationPage` | Nalaganje deljene izbire poti |

## Struktura javnega frontenda

| Mapa | Odgovornost |
|---|---|
| `src/app/` | Korenska aplikacija in usmerjanje |
| `src/pages/` | Glavne strani |
| `src/components/` | Splošne komponente, uporabljene na več straneh |
| `src/features/navigation/` | Celoten navigacijski uporabniški tok |
| `src/services/` | Dostop do backend API-ja |
| `src/types/` | TypeScript oblike API podatkov |
| `src/i18n/` | Jeziki, prevodi in izbira aktivnega jezika |
| `src/utils/` | Iskanje, prikaz imen in pomožna logika |
| `tests/` | Playwright testi uporabniških tokov |

Nova koda naj sledi obstoječim mejam. Logika, ki pripada samo navigaciji, naj ostane v `features/navigation/`; splošna komponenta naj gre v `components/`.

## Tok podatkov

`frontend/src/services/api.ts` je skupna vstopna točka za HTTP zahteve. Skrbi za:

- sestavo URL-ja;
- pošiljanje aktivnega jezika v glavi `Accept-Language`;
- pretvorbo neuspešnega odgovora v `ApiError`;
- razreševanje URL-jev slik in drugih assetov.

Področna odjemalca sta:

- `catalogService.ts` za objekte in prostore;
- `navigationService.ts` za lokacije, poti in deljenje.

Komponente ne smejo podvajati splošnega `fetch` in error-handling vedenja, če ga lahko uporabijo prek teh servisov.

## Runtime URL

Javni frontend bere `VITE_API_BASE_URL` v `frontend/src/utils/runtimeConfig.ts`.

- Če je vrednost prazna, uporablja relativne poti, na primer `/api/...` in `/maps/...`.
- V Docker/Nginx okolju Nginx te poti posreduje backendu.
- V lokalnem Vite okolju `frontend/vite.config.ts` proxy zahteve posreduje na `http://localhost:8080`.
- Če frontend in backend živita na različnih origin-ih, mora biti `VITE_API_BASE_URL` eksplicitno nastavljen ob buildu.

## Navigacijski prikaz

`NavigationView.tsx` upravlja:

- začetno in ciljno lokacijo;
- izbiro najbližjega WC-ja;
- nastavitev uporabe dvigala;
- nalaganje poti;
- aktivni odsek in korak;
- deljenje poti.

Backend vrne `NavigationRoute`, definiran v `frontend/src/types/navigation.ts`. Frontend pričakuje:

- `segments[]` po nadstropjih oziroma objektih;
- URL tlorisa;
- širino in višino koordinatnega sistema;
- točke poti;
- besedilne korake z začetnim in končnim vozliščem.

`RouteMap.tsx` sliko tlorisa in SVG pot prikaže v istem koordinatnem sistemu. Koordinate iz odgovora niso CSS piksli in se ne smejo ročno pretvarjati glede na trenutno velikost zaslona.

`routeGeometry.ts` določi, kateri del geometrije pripada aktivnemu koraku. Spremembe te logike lahko povzročijo napačno črto skozi stene ali napačen prikaz po menjavi nadstropja, zato zahtevajo ciljne Playwright teste.

## Lokalizacija

Javni frontend podpira:

- slovenščino;
- angleščino.

Glavna slovarja sta:

- `frontend/src/i18n/messages/sl.ts`;
- `frontend/src/i18n/messages/en.ts`.

Uporabniški tekst naj bo dodan kot prevodni ključ. Komponente ne smejo uvajati novih trdo zapisanih uporabniških sporočil samo v enem jeziku.

Aktivni jezik se shrani v brskalnik in se pošilja backendu, da so lokalizirana tudi navodila in napake.

## Deljenje in PDF

Deljenje poti je povezano s trenutnim uporabniškim vmesnikom:

- frontend od backenda pridobi deljeno povezavo;
- uporabnik jo lahko kopira ali deli prek brskalnika;
- frontend lahko prikaže QR-kodo.

Komponenti `RoutePdf.tsx` in `useRoutePdf.tsx` vsebujeta generator PDF-ja, vendar trenutni `NavigationView` ne prikazuje gumba, ki bi ga poklical. PDF zato ni trenutno zaključena uporabniška funkcija. Če se ponovno vključi, je treba dodati UI, teste in posodobiti uporabniško dokumentacijo.

## Admin frontend

Admin aplikacija je v `frontend/admin/` in ima svoj:

- `package.json`;
- `package-lock.json`;
- `tsconfig.json`;
- `vite.config.ts`;
- jezikovni sloj.

Glavna komponenta `AdminApp.tsx` upravlja prikaz tlorisa, vozlišč, povezav, obrazcev, predogleda poti in SQL izvoza.

Admin privzeto kliče `http://localhost:8080`, razen če je nastavljen `VITE_API_BASE_URL`. Namenjen je lokalnemu delu z backendom, pri katerem je omogočen admin način.

Admin UI ni varen javni produkcijski panel. Backend admin endpointi nimajo uporabniške prijave; produkcijski profil jih zato izklopi.

## Kje izvesti običajno spremembo

| Sprememba | Najprej preverite |
|---|---|
| Nova ali spremenjena stran | `src/pages/`, `src/app/AppRouter.tsx` |
| Splošna UI komponenta | `src/components/` |
| Navigacijski obrazec ali prikaz poti | `src/features/navigation/` |
| API zahteva | `src/services/`, nato `src/types/` |
| Uporabniško besedilo | oba slovarja v `src/i18n/messages/` |
| Iskanje in razvrščanje | `src/utils/search.ts` |
| Runtime API URL | `src/utils/runtimeConfig.ts`, Vite in Nginx konfiguracija |
| Admin urejevalnik | `frontend/admin/src/AdminApp.tsx` in backend `/api/admin/map-editor` |

## Invariante

- Frontend pošilja identifikatorje izbranih lokacij, ne samo vpisanega besedila.
- Frontend ne računa lastne alternativne poti.
- Backend in frontend oblika `NavigationRoute` morata ostati usklajeni.
- Jezik se mora uporabljati tako v UI-ju kot v API zahtevah.
- Tloris, `coordinateWidth`, `coordinateHeight` in točke poti morajo uporabljati isti koordinatni sistem.
- Admin sprememba ni trajna produkcijska sprememba, dokler ni pregledana in zapisana kot migracija.

## Preverjanje sprememb

Iz mape `frontend/`:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
```

Za spremembe uporabniških tokov:

```powershell
npm.cmd run test:e2e
```

Za admin frontend iz `frontend/admin/`:

```powershell
npm.cmd run build
```

Če je sprememba omejena na določen navigacijski problem, najprej zaženite ustrezen ciljni Playwright test, nato celoten `test:e2e`.

## Povezana dokumentacija

- [`architecture.md`](architecture.md) za meje sistema;
- [`backend-and-api.md`](backend-and-api.md) za API pogodbe;
- [`data-and-navigation.md`](data-and-navigation.md) za navigacijski model;
- [`development.md`](development.md) za namestitev odvisnosti in celoten razvojni tok.
