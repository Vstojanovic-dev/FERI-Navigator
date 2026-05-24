# Admin dokumentacija

Ovaj dokument opisuje admin map editor za FERI Navigator: sta radi, kako radi, kako se pokrece i koje funkcionalnosti trenutno podrzava.

Admin editor sluzi za odrzavanje navigacionog grafa: node-ova, veza izmedju node-ova, tipova prolaza i cross-floor konekcija. Obicna korisnicka navigacija koristi podatke koje admin editor upise u bazu.

## 1. Sta admin radi

Admin map editor omogucava:

- izbor objekta i sprata,
- prikaz mape sprata,
- prikaz node-ova preko mape,
- prikaz veza izmedju node-ova,
- dodavanje novog node-a klikom na mapu,
- izmenu postojeceg node-a,
- pomeranje node-a drag akcijom,
- brisanje node-a kada nije povezan sa lokacijama/prostorima,
- dodavanje veze izmedju dva node-a,
- dodavanje cross-floor veze izmedju node-ova na razlicitim spratovima,
- izmenu postojece veze,
- brisanje veze,
- unos rucnih instrukcija za edge,
- undo poslednje sacuvane admin akcije.

Admin ne racuna korisnicku rutu direktno. On menja podatke u `navigation_nodes` i `navigation_edges`. Posle toga normalni navigation API koristi te podatke kroz A* servis.

## 2. Gde se nalazi kod

Backend admin kod:

- `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`
- `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- `backend/src/main/java/com/navigator/backend/admin/dto/MapEditorDto.java`
- `backend/src/main/java/com/navigator/backend/admin/model/*`
- `backend/src/main/java/com/navigator/backend/admin/repository/*`

Frontend admin aplikacija:

- `frontend/admin/src/AdminApp.tsx`
- `frontend/admin/src/main.tsx`
- `frontend/admin/package.json`
- `frontend/admin/vite.config.ts`

Admin frontend je odvojena Vite aplikacija od glavnog korisnickog frontenda.

## 3. Kako se pokrece

### Backend i baza

Iz root foldera projekta:

```powershell
docker compose up -d --build backend
```

Ovo podize:

- `postgres` na portu `5432`,
- `backend` na portu `8080`.

Backend admin API je dostupan na:

```text
http://localhost:8080/api/admin/map-editor
```

### Glavni frontend

Glavni korisnicki frontend se pokrece kroz Docker Compose:

```powershell
docker compose up -d --build frontend
```

On je dostupan na:

```text
http://localhost:5173/
```

### Admin frontend u dev modu

Admin frontend se trenutno pokrece posebno iz `frontend/admin` foldera:

```powershell
npm install
npm run dev
```

Vite ce ispisati lokalni URL, tipicno:

```text
http://localhost:5174/
```

Ako treba eksplicitno vezati admin frontend na backend, koristi `VITE_API_BASE_URL`:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

Default backend URL u kodu je:

```text
http://localhost:8080
```

### Admin build

Za proveru admin frontenda:

```powershell
cd frontend/admin
npm run build
```

Build radi:

- TypeScript proveru,
- Vite production build.

## 4. Backend API

Svi endpointi su pod:

```text
/api/admin/map-editor
```

### `GET /floors`

Vraca listu spratova dostupnih editoru.

Koristi se za izbor objekta i sprata u toolbaru.

Bitna polja:

- `floorId`
- `buildingId`
- `buildingCode`
- `buildingName`
- `floorCode`
- `floorLabel`
- `mapImageUrl`
- `coordinateWidth`
- `coordinateHeight`
- `z`

### `GET /floors/{floorId}/graph`

Vraca kompletan graf za jedan sprat.

Response sadrzi:

- `floor`
- `nodes`
- `edges`

Admin frontend iz ovog response-a crta:

- map image,
- node krugove,
- same-floor edge linije,
- listu cross-floor veza.

### `GET /lookup/node-types`

Vraca dozvoljene tipove node-ova, npr:

- `room`
- `waypoint`
- `elevator`
- `stairs`
- `corridor`
- `wc`

### `GET /lookup/edge-types`

Vraca dozvoljene tipove veza, npr:

- `corridor`
- `elevator`
- `stairs`
- `virtual`
- `building_transfer`

### `POST /nodes`

Kreira novi node.

Request:

```json
{
  "floorId": 1,
  "label": "wp-new",
  "externalId": null,
  "nodeTypeCode": "waypoint",
  "x": 120.5,
  "y": 300.25,
  "isWaypoint": true,
  "isPublic": true,
  "spaceId": null
}
```

Ako `externalId` nije poslat, backend ga generise iz objekta, sprata i labela/tipa.

### `PATCH /nodes/{nodeId}`

Menja postojeci node.

Koristi se za:

- izmenu labela,
- izmenu externalId-a,
- promenu tipa,
- promenu public/waypoint flagova,
- promenu pozicije posle drag akcije.

### `DELETE /nodes/{nodeId}`

Brise node.

Backend ne dozvoljava brisanje ako je node povezan sa:

- `navigation_locations.node_id`,
- `spaces.primary_node_id`.

U tom slucaju vraca conflict gresku i node ostaje u bazi.

### `POST /edges`

Kreira vezu izmedju dva node-a.

Request:

```json
{
  "fromNodeId": 32,
  "toNodeId": 101,
  "edgeTypeCode": "elevator",
  "isBidirectional": true,
  "isCrossFloor": true,
  "isCrossBuilding": false,
  "instructionForward": "Z liftom pojdi v 2. nadstropje.",
  "instructionBackward": null,
  "landmark": "lift"
}
```

Ako je `isBidirectional=true`, backend pravi ili azurira i obrnutu vezu.

### `PATCH /edges/{edgeId}`

Menja postojecu vezu.

Koristi se za:

- promenu from/to node-a,
- promenu edge type-a,
- promenu bidirectional/cross-floor/cross-building flagova,
- izmenu instrukcija,
- izmenu landmark-a.

### `DELETE /edges/{edgeId}`

Brise vezu.

Ako postoji reverse edge i veza je bidirectional, backend brise i reverse edge.

## 5. Kako radi backend admin servis

Glavna klasa je `MapEditorService`.

Odgovornosti servisa:

- ucitava spratove i lookup tipove,
- ucitava graf za aktivni sprat,
- cuva node-ove,
- cuva edge-eve,
- validira cross-floor/cross-building pravila,
- racuna tezinu edge-a,
- pravi PostGIS geometrije,
- stiti node-ove koji su povezani sa lokacijama/prostorima.

### Node geometrija

Node koristi:

- `x`
- `y`
- `z`
- `geom` kao PostGIS `Point`

Admin frontend salje `x/y` u koordinatnom sistemu mape. Backend pravi `Point(x, y)`.

### Edge geometrija

Edge koristi:

- `fromNode`
- `toNode`
- `weight`
- `geom` kao PostGIS `LineString`

Backend pravi `LineString` od tacke pocetnog do tacke ciljnog node-a.

### Tezina edge-a

Tezina se racuna kao udaljenost izmedju geometrija node-ova.

Ako je edge cross-floor, dodaje se penalty:

```text
100
```

To pomaze A* rutiranju da promenu sprata tretira kao skuplji prelaz od obicnog hodanja.

### Validacija edge-a

Backend ne dozvoljava:

- edge iz node-a u isti node,
- vezu izmedju razlicitih spratova ako `isCrossFloor=false`,
- vezu izmedju razlicitih objekata ako `isCrossBuilding=false`,
- duplikat veze u istom smeru.

## 6. Kako radi frontend admin

Glavna komponenta je:

```text
frontend/admin/src/AdminApp.tsx
```

Admin frontend ima tri moda:

- `select`
- `add-node`
- `connect`

### Select mode

Koristi se za:

- izbor node-a,
- izbor edge-a,
- drag pomeranje node-a,
- otvaranje forme za edit.

Klik na node otvara node detalje.

Klik na edge otvara edge detalje.

Drag node-a odmah cuva novu poziciju kada korisnik pusti mis.

### Add node mode

Klik na mapu otvara formu za novi node na koordinatama klika.

Korisnik zatim bira:

- label,
- external ID,
- node type,
- space ID,
- waypoint flag,
- public flag.

Klik na `Sacuvaj node` salje `POST /nodes`.

### Connect mode

Koristi se za dodavanje edge-a.

Tok za isti sprat:

1. Klik na prvi node bira source.
2. Klik na drugi node bira target.
3. Otvara se forma za novu vezu.
4. Klik na `Sacuvaj vezu` salje `POST /edges`.

Tok za drugi sprat:

1. Klik na source node.
2. U panelu izabrati ciljni sprat.
3. Izabrati ciljni node iz dropdown-a.
4. Kliknuti `Pripremi vezu`.
5. Popuniti edge formu.
6. Sacuvati vezu.

## 7. Undo

Admin frontend ima undo za poslednju sacuvanu akciju.

Podrzano:

- dodavanje node-a,
- izmena node-a,
- pomeranje node-a,
- brisanje node-a,
- dodavanje edge-a,
- izmena edge-a,
- brisanje edge-a.

Undo se pokrece:

- klikom na `Undo` dugme u status delu,
- precicom `Ctrl+Z`,
- precicom `Cmd+Z` na macOS-u.

Undo je trenutno single-step. Cuva samo poslednju reverzibilnu akciju.

### Kako undo radi

Admin frontend pre izmene zapamti prethodni payload.

Primeri:

- ako je node dodat, undo salje `DELETE /nodes/{id}`,
- ako je node izmenjen, undo salje `PATCH /nodes/{id}` sa starim vrednostima,
- ako je node obrisan, undo salje `POST /nodes` sa starim vrednostima,
- ako je edge dodat, undo salje `DELETE /edges/{id}`,
- ako je edge izmenjen, undo salje `PATCH /edges/{id}` sa starim vrednostima,
- ako je edge obrisan, undo salje `POST /edges` sa starim vrednostima.

### Ogranicenja undo-a

Undo ne cuva originalni database ID kod obrisanog pa vracenog node-a/edge-a. Backend pri ponovnom kreiranju dodeljuje novi ID.

To je prihvatljivo za slucajne unose, ali nije isto kao transakcioni audit log.

Undo moze da ne uspe ako su se u medjuvremenu promenile zavisnosti. Primer:

- obrisan edge,
- zatim obrisan jedan od njegovih node-ova,
- undo edge-a vise nema validne node-ove.

Za ozbiljniji admin audit kasnije treba dodati backend-side history ili soft delete.

## 8. Odnos admina i korisnicke navigacije

Korisnik bira lokacije iz `navigation_locations`.

Ruta se racuna kroz:

- `navigation_nodes`
- `navigation_edges`

Admin editor menja samo graf.

Ako dodas novi node koji nije povezan sa `navigation_locations`, korisnik ga nece videti u dropdown-u kao destinaciju.

Ako dodas lokaciju bez dovoljno edge-eva, korisnik moze da je vidi, ali ruta moze vratiti `NO_ROUTE`.

Za kompletno dodavanje nove rutabilne destinacije treba:

1. postojeci ili novi node,
2. edge-evi koji povezuju node sa grafom,
3. `navigation_locations` zapis koji pokazuje na taj node,
4. mapa i koordinatni sistem sprata u `floors`.

## 9. Map rendering

Admin frontend koristi `floor.mapImageUrl` i prikazuje mapu kao sliku.

Preko slike crta SVG overlay sa:

```text
viewBox="0 0 coordinateWidth coordinateHeight"
```

Zato su `x/y` koordinate node-ova direktno kompatibilne sa mapom.

Ako je mapa lose poravnata:

- proveri `floors.coordinate_width`,
- proveri `floors.coordinate_height`,
- proveri da li je PNG ista verzija mape na kojoj su koordinate merene.

## 10. Bezbednosne napomene

Trenutno admin endpointi nemaju autentifikaciju/autorizaciju.

To znaci:

- svako ko ima pristup backend URL-u moze menjati navigacioni graf,
- ovo je prihvatljivo samo za lokalni/dev MVP,
- pre produkcije mora se dodati zastita admin API-ja.

Minimalni sledeci koraci za produkciju:

- admin login,
- role-based authorization,
- CSRF/CORS politika,
- audit log za izmene,
- soft delete ili history tabela.

## 11. Poznata ogranicenja

Trenutna ogranicenja admina:

- nema multi-step undo stack,
- nema backend audit log,
- nema bulk import/export kroz admin UI,
- nema editovanja `navigation_locations`,
- nema editovanja `spaces`,
- nema kontrole pristupa,
- admin frontend nije ukljucen u `docker-compose.yml` kao poseban servis,
- brisanje node-a je blokirano ako node ima zavisnosti u lokacijama/prostorima.

## 12. Sta testirati posle izmene admina

Minimalna checklista:

1. `GET /api/admin/map-editor/floors` vraca spratove.
2. `GET /api/admin/map-editor/floors/{floorId}/graph` vraca mapu, node-ove i edge-eve.
3. Add-node klik na mapu otvara formu sa dobrim koordinatama.
4. `Sacuvaj node` napravi novi node.
5. Undo posle dodavanja node-a obrise taj node.
6. Drag node-a cuva novu poziciju.
7. Undo posle drag-a vraca staru poziciju.
8. Connect mode pravi edge izmedju dva node-a.
9. Undo posle dodavanja edge-a brise edge.
10. Cross-floor edge se vidi u listi cross-floor veza.
11. Korisnicki route endpoint i dalje moze da izracuna poznatu MVP rutu.

## 13. Praktican mentalni model

Razmisljaj o adminu ovako:

- `floors` definise mapu i koordinatni sistem,
- `navigation_nodes` su tacke koje se crtaju na mapi,
- `navigation_edges` su linije po kojima A* sme da se krece,
- `edge_type` i `node_type` nose semantiku,
- `instruction_forward/backward` su rucne navigacione instrukcije,
- `navigation_locations` su korisnicki vidljive destinacije i nisu trenutno editovane kroz admin UI.

Ako je ruta pogresna, prvo proveri graf:

1. da li lokacija ima node,
2. da li node ima edge do ostatka grafa,
3. da li edge postoji u potrebnom smeru,
4. da li je edge type validan za filtere kao `allowElevator`,
5. da li cross-floor veza ima tacne node-ove na oba sprata.
