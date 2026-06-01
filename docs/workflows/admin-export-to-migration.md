# Admin Export to Migration Workflow

Ovaj workflow postoji da bi izmene navigacionog grafa ostale verzionisane, pregledane i bez direktnog menjanja staging/production baze iz browsera.

## Operativni redosled

1. Pokreni lokalni `postgres`, backend i admin frontend.
2. Napravi izmene grafa lokalno kroz admin panel.
3. Exportuj SQL preko `GET /api/admin/map-editor/export/sql`.
4. Pregledaj generisani SQL i proveri diff u odnosu na prethodno stanje.
5. Ne diraj `V2026_06_01_002__admin_graph_snapshot_template.sql`; to je rezervisani placeholder koji je vec deo migracionog lanca.
6. Nalepi samo pregledani SQL u novi Flyway migration fajl oblika `VYYYY_MM_DD_NNN__admin_graph_update.sql`, sa sledecim slobodnim brojem, na primer `003` ili kasnije.
7. Ako podizes praznu bazu, proveri da `database/init` bootstrap i posle njega Flyway migracije i dalje prolaze konzistentno.
8. Ako radis release za postojecu staging/production bazu, uradi nameran baseline/cutover postupak pre oslanjanja na Flyway za dalje izmene.
9. Commituj migraciju i deployuj je kroz standardni release proces.

## Pravila

- Admin panel je lokalni alat, ne remote production control panel.
- Export ne menja staging ili production direktno.
- Hosted okruzenja dobijaju admin izmene samo kroz pregledane Flyway migracije.
- Ne prepisuj postojecu verzionisanu migraciju novim exportom.
- `V2026_06_01_002__admin_graph_snapshot_template.sql` je rezervisan placeholder i nikad se ne menja u mestu.
- Ako postoji stara bootstrap SQL istorija, koristi je samo za inicijalizaciju prazne baze; sve naredne promene idu kroz `db/migration`.
- Prazna baza prvo dobija `database/init` bootstrap, pa tek onda Flyway-managed post-bootstrap izmene.
- Postojeca staging/production baza mora da prodje eksplicitan baseline/cutover pre nego sto Flyway postane izvor istine za naredne promene.

## Baseline napomena

Repo sada ocekuje verzionisane Flyway migracije kao izvor istine za post-bootstrap promene. `001` obelezava pocetak Flyway lanca, a `002` ostaje rezervisan template placeholder u istoriji. Sve stvarne admin graph promene moraju ici u nove migracije od `003` nadalje. Prazne baze i dalje zavise od `database/init` bootstrap koraka, dok postojece staging/production baze moraju biti namerno uskladjene kroz baseline/cutover tokom release pripreme.
