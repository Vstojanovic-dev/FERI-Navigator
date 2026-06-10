# Zasnova dokumentacijskega sistema projekta FERI Navigator

## 1. Namen

Vzpostaviti je treba kratek, natančen in vzdržljiv dokumentacijski sistem, ki omogoča:

- nestrokovnemu uporabniku razumeti namen aplikacije in jo uporabljati;
- novemu razvijalcu samostojno zagnati projekt in pridobiti pravilen mentalni model;
- obstoječemu razvijalcu hitro najti pravila za področje, ki ga spreminja;
- skrbniku varno pripraviti produkcijsko namestitev, vzdrževanje in obnovitev;
- AI-agentu delati po obveznih, preverljivih pravilih projekta.

Dokumentacija ne sme opisovati kode vrstico za vrstico. Pojasniti mora odgovornosti, pogodbe, vire resnice, kritične tokove, omejitve in postopke, ki jih bralec potrebuje za varno delo.

## 2. Jezik in slog

Vsa nova trajna dokumentacija mora biti napisana v slovenščini.

Imena datotek, razredov, funkcij, API-pol, okoljske spremenljivke in ukazi ostanejo v izvirni obliki. Besedilo mora biti:

- kratko in neposredno;
- preverljivo glede na trenutno stanje repozitorija;
- prilagojeno ciljnemu bralcu dokumenta;
- brez generičnih razlag, ki ne pomagajo pri uporabi ali spremembi projekta;
- brez opisovanja načrtovanih funkcij kot že obstoječih.

## 3. Izbrani pristop

Uporabi se majhen modularni sklop dokumentov. Vsak dokument ima eno jasno odgovornost, podrobnosti pa se namesto podvajanja povezujejo z relativnimi povezavami.

Dokumentacijski sistem združuje štiri vrste vsebine:

- uvod za prvo orientacijo;
- konceptualne razlage in arhitekturo;
- tehnične reference;
- praktična navodila za konkretne naloge.

