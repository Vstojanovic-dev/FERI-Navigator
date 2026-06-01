# FERI Navigator Pre-Production Balanced Hardening Design

## Goal

Pripremiti FERI Navigator za bezbedan staging i public alpha hosting tako da javni deployment sadrzi samo korisnicki frontend i backend API, dok admin panel ostaje privremeni, lokalni ili rucno ukljucen ops alat. Resenje mora ukloniti poznate P0/P1 bezbednosne i deployment rizike, uvesti stabilan migration workflow za bazu i zatvoriti najvaznije correctness i operativne rupe pre online izlaska.

## Scope

Ovaj dizajn pokriva:

- security i exposure hardening za backend, frontend i bazu,
- profile/config razdvajanje za `dev`, `test` i `prod`,
- prelazak sa init-only SQL pristupa na production-safe migration workflow,
- offline admin workflow zasnovan na SQL exportu i git verzionisanju,
- alpha-readiness ispravke za poznate routing i DTO edge case probleme,
- minimalni CI, health, backup i release workflow potreban za hosting.

Ovaj dizajn ne pokriva:

- pun enterprise monitoring stack,
- stalno hostovan admin panel,
- full audit/history sistem za admin izmene,
- napredne analytics funkcije,
- kompletan redesign admin UX-a.

## Current State

Trenutni repo vec ima Docker-based lokalni stack, odvojene frontend i admin frontend aplikacije, Spring Boot backend i SQL snapshot fajlove u `database/init/`. To je dovoljno za razvoj, ali nije dovoljno disciplinovano za staging/public alpha iz sledecih razloga:

- admin write endpointi su otvoreni i nemaju autentifikaciju,
- CORS je siroko otvoren,
- secrets i javni URL fallback-i imaju dev podrazumevane vrednosti,
- baza se oslanja na init SQL koji nije dovoljan za evoluciju postojece production baze,
- backend build skipuje testove,
- postoje dokumentovani routing i null-safety rizici koji mogu proizvesti pogresne rute ili runtime greske.

## Target Architecture

### Public Runtime

Javni runtime sadrzi samo:

- SPA frontend iza Nginx-a ili drugog reverse proxy-ja,
- Spring Boot backend API,
- Postgres bazu na privatnoj mrezi,
- jedan javni ulaz preko HTTPS-a.

Frontend i backend komuniciraju kroz eksplicitno konfigurisan production API base URL. Backend i baza nisu direktno javno izlozeni.

### Admin Runtime

Admin panel nije deo stalno podignutog public stack-a. Podrzani operativni model je:

1. lokalno podici `postgres + backend + admin frontend`,
2. napraviti izmene nad lokalnim admin okruzenjem,
3. izvesti novi SQL snapshot iz admin panela,
4. od tog exporta napraviti novi verzionisani migration fajl,
5. commitovati migration u git,
6. pustiti deploy koji primenjuje migration na staging ili production bazu.

Ovim modelom production/staging baza se ne menja direktno iz admin browser sesije. Git ostaje source of truth za promene navigacionog grafa.

### Database Change Model

Postojece `database/init/*.sql` datoteke ostaju bootstrap mehanizam za podizanje potpuno nove, prazne baze u lokalnom development-u. Za staging i production uvodi se `Flyway` kao jedini podrzani mehanizam za promene seme i navigacionih podataka nad vec postojecom bazom.

To znaci:

- bootstrap SQL i migracije imaju razdvojene odgovornosti,
- svaka promena strukture ili admin eksportovanih podataka dobija novi migration fajl,
- deploy pre starta aplikacije ili pri startu aplikacije mora primeniti pending migracije,
- rollback se radi preko nove korektivne migracije ili restore procedure, ne rucnim editovanjem live baze.

## Design Areas

### 1. Security Hardening

Backend dobija centralizovanu security konfiguraciju zasnovanu na Spring profilima i feature flag-ovima.

U `prod` profilu:

