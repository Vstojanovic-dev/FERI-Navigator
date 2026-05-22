# Navigacioni sistem

Ovaj dokument opisuje dogovorenu arhitekturu navigacionog sistema za FERI Navigator. Cilj je da sistem bude dovoljno jednostavan za MVP, ali dovoljno stabilan da kasnije podrzi lift/no-lift rute, najblizi WC, prelaze izmedju objekata i 3D navigaciju.

## Cilj funkcionalnosti

Korisnik ulazi na stranicu Navigacija i bira:

- pocetnu lokaciju,
- ciljnu lokaciju.

Polja izgledaju kao slobodan unos sa dropdown rezultatima, ali korisnik mora izabrati validnu stavku iz liste. Frontend ne salje backend-u tekst koji je korisnik kucao, nego stabilan ID izabrane lokacije.

Nakon izbora lokacija, aplikacija treba da prikaze:

- mapu trenutnog objekta/sprata,
- nacrtanu rutu preko mape,
- listu tekstualnih koraka ispod mape,
- strelice za prelaz kroz segmente rute kada ruta prelazi na drugi sprat ili drugi objekat.

Za MVP je dovoljno da postoji jedan kompletan prelaz izmedju slika, npr. izmedju dva sprata u G2. Kasnije isti mehanizam treba da radi i za prelaze izmedju objekata, npr. G2 -> G3.

## Fiksne odluke

### Baza je izvor istine

Sve lokacije, cvorovi, veze, slike mapa, spratovi, objekti i metapodaci moraju biti u bazi ili u verzionisanim seed/migration fajlovima.

`POST /api/graph/import` moze postojati kao razvojni/admin alat, ali ne sme biti glavni nacin na koji aplikacija dobija navigacione podatke. Produkcioni tok treba da radi iz vec unetih podataka.

Razlog: navigacija mora biti ponovljiva, testabilna i verzionisana. Ako se graf rucno importuje kroz API body, lako se dobije okruzenje koje radi kod jednog developera, a ne radi kod drugog.

### Koordinate ostaju u PDF koordinatnom sistemu

Tacke su crtane na PDF mapama. Provereni PDF-ovi imaju dimenzije:

- sirina: `1190.55`
- visina: `841.89`

PNG exporti iz `database/maps` imaju vecu rezoluciju, npr. `4961 x 3508`, sto je priblizno skala `4.1667x`.

Ne treba cuvati koordinate kao PNG piksele. Treba cuvati originalne PDF/canvas koordinate i uz svaki sprat cuvati:

- `coordinate_width`,
- `coordinate_height`,
- `map_image_url`.

Frontend treba da prikaze PNG sliku, a rutu da crta kao SVG overlay sa istim viewBox-om kao originalni koordinatni sistem, npr:

```tsx
<svg viewBox="0 0 1190.55 841.89">
```

Tako ruta ostaje tacna bez obzira na stvarnu velicinu slike na desktopu, telefonu ili buducem exportu.

### Dropdown salje ID, ne tekst

Korisnik moze da kuca slobodno, ali rezultat mora biti izabrana stavka iz liste.

Frontend backend-u salje:

```json
{
  "fromLocationId": 123,
  "toLocationId": 456
}
```

Ne salje:

```json
{
  "from": "Lift",
  "to": "Alfa"
}
```

Razlog: nazivi mogu biti duplirani. Na primer, `Lift` moze postojati na svakom spratu. Stabilan ID uklanja dvosmislenost.

### A* ostaje osnova, ali odgovor mora biti bogatiji

Postojeci A* koncept je dobar za trazenje najkrace rute kroz graf. Ipak, API ne sme vracati samo listu cvorova. Frontendu treba rezultat vec podeljen u segmente koji se mogu direktno prikazati.

Backend treba da vrati:

- ukupnu cenu/duzinu rute,
- segmente po objektu i spratu,
- URL slike mape za svaki segment,
- koordinatni sistem segmenta,
- tacke rute za crtanje,
- tekstualne korake,
- informaciju da li segment koristi lift, stepenice ili prelaz izmedju objekata.

Primer odgovora:

