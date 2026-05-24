# Admin Panel - uputstvo za koriscenje

Ovaj dokument opisuje kako se koristi novi admin panel za FERI Navigator. Admin panel sluzi za uredjivanje navigacionog grafa: node-ova, edge-eva, cross-floor veza, testiranje ruta i export izmena u SQL fajl koji se commituje u projekat.

## 1. Pokretanje

Backend i baza moraju biti dostupni na:

```text
http://localhost:8080
```

Admin frontend se pokrece iz foldera `frontend/admin`:

```powershell
npm install
npm run dev
```

Vite ce ispisati URL. Ako je glavni frontend vec na `5173`, admin ce obicno biti na:

```text
http://localhost:5174/
```

Ako treba rucno zadati backend URL:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

## 2. Raspored ekrana

Admin panel ima tri glavne zone:

- Levo: vertikalni toolbar sa alatkama.
- Sredina: velika mapa aktivnog sprata.
- Desno: inspector, route preview i SQL export.

Na vrhu se biraju zgrada i sprat. Mapa uvek prikazuje node-ove i edge-eve za trenutno izabrani sprat.

## 3. Toolbar

Toolbar ima cetiri alata:

- `V` - select / move.
- `+` - dodavanje node-a.
- `-` - povezivanje node-ova.
- `X` - brisanje node-a ili edge-a.

Aktivan alat je obelezen narandzastom bojom.

## 4. Node-ovi

Node je tacka na mapi kroz koju ruta moze da prodje ili na koju moze da bude vezana lokacija.

Boja node-a zavisi od tipa:

- `room` - prostorija.
- `waypoint` - pomocna tacka na hodniku.
- `corridor` - hodnik.
- `elevator` - lift.
- `stairs` - stepenice.
- `wc` - toalet.
- `entrance` / `exit` - ulaz ili izlaz.

### Dodavanje node-a

1. Klikni `+` u toolbaru.
2. Klikni na mesto na mapi gde node treba da bude.
3. Desno u `Inspector` panelu popuni formu.
4. Izaberi `Node type`.
5. Klikni `Save node`.

Polja:

- `Label` je citljivo ime node-a.
- `External ID` je stabilni identifikator koji ide u seed SQL. Ako se ostavi prazno, backend ga generise.
- `Node type` odredjuje semantiku node-a.
- `Space ID` se koristi samo ako node treba da bude vezan za postojeci space.
- `X` i `Y` su koordinate na mapi.
- `Waypoint` oznacava pomocnu rutabilnu tacku.
- `Public` oznacava da node moze biti deo javne navigacije.

### Pomeranje node-a

1. Klikni `V` u toolbaru.
2. Klikni i drzi node na mapi.
3. Prevuci node na novu poziciju.
4. Pusti mis.

Pozicija se cuva odmah kada pustis mis. Status gore postaje `Unexported changes`.

### Izmena node-a

1. Klikni `V`.
2. Klikni node.
3. U desnom `Inspector` panelu promeni polja.
4. Klikni `Save node`.

### Brisanje node-a

1. Klikni `X`.
2. Klikni node koji zelis da obrises.
3. Potvrdi brisanje.

Backend nece dozvoliti brisanje node-a ako je vezan za `navigation_locations` ili `spaces.primary_node_id`. U tom slucaju prvo treba ukloniti ili promeniti zavisnost.

## 5. Edge-evi

Edge je veza izmedju dva node-a. Ruta moze da ide samo kroz edge-eve koji postoje u bazi.

### Povezivanje dva node-a na istom spratu

1. Klikni `-` u toolbaru.
2. Klikni prvi node. To je source.
3. Klikni drugi node. To je target.
4. Desno ce se otvoriti forma za edge.
5. Izaberi `Edge type`.
6. Ostavi `Bidirectional` ukljuceno ako se moze ici u oba smera.
7. Klikni `Save edge`.

Najcesci `Edge type` za isti sprat je `corridor`. Za vezu od hodnika do prostorije moze se koristiti `virtual`.

### Povezivanje node-ova na razlicitim spratovima

1. Klikni `-`.
2. Klikni source node na trenutnoj mapi.
3. U desnom panelu izaberi `Target floor`.
4. Izaberi `Target node`.
5. Klikni `Prepare cross-floor edge`.
6. Proveri da je `Cross-floor` ukljucen.
7. Izaberi tip veze, najcesce `elevator` ili `stairs`.
8. Klikni `Save edge`.

Cross-floor edge treba koristiti samo za stvarne prelaze izmedju spratova: lift, stepenice ili drugi vertikalni prelaz.

### Izmena edge-a

1. Klikni `V`.
2. Klikni liniju edge-a na mapi.
3. U `Inspector` panelu izmeni tip, smer, instrukcije ili landmark.
4. Klikni `Save edge`.

