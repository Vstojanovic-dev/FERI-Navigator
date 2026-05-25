# Pre-production checklist

Ovaj dokument je lista stvari koje treba resiti pre nego sto FERI Navigator ide u produkciju i moze stabilno da radi sa oko 50 konstantnih korisnika.

Statusi:

- `P0` - blokira produkciju; ne pustati aplikaciju bez ovoga.
- `P1` - jako vazno za stabilnost, bezbednost i odrzavanje.
- `P2` - kvalitet, operativnost i dugorocno lakse odrzavanje.

## P0 - mora pre produkcije

### Admin autentifikacija

Admin panel i `/api/admin/map-editor/**` endpointi trenutno moraju biti zasticeni login-om. Bez toga bilo ko ko zna URL moze da menja navigacioni graf.

### Zastita write/import endpointa

Endpointi `/api/admin/map-editor/**`, `/api/graph/import` i `/api/graph/cross-floor` menjaju podatke. U produkciji moraju biti admin-only ili potpuno ugaseni ako nisu potrebni.

### Ogranicen CORS

Backend trenutno koristi `@CrossOrigin(origins = "*")`. U produkciji treba dozvoliti samo stvarni frontend domen, npr. `https://navigator.example.com`.

### Zatvoren Postgres port

Postgres ne sme biti javno dostupan preko porta `5432`. Baza treba da bude dostupna samo backend servisu unutar privatne Docker/cloud mreze.

### Zatvoren raw backend port

Backend port `8080` ne treba izlagati direktno internetu. Javnost treba da pristupa aplikaciji kroz reverse proxy koji kontrolise HTTPS, headers, rate limits i routing.

### Secrets umesto hardkodovanih lozinki

Kredencijali kao `feri/feri` iz `docker-compose.yml` i fallback vrednosti iz `application.properties` nisu prihvatljivi za produkciju. Koristiti env varijable, Docker secrets ili secrets manager.

### Poseban production compose/deployment

Napraviti `docker-compose.prod.yml` ili drugi deployment manifest za produkciju. Dev compose ne treba koristiti direktno za produkciju jer izlozeni portovi i default vrednosti nisu dovoljno bezbedni.

### HTTPS/TLS

Aplikacija mora raditi preko HTTPS-a. TLS moze da resi Nginx, Caddy, Traefik ili cloud load balancer.

### Backup i restore baze

Postgres mora imati automatski backup. Restore procedura mora biti testirana, jer backup koji nije provereno moguce vratiti nije dovoljan.

### Migracije baze

Trenutni `database/init/*.sql` fajlovi rade samo pri prvom kreiranju baze/volume-a. Za produkciju treba uvesti Flyway ili Liquibase kako bi svaka promena seme bila verzionisana i ponovljiva.

### Admin frontend zastita

Admin UI ne treba biti javno dostupan bez autentifikacije. Moze biti iza istog login-a, posebnog admin domena, VPN-a ili potpuno iskljucen iz public deployment-a.

### Rate limiting

Dodati rate limiting za endpoint-e koji se lako pozivaju mnogo puta, posebno `/api/navigation/locations` i `/api/navigation/route`. Autocomplete moze brzo generisati veliki broj requestova.

### Global error handling

Backend treba da ima centralizovan exception handler. Produkcija ne treba da vraca stack trace ili razlicite formate gresaka po endpointima.

### Health i readiness endpointi

Dodati health endpoint koji pokazuje da backend radi i readiness proveru koja ukljucuje DB konekciju. To je potrebno za monitoring i automatski restart/deploy.

### Production API base URL

Frontend trenutno ima fallback na `http://localhost:8080`. U produkciji API base URL mora biti eksplicitno konfigurisan i ne sme zavisiti od lokalnog fallback-a.

## P1 - jako vazno za stabilnost

### Spring profili

Dodati jasne profile `dev`, `test` i `prod`. Production profil treba da ima stroze vrednosti, bez dev fallbackova i bez opasnih defaulta.

### Testovi u release pipeline-u

Backend Dockerfile trenutno build-uje sa `mvn -DskipTests package`. Testovi moraju da se izvrse pre release image-a, makar u CI pipeline-u.

### CI pipeline

Dodati pipeline koji pokrece backend testove, frontend build, admin build i Docker build. Bez toga je lako pustiti neispravan release.

### Backend integration testovi

Dodati testove sa realnom Postgres bazom ili Testcontainers setup-om za route search, route calculation, admin CRUD i SQL export.

### Frontend smoke testovi

Dodati osnovne testove za glavnu navigaciju i admin tokove: izbor lokacija, prikaz rute, dodavanje node-a, spajanje node-ova i export SQL-a.

### Validacija query parametara

Parametri kao `limit`, `fromLocationId`, `toLocationId` i admin koordinate treba da imaju jasna ogranicenja. Na primer `limit` mora imati maksimalnu vrednost, a koordinate moraju biti unutar dimenzija mape.

### Indeksi za pretragu lokacija

`navigation_locations(searchable_name)` postoji, ali `LIKE '%query%'` moze biti sporiji na vecem datasetu. Razmotriti trigram, full-text ili `lower(searchable_name)` index.

### Audit log za admin izmene

Admin izmene treba logovati: ko je menjao, sta je menjao i kada. Ovo je vazno kada se graf slomi ili treba vratiti prethodno stanje.

### Sigurnije brisanje node-ova

