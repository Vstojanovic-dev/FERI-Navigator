# FERI Navigator

## Sta je FERI Navigator

FERI Navigator je web aplikacija za snalazenje kroz prostore FERI-ja. Projekat je fokusiran na dve glavne potrebe:

- korisnik treba brzo da pronadje ucionicu, kabinet ili drugi prostor,
- korisnik treba da dobije razumljivu navigaciju kroz zgradu, po mapama i spratovima.

Aplikacija je podeljena na korisnicki frontend, admin alat za uredjivanje navigacionog grafa, backend API i verzionisane SQL podatke sa mapama. Trenutni fokus projekta je da navigacioni sistem bude dovoljno stabilan da ljudi i AI mogu bezbedno da menjaju rute, podatke i UI bez lomljenja ugovora izmedju slojeva.

## Struktura projekta

- `frontend/` - glavna korisnicka web aplikacija
- `frontend/admin/` - admin panel za uredjivanje navigacionog grafa i SQL export
- `backend/` - Spring Boot backend, API i logika rutiranja
- `database/` - SQL schema, seed podaci i slike mapa
- `docs/` - projektna dokumentacija i handover materijal

## Brzi start

Najkraci nacin za podizanje glavnog stack-a iz korena repozitorijuma je:

```powershell
docker compose up --build
```

Pre pokretanja proveri da su Docker i Docker Compose dostupni lokalno.

Tipicne adrese u lokalnom razvoju:

- korisnicki frontend: Vite dev server iz `frontend/`
- admin frontend: Vite dev server iz `frontend/admin/`
- backend API: `http://localhost:8080`

Za detaljniji lokalni workflow i module koje zelis da podizes odvojeno, vidi dokumentaciju u `docs/`.

## Kako je sistem organizovan

Korisnicki frontend prikazuje pretragu prostora, detalje objekata i navigacijski UI. On ne odlucuje kako izgleda navigacioni graf niti sam racuna rutu. Njegova odgovornost je da korisniku omoguci izbor lokacija, posalje stabilne identifikatore backend-u i prikaze rezultat koji backend vrati.

Backend je centralno mesto za aplikativnu logiku navigacije. On cita navigacione podatke iz baze, validira korisnicki izbor lokacija, racuna rutu kroz graf i vraca frontend-u odgovor spreman za prikaz, ukljucujuci segmente rute, koordinate i tekstualne korake.

Baza i SQL seed fajlovi su izvor istine za navigacione podatke. U njima zive sema, lokacije, cvorovi, ivice, spratovi i metapodaci mapa. Admin panel sluzi za uredjivanje navigacionog grafa, ali promene nisu trajne za tim dok ne budu exportovane u SQL i commitovane u repozitorijum.

## Najvaznija pravila

- SQL schema i seed fajlovi u `database/init/` su source of truth za navigacione podatke.
- Frontend ne sme da modeluje navigacioni graf niti da sam odlucuje o validnim rutama.
- Route API treba da koristi stabilne ID-jeve lokacija, ne slobodan tekst kao glavni identitet.
- Koordinate rute ostaju u internom koordinatnom sistemu mape, a frontend radi prikaz i skaliranje.
- Admin izmene nisu zavrsene dok se export ne prenese u verzionisani SQL i ne commituje.

## Gde poceti sa citanjem

Ako prvi put ulazis u projekat ili AI treba da stekne siguran mentalni model pre izmene, kreni od ovih dokumenata:

- `docs/README.md`
- `docs/backend.md`
- `docs/navigation.md`
- `docs/admin_panel.md`
- `docs/opis.md`

## Ako menjas sistem

- Ako menjas navigacionu logiku ili route response, prvo procitaj `docs/backend.md` i `docs/navigation.md`.
- Ako menjas bazu, seed podatke ili mapiranje entiteta, prvo procitaj `docs/backend.md` i pregledaj `database/init/`.
- Ako menjas admin panel ili workflow exporta, prvo procitaj `docs/admin_panel.md`.
- Ako menjas korisnicki tok ili funkcionalni opis aplikacije, prvo procitaj `docs/opis.md`.

## Trenutno stanje i ogranicenja

Projekat vec ima solidan tehnicki temelj za navigaciju, backend i admin graf editor, ali dokumentacija jos nije potpuno ujednacena. Deo znanja je dobro opisan dubinski, posebno backend i admin workflow, a deo je jos u handover ili radnoj formi.

Najveci oprez je potreban kod izmena koje prelaze granice modula:

- promena SQL seme ili seed podataka,
- promena route DTO ugovora,
- promena koordinatnog sistema ili map assets,
- promena admin export workflow-a.

Dokumentacija u `docs/` ce se postepeno reorganizovati u strukturisaniji, hibridni sistem koji je podjednako citljiv ljudima i dovoljno eksplicitan za AI.
