# Backend dokumentacija

Ovaj dokument je praktican handover za backend FERI Navigator projekta. Cilj nije samo da opise sta postoji, nego i da ostavi dovoljno konteksta da covek ili AI kasnije mogu bezbedno da menjaju sistem bez lomljenja navigacije, baze ili frontend ugovora.

Dokument je pisan prema trenutnom kodu u `backend/`, SQL semama u `database/init/` i frontend kontraktu u `frontend/src/types/navigation.ts`.

## 1. Sta backend radi

Backend je Spring Boot aplikacija za:

- citanje navigacionih podataka iz PostgreSQL/PostGIS baze,
- pretragu korisnickih lokacija za dropdown,
- racunanje najkrace rute kroz navigacioni graf,
- vracanje rute segmentirane po spratu,
- serviranje mapa iz `database/maps` preko HTTP-a,
- razvojni import grafa za pojedinacne spratove i cross-floor veze.

Uloga backend-a je da bude izvor istine za navigaciju. Frontend ne sme sam da odlucuje kako izgleda graf, koje su validne lokacije, ni kada se menja sprat. Frontend samo bira lokacije i crta ono sto backend vrati.

## 2. Tehnologije i runtime

- Java 21
- Spring Boot 3.3
- Spring Web
- Spring Data JPA
- PostgreSQL
- PostGIS
- Hibernate Spatial
- Lombok

Glavni entrypoint je:

- [backend/src/main/java/com/navigator/backend/FeriNavigatorApplication.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/FeriNavigatorApplication.java)

Konfiguracija aplikacije je u:

- [backend/src/main/resources/application.properties](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/resources/application.properties)

Bitne stvari iz konfiguracije:

- `server.port=8080`
- `spring.jpa.hibernate.ddl-auto=validate` po default-u
- baza se povezuje preko env promenljivih `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`

`ddl-auto=validate` je bitan: Hibernate ne treba da menja semu, samo da proveri da li Java modeli odgovaraju SQL-u. SQL fajlovi u `database/init/` su source of truth.

## 3. Arhitektura po slojevima

### Kontroleri

#### `NavigationController`

Fajl:

- [backend/src/main/java/com/navigator/backend/controller/NavigationController.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/controller/NavigationController.java)

Izlaze:

- `GET /api/navigation/locations`
- `GET /api/navigation/route`
- `GET /api/navigation/path`

Napomena:

- `/locations` i `/route` su novi API za frontend.
- `/path` je legacy/tehnicki endpoint koji radi po label/externalId stringovima i vraca sirov path bez segmentacije. Ne treba ga koristiti kao glavni frontend API.

#### `NavGraphController`

Fajl:

- [backend/src/main/java/com/navigator/backend/controller/NavGraphController.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/controller/NavGraphController.java)

Izlaze:

- `POST /api/graph/import`
- `POST /api/graph/cross-floor`

Ovo su razvojni/admin endpointi za import grafa. Produkcioni sistem ne treba da zavisi od njih kao od jedinog nacina punjenja podataka. Seed SQL ostaje primarni izvor podataka.

### Servisi

#### `NavigationRouteService`

Fajl:

- [backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java)

Ovo je glavni aplikativni servis za frontend navigaciju. Njegove odgovornosti:

- pretraga dropdown lokacija,
- validacija `fromLocationId` i `toLocationId`,
- proveravanje da li lokacije imaju povezani node,
- pozivanje A* algoritma,
- prevod rezultata u `RouteResponseDto`,
- segmentacija po spratu,
- generisanje tekstualnih koraka,
- pretvaranje gresaka u kontrolisane poslovne greske preko `NavigationRouteException`.

#### `AStarService`

Fajl:

- [backend/src/main/java/com/navigator/backend/service/AStarService.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/service/AStarService.java)

Ovo je engine za pretragu puta kroz graf.

Radi dve stvari:

- legacy `findPath(String fromLabel, String toLabel)`
- glavni `findPath(NavNode start, NavNode goal, boolean allowElevator)`

Algoritam:

- koristi `gScore`, `fScore`, `cameFrom`, `cameFromEdge`, `closedSet`
- susede cita iz `navigation_edges` preko `NavEdgeRepository.findByFromNodeId`
- heuristika je euklidska udaljenost u `x/y`
- ukupni cost je suma `edge.weight`
- ako je `allowElevator=false`, preskacu se edge-ovi tipa `elevator`

Vazno:

- algoritam tretira graf kao usmeren
- zato seed/import mora obezbediti oba smera ako je kretanje dvosmerno
- servis trenutno ne koristi `z` u heuristici

#### `NavGraphService`

Fajl:

- [backend/src/main/java/com/navigator/backend/service/NavGraphService.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/service/NavGraphService.java)

Odgovornosti:

- import node-ova i edge-eva za jedan sprat,
- brisanje starih node-ova/edge-eva za taj sprat pre reimport-a,
- pravljenje `Point` i `LineString` geometrija,
- automatsko dupliranje edge-eva u oba smera,
- import cross-floor edge-eva.

Ovo je razvojni alat. Ako ga menjas, vodi racuna da moze da obrise podatke jednog sprata.

### Repo sloj

Glavni repozitorijumi:

- [backend/src/main/java/com/navigator/backend/repository/NavigationLocationRepository.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/repository/NavigationLocationRepository.java)
- [backend/src/main/java/com/navigator/backend/repository/NavNodeRepository.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/repository/NavNodeRepository.java)
- [backend/src/main/java/com/navigator/backend/repository/NavEdgeRepository.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/repository/NavEdgeRepository.java)
- [backend/src/main/java/com/navigator/backend/repository/NodeTypeRepository.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/repository/NodeTypeRepository.java)
- [backend/src/main/java/com/navigator/backend/repository/EdgeTypeRepository.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/repository/EdgeTypeRepository.java)

Prakticne napomene:

- `NavigationLocationRepository` koristi `@EntityGraph` da odmah ucita `building`, `floor`, `node`
- `searchEnabled` vraca samo `is_enabled = true`
- `NavEdgeRepository.findByFromNodeId` radi `JOIN FETCH e.toNode`, sto je bitno da A* ne pravi previse dodatnih upita za susede
- `NavNodeRepository.findNearestOnFloor(...)` postoji za buduce map-click ili nearest-node scenarije, ali trenutno nije pozvan iz glavnog ruta toka

### DTO sloj

Glavni DTO fajlovi:

- [backend/src/main/java/com/navigator/backend/dto/NavigationLocationDto.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/NavigationLocationDto.java)
- [backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java)
- [backend/src/main/java/com/navigator/backend/dto/NavigationErrorDto.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/NavigationErrorDto.java)
- [backend/src/main/java/com/navigator/backend/dto/PathResponseDto.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/PathResponseDto.java)
- [backend/src/main/java/com/navigator/backend/dto/FloorGraphDto.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/FloorGraphDto.java)
- [backend/src/main/java/com/navigator/backend/dto/RouteSearchResult.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/dto/RouteSearchResult.java)

## 4. Domen i baza

Source of truth seme je:

- [database/init/001_schema.sql](/D:/Feri%20Navigator/FERI-Navigator/database/init/001_schema.sql)

Seed i inicijalni import:

- [database/init/002_seed_data.sql](/D:/Feri%20Navigator/FERI-Navigator/database/init/002_seed_data.sql)
- [database/init/003_g2_staging_nodes.sql](/D:/Feri%20Navigator/FERI-Navigator/database/init/003_g2_staging_nodes.sql)
- [database/init/004_load_g2_navigation_nodes.sql](/D:/Feri%20Navigator/FERI-Navigator/database/init/004_load_g2_navigation_nodes.sql)
- [database/init/005_mvp_navigation_edges.sql](/D:/Feri%20Navigator/FERI-Navigator/database/init/005_mvp_navigation_edges.sql)

