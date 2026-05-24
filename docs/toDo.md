# ToDo - buduci feature-i

Ovaj dokument outline-uje buduce feature-e koje treba dodati u FERI Navigator. Fokus je na stvarima koje prosiruju osnovnu viziju projekta iz `docs/opis.md`: mobilna web aplikacija koja korisniku pomaze da se brzo snadje u FERI prostoru, pronadje ucionicu i dobije jasan, upotrebljiv navigacioni tok.

Feature-i ispod nisu napisani kao finalna specifikacija, nego kao radni backlog: sta bi trebalo da rade, koju vrednost daju korisniku i sta tehnicki otvaraju za dalji razvoj.

## 1. 3D mapa zgrade sa 3D navigacijom

### Sta treba da radi

Korisnik treba da moze da vidi zgradu i rutu ne samo kao 2D mapu sprata, nego i kao 3D prikaz kroz vise nivoa zgrade. To znaci:

- prikaz vise spratova u istom prostoru,
- vizuelno jasno kretanje izmedju spratova,
- oznacavanje lifta, stepenista i prelaza,
- highlight aktivnog dela rute u 3D prikazu.

### Sta omogucava korisniku

- mnogo lakse razumevanje vertikalnog kretanja,
- manje zbunjenosti kada ruta prelazi sa jednog sprata na drugi,
- bolji osecaj gde se korisnik nalazi u celini objekta, a ne samo na jednoj slici sprata.

### Sta tehnicki podrazumeva

- uvodjenje 3D modela zgrade ili dovoljno dobrog 3D apstraktnog prikaza,
- koriscenje `z` koordinate kao stvarnog dela navigacije, ne samo metadata polja,
- backend response koji moze da vrati 3D putanju bez lomljenja 2D fallback prikaza,
- frontend koji ume da prebaci korisnika izmedju 2D i 3D moda.

## 2. Accessibility feature za citanje koraka

### Sta treba da radi

Navigacija treba da moze glasovno da cita korake korisniku dok se krece kroz zgradu. To moze biti dugme za pokretanje citanja ili automatsko citanje aktivnog koraka.

Minimalno ponasanje:

- procitaj trenutni korak,
- procitaj sledeci korak,
- ponovi poslednji korak,
- jasno naglasi promenu sprata, lift i stepenice.

### Sta omogucava korisniku

- bolju pristupacnost za korisnike sa slabijim vidom,
- manje gledanja u ekran tokom hodanja,
- bezbedniju i prakticniju navigaciju na telefonu.

### Sta tehnicki podrazumeva

- frontend integraciju sa text-to-speech mehanizmom,
- konzistentan format koraka iz backend-a,
- eventualno krace i prirodnije varijante step poruka za glasovno citanje,
- kasnije mogucnost izbora jezika i brzine citanja.

## 3. Backend feature za tacniji opis koraka

### Sta treba da radi

Backend treba da generise mnogo prirodnije, preciznije i korisnije korake nego sto su trenutni fallback opisi. Koraci treba da koriste kontekst prostora, tipove node-ova i edge-eva, landmarke i smer kretanja.

Primer cilja:

- nije dovoljno samo "Nastavite prema X"
- treba da bude blize "Prodjite hodnikom do lifta, zatim skrenite levo prema laboratoriji"

### Sta omogucava korisniku

- manju sansu da se izgubi,
- manje oslanjanja samo na mapu,
- prirodniji dozivljaj navigacije, posebno na mestima gde je raspored zbunjujuci.

### Sta tehnicki podrazumeva

- bogatije instrukcije na `navigation_edges`,
- logiku za grupisanje vise kratkih edge-eva u jedan ljudski smislen korak,
- moguce uvodjenje pravila za skretanje levo/desno/pravo,
- kasnije i prilagodjavanje koraka za accessibility citanje i 3D prikaz.

## 4. 360 slike od node-ova

### Sta treba da radi

Za odabrane bitne node-ove aplikacija treba da prikazuje 360 fotografije ili panorame prostora. To mogu biti:

- ulazi,
- liftovi,
- raskrsnice hodnika,
- stepenista,
- teske tacke orijentacije.

Korisnik bi iz navigacije ili detalja koraka mogao da otvori pogled "kako to mesto izgleda uzivo".

### Sta omogucava korisniku

- lakse prepoznavanje realnog prostora,
- manje nesigurnosti na mestima gde 2D mapa nije dovoljna,
- posebno korisno za nove studente i posetioce koji prvi put ulaze u zgradu.

### Sta tehnicki podrazumeva

- vezivanje medija za `navigation_nodes` ili posebnu media tabelu,
- storage za 360 slike,
- frontend viewer za panorame,
- pazljivo biranje samo bitnih tacaka da sistem ne postane pretezak za telefon i administraciju.

## 5. Dev tool za editovanje node-ova

### Sta treba da radi

Potreban je interni alat za razvojni tim kojim mogu da:

- vide node-ove i edge-eve na mapi,
- pomeraju node tacke,
- dodaju nove node-ove,
- spajaju node-ove edge-evima,
- menjaju tip node-a ili edge-a,
- brzo ispravljaju greske bez rucnog editovanja SQL-a.

