# Backend in API

Backend je Spring Boot aplikacija v `backend/`. Je osrednji vir poslovnih pravil za katalog, navigacijo, deljenje poti in lokalno urejanje navigacijskega grafa.

## Sloji

| Paket | Odgovornost |
|---|---|
| `controller/` | HTTP endpointi in vhodni parametri |
| `service/` | Poslovna pravila, rutiranje, lokalizacija in sestava odgovorov |
| `repository/` | Dostop do PostgreSQL podatkov |
| `model/` | JPA entitete |
| `dto/` | API zahteve in odgovori |
| `config/` | Security, CORS, napake, profili in tlorisi |
| `admin/` | Lokalni map editor in SQL izvoz |

Tipičen tok je:

```text
HTTP zahteva -> Controller -> Service -> Repository -> PostgreSQL
                                      -> DTO odgovor
```

Kontrolerji naj ostanejo tanki. Poslovna pravila sodijo v servise, poizvedbe pa v repozitorije.

## Javni API

### Katalog

| Metoda | Pot | Namen | Odgovor |
|---|---|---|---|
| `GET` | `/api/catalog/buildings` | Seznam objektov | `BuildingCatalogDto[]` |
| `GET` | `/api/catalog/buildings/{buildingId}/spaces` | Prostori izbranega objekta | `CatalogSpaceDto[]` |

`BuildingCatalogDto` vsebuje `id`, `name`, `description`, `imageUrl` in `spaceCount`.

`CatalogSpaceDto` vsebuje `id`, `name`, `type`, `buildingId`, `buildingName`, `floor`, `description` in `imageUrl`.

### Lokacije in navigacija

| Metoda | Pot | Namen |
|---|---|---|
| `GET` | `/api/navigation/locations` | Iskanje lokacij, ki jih je mogoče izbrati za navigacijo |
| `GET` | `/api/navigation/spaces` | Iskanje prostorov za javni katalog |
| `GET` | `/api/navigation/locations/{id}` | Podrobnosti ene navigacijske lokacije |
| `GET` | `/api/navigation/route` | Izračun poti |

`GET /api/navigation/locations`:

- `query`, privzeto prazen niz;
- `limit`, privzeto `20`, backend ga omeji na `1..200`;
- `Accept-Language`, opcijsko `sl` ali `en`.

`GET /api/navigation/spaces` uporablja enak model, privzeti limit pa je `200`.

Lokacijski odgovor vsebuje:

```text
id, displayName, locationType,
buildingId, buildingCode, buildingName,
floorId, floorCode, floorLabel,
nodeId, spaceId, spaceName, spaceTypeName,
description, imageUrl, hasNode
```

### Izračun poti

`GET /api/navigation/route` sprejme:

| Parameter | Obveznost | Pomen |
|---|---|---|
| `fromLocationId` | obvezen | Začetna navigacijska lokacija |
| `toLocationId` | natanko eden od ciljnih parametrov | Določena ciljna lokacija |
| `targetType` | natanko eden od ciljnih parametrov | Dinamični cilj; trenutno samo `wc` |
| `allowElevator` | neobvezen, privzeto `true` | Preferenca vertikalnega premikanja |

`toLocationId` in `targetType` ne smeta biti podana hkrati in eden od njiju mora biti podan.

Odgovor `RouteResponseDto` vsebuje:

- `routeId`;
- začetno in ciljno lokacijo;
- `totalCost`;
- `segments`.

Vsak segment vsebuje identiteto objekta in nadstropja, URL tlorisa, koordinatne dimenzije, `z`, uporabo dvigala/stopnic, točke poti in besedilne korake.

`allowElevator` je preferenca, ne absolutna prepoved. Backend poskuša načine vertikalnega premikanja v vrstnem redu, ki ga določi `VerticalPreferenceResolver`, in lahko uporabi nadomestni način, če preferirana pot ne obstaja.

### Deljenje poti

| Metoda | Pot | Namen |
|---|---|---|
| `POST` | `/api/navigation/share` | Shrani vhodne podatke poti in vrne povezavo |
| `GET` | `/api/navigation/share/{shareCode}` | Vrne shranjene vhodne podatke |

Zahteva za ustvarjanje vsebuje:

```json
{
  "fromLocationId": 1,
  "toLocationId": 2,
  "targetType": null,
  "allowElevator": true
}
```

Tudi tukaj mora biti podan natanko en ciljni parameter. Odgovor vsebuje `shareCode` in `shareUrl`.

Deljena pot hrani izbiro, ne izračunane geometrije. Frontend ob odprtju povezave zahteva nov izračun poti.

## Kompatibilni in razvojni endpointi

### `GET /api/navigation/path`

To je starejši, tehnični endpoint za iskanje poti po `external_id` oziroma labeli vozlišča. Vrača enostaven seznam vozlišč brez segmentov po nadstropjih.

