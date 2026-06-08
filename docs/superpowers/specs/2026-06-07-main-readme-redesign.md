# Glavni README Redesign

## Cilj

Prenoviti glavni `README.md`, da bo služil kot kratek uvod v projekt FERI Navigator za bralca, ki o projektu še ne ve ničesar. Dokument mora biti na slovenskem jeziku, jedrnat in usmerjen v prvo razumevanje projekta ter prvi zagon z Dockerjem.

## Obseg

Glavni README naj pokriva samo uvodne informacije:

- opis in vizijo projekta,
- glavne skupine uporabnikov in njihove ključne možnosti,
- rezervirano mesto za slike projekta,
- priporočeni zagon z Dockerjem,
- nadaljnje branje v obstoječi dokumentaciji,
- strukturo repozitorija s kratkimi opisi,
- kontakt razvijalca.

README ne sme postati tehnični handover dokument, razvojni cheat sheet ali seznam notranjih pravil.

## Vsebinski okvir

Končna struktura README:

1. `Opis in vizija projekta`
2. `Kdo so uporabniki in kaj lahko počnejo`
3. `Slike projekta`
4. `Kako zagnati projekt`
5. `Kje nadaljevati z branjem`
6. `Struktura projekta`
7. `Kontakt razvijalca`

## Vsebinski poudarki

### 1. Opis in vizija projekta

Sekcija naj v nekaj stavkih pojasni, da je FERI Navigator spletna aplikacija za lažje iskanje učilnic, kabinetov in drugih prostorov na FERI ter za bolj razumljivo navigacijo po stavbi.

### 2. Kdo so uporabniki in kaj lahko počnejo

README mora ločiti med:

- obiskovalci, študenti in zaposlenimi, ki želijo poiskati prostor, pregledati podrobnosti in dobiti pot do cilja,
- skrbniki oziroma uredniki podatkov, ki skrbijo za navigacijske podatke in administrativni del sistema.

Opis naj ostane produktni in ne preveč tehničen.

### 3. Slike projekta

Za zdaj ostane jasen placeholder, da bodo posnetki zaslona dodani naknadno.

### 4. Kako zagnati projekt

Docker mora biti predstavljen kot glavni in priporočeni način zagona. Sekcija naj vsebuje:

- kratke predpogoje,
- ukaz `docker compose up --build`,
- kratek opis, kaj se pri tem zažene,
- lokalne naslove za frontend, backend in bazo.

README naj ne vključuje dodatnega razvojnega workflowa brez Dockerja.

### 5. Kje nadaljevati z branjem

Sekcija naj usmeri bralca na obstoječo dokumentacijo, predvsem:

- `docs/README.md`,
- `docs/opis.md`,
- `docs/navigation.md`,
- `docs/backend.md`,
- `docs/admin_panel.md`.

### 6. Struktura projekta

Sekcija naj kratko opiše glavne mape in najpomembnejše datoteke v korenu repozitorija, predvsem:

- `frontend/`,
- `frontend/admin/`,
- `backend/`,
- `database/`,
- `docs/`,
- `deploy/`,
- `docker-compose.yml`,
- `docker-compose.prod.yml`,
- `.env.example`,

### 7. Kontakt razvijalca

Sekcija mora vsebovati e-poštni naslov `veljko.stojanovic@student.um.si` in placeholder opombo za prihodnji Microsoft Forms obrazec za prijavo napak.

## Ton in slog

- Vse besedilo mora biti v slovenščini.
- Sekcije morajo biti kratke in lahko berljive.
- Ukazi morajo biti pripravljeni za copy-paste.
- Besedilo naj bo praktično in informativno, brez generičnega template jezika.