To sledi uporabniško usmerjeni delitvi dokumentacije iz virov, zbranih v projektu
[awesome-documentation](https://github.com/pengqun/awesome-documentation), predvsem ločevanju uvodov, konceptov, referenc in postopkov.

## 4. Ciljna struktura

```text
README.md
AGENTS.md
docs/
├── README.md
├── user-guide.md
├── architecture.md
├── repository-structure.md
├── frontend.md
├── backend-and-api.md
├── data-and-navigation.md
├── development.md
├── deployment-and-operations.md
├── ai-agents.md
└── superpowers/
    ├── plans/
    └── specs/
```

### `README.md`

Glavna vstopna točka repozitorija. V nekaj minutah mora odgovoriti:

- kaj je FERI Navigator;
- komu je namenjen;
- katere glavne zmožnosti ponuja;
- kako se najhitreje zažene z Dockerjem;
- kateri lokalni naslovi so na voljo;
- kje nadaljevati branje glede na cilj bralca.

README ne vsebuje podrobne arhitekture, celotnega razvojnega postopka ali produkcijskega priročnika.

### `AGENTS.md`

Kratka korenska vstopna točka za AI-agente. Vsebuje samo:

- obvezno začetno branje;
- osnovne prepovedi in varnostna pravila;
- obveznost preverjanja sprememb;
- povezavo na celoten pravilnik `docs/ai-agents.md`.

### `docs/README.md`

Navigacijsko kazalo dokumentacije. Bralca usmerja glede na vprašanje ali nalogo, na primer:

- prvič uporabljam aplikacijo;
- prvič razvijam projekt;
- spreminjam frontend;
- spreminjam API ali backend;
- spreminjam bazo, zemljevide ali navigacijski graf;
- pripravljam namestitev ali obnovitev;
- sem AI-agent.

### `docs/user-guide.md`

Navodila za nestrokovne uporabnike:

- namen aplikacije;
- iskanje stavb in prostorov;
- izbor začetne in ciljne lokacije;
- sledenje večnadstropni poti;
- deljenje ali izvoz poti, če je funkcija dejansko podprta;
- običajne uporabniške težave in njihove rešitve.

Dokument ne razlaga notranje implementacije.

### `docs/architecture.md`

Visokonivojski mentalni model:

- sistemski kontekst;
- javni frontend, lokalni admin frontend, backend in PostgreSQL/PostGIS;
- komunikacija med komponentami;
- glavni tokovi iskanja, kataloga in navigacije;
- meje odgovornosti;
- najpomembnejše arhitekturne odločitve in omejitve.

Za diagrame se uporabi Mermaid, kadar diagram jasno skrajša razlago.

### `docs/repository-structure.md`

Referenca za repozitorij in tehnologije:

- uporabljene različice Jave, Spring Boota, Node.js, Reacta, TypeScripta, Vitea, PostgreSQL/PostGIS in drugih ključnih orodij;
- namen glavnih map in korenskih datotek;
- pomembne vstopne točke;
- konfiguracijske datoteke;
- tabela virov resnice za kodo, konfiguracijo, shemo, migracije, zemljevide in CI.

Različica se navede samo, če jo je mogoče potrditi v repozitoriju. Če točna različica ni zaklenjena, se dokumentira podprta ali uporabljena glavna različica in njen vir.

### `docs/frontend.md`

Pregled obeh frontendov:

- odgovornost javnega frontenda;
- odgovornost lokalnega admin orodja;
- usmerjanje, strani, glavne funkcionalne enote in storitveni sloj;
- runtime konfiguracija in povezava z backendom;
- stanje, lokalizacija, prikaz zemljevidov in poti;
- mesta, kjer se običajno izvajajo spremembe;
- pomembne invariante in obvezne frontend preverbe.

Dokument ne našteva vsake React komponente.

### `docs/backend-and-api.md`

Backend in javne pogodbe:

- sloji Spring Boot aplikacije in njihove odgovornosti;
- ključni kontrolerji in servisi;
- aktivni API endpointi, parametri, odgovori in napake;
- varnostni in admin način;
- konfiguracijski profili;
- pravila za spremembo DTO-jev in API pogodb;
- povezave na teste, ki dokazujejo opisano vedenje.

Endpointi in strukture odgovorov se preverijo neposredno v kontrolerjih in DTO-jih. Zastareli endpoint mora biti jasno označen kot zastarel ali izpuščen iz glavnega toka.

### `docs/data-and-navigation.md`

Podatkovni in navigacijski model:

- vloga PostgreSQL in PostGIS;
- glavne domenske entitete in odnosi;
- razlika med prostori, uporabniškimi lokacijami, navigacijskimi vozlišči in povezavami;
- koordinatni sistem zemljevidov;
- izračun in segmentacija poti;
- vertikalno premikanje in prehodi;
- bootstrap SQL, Flyway migracije in njune ločene vloge;
- admin export v migracijo;
- kritične podatkovne invariante ter tipične napake.

Ta dokument je glavni vir resnice za varno spreminjanje navigacijskega grafa in podatkov.

### `docs/development.md`

Praktični razvojni priročnik:

- predpogoji;
- priporočeni Docker zagon;
- zagon posameznih komponent, kadar je potreben;
- okoljske spremenljivke za razvoj;
- backend testi;
- frontend in admin build;
- Playwright testi;
- lintanje in formatiranje, če sta dejansko vključena v projekt;
- delo s podatkovnimi spremembami;
- običajne napake pri zagonu in diagnostični ukazi.

Vse objavljene ukaze je treba dejansko izvesti ali jasno označiti, zakaj jih v trenutnem okolju ni mogoče preveriti.

### `docs/deployment-and-operations.md`

Produkcijska namestitev in vzdrževanje:

- razlika med razvojnim in produkcijskim profilom;
- zahtevana infrastruktura in okoljske spremenljivke;
- priprava produkcijskega Compose okolja;
- secrets, CORS, javni URL-ji in admin omejitve;
- migracije in varno uvajanje podatkovnih sprememb;
- health in readiness preverbe;
- backup in restore;
- release postopek;
- rollback;
- logi, monitoring in redna vzdrževalna opravila;
- trenutno znane produkcijske omejitve.

Dokument ne sme obljubljati podpore za infrastrukturo, ki v repozitoriju ni implementirana. Manjkajoče produkcijske zmogljivosti se navedejo kot omejitve.

### `docs/ai-agents.md`

Normativni pravilnik za AI-agente. Uporablja izraze »mora«, »ne sme« in »pred zaključkom preveri« ter določa:

- obvezno branje glede na vrsto naloge;
- vire resnice in prednost kode pred zastarelim besedilom;
- prepoved domnevanja nepreverjenega vedenja;
- pravila za majhne in osredotočene spremembe;
- zaščito uporabnikovih obstoječih sprememb;
- pravila za frontend, backend, API, podatke, migracije in navigacijski graf;
- varnostna in produkcijska pravila;
- zahtevane teste in build ukaze glede na obseg spremembe;
- obveznost sočasne posodobitve dokumentacije, kadar se spremeni pogodba ali postopek;
- zaključni seznam preverjanj;
- uporabo zgodovinskih načrtov samo za dodatni kontekst, ne kot vir trenutnega vedenja.

## 5. Pravila lastništva informacij

Vsaka informacija ima en glavni dokument:

| Informacija | Glavni dokument |
|---|---|
| Prvi opis in hiter zagon | `README.md` |
| Navigacija po dokumentaciji | `docs/README.md` |
| Uporaba aplikacije | `docs/user-guide.md` |
| Arhitektura in sistemski tokovi | `docs/architecture.md` |
| Različice in struktura repozitorija | `docs/repository-structure.md` |
| Frontend mentalni model | `docs/frontend.md` |
| Backend in API pogodbe | `docs/backend-and-api.md` |
| Baza, migracije in navigacijski graf | `docs/data-and-navigation.md` |
| Lokalni razvoj in preverjanje | `docs/development.md` |
| Produkcija in vzdrževanje | `docs/deployment-and-operations.md` |
| Obvezna pravila za agente | `docs/ai-agents.md` |

Drugi dokumenti smejo podati kratek kontekst in povezavo, ne pa vzdrževati druge kopije iste reference.

## 6. Enotna struktura tehničnih dokumentov

Kjer je smiselno, tehnični dokument uporablja naslednje zaporedje:

1. namen;
2. mentalni model;
3. ključne komponente;
4. tokovi in pogodbe;
5. invariante, omejitve in tveganja;
6. varen postopek spremembe;
7. povezana dokumentacija.

Odstopanje je dovoljeno, kadar bi predloga zmanjšala jasnost kratkega dokumenta.

## 7. Obravnava obstoječe dokumentacije

Nova trajna dokumentacija se napiše na novo na podlagi preverjenega stanja projekta.

Obstoječi ročno napisani dokumenti se med izvedbo:

- pregledajo zaradi uporabnih dejstev;
- ne uporabljajo samodejno kot vir resnice;
- po prenosu preverjenih informacij odstranijo iz glavne strukture ali arhivirajo, če vsebujejo še uporabno zgodovinsko vrednost.

Naslednji mapi se ohranita:

```text
docs/superpowers/plans/
docs/superpowers/specs/
```

Vsebujeta zgodovino zasnov in implementacijskih načrtov. Ne predstavljata trenutne tehnične dokumentacije in nista del priporočenega zaporedja branja.

## 8. Postopek izdelave

### Faza 1: inventar in preverjanje

- popis vseh dokumentov in povezav;
- preverjanje tehnologij, različic in zagonskih načinov;
- preverjanje komponent, API-jev, konfiguracije, podatkovnega modela in CI;
- določitev, kateri stari dokumenti se odstranijo ali arhivirajo.

### Faza 2: vstopne točke

- prenova `README.md`;
- izdelava `docs/README.md`;
- izdelava korenskega `AGENTS.md`.

### Faza 3: osnovni mentalni model

- `docs/user-guide.md`;
- `docs/architecture.md`;
- `docs/repository-structure.md`.

### Faza 4: tehnična področja

- `docs/frontend.md`;
- `docs/backend-and-api.md`;
- `docs/data-and-navigation.md`.

### Faza 5: delo in vzdrževanje

- `docs/development.md`;
- `docs/deployment-and-operations.md`;
- `docs/ai-agents.md`.

### Faza 6: celovito preverjanje

- izvedba dokumentiranih ukazov;
- preverjanje vseh notranjih povezav in poti;
- primerjava različic z manifesti, Dockerfile-i in CI;
- primerjava API dokumentacije s kontrolerji in DTO-ji;
- primerjava podatkovne dokumentacije s shemo, modeli in migracijami;
- primerjava produkcijskih postopkov s Compose in konfiguracijskimi datotekami;
- iskanje nedokončanih oznak, placeholderjev in nasprotujočih si trditev;
- poskusno branje z vidika novega razvijalca in nestrokovnega uporabnika.

## 9. Kriteriji sprejema

Dokumentacijski sistem je končan, ko:

- nestrokovni uporabnik razume namen aplikacije in osnovno uporabo;
- novi razvijalec lahko brez ustnega uvajanja zažene projekt;
- razvijalec lahko najde odgovorno področje in vir resnice za načrtovano spremembo;
- razvojni ukazi, povezave, datoteke in navedene različice so preverjeni;
- API in podatkovni model ustrezata trenutni implementaciji;
- production deployment, backup, restore, health check in rollback imajo jasne postopke ali jasno navedene omejitve;
- AI-agent pred začetkom spremembe dobi obvezna pravila in ustrezen bralni vrstni red;
- trajna dokumentacija ne vsebuje medsebojno konkurenčnih virov resnice;
- zgodovinski Superpowers načrti in specifikacije ostanejo ohranjeni, vendar ločeni od trenutne dokumentacije.

## 10. Izključeno iz obsega

Ta zasnova ne zahteva:

- dokumentiranja vsakega razreda, metode ali React komponente;
- uvedbe ločene dokumentacijske spletne strani;
- samodejno generirane Javadoc ali TypeDoc dokumentacije;
- dokumentiranja nerealiziranih funkcij kot dela trenutnega sistema;
- spreminjanja aplikacijske arhitekture samo zaradi dokumentacije;
- brisanja zgodovinskih Superpowers načrtov in specifikacij.
