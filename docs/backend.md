# Backend specifikacija

Ovaj dokument opisuje koje funkcionalnosti backend FERI Navigatora treba da ima, kako treba da rade i koji su dogovoreni API/data-flow principi. Backend mora biti izvor navigacione logike; frontend treba da salje stabilne ID-jeve i prikazuje rezultat koji backend vrati.

## Glavna uloga backenda

Backend treba da:

- cita navigacione podatke iz PostgreSQL/PostGIS baze,
- izlozi API za dropdown lokacije,
- izracuna rutu izmedju dve izabrane lokacije,
- segmentira rutu po objektu i spratu,
- vrati mapu, koordinate rute i tekstualne korake za svaki segment,
- podrzi buduce opcije kao `allowElevator=false`, najblizi WC, prelaze izmedju objekata i 3D `z` koordinatu.

Backend ne treba da zavisi od toga da frontend salje tekstualne nazive lokacija. Tekst se koristi samo za pretragu/dropdown; navigacioni request mora koristiti ID-jeve iz baze.

## Tehnoloska osnova

- Framework: Spring Boot.
- Baza: PostgreSQL + PostGIS.
- Schema source of truth: SQL fajlovi u `database/init`.
- Koordinate: originalni PDF/map coordinate system.
- PostGIS SRID: `0`, jer koordinate nisu GPS.
- `x`, `y`, `z` ostaju obicne kolone zbog frontend overlay-a i buduce 3D navigacije.

Trenutni Java kod treba uskladiti sa novom bazom. Stare tabele/entiteti `nav_nodes` i `nav_edges` vise nisu ciljni model; ciljni model koristi `navigation_nodes` i `navigation_edges`.

## Domen i entiteti

Backend treba da modeluje sledece domenske celine.

### Buildings

Objekti fakulteta, npr. `G2`, kasnije `G3`.

Koristi se za:

- grupisanje spratova,
- segmentaciju rute,
- prikaz konteksta u dropdown-u.

### Floors

Sprat unutar objekta.

Bitna polja:

- `building_id`,
- `code`,
- `label`,
- `level_number`,
- `z`,
- `map_image_url`,
- `coordinate_width`,
- `coordinate_height`.

Backend mora koristiti `coordinate_width` i `coordinate_height` u route response-u da frontend moze tacno da nacrta SVG overlay.

### Spaces

Prostorije i javne lokacije koje korisnik razume: ucionice, laboratorije, WC, referat, kancelarije, prostor za ucenje.

`spaces` su katalog lokacija. One nisu dovoljne za racunanje puta; svaka navigabilna prostorija mora biti povezana sa `navigation_nodes.primary_node_id`/`space_id` vezom.

### Navigation Nodes

Tehnicke tacke grafa.

Primeri:

- waypoint,
- lift,
- stepenice,
- hodnik,
- ulaz,
- izlaz,
- WC,
- tacka ispred prostorije.

Svaki node ima:

- `external_id`,
- tip,
- `x`, `y`, `z`,
- PostGIS `geom Point`,
- pripadnost spratu.

### Navigation Edges

Veze izmedju node-ova.

Edge oznacava da korisnik moze da se krece iz jedne tacke u drugu. Bez edge-eva ne postoji ruta.

Svaki edge ima:

- `from_node_id`,
- `to_node_id`,
- tip edge-a,
- `weight`,
- PostGIS `geom LineString`,
- flags: `is_cross_floor`, `is_cross_building`,
- opcione instrukcije: `instruction_forward`, `instruction_backward`,
- opcioni `landmark`.

Backend treba da tretira edge-eve kao usmerene zapise. Ako je prolaz dvosmeran, u bazi treba da postoje oba smera ili import/seed treba da ih generise.

### Navigation Locations

Dropdown stavke koje korisnik sme da izabere.

Ovo nije isto sto i `spaces`, jer dropdown moze sadrzati i:

- ulaz,
- lift,
- stepenice,
- WC,
- prostoriju.

Route endpoint ne prima tekst, nego `navigation_locations.id`.

## API funkcionalnosti

### Health

Endpoint:

```http
GET /api/health
```

Svrha:

- brza provera da backend radi,
- opcionalno proveriti konekciju sa bazom.

Minimalan odgovor:

```json
{
  "status": "ok"
}
```

