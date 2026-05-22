# Handover

## Trenutno stanje

Dogovorena je nova arhitektura za navigaciju FERI Navigatora. Baza je izvor istine, koristi se PostgreSQL + PostGIS, a koordinate ostaju u PDF/map coordinate system-u (`1190.55 x 841.89`), ne u PNG pikselima. Frontend treba da salje ID izabrane lokacije, ne tekst koji korisnik ukuca.

## Urađeno

- Dodata dokumentacija navigacionog sistema u `docs/navigation.md`.
- Dodata backend specifikacija u `docs/backend.md`.
- Prepravljena SQL šema u `database/init/001_schema.sql`.
- Dodati seed podaci za tipove, G2 objekat i G2 spratove u `database/init/002_seed_data.sql`.
- Kolegine G2 tacke prebacene su u staging fajl `database/init/003_g2_staging_nodes.sql`.
- Dodat loader `database/init/004_load_g2_navigation_nodes.sql` koji pravi `navigation_nodes`, `spaces` i `navigation_locations`.
- Dodat minimalni MVP edge seed `database/init/005_mvp_navigation_edges.sql`.
- `docker-compose.yml` sada ima PostGIS servis.
- Backend config je uskladjen na bazu `feri_navigator`, user/pass `feri`, i `ddl-auto=validate`.

## Važne odluke

- Koristimo SQL, ne NoSQL.
- Koristimo PostGIS, ali sa lokalnim SRID `0`, ne GPS koordinatama.
- Cuvamo i `x`, `y`, `z` kolone i PostGIS `geom`.
- Route endpoint mora koristiti `fromLocationId` i `toLocationId`.
- Tekstualni koraci su hibrid: vecinom dinamicki, uz rucne instrukcije na bitnim edge-evima.
- `allowElevator=false` mora biti podrzan u dizajnu algoritma.
- Najblizi WC nije MVP, ali model mora da ga podrzi.

## Sledeći koraci

1. Pokrenuti Docker i proveriti da PostGIS init skripte prolaze.
2. Uskladiti Java entitete sa novim tabelama `navigation_nodes`, `navigation_edges`, `navigation_locations`, `floors`, `buildings`, `spaces`.
3. Implementirati `GET /api/navigation/locations`.
4. Implementirati `GET /api/navigation/route`.
5. Vratiti segmentisan response sa mapom, path koordinatama i koracima.
6. Povezati frontend `NavigacijaPage` sa backend API-jima.

## Poznati rizici

- Kompletan G2 graf jos nema sve edge-eve; postoji samo minimalni MVP set.
- Backend trenutni kod jos koristi stare entitete/tabele i mora se refaktorisati.
- Docker init nije izvrsen jer Docker daemon nije bio pokrenut tokom rada.