### Glavne tabele

#### `buildings`

Predstavlja objekte fakulteta, npr. `G2`.

Bitna polja:

- `code`
- `name`
- `description`
- `image_url`

#### `floors`

Predstavlja sprat unutar objekta.

Bitna polja:

- `building_id`
- `code`
- `label`
- `level_number`
- `z`
- `map_image_url`
- `coordinate_width`
- `coordinate_height`

Ovo je kljucno za frontend overlay. Backend vraca iste koordinate kao u bazi, a frontend koristi `viewBox` dimenzije da iscrta putanju.

#### `spaces`

Ovo je katalog realnih prostora razumljivih korisniku.

Primeri:

- ucionica
- laboratorija
- kancelarija
- WC
- prostor za ucenje

`spaces.primary_node_id` povezuje realan prostor sa navigacionim grafom.

#### `navigation_nodes`

Tehnicke tacke grafa.

Bitna polja:

- `floor_id`
- `node_type_id`
- `space_id`
- `external_id`
- `label`
- `x`
- `y`
- `z`
- `geom`
- `is_waypoint`
- `is_public`

Java model:

- [backend/src/main/java/com/navigator/backend/model/NavNode.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/model/NavNode.java)

`external_id` mora ostati stabilan jer se koristi u seed/import procesu i u legacy putanji.

#### `navigation_edges`

Veze izmedju node-ova.

Bitna polja:

- `from_node_id`
- `to_node_id`
- `edge_type_id`
- `weight`
- `geom`
- `is_bidirectional`
- `is_cross_floor`
- `is_cross_building`
- `instruction_forward`
- `instruction_backward`
- `landmark`

Java model:

- [backend/src/main/java/com/navigator/backend/model/NavEdge.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/model/NavEdge.java)

Iako baza ima `is_bidirectional`, trenutni A* i repo sloj koriste eksplicitne usmerene zapise. U praksi to znaci da moraju postojati obe vrste reda ako je prolaz dvosmeran. Seed `005_mvp_navigation_edges.sql` to radi automatski preko `UNION ALL`.

#### `navigation_locations`

Ovo je lista lokacija koje frontend nudi korisniku.

Bitna polja:

- `display_name`
- `searchable_name`
- `location_type`
- `building_id`
- `floor_id`
- `node_id`
- `space_id`
- `is_enabled`

Java model:

- [backend/src/main/java/com/navigator/backend/model/NavigationLocation.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/model/NavigationLocation.java)

`navigation_locations` je vazna apstrakcija: frontend bira lokacije iz ove tabele, ne iz `spaces`, ne iz `navigation_nodes`, i ne po slobodnom tekstu.

### Tipovi koji postoje u seed-u

`node_types`:

- `room`
- `entrance`
- `exit`
- `elevator`
- `stairs`
- `corridor`
- `waypoint`
- `wc`
- `building_transfer`

`edge_types`:

- `corridor`
- `stairs`
- `elevator`
- `entrance`
- `building_transfer`
- `virtual`

`space_types`:

- `classroom`
- `laboratory`
- `office`
- `wc`
- `service`
- `public_area`

## 5. Tok podataka

### 5.1 Pretraga lokacija

Tok:

1. Frontend salje `GET /api/navigation/locations?query=...&limit=20`
2. `NavigationController` prosledjuje zahtev u `NavigationRouteService.searchLocations`
3. Servis normalizuje `limit` na opseg `1..50`
4. `NavigationLocationRepository.searchEnabled` vraca samo enabled lokacije
5. Rezultat se mapira u `NavigationLocationDto`
6. Frontend prikazuje `displayName` i meta podatke o objektu/spratu

Bitno:

- pretraga ide preko `searchable_name` i `display_name`
- query moze biti prazan string
- backend trenutno ne namece eksplicitni `ORDER BY`, pa redosled zavisi od baze i pageable implementacije; ako ti treba deterministicko sortiranje, uvedi ga u repo upitu