### Dropdown lokacije

Endpoint:

```http
GET /api/navigation/locations?query=...&limit=20
```

Svrha:

- frontend koristi ovaj endpoint dok korisnik kuca pocetnu ili ciljnu lokaciju,
- vraca samo lokacije koje korisnik sme da izabere.

Pravila:

- `query` moze biti prazan; tada vratiti najkorisnije/abecedno prve lokacije do limita.
- `limit` ima default `20` i maksimalnu vrednost, npr. `50`.
- Rezultat ne sme ukljuciti `waypoint` i tehnicke `corridor` tacke.
- Rezultat mora imati dovoljno konteksta da korisnik razlikuje duplirane nazive.

Primer odgovora:

```json
[
  {
    "id": 123,
    "displayName": "Lift - G2, 2. nadstropje",
    "locationType": "elevator",
    "buildingCode": "G2",
    "buildingName": "Objekt G2",
    "floorCode": "2_nadstropje",
    "floorLabel": "2. nadstropje"
  }
]
```

### Ruta izmedju dve lokacije

Endpoint:

```http
GET /api/navigation/route?fromLocationId=123&toLocationId=456&allowElevator=true
```

Svrha:

- izracuna najbolju rutu izmedju dve dropdown lokacije,
- vrati rezultat spreman za frontend prikaz.

Pravila:

- `fromLocationId` je obavezan.
- `toLocationId` je obavezan.
- `allowElevator` ima default `true`.
- Backend prvo ucita `navigation_locations`, zatim njihove `node_id` vrednosti.
- Backend ne sme traziti node samo po labelu.
- Ako su start i cilj isti, vratiti validan route response sa jednim segmentom i porukom.
- Ako lokacija ne postoji, vratiti `404`.
- Ako lokacija nema node, vratiti `422`.
- Ako ruta ne postoji, vratiti `404` sa jasnom porukom.

Primer odgovora:

```json
{
  "totalCost": 325.4,
  "message": null,
  "segments": [
    {
      "index": 0,
      "buildingCode": "G2",
      "buildingName": "Objekt G2",
      "floorCode": "pritlicje",
      "floorLabel": "Pritlicje",
      "mapImageUrl": "/maps/1_pritlicje.png",
      "coordinateWidth": 1190.55,
      "coordinateHeight": 841.89,
      "z": 0,
      "usesElevator": true,
      "usesStairs": false,
      "path": [
        { "nodeId": 1, "x": 253.9, "y": 385.8, "z": 0 },
        { "nodeId": 2, "x": 220.9, "y": 451.8, "z": 0 }
      ],
      "steps": [
        "Pojdi od lifta proti hodniku.",
        "Nadaljuj po hodniku."
      ]
    }
  ]
}
```

### Najblizi WC

Endpoint za buducu fazu:

```http
GET /api/navigation/nearest?fromLocationId=123&type=wc&allowElevator=true
```

Svrha:

- pronadje najblizu lokaciju od zadatog tipa,
- za sada primarni tip je `wc`.

Pravila:

- backend ucitava sve enabled lokacije tipa `wc`,
- racuna rutu do svake dostupne WC lokacije,
- bira rutu sa najmanjim ukupnim cost-om,
- vraca isti response format kao `/route`.

Ovo nije obavezno za MVP, ali route servis mora biti projektovan tako da se moze pozvati vise puta za vise kandidata.

### Admin/import endpointi

Postojeci import graf endpoint moze ostati samo kao razvojni/admin alat.

Produkcioni tok ne sme zavisiti od toga da neko rucno salje body sa node/edge podacima. Baza i seed/migration fajlovi su izvor istine.

Ako admin import ostane, mora biti jasno oznacen i ne sme brisati produkcione podatke bez eksplicitne namere.

## Route algoritam

Backend koristi A* ili Dijkstra varijantu nad `navigation_edges`.

Za MVP je prihvatljivo:

- A* sa euklidskom heuristikom preko `x`, `y`, `z`,
- ili Dijkstra ako heuristika komplikuje cross-floor/cross-building slucajeve.

Bitnije od naziva algoritma je da servis:

- koristi edge `weight`,
- postuje `allowElevator`,
- moze kasnije da filtrira accessibility opcije,
- vrati kompletan niz node-ova i edge-eva.

### `allowElevator=false`