```json
{
  "totalCost": 325.4,
  "segments": [
    {
      "buildingCode": "G2",
      "floorCode": "pritlicje",
      "mapImageUrl": "/maps/g2/1_pritlicje.png",
      "coordinateWidth": 1190.55,
      "coordinateHeight": 841.89,
      "z": 0,
      "path": [
        { "x": 829.7, "y": 300.0, "z": 0 },
        { "x": 813.7, "y": 222.0, "z": 0 }
      ],
      "steps": [
        "Pojdi od vhoda do glavnega hodnika.",
        "Nadaljuj do stopnisca."
      ]
    }
  ]
}
```

### Tekstualni koraci su 80% dinamicki, 20% rucno fiksirani

Samo iz koordinata nije moguce uvek dobiti prirodan i tacan opis koraka. Algoritam moze znati da ruta ide:

```text
lift -> wp1 -> wp2 -> hodnik_kod_laboratorija -> farad_lab
```

Ali ne moze uvek pouzdano znati da li treba reci:

```text
Skreni desno kod stepenica.
```

ili:

```text
Nastavi pravo pored laboratorija.
```

Zato koraci treba da se generisu hibridno:

- dinamicki za standardne delove puta,
- rucno za kriticne prelaze, zbunjujuce hodnike, stepenice, liftove, izlaze i ulaze u druge objekte.

Na nivou `navigation_edges` ili posebne tabele treba predvideti opciona polja:

- `instruction_forward`,
- `instruction_backward`,
- `instruction_key` ili `instruction_hint`,
- `landmark`.

Ako rucni tekst postoji, backend ga koristi. Ako ne postoji, backend pravi fallback na osnovu tipa cvorova, labela, smera i ugla skretanja.

## Buduce opcije koje sistem mora podrzati

Ove opcije nisu obavezne za MVP, ali arhitektura ne sme biti krhka kada se budu dodavale.

### Lift da/ne

Navigacija ce kasnije imati opciju:

- koristi lift: da,
- koristi lift: ne.

Ako korisnik izabere `lift: ne`, algoritam ne sme koristiti ivice i cvorove koji predstavljaju lift.

To znaci da graf mora imati tipove:

- `node_type = elevator`,
- `edge_type = elevator`,
- `edge_type = stairs`,
- `edge_type = corridor`,
- `edge_type = building_transfer`.

A* servis treba da prima routing opcije:

```json
{
  "allowElevator": false
}
```

Zatim filtrira nedozvoljene ivice pre racunanja puta.

### Najblizi WC

Kasnije treba podrzati opciju "najblizi WC".

To nije obicna ruta do unapred izabranog cilja. Backend treba da:

1. primi pocetnu lokaciju,
2. nadje sve lokacije tipa `wc`,
3. izracuna najjeftiniju/najkracu rutu do dostupnog WC-a,
4. vrati istu strukturu rezultata kao i za obicnu navigaciju.

Zato lokacije i cvorovi moraju imati tipove, npr:

- `room`,
- `wc`,
- `stairs`,
- `elevator`,
- `entrance`,
- `exit`,
- `corridor`,
- `waypoint`.

### Z koordinata

Koordinate treba prosiriti sa `z` vrednoscu.

Za sada `z` moze biti vrednost na nivou celog sprata. Na primer:

- pritlicje: `z = 0`,
- medetaza: `z = 0.5`,
- 1. nadstropje: `z = 1`,
- 2. nadstropje: `z = 2`.

Svaki cvor efektivno ima:

```json
{
  "x": 253.9,
  "y": 385.8,
  "z": 2
}
```

Za 2D prikaz frontend koristi `x` i `y`. Za buducu 3D navigaciju koristi se i `z`.

## Predlozeni model podataka

Nazivi su predlog i mogu se prilagoditi postojecem backendu, ali odnosi treba da ostanu ovakvi.

### `buildings`

Predstavlja objekat, npr. G2 ili G3.

Polja:

- `id`
- `code` (`G2`, `G3`)
- `name`
- `description`

### `floors`

Predstavlja sprat u objektu.

Polja:

- `id`
- `building_id`
- `code` (`pritlicje`, `1_nadstropje`, `2_nadstropje`)
- `label`
- `level_number`
- `z`
- `map_image_url`
- `coordinate_width`
- `coordinate_height`

### `locations`

Predstavlja stavku koju korisnik vidi u dropdown-u.

Polja:

- `id`
- `name`
- `search_label`
- `building_id`
- `floor_id`
- `node_id`
- `location_type`
- `is_public`

Primeri:

- `Lift - G2, pritlicje`
- `G2-P3 Gama`
- `Referat`
- `Studentski WC`

### `navigation_nodes`

Predstavlja tacku na navigacionom grafu.

Polja:

- `id`
- `floor_id`
- `external_id`
- `label`
- `node_type`
- `x`
- `y`
- `z`
- `is_waypoint`
- `room_id` ili `location_id` ako je primenljivo

Napomena: koristimo PostGIS `Point` za 2D geometriju u lokalnom map coordinate system-u, ali i dalje eksplicitno cuvamo `x`, `y` i `z`. `x` i `y` nisu GPS koordinate i nisu PNG pikseli.

### `navigation_edges`

Predstavlja prolaz izmedju dva cvora.

Polja:

- `id`
- `from_node_id`
- `to_node_id`
- `weight`
- `edge_type`
- `is_bidirectional`
- `is_cross_floor`
- `is_cross_building`
- `instruction_forward`
- `instruction_backward`
- `landmark`

Za hodnike i standardne prolaze veza je uglavnom dvosmerna. Ako postoje smerovi koji nisu simetricni, treba ih modelovati eksplicitno.

## Backend API

### Lokacije za dropdown

Endpoint:

```http
GET /api/navigation/locations?query=...
```

Vraca samo validne izbore koje korisnik sme da izabere.

Primer:

```json
[
  {
    "id": 123,
    "name": "G2-P3 Gama",
    "buildingCode": "G2",
    "floorLabel": "2. nadstropje",
    "type": "room"
  }
]
```

### Ruta izmedju dve lokacije

Endpoint:

```http
GET /api/navigation/route?fromLocationId=123&toLocationId=456&allowElevator=true
```

Za MVP `allowElevator` moze imati default `true`, ali servis treba projektovati tako da opcija kasnije stvarno filtrira graf.

### Najblizi WC

Buduci endpoint:

```http
GET /api/navigation/nearest?fromLocationId=123&type=wc&allowElevator=true
```

Ovo nije MVP, ali data model mora podrzati `location_type = wc`.

## Frontend ponasanje

### Izbor lokacija

Na `NavigacijaPage` treba zameniti obicna input polja combobox komponentom:

- korisnik kuca tekst,
- prikazuju se rezultati,
- klik ili Enter bira rezultat,
- forma je validna samo ako postoje izabrani `fromLocationId` i `toLocationId`.

Ako korisnik ukuca tekst ali ne izabere rezultat, prikazuje se greska.

### Prikaz rute

Kada backend vrati rutu, frontend drzi:

- `segments`,
- `activeSegmentIndex`.

Prikazuje se:

- slika mape aktivnog segmenta,
- SVG overlay sa rutom aktivnog segmenta,
- lista koraka aktivnog segmenta,
- strelice za prethodni/sledeci segment ako postoji vise segmenata.

SVG overlay mora koristiti `coordinateWidth` i `coordinateHeight` iz backend odgovora:

```tsx
<svg viewBox={`0 0 ${segment.coordinateWidth} ${segment.coordinateHeight}`}>
```

### Promena slike

Promena slike nije poseban frontend hack. Ona se desava kada korisnik predje na drugi segment.

Ako ruta ima:

- segment 0: G2, pritlicje,
- segment 1: G2, 2. nadstropje,

onda strelica "sledece" menja `activeSegmentIndex` sa `0` na `1`. Time se automatski menjaju mapa, ruta i koraci.

## Segmentacija rute

Backend treba da podeli rezultat na segmente kada se promeni:

- objekat,
- sprat,
- mapa,
- ili kada postoji eksplicitni cross-building/cross-floor prelaz.