Brisanje node-a moze ukloniti povezane edge-eve i uticati na rute. Dodati zastitu, potvrdu i proveru da li node koristi neka `navigation_location`.

### Potvrda pre destruktivnih akcija

Admin UI treba jasno da prikaze posledice brisanja node-a ili edge-a. Korisnik treba da zna koliko veza ili ruta potencijalno menja.

### Concurrent admin izmene

Ako dva admina menjaju graf u isto vreme, jedan moze pregaziti promene drugog. Dodati optimistic locking ili proveru preko `updated_at`.

### Transakcije za slozene operacije

Operacije koje menjaju vise tabela moraju biti u transakciji. Posebno delete node, create edge i import/export tokovi.

### Centralizovana CORS konfiguracija

CORS ne treba da bude razbacan po kontrolerima. Bolje je imati jednu konfiguraciju koja zavisi od environment-a.

### Security headers

Na reverse proxy/frontend strani dodati HSTS, Content-Security-Policy, X-Content-Type-Options i Referrer-Policy. Ovo smanjuje rizik od browser-based napada.

### Nginx/SPA konfiguracija

Frontend treba da ima pravilno podesen SPA fallback, cache headers za static assets i `no-cache` za `index.html`.

### Container restart policy

Dodati restart policy za servise. Produkcioni container ne treba ostati ugasen posle privremenog pada.

### Resource limits

Dodati CPU i memory limite za backend, frontend i bazu. Ovo sprecava da jedan servis pojede sve resurse.

### Log rotation

Container logovi moraju imati rotaciju. Bez toga disk moze da se napuni i obori aplikaciju.

### Monitoring

Pratiti uptime, backend health, DB health, response time za `/api/navigation/route` i broj 5xx gresaka.

### Alerting

Dodati alarme za backend down, DB down, visok error rate, pun disk i neuspesan backup.

### Strukturisani logovi

Logovi treba da imaju request id/correlation id. To olaksava debug kada korisnik prijavi problem sa rutom.

## P2 - kvalitet i operativnost

### Production deployment dokumentacija

Dokumentovati tacne korake za deploy: build, env varijable, migracije, backup pre deploy-a i smoke test posle deploy-a.

### `.env.example`

Dodati primer svih potrebnih environment promenljivih. Ovo smanjuje rizik da produkcija radi sa pogresnim ili nepotpunim vrednostima.

### Release checklist

Napraviti kratku checklistu za svako pustanje: testovi prosli, migracije proverene, backup napravljen, smoke test izvrsen.

### Rollback plan

Definisati kako se vraca prethodna verzija: prethodni Docker image, kompatibilnost migracija i restore baze ako je potreban.

### Pravilo za admin SQL export

Jasno dokumentovati da lokalne admin izmene nisu source of truth dok se SQL export ne commituje u repo.

### Razdvajanje javnih lokacija od tehnickih node-ova

Korisnicima treba prikazivati samo `navigation_locations`. Waypoint i tehnicki node-ovi ne treba da cure u korisnicki UI.

### Verzija grafa i mapa

Dodati verzionisanje navigacionog grafa i mapa. To pomaze da se zna sa kojim podacima frontend i backend rade.

### Test rutiranja za svaku lokaciju

Dodati proveru da se svaka enabled lokacija moze rutirati bar od glavnog ulaza. Ovo brzo otkriva prekinute veze u grafu.

### Provera orphan podataka

Dodati scriptu ili test za orphan node-ove, edge-eve i lokacije: node bez validnog floor-a, edge bez oba kraja, lokacija bez node-a.

### Graph integrity script

Napraviti scriptu koja pre deploy-a proverava da graf nema ocigledne greske: self-loop, duple edge-eve, nedostupne destinacije i lose koordinate.

### Performance benchmark

Izmeriti route calculation na punom grafu. Za 50 korisnika verovatno nije problem, ali treba imati osnovnu metriku.

### Caching procena

Ako autocomplete ili route endpointi postanu spori, dodati cache za lookup podatke i cesto citane delove grafa. Ne optimizovati pre merenja.

### Frontend error boundary

Dodati error boundary da jedna greska u renderu ne obori celu aplikaciju.

### Konzistentna loading/error stanja

Svaki ekran koji ucitava podatke treba da ima jasno loading, empty i error stanje.

### Korisnicke poruke za greske ruta

Greske kao `NO_ROUTE` i `LOCATION_WITHOUT_NODE` treba prikazati razumljivo korisniku, ne kao tehnicki backend kod.

### Analytics ili event logging

Razmotriti privacy-friendly pracenje najcescih ruta i gresaka. To pomaze da se popravi kvalitet navigacije.

### Accessibility provera

Proveriti kontrast, keyboard navigation, focus states i label-e na formama. Ovo je vazno posebno za mobilnu upotrebu.

### Mobile layout provera

Glavna navigacija mora biti proverena na telefonu i uzim ekranima. Admin moze biti desktop-first, ali korisnicka navigacija mora raditi dobro na mobilnom.

## Minimalni redosled rada

1. Zakljucati security: admin auth, CORS, secrets, zatvoren DB/backend port i HTTPS.
2. Uvesti production deployment config i migracije.
3. Dodati backup/restore i monitoring.
4. Dodati CI i osnovne testove.
5. Uraditi staging deploy i smoke test.
6. Tek onda pustiti produkciju.