Ako je `allowElevator=false`, algoritam mora izbaciti:

- edge-eve tipa `elevator`,
- node-ove tipa `elevator`, osim ako su start ili cilj direktno lift lokacija i proizvodna odluka to dozvoli kasnije.

Za MVP je dovoljno da ruta sa `allowElevator=false` ne koristi lift edge-eve.

### Weight

`weight` dolazi iz baze.

Seed moze racunati osnovni weight kroz PostGIS:

```sql
ST_Distance(from_node.geom, to_node.geom)
```

Za prelaze izmedju spratova ili objekata dodaje se penalty. Algoritam ne treba ponovo da izracunava weight ako ga baza vec cuva.

## Segmentacija rute

Nakon sto algoritam nadje put, backend mora podeliti rezultat u segmente.

Novi segment pocinje kada se promeni:

- `building_id`,
- `floor_id`,
- mapa,
- ili kada edge ima `is_cross_floor=true` ili `is_cross_building=true`.

Svaki segment mora sadrzati:

- objekat,
- sprat,
- map image URL,
- coordinate width/height,
- `z`,
- path tacke za taj segment,
- tekstualne korake za taj segment,
- flags `usesElevator`, `usesStairs`.

Frontend ne treba sam da zakljucuje kada se menja slika. To mora biti jasno iz segmenta.

## Generisanje koraka

Koraci su hibridni:

- ako edge ima `instruction_forward`, koristi se taj tekst,
- ako nema rucne instrukcije, backend generise fallback.

Fallback moze koristiti:

- tip trenutnog node-a,
- tip sledeceg node-a,
- `label`,
- `landmark`,
- ugao skretanja ako su dostupna tri uzastopna node-a.

Minimalni fallback:

```text
Nadaljuj do {nextNode.label}.
```

Za waypoint bez labela treba preskociti nepotrebne tehnicke korake i grupisati vise edge-eva u jedan citljiv korak kada je moguce.

## Error handling

Backend treba da vraca strukturisane greske:

```json
{
  "message": "Put nije pronadjen za izabrane opcije."
}
```

Ocekivani statusi:

- `400`: nedostaje obavezan parametar ili je parametar nevalidan.
- `404`: lokacija ili ruta nije pronadjena.
- `422`: lokacija postoji, ali nije povezana sa navigacionim node-om.
- `500`: neocekivana greska.

Ne sme se vracati stack trace frontend-u.

## MVP backend obim

Za prvi radni MVP backend treba da ima:

1. Entitete/repozitorijume uskladjene sa novom bazom.
2. `GET /api/navigation/locations`.
3. `GET /api/navigation/route`.
4. Route servis koji koristi postojece `navigation_edges`.
5. Segmentisani response po spratu/objektu.
6. Korake iz `instruction_forward` uz fallback.
7. `allowElevator` parametar, makar samo kao edge filter.

Nije MVP:

- kompletna G2 mreza,
- G3 podaci,
- najblizi WC endpoint,
- admin UI za unos grafa,
- 3D route response osim cuvanja i vracanja `z`.

## Test scenariji

Backend testovi treba da pokriju:

- dropdown vraca enabled lokacije i ne vraca waypoint/corridor,
- dropdown prikazuje kontekst za duplirane nazive,
- route radi izmedju dve lokacije u istom spratu,
- route radi preko cross-floor edge-a,
- `allowElevator=false` ne koristi elevator edge,
- ista pocetna i ciljna lokacija vraca validan response,
- nepostojeca lokacija vraca `404`,
- nepovezana lokacija/ruta vraca kontrolisanu gresku,
- segment response sadrzi `mapImageUrl`, `coordinateWidth`, `coordinateHeight`, `path` i `steps`.

## Vazne napomene za implementaciju

- Ne koristiti tekst iz inputa kao identifikator rute.
- Ne crtati niti skalirati rutu na backendu; backend vraca PDF/map koordinate.
- Ne racunati rutu iz `spaces` direktno; ruta ide preko `navigation_nodes` i `navigation_edges`.
- Ne oslanjati se na `label` kao jedinstven identifikator.
- Ne dopustiti da Hibernate sam menja semu u runtime-u; SQL fajlovi su izvor istine.
- Backend modeli moraju biti uskladjeni sa tabelama iz `database/init/001_schema.sql`.
