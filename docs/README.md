# Dokumentacija projekta

## Svrha dokumentacije

Ova dokumentacija treba da omoguci dve stvari u isto vreme:

- da novi developer brzo stekne tacan mentalni model projekta,
- da AI moze da referencuje pravila, tokove i ocekivanja pre nego sto menja kod, SQL ili UI.

Cilj nije da svaki markdown fajl objasni sve, nego da dokumentacija usmeri citaoca ka pravom nivou detalja u sto manje koraka.

## Kako je dokumentacija organizovana

Dokumentacija se gradi kao balansirani hibrid:

- orijentacioni dokumenti objasnjavaju kako je projekat organizovan i koja pravila vaze,
- operativni dokumenti objasnjavaju kako se bezbedno rade konkretne izmene.

Trenutno repozitorijum vec sadrzi nekoliko korisnih dubinskih dokumenata. Sledeci korak je da se oni povezu u jasniju strukturu, umesto da ostanu kao odvojeni handover tekstovi.

## Postojeca dokumentacija

### Ulaz i opsti opis

- `../README.md` - glavni ulaz u projekat
- `opis.md` - funkcionalni opis aplikacije, stranica i korisnickih tokova

### Navigacija i backend

- `navigation.md` - dogovoreni model navigacionog sistema, route response i glavne pretpostavke
- `backend.md` - detaljan backend handover, odgovornosti servisa, DTO ugovori i pravila za izmene

### Admin i proces rada

- `admin_panel.md` - kako se koristi admin panel i kako radi SQL export workflow
- `handover.md` - dodatni radni kontekst i predaja
- `issues.md` - poznati problemi ili radne beleške
- `toDo.md` - otvorene stavke

### Dodatni radni dokumenti

- `admin.md`
- `opis_koraka_implemetacioni_plan.md`
- `pre_production_chechklist.md`
- `razpodela.md`

Neki od ovih fajlova su trajna dokumentacija, a neki su vise radne beleške. Vremenom ih treba ili uklopiti u novu strukturu ili arhivirati ako vise nisu relevantni.

## Ako radis X, citaj Y

- Zelis da razumes projekat od nule: `../README.md`, `opis.md`, `backend.md`
- Menjas navigacioni sistem: `navigation.md`, `backend.md`, `admin_panel.md`
- Menjas backend API ili route DTO-je: `backend.md`, `navigation.md`
- Menjas bazu, seed podatke ili graf: `backend.md`, `navigation.md`, `../database/init/`
- Menjas admin panel ili export workflow: `admin_panel.md`
- Proveravas funkcionalni korisnicki tok: `opis.md`

## Preporuceni redosled citanja za novog developera

1. `../README.md`
2. `opis.md`
3. `backend.md`
4. `navigation.md`
5. relevantan dokument za deo sistema koji menjas

## Preporuceni redosled citanja za AI pre izmene

1. Procitaj `../README.md` da dobijes mapu sistema.
2. Procitaj dokument koji definise pravila i source-of-truth za oblast koju menjas.
3. Ako je promena vezana za navigaciju, obavezno procitaj `backend.md` i `navigation.md`.
4. Ako promena ukljucuje graf ili mape, proveri i `admin_panel.md` i `../database/init/`.
5. Tek posle toga menjaj kod, SQL ili ugovore.

## Ciljna struktura dokumentacije

Dokumentacija ce se postepeno preurediti ka sledecoj strukturi:

```text
docs/
  README.md
  architecture/
    overview.md
    repository-map.md
    decisions-and-invariants.md
  frontend/
    overview.md
    navigation-ui.md
  backend/
    overview.md
    api-contracts.md
  data/
    database-and-seeds.md
    navigation-domain-model.md
  admin/
    admin-panel.md
  workflows/
    local-development.md
    changing-navigation.md
    changing-database.md
    verification-checklist.md
  glossary.md
```

Ova ciljna struktura ne znaci da sve mora biti napisano odmah. Znaci da novi dokumenti treba da se pisu sa tom organizacijom na umu, umesto da nastaju kao nepovezani fajlovi.

## Pravila odrzavanja dokumentacije

- Dokumentacija mora da prati stvarni kod, SQL i workflow.
- Kada se menja API ugovor ili source-of-truth pravilo, dokumentacija se menja u istom radu.
- Kada se uvede rizican novi tok rada, treba dodati ili azurirati odgovarajuci workflow dokument.
- Ako je neki dokument zastareo, treba to eksplicitno naglasiti ili ga ukloniti iz glavnih referenci.