Polja:

- `Edge type` govori algoritmu kakav je prolaz.
- `Bidirectional` znaci da backend treba da napravi ili odrzava vezu u oba smera.
- `Cross-floor` znaci da edge spaja razlicite spratove.
- `Cross-building` znaci da edge spaja razlicite objekte.
- `Forward instruction` je tekst instrukcije u smeru source -> target.
- `Backward instruction` je tekst instrukcije u obrnutom smeru.
- `Landmark` je orijentir koji pomaze korisniku.

### Brisanje edge-a

1. Klikni `X`.
2. Klikni liniju edge-a.
3. Potvrdi brisanje.

Ako je edge bidirectional, backend moze obrisati i obrnutu vezu.

## 6. Route Preview

`Route preview` panel sluzi da odmah proveris kako izgleda korisnicka ruta posle izmena grafa.

1. U polje `From` ukucaj pocetnu lokaciju.
2. Izaberi lokaciju iz dropdown-a.
3. U polje `To` ukucaj ciljnu lokaciju.
4. Izaberi lokaciju iz dropdown-a.
5. Ruta se automatski racuna posle kratkog debounce-a.

Preview koristi isti backend kao korisnicka navigacija:

```text
GET /api/navigation/locations
GET /api/navigation/route
```

Ako ruta postoji, prikazuju se:

- tabovi po segmentima/spratovima,
- mapa sprata,
- narandzasta linija putanje,
- lista koraka.

Ako ruta ne postoji, prikazuje se greska iz backend-a, na primer:

- `NO_ROUTE` - graf nije dovoljno povezan.
- `LOCATION_WITHOUT_NODE` - lokacija nije povezana sa node-om.
- `LOCATION_NOT_FOUND` - izabrana lokacija ne postoji ili nije enabled.

## 7. SQL Export

Admin izmene se prvo cuvaju u lokalnu bazu. Da bi drugi developeri dobili iste izmene posle `pull`, izmene moraju da se exportuju u SQL i commituju.

Status gore desno pokazuje:

- `Export up to date` - nema lokalnih izmena od poslednjeg exporta.
- `Unexported changes` - napravljene su izmene koje jos nisu exportovane.

### Kako exportovati izmene

1. Klikni `Export SQL` gore desno ili `Generate` u SQL export panelu.
2. Proveri generisani SQL u preview polju.
3. Klikni `Download` ili `Copy`.
4. Zameni sadrzaj fajla:

```text
database/init/006_admin_navigation_graph.sql
```

5. Commituj taj fajl zajedno sa kodom.

Export koristi stabilne `external_id` vrednosti za node-ove. To znaci da SQL ne zavisi od lokalnih database ID-jeva.

## 8. Sta export SQL pokriva

Export generise SQL za:

- `navigation_nodes`,
- `navigation_edges`,
- `spaces.primary_node_id`,
- `navigation_locations`.

Export takodje uklanja stale edge-eve, lokacije i node-ove za exportovane zgrade kada vise ne postoje u admin stanju.

## 9. Praktican workflow

Tipican workflow za promenu grafa:

1. Pokreni backend, bazu i admin frontend.
2. Izaberi zgradu i sprat.
3. Dodaj ili pomeri node-ove.
4. Povezi node-ove edge-evima.
5. Proveri rutu kroz `Route preview`.
6. Klikni `Export SQL`.
7. Upisi export u `database/init/006_admin_navigation_graph.sql`.
8. Pokreni build/proveru.
9. Commituj izmene.

## 10. Ceste greske

### Ruta ne postoji

Proveri:

- da li obe lokacije imaju node,
- da li svaki node ima edge do ostatka grafa,
- da li postoje oba smera ako edge nije bidirectional,
- da li je cross-floor veza pravilno oznacena,
- da li je edge type kompatibilan sa rutiranjem.

### Node ne moze da se obrise

Node je verovatno povezan sa lokacijom ili space zapisom. Potrebno je prvo promeniti tu vezu u bazi ili kroz buduci location/space editor.

### Edge se ne vidi

Na mapi se prikazuju same-floor edge-evi za aktivni sprat. Cross-floor edge-evi su prikazani u desnom `Cross-floor` panelu.

### Export nije dovoljan sam po sebi

Export samo generise SQL. Da bi tim dobio izmene, generisani SQL mora biti upisan u tracked fajl i commitovan.

## 11. Ogranicenja trenutne verzije

Trenutna verzija admin panela jos nema:

- autentifikaciju i autorizaciju,
- audit log,
- multi-step undo,
- direktan editor za `navigation_locations`,
- direktan editor za `spaces`,
- automatsko pisanje exporta u repo fajl iz browsera.

Zbog toga admin treba koristiti kao dev-only alat dok se ne doda zastita i audit.