### 5.2 Racunanje rute

Tok:

1. Frontend bira dve stavke iz dropdown-a
2. Salje `GET /api/navigation/route?fromLocationId=...&toLocationId=...&allowElevator=true`
3. `NavigationRouteService.route(...)` ucita obe lokacije
4. Ako lokacija ne postoji ili je disabled, baca se `NavigationRouteException`
5. Servis proverava da li lokacije imaju `node`
6. Poziva `AStarService.findPath(startNode, goalNode, allowElevator)`
7. `AStarService` vraca `RouteSearchResult` sa:
   - listom node-ova
   - listom edge-eva
   - ukupnim cost-om
8. `NavigationRouteService`:
   - segmentira rezultat po spratu
   - generise `steps`
   - pravi `RouteResponseDto`
9. Kontroler vraca:
   - `200` sa rutom
   - ili status iz `NavigationRouteException` sa `NavigationErrorDto`

### 5.3 Frontend prikaz

Frontend kontrakt je definisan u:

- [frontend/src/types/navigation.ts](/D:/Feri%20Navigator/FERI-Navigator/frontend/src/types/navigation.ts)

Frontend navigacija koristi:

- [frontend/src/pages/NavigacijaPage.tsx](/D:/Feri%20Navigator/FERI-Navigator/frontend/src/pages/NavigacijaPage.tsx)

Frontend ocekuje:

- `segments[]`
- svaki segment mora imati `mapImageUrl`
- svaki segment mora imati `coordinateWidth` i `coordinateHeight`
- `path` je lista tacaka u istom koordinatnom sistemu kao mapa
- `steps` imaju `fromNodeId` i `toNodeId` da frontend moze da highlight-uje aktivni deo putanje

Ako promenis shape ovih DTO-a, moras menjati i frontend tipove i map rendering.

## 6. API ugovor

### `GET /api/navigation/locations`

Parametri:

- `query` default `""`
- `limit` default `20`

Odgovor:

- lista `NavigationLocationDto`

Polja DTO-a:

- `id`
- `displayName`
- `locationType`
- `buildingId`
- `buildingCode`
- `buildingName`
- `floorId`
- `floorCode`
- `floorLabel`
- `nodeId`
- `hasNode`

### `GET /api/navigation/route`

Parametri:

- `fromLocationId` obavezno
- `toLocationId` obavezno
- `allowElevator` default `true`

Odgovor:

- `RouteResponseDto`

Top-level polja:

- `routeId`
- `from`
- `to`
- `totalCost`
- `segments`

`RouteSegmentDto` polja:

- `index`
- `buildingId`
- `buildingCode`
- `buildingName`
- `floorId`
- `floorCode`
- `floorLabel`
- `mapImageUrl`
- `coordinateWidth`
- `coordinateHeight`
- `z`
- `usesElevator`
- `usesStairs`
- `path`
- `steps`

### `GET /api/navigation/path`

Legacy endpoint.

Parametri:

- `from`
- `to`

Trazi node po:

1. `external_id`
2. pa fallback `label` case-insensitive

Vraca `PathResponseDto` bez segmentacije. Koristan je za debug, ali nije dobar ugovor za ozbiljan frontend.

### `POST /api/graph/import`

Request DTO: `FloorGraphDto.ImportRequest`

Koristi se za:

- reimport cvorova i edge-eva jednog sprata

Efekat:

- brise stare node-ove i edge-eve za sprat
- upisuje nove
- generise geometrije
- upisuje edge u oba smera

### `POST /api/graph/cross-floor`

Koristi se za ručni unos cross-floor edge-eva.

Takodje generise oba smera.

## 7. Kako radi rutiranje

### A* pravila

Trenutna implementacija:

- start i cilj su `NavNode`
- ako su isti `id`, vraca se ruta sa jednim node-om i cost `0`
- susedi se citaju iz `navigation_edges` gde je `from_node_id = current`
- `tentativeG = trenutni cost + edge.weight`
- `f = tentativeG + heuristic(neighbor, goal)`