Javni frontend ga ne uporablja. Nova uporabniška funkcionalnost naj uporablja `/api/navigation/route`.

### `/api/graph`

| Metoda | Pot | Namen |
|---|---|---|
| `POST` | `/api/graph/import` | Uvoz grafa enega nadstropja |
| `POST` | `/api/graph/cross-floor` | Uvoz povezav med nadstropji |

Endpointa sta razvojna/import mehanizma. Nista zaščitena z admin guardom in `NavGraphController` trenutno dovoljuje CORS `*`. Ne smeta se obravnavati kot varen javni produkcijski API. Pred resno produkcijsko uporabo ju je treba onemogočiti, odstraniti ali ustrezno zaščititi.

## Admin API

Vsi endpointi imajo predpono `/api/admin/map-editor` in zahtevajo omogočen `app.admin.enabled`.

| Metoda | Pot | Namen |
|---|---|---|
| `GET` | `/floors` | Razpoložljiva nadstropja |
| `GET` | `/floors/{floorId}/graph` | Vozlišča in povezave nadstropja |
| `GET` | `/lookup/node-types` | Tipi vozlišč |
| `GET` | `/lookup/edge-types` | Tipi povezav |
| `GET` | `/export/sql` | Izvoz celotnega SQL posnetka |
| `POST` | `/nodes` | Novo vozlišče |
| `PATCH` | `/nodes/{nodeId}` | Sprememba vozlišča |
| `DELETE` | `/nodes/{nodeId}` | Brisanje vozlišča |
| `POST` | `/edges` | Nova povezava |
| `PATCH` | `/edges/{edgeId}` | Sprememba povezave |
| `DELETE` | `/edges/{edgeId}` | Brisanje povezave |

Admin guard vrne `404`, ko je admin način izklopljen. Ko je vklopljen, trenutna konfiguracija ne zahteva prijave. Zato je admin namenjen samo zaupanja vrednemu lokalnemu okolju.

## Napake

Navigacijske in admin poslovne napake se prek `ApiExceptionHandler` vrnejo v obliki:

```json
{
  "code": "NO_ROUTE",
  "message": "Za izbrani lokaciji še ni določene poti."
}
```

Pomembne kode vključujejo:

- `INVALID_TARGET`;
- `UNSUPPORTED_TARGET_TYPE`;
- `MISSING_LOCATION`;
- `LOCATION_NOT_FOUND`;
- `LOCATION_WITHOUT_NODE`;
- `TARGET_TYPE_NOT_AVAILABLE`;
- `NO_ROUTE_TO_TARGET_TYPE`;
- `NO_ROUTE`;
- `INVALID_ROUTE_DATA`;
- `SHARE_NOT_FOUND`.

Frontend naj uporablja `code` za stabilno razločevanje scenarijev, `message` pa za prikaz uporabniku.

## Profili in konfiguracija

| Profil | Namen |
|---|---|
| osnovni | Skupni datasource, JPA, Flyway, Actuator in aplikacijske lastnosti |
| `dev` | Lokalni razvoj, SQL log in omogočen admin |
| `test` | Izolirane testne nastavitve |
| `prod` | Izklopljen admin, obvezni CORS/share URL in skriti health detajli |

Ključne okoljske spremenljivke:

- `DB_URL`;
- `DB_USERNAME`;
- `DB_PASSWORD`;
- `APP_CORS_ALLOWED_ORIGINS`;
- `APP_SHARE_BASE_URL`;
- `APP_ADMIN_ENABLED`;
- `SERVER_PORT`.

## Pravila za spremembo API-ja

Ob spremembi javnega odgovora je treba uskladiti:

1. backend DTO;
2. servis, ki DTO sestavlja;
3. kontrolerske in servisne teste;
4. `frontend/src/types/`;
5. `frontend/src/services/`;
6. komponente, ki podatke uporabljajo;
7. ta dokument.

Ne preimenujte ali odstranite polja samo na eni strani pogodbe.

## Testna mapa

| Področje | Testi |
|---|---|
| Zagon aplikacije | `BackendApplicationTests` |
| Katalog | `CatalogServiceTest`, `CatalogControllerTest` |
| A* | `AStarServiceTest` |
| Pot, segmenti in navodila | `NavigationRouteServiceTest` |
| Route HTTP pogodba | `NavigationControllerTest` |
| Vertikalne preference | `VerticalPreferenceResolverTest` |
| Admin način | `AdminModeGuardTest` |
| Admin SQL snapshot | `backend/src/test/java/com/navigator/backend/seed/` |

Celotna backend zbirka:

```powershell
Set-Location backend
.\mvnw.cmd test
```

## Povezana dokumentacija

- [`architecture.md`](architecture.md) za sistemski kontekst;
- [`frontend.md`](frontend.md) za frontend odjemalce;
- [`data-and-navigation.md`](data-and-navigation.md) za podatkovne in routing invariante;
- [`development.md`](development.md) za razvojni workflow.