- admin endpointi i drugi write/import endpointi nisu javno otvoreni po default-u,
- CORS dozvoljava samo eksplicitno definisane frontend origin-e,
- production secrets dolaze iz env varijabli ili secret store-a,
- health endpoint ostaje dostupan za orchestrator/monitoring, ali detalji readiness-a se kontrolisu po potrebi.

Admin pristup se ne tretira kao opsti korisnicki feature, vec kao operativni kanal koji se eksplicitno ukljucuje. Prva iteracija moze koristiti jednostavniji model:

- `admin.enabled=false` u produkcionom profilu,
- admin kontroleri i eventualni import endpointi vracaju `404` ili `403` kada je admin mode iskljucen,
- opciono kasnije dodati autentifikaciju za privremeni remote admin stack ako zatreba.

Ovaj pristup je namerno strozi od "uvek ukljucen admin iza login-a", jer smanjuje javnu povrsinu sistema za alpha fazu.

### 2. Configuration and Profiles

Konfiguracija se deli na:

- `application.properties` za neutralne zajednicke default-e,
- `application-dev.properties`,
- `application-test.properties`,
- `application-prod.properties`.

Bitne production konfiguracije:

- nema `localhost` fallback-ova za share base URL ili API URL,
- datasource vrednosti dolaze iz env varijabli,
- CORS origin-i su eksplicitni,
- admin mode je iskljucen,
- debug/dev pogodnosti nisu ukljucene.

Frontend build takodje mora postati environment-driven:

- `VITE_API_BASE_URL` ne sme imati tihi production fallback na `localhost`,
- build treba da fail-uje ili bar jasno signalizira kada production env nije kompletan,
- admin frontend koristi zaseban env model i nije deo default public build/deploy toka.

### 3. Database and Migration Workflow

Flyway se uvodi u backend aplikaciju ili deployment workflow kao obavezni korak pre public hostinga. Pocetni migration plan treba da bude pragmatican:

- zadrzati postojeci init SQL za lokalno bootstrap-ovanje,
- definisati novu `db/migration` strukturu,
- napraviti baseline strategiju kompatibilnu sa trenutnim stanjem baze,
- dokumentovati kako se iz admin exporta pravi sledeci migration fajl.

Za admin-driven data updates preporuceni workflow je:

1. admin export generise snapshot SQL,
2. developer pregleda export,
3. relevantni SQL se upakuje u novi Flyway migration,
4. migration prolazi kroz review i deploy.

Nije cilj da admin export automatski pise direktno u migration folder bez ljudske provere, jer export moze sadrzati stale ili siroke promene koje moraju biti razumene pre release-a.

### 4. Admin Workflow

Admin panel ostaje odvojena Vite aplikacija i ne ulazi u glavni produkcioni compose/deploy.

Potrebne promene u workflow-u:

- dokumentovati "local admin only" pravilo,
- dodati uputstvo kako se lokalni export pretvara u novi migration,
- jasno odvojiti lokalnu admin bazu od staging/prod baza,
- spreciti naviku direktnog editovanja remote baze iz admin UI-ja.

Ako kasnije zatreba privremeni remote admin stack, on mora biti:

- posebno podignut,
- zasebno zasticen,
- vremenski ogranicen,
- po zavrsetku ugasen.

Ali to nije uslov za initial public alpha readiness i ne treba ga gurati u prvi hardening sprint.

### 5. Correctness and Stability

Pre hostinga moraju biti reseni poznati problemi koji mogu oboriti poverenje u aplikaciju:

- A* pathfinding bug koji moze vratiti pogresnu ili nepostojecu rutu,
- null-safety rupe u backend route build putanji,
- neujednaceni error response formati za navigacione endpoint-e,
- frontend pretpostavke o validnim DTO poljima i koordinatama,
- search endpoint/client ponasanje koje moze generisati previse requestova ili los UX.

Balanced hardening ne znaci "srediti sve bugs zauvek", nego zatvoriti one defekte koji direktno ugrozavaju alpha upotrebu, debug-ovanje i deploy pouzdanost.