Heuristika:

- koristi samo `x` i `y`
- formula je euklidska udaljenost

Posledice:

- radi dobro za lokalni graf
- nije savrseno svesna promene sprata
- ali posto je `weight` iz baze izvor istine, i cross-floor edge-evi imaju penalty, ruta ipak ostaje upotrebljiva

Ako budes menjao algoritam:

- ne pomeraj odgovornost za tezine sa baze na frontend
- ne koristi `displayName` za nalazenje cvorova
- zadrzi `allowElevator` kao filtrirajuci kriterijum u grafu

### `allowElevator`

Trenutno:

- ako je `false`, `AStarService` skipuje samo edge-eve tipa `elevator`

To znaci:

- elevator node i dalje mogu postojati u path-u ako do njih vodi drugi tip veze
- trenutno je to prihvatljivo za MVP

Ako budes uvodio accessibility pravila:

- filtriranje podigni na nivo "koji skup edge-eva ulazi u pretragu"
- nemoj hardkodovati posebna pravila po labelama node-ova
- oslanjaj se na `edge_type` i `node_type`

## 8. Kako radi segmentacija

Segmentaciju radi `NavigationRouteService.buildSegments(...)`.

Trenutna logika:

- segment krece sa prvim node-om
- za svaki edge dodaje se sledeci node i jedan step
- kada se promeni `floorId`, trenutni segment se zatvara
- pravi se novi segment za novi sprat
- isti cross-floor edge dobija:
  - korak izlaska u starom segmentu
  - arrival korak u novom segmentu

Svaki segment je vezan za jedan `Floor`.

Prakticna posledica:

- frontend dobija odvojene tabove po spratu
- mapa se menja po segmentu
- aktivan korak moze da highlight-uje jednu deonicu na aktivnoj mapi

Ogranicenje trenutne implementacije:

- segmentacija gleda samo promenu `floorId`
- ne proverava posebno `building_id`, `is_cross_floor` ili `is_cross_building`

To je dovoljno dok je sistem prakticno G2-only. Kada uvedes vise objekata, segmentaciju treba prosiriti da menja segment i na promenu objekta.

## 9. Kako se generisu tekstualni koraci

`NavigationRouteService.instruction(...)` koristi sledeca pravila:

1. Ako edge ima `instruction_forward` i nije arrival-context, koristi taj tekst.
2. Ako je edge tip `elevator`:
   - odlazak: "Udjite u lift i idite na sprat ..."
   - dolazak: "Izadjite iz lifta i nastavite po prikazanoj putanji."
3. Ako je edge tip `stairs`:
   - odlazak: "Idite stepenicama do sprata ..."
   - dolazak: "Izadjite sa stepenica i nastavite po prikazanoj putanji."
4. Ako je ciljni node tip `room`, vraca poruku dolaska.
5. Ako je edge tip `corridor` ili `virtual`, vraca "Nastavite prema ..."
6. Inace fallback je "Pratite putanju do ..."

`readableLabel(...)` koristi:

- `node.label` ako postoji
- inace `external_id` sa `_` -> razmak, lower-case

Napomena:

- trenutne poruke su mesavina lokalnog jezika u seed instrukcijama i fallback poruka iz Java koda
- ako budes standardizovao jezik, radi to sistemski kroz seed + fallback, ne parcijalno

## 10. Serviranje mapa

Mape su PNG fajlovi u:

- `database/maps/`

Static resource config:

- [backend/src/main/java/com/navigator/backend/config/MapResourceConfig.java](/D:/Feri%20Navigator/FERI-Navigator/backend/src/main/java/com/navigator/backend/config/MapResourceConfig.java)

Backend izlaže:

- `/maps/**`

Podrazumevana lokacija:

- `file:./database/maps/`