Primer:

```text
G2 pritlicje: ulaz -> stepeniste
G2 2. nadstropje: stepeniste -> G2-P3 Gama
```

To postaju dva segmenta. Frontend ih prikazuje jedan po jedan.

## Edge cases

### Korisnik nije izabrao dropdown stavku

Ne slati request za rutu. Prikazati gresku da mora izabrati validnu lokaciju.

### Pocetna i ciljna lokacija su iste

Backend treba da vrati validan odgovor sa jednom tackom i porukom da je korisnik vec na ciljnoj lokaciji.

### Lokacija postoji, ali nije povezana sa grafom

Backend treba da vrati kontrolisanu gresku, npr. `422 Unprocessable Entity`, sa porukom da lokacija nema navigacioni cvor.

### Ruta ne postoji

Backend vraca `404` ili jasno strukturisan error:

```json
{
  "message": "Put nije pronadjen za izabrane opcije."
}
```

Ovo ce biti vazno kada korisnik iskljuci lift, a ne postoji alternativa stepenicama.

### Duplirani nazivi

Dropdown mora prikazivati kontekst:

```text
Lift - G2, pritlicje
Lift - G2, 2. nadstropje
```

Backend nikada ne sme traziti cvor samo po labelu kao jedinom identifikatoru u produkcionom route endpointu.

### Nedostaje mapa za segment

Backend treba da vrati gresku ili segment oznacen kao neprikaziv. Za MVP je bolje tretirati ovo kao gresku podataka, jer korisnik ne moze dobiti kompletno iskustvo.

### Nedostaje rucni instruction hint

Backend generise fallback korak. Sistem ne sme pucati samo zato sto rucni tekst nije unesen.

### Lift zabranjen

Ako je `allowElevator=false`, algoritam mora izbaciti `elevator` cvorove/ivice iz kandidata. Ako posle toga nema rute, vraca se kontrolisana greska.

### Prelaz izmedju objekata

Prelazi izmedju objekata treba da budu modelovani kao posebne ivice, npr. `edge_type = building_transfer`. Time A* moze normalno racunati rutu kroz vise objekata.

## MVP obim

Za MVP treba uraditi najmanji kompletan scenario koji dokazuje ceo workflow:

1. Baza sadrzi G2 spratove i mape.
2. Baza sadrzi lokacije za dropdown.
3. Baza sadrzi cvorove i ivice za najmanje jednu rutu.
4. Ruta prelazi sa jedne slike na drugu, idealno sa jednog sprata G2 na drugi sprat G2.
5. Backend vraca segmentisan route response.
6. Frontend prikazuje mapu, overlay rutu, korake i strelice za segmentaciju.

G3 i ostali objekti mogu se dodati kasnije istim modelom.

## Tehnicki rizici

### Najveci rizik: nedostaju ivice

Trenutni `003_g2_staging_nodes.sql` sadrzi mnogo tacaka, ali navigacija ne moze raditi bez veza izmedju tacaka. Potrebno je uneti kompletne `navigation_edges`.

### Drugi rizik: neuskladjena SQL sema

Postojeca sema i seed fajlovi nisu potpuno uskladjeni. Pre implementacije route API-ja treba srediti semu tako da Java modeli, SQL i seed podaci koriste iste tabele i kolone.

### Treci rizik: pogresno skaliranje mape

Ako frontend crta tacke kao PNG piksele, ruta ce biti pogresna na razlicitim ekranima. Zato se koristi PDF coordinate system i SVG viewBox.

## Zakljucak

Navigacioni sistem treba graditi kao graf u bazi, sa A* racunanjem rute na backendu i segmentisanim odgovorom za frontend. Frontend treba da bude prikazivac rezultata: bira lokacije, salje ID-jeve, prikazuje aktivni segment, mapu, overlay i korake.

Ovakav pristup podrzava MVP, ali ostavlja prostor za:

- zabranu lifta,
- najblizi WC,
- prelaze izmedju objekata,
- 3D navigaciju preko `z` koordinate,
- bolji tekstualni opis koraka kroz kombinaciju dinamickog generisanja i rucnih hintova.