### 6. Operational Readiness

Pre hostinga su potrebni sledeci operativni minimumi:

- health i readiness endpointi,
- produkcioni compose/deployment manifest,
- CI koji pokrece backend testove, frontend build i admin build,
- backup i restore dokumentovan workflow,
- release checklist sa smoke test koracima,
- rollback instrukcija za aplikativni deploy i bazu.

Monitoring i alerting mogu krenuti minimalno, ali health status, logika za restart i backup disciplina ne mogu ostati implicitni.

## Data Flow

### Public User Flow

1. korisnik otvara javni frontend,
2. frontend poziva backend API preko production base URL-a,
3. backend cita podatke iz Postgres baze,
4. backend vraca route/search rezultat u stabilnom DTO formatu,
5. frontend prikazuje rezultat uz defensive handling za empty/error stanja.

### Admin Change Flow

1. developer lokalno pokrece admin okruzenje,
2. admin panel menja lokalnu bazu,
3. admin panel eksportuje SQL snapshot,
4. snapshot se rucno pretvara u novi migration,
5. migration se commituje i prolazi CI,
6. staging/prod deploy primenjuje migration,
7. javni runtime koristi novu verziju podataka bez direktnog admin pristupa.

## Error Handling

Backend treba da predje na centralizovan exception handling za javne i admin API-je kako bi:

- response format bio konzistentan,
- produkcija izbegla stack trace curenje,
- frontend mogao pouzdano da mapira greske kao `NO_ROUTE`, `LOCATION_NOT_FOUND` i slicno.

Admin-specificke validacije treba da vracaju jasne poslovne greske, ne sirove runtime exception-e. Javni frontend treba da ima konzistentna loading, empty i error stanja, uz fallback poruke kada backend vrati neocekivan payload.

## Testing Strategy

Pre hosting readiness oznake potrebno je minimum:

- backend unit/integration testovi za route calculation i search kriticne tokove,
- test pokrivenost za poznati A* bug i null edge cases,
- frontend production build provera,
- osnovni smoke test za glavne korisnicke tokove,
- admin build provera i osnovni sanity check export workflow-a,
- pozeljno graph integrity ili route reachability check za najvaznije lokacije.

Test strategy nije usmerena na savrsenu pokrivenost, vec na hvatanje regresija koje bi bile skupe kada aplikacija bude javno dostupna.

## Risks and Tradeoffs

### Zasto ne stalno hostovan admin

Prednost je manja javna povrsina i jednostavniji security model. Mana je sto admin izmene traze disciplinovan lokalni workflow i dodatni deploy korak. Za alpha fazu to je prihvatljiv i pozeljan tradeoff.

### Zasto Flyway umesto init-only snapshot pristupa

Prednost je bezbedna evolucija postojece baze i jasan audit trail kroz git. Mana je dodatni rad oko baseline-a i migration discipline. To je neophodan trosak ako aplikacija ide online.

### Zasto balanced a ne maximal hardening

Cilj je pustiti aplikaciju online bez nepotrebnog odlaganja. Zato se fokus stavlja na P0 i najvaznije P1 stavke koje direktno uticu na security, correctness i deployability, dok napredniji audit/observability elementi mogu ici u sledeci ciklus.

## Acceptance Criteria

Smatracemo projekat spremnim za staging/public alpha kada vaze sledeci uslovi:

- javni deployment ne sadrzi admin frontend niti otvorene admin write endpoint-e po default-u,
- production config nema dev fallback secrets ni `localhost` URL zavisnosti,
- baza koristi migracioni workflow za promene nad postojecim okruzenjima,
- poznati routing i null-safety problemi koji ugrozavaju alpha flow su sanirani i testirani,
- postoji produkcioni deployment manifest i dokumentovan release/smoke test postupak,
- postoji dokumentovan lokalni admin export -> migration workflow,
- CI proverava osnovne build/test korake pre release-a.