To je bitno zato sto `floors.map_image_url` sadrzi vrednosti kao `/maps/1_pritlicje.png`, a frontend ih pretvara u `http://localhost:8080/maps/...`.

Ako promenis putanju fajlova, moras:

- azurirati `feri.maps.location`
- proveriti da `floors.map_image_url` i dalje pokazuje na validne URL-ove

## 11. Sta seed trenutno priprema

### `002_seed_data.sql`

Priprema:

- lookup tipove
- building `G2`
- sve G2 spratove
- map metadata (`map_image_url`, `coordinate_width`, `coordinate_height`, `z`)

### `003_g2_staging_nodes.sql`

Sadrzi staging skup G2 tacaka po spratovima. Ovo jos nije glavni graf, nego izvor za naredni import korak.

### `004_load_g2_navigation_nodes.sql`

Radi sledece:

- prevodi staging tacke u `navigation_nodes`
- dodeljuje `node_type` heuristikom iz `node_key`/`label`
- kreira `spaces` za destinacije tipa `room` i `wc`
- povezuje `spaces.primary_node_id`
- kreira `navigation_locations` za sve javne destinacije osim `waypoint` i `corridor`

To je centralni SQL korak koji pravi frontend-vidljive lokacije.

### `005_mvp_navigation_edges.sql`

Dodaje minimalan set edge-eva za MVP.

Vazno:

- ovo nije kompletan graf G2
- zato backend moze da rutira samo kroz ogranicen deo zgrade
- mnoge lokacije mogu postojati u dropdown-u, ali nemati put do drugih lokacija

To nije bag u Java kodu sam po sebi, nego ogranicenje trenutno unetih edge-eva.

## 12. Poznata ogranicenja trenutnog stanja

Ovo je najvazniji deo za buduce izmene.

### 1. Nije kompletan graf

`navigation_locations` moze imati mnogo lokacija, ali `navigation_edges` trenutno sadrzi samo MVP putanje. Zato je realno ocekivano da neke rute vrate `NO_ROUTE`.

### 2. Segmentacija je floor-only

Ako se uvede vise objekata i cross-building veze, `buildSegments(...)` mora da reaguje i na promenu objekta, ne samo sprata.

### 3. `NavigationLocation.node` je u Java modelu `nullable=false`

Trenutni model:

- `@JoinColumn(name = "node_id", nullable = false)`

Zbog toga je `hasNode()` trenutno prakticno zastitni sloj, ali SQL schema takodje kaze da `node_id` ne sme biti null. Ako pozelis "lokacija postoji ali jos nije mapirana na node", mora se menjati i schema i model.

### 4. `AStarService` heuristika ne koristi `z`

To nije kriticno dok `weight` dobro modeluje kretanje, ali vredi znati.

### 5. Nema globalnog exception handler-a

`/route` radi lokalni try/catch za `NavigationRouteException`. Ako kasnije uvedes vise kontrolera i slozeniji error model, bolje je da to ode u `@ControllerAdvice`.

### 6. `/path` endpoint je tehnicki dug

On prihvata string `from/to`, trazi po labeli i nije stabilan API za ozbiljnu integraciju. Ako ga zadrzis, tretiraj ga kao debug alat.

### 7. Pretraga lokacija nema eksplicitno sortiranje

Ako korisnicki UX postane bitan, dodaj deterministicko sortiranje po relevantnosti ili abecedi.

### 8. `pom.xml` ima duplirane dependency i plugin unose

Trenutno postoje duplikati za:

- `spring-boot-starter-data-jpa`
- `postgresql`
- `spotless-maven-plugin`

To ne mora odmah da obori rad, ali je tehnicki dug i treba ga srediti pazljivo da se ne promeni build ponasanje.

## 13. Pravila za buduce izmene

Ako AI ili covek menja backend, ovo su pravila koja ne treba krsiti bez jasne migracije plana.

### Pravilo 1: `database/init/*.sql` je source of truth