### Sta omogucava korisniku

Indirektno omogucava mnogo kvalitetniju i brzu navigaciju, jer tim moze lakse da odrzava i prosiruje graf zgrade.

### Sta tehnicki podrazumeva

- admin/dev-only interfejs,
- sigurnu izmenu podataka bez rusenja produkcionog grafa,
- validacije da se ne prave polomljene veze,
- eventualno eksport nazad u SQL seed ili poseban import/export format.

Ovo je jedan od najvaznijih feature-a za dugorocni razvoj, jer bez alata za uredjivanje graf ce se sporo i rizicno odrzavati.

## 6. Najblizi WC opcija

### Sta treba da radi

Korisnik treba da moze iz trenutne ili izabrane lokacije da trazi najblizi WC, bez potrebe da zna unapred gde se nalazi.

Flow bi trebalo da bude:

- korisnik izabere pocetnu lokaciju ili skenira QR,
- klikne opciju "Najblizi WC",
- aplikacija pronadje najkracu dostupnu rutu do najblize WC lokacije,
- prikaze rutu isto kao za obicnu navigaciju.

### Sta omogucava korisniku

- brzu pomoc u realnoj situaciji,
- vecu prakticnu vrednost aplikacije van samog trazenja ucionica,
- bolji osecaj da aplikacija razume stvarne potrebe u prostoru.

### Sta tehnicki podrazumeva

- backend endpoint koji poredi vise kandidata tipa `wc`,
- filtriranje samo enabled i dostupnih WC lokacija,
- ponovno koriscenje postojece route logike umesto posebnog sistema,
- mogucnost da kasnije isti mehanizam radi i za druge tipove lokacija, npr. lift, izlaz ili prostor za ucenje.

## 7. QR kod generator za pocetne tacke

### Sta treba da radi

Za bitne pocetne tacke u zgradi treba generisati QR kodove koje korisnik moze da skenira i odmah postavi svoju trenutnu lokaciju.

To mogu biti:

- glavni ulazi,
- liftovi,
- raskrsnice hodnika,
- veci zajednicki prostori.

Nakon skeniranja:

- aplikacija otvori navigaciju,
- automatski postavi startnu lokaciju,
- korisnik samo bira cilj.

### Sta omogucava korisniku

- mnogo brzi pocetak navigacije,
- manje unosa na telefonu,
- manju sansu da korisnik pogresi startnu lokaciju.

### Sta tehnicki podrazumeva

- stabilan identitet pocetne tacke, idealno preko `navigation_locations.id` ili stabilnog node reference,
- generator QR kodova za interne lokacije,
- URL semu koju frontend zna da obradi,
- kasnije i stampu/fizicko postavljanje kodova u zgradi.

## Prioriteti koje ima smisla razmotriti

Ako se feature-i budu radili po redosledu vrednosti i zavisnosti, razuman prioritet je:

1. Dev tool za editovanje node-ova
2. Backend feature za tacniji opis koraka
3. Accessibility feature za citanje koraka
4. Najblizi WC opcija
5. QR kod generator za pocetne tacke
6. 360 slike od node-ova
7. 3D mapa zgrade sa 3D navigacijom

Razlog za ovakav redosled:

- prvo treba ojacati bazu navigacionih podataka i kvalitet koraka,
- zatim poboljsati realnu upotrebljivost osnovne navigacije,
- tek onda graditi teze vizuelne i medijske feature-e poput 360 i 3D prikaza.

## Kratak zakljucak

Svi ovi feature-i imaju smisla u okviru vizije FERI Navigatora, ali ne resavaju isti problem. Neki povecavaju kvalitet osnove navigacije, neki povecavaju pristupacnost, a neki siru iskustvo i orijentaciju u prostoru.

Najvecu baznu vrednost za projekat daju:

- alat za uredjivanje grafa,
- bolji backend opisi koraka,
- accessibility citanje koraka,
- nearest-WC tok.

Najvecu demonstracionu i UX vrednost daju:

- 360 slike,
- QR pocetne tacke,
- 3D navigacija.

## Dodatne zanimljive ideje (dodato)

Ispod su brze poboljsanja i korisne opcije koje nisu ranije pomenute u dokumentu, a korisnicima daju neposrednu vrednost.

- Offline PWA & cached maps — omoguciti keširanje mapa spratova i poslednjih izracunatih ruta putem Service Worker-a, tako da aplikacija radi i u losoj konekciji (posebno unutra u zgradi). (Nisko-srednji napor)
- Route sharing / deep links — generisanje kratkih URL-ova ili URL seme koje otvaraju aplikaciju sa automatski popunjenim startom i ciljem (opcionalno sa indeksom koraka). Omogucava deljenje rute putem poruka. (Nizak napor)
- Favorites & Recent places — sacuvaj omiljene i nedavno koriscene lokacije u `localStorage` ili na backendu za brzi pristup. (Nizak napor)
- Route export / printable directions (GPX / PDF) — eksportuj ili generisi stampive uputstva (ili GPX) za offline koriscenje ili stampu. (Nizak napor)