Ne ispravljaj model samo u Javi ako SQL schema govori drugacije. Uvek proveri:

- `001_schema.sql`
- seed/import skripte
- da li `ddl-auto=validate` i dalje prolazi

### Pravilo 2: Frontend bira `navigation_locations.id`

Ne vracaj sistem nazad na "rutiraj po nazivu". Stabilan identitet rute je:

- `fromLocationId`
- `toLocationId`

### Pravilo 3: Backend vraca map koordinate, ne piksele browser prikaza

`x`, `y`, `z`, `coordinateWidth`, `coordinateHeight` moraju ostati u internom map/PDF koordinatnom sistemu. Frontend radi skaliranje kroz SVG `viewBox`.

### Pravilo 4: Graf je skup `navigation_nodes` + `navigation_edges`

Nemoj racunati put direktno iz `spaces` ili `navigation_locations`.

### Pravilo 5: Edge `weight` dolazi iz baze

Ne uvodi u frontend ili DTO sloj "skrivenu" logiku za cost. Ako menjas routing ponasanje, menjaj:

- seed/SQL logiku za tezine
- ili algoritamski filter edge-eva

### Pravilo 6: `external_id` mora ostati stabilan

Koristi se za:

- seed/import povezivanje
- legacy debug endpoint
- SQL skripte za edges

### Pravilo 7: Kada dodajes novi tip pristupacnosti, modeluj ga kroz tipove i filtere

Primer:

- wheelchair
- avoid_stairs
- avoid_elevator
- staff_only

Takve stvari treba graditi preko:

- `node_type`
- `edge_type`
- eventualno novih boolean/metapodataka u bazi

Ne hardkoduj pravila po `label` tekstu.

### Pravilo 8: Segment response je frontend ugovor

Ako menjas `RouteResponseDto`, odmah proveri:

- `frontend/src/types/navigation.ts`
- `frontend/src/pages/NavigacijaPage.tsx`

Posebno ne uklanjaj:

- `segments`
- `mapImageUrl`
- `coordinateWidth`
- `coordinateHeight`
- `path`
- `steps`
- `fromNodeId`
- `toNodeId`

## 14. Preporuceni smer za naredne izmene

Najrazumniji redosled razvoja je:

1. Dopuniti `navigation_edges` da graf pokrije veci deo G2.
2. Dodati testove za `NavigationRouteService` i `AStarService`.
3. Uvesti `@ControllerAdvice` za jedinstven error model.
4. Prosiriti segmentaciju na promenu objekta.
5. Uvesti nearest-location scenarije, npr. najblizi WC.
6. Dodati sortiranje / ranking za pretragu lokacija.
7. Ako treba, prosiriti routing filtere za accessibility opcije.

## 15. Sta testirati posle svake backend izmene

Minimalna checklista:

1. `GET /api/navigation/locations` vraca validne lokacije.
2. `GET /api/navigation/route` radi za poznatu MVP rutu.
3. `allowElevator=false` za rutu koja inace koristi lift daje:
   - alternativu preko stepenica ili
   - kontrolisanu gresku ako alternativa ne postoji
4. `mapImageUrl` pokazuje na fajl koji backend stvarno servira.
5. Frontend i dalje ume da iscrta `polyline` bez pomerenih koordinata.
6. Seed skripte i JPA modeli su i dalje uskladjeni.

## 16. Kratak mentalni model za AI

Ako kasnije neki AI bude menjao backend, najbezbednije je da razmislja ovako:

- `navigation_locations` = ono sto korisnik bira
- `navigation_nodes` = tacke grafa
- `navigation_edges` = kako se izmedju njih krece
- `AStarService` = nalazi niz node-ova i edge-eva
- `NavigationRouteService` = pretvara sirov path u frontend-friendly response
- `floors` = definisu mapu i koordinatni sistem za prikaz
- `database/init/*.sql` = istina o podacima i semama

Ako ova podela ostane cista, sistem ce ostati lak za dalje sirenje.
