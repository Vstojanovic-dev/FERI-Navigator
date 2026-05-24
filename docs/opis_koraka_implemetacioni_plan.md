# Implementacioni plan: dinamicki opisi koraka navigacije

Ovaj plan opisuje kako cemo strukturirati node-ove, edge-eve i backend logiku da FERI Navigator moze automatski da generise korisne navigacione instrukcije.

## 1. Zakljucene odluke

- Smer (`left`, `right`, `straight`) backend racuna automatski iz geometrije node-ova.
- Admin ipak ima `direction_hint` override za problematicna mesta.
- Instrukcije se generisu na slovenackom ili engleskom.
- Korisnicke destinacije ostaju samo kroz `navigation_locations`.
- Waypoint i tehnicki node-ovi ne smeju automatski da se prikazuju korisnicima.
- Admin UI treba da dobije semantic presets, da unos bude brz i dosledan.

## 2. Cilj

Trenutno kvalitet instrukcija zavisi od rucnih tekstova na edge-evima. To ne skalira jer svaki prolaz, skretanje i promena sprata mora rucno da se opisuje.

Cilj je da backend iz strukture grafa generise korake tipa:

```text
Continue down the corridor past the elevator, then turn right.
Go up the stairs to the first floor.
At the end of the corridor, turn left toward the cafe.
```

Ili na slovenackom:

```text
Nadaljujte po hodniku mimo dvigala, nato zavijte desno.
Pojdite po stopnicah v prvo nadstropje.
Na koncu hodnika zavijte levo proti kavarni.
```

## 3. Nova semantika podataka

### 3.1 `navigation_nodes.decision_type`

Dodati novo polje:

```sql
ALTER TABLE navigation_nodes
ADD COLUMN decision_type VARCHAR(40) NOT NULL DEFAULT 'none';
```

Dozvoljene vrednosti:

```text
none
waypoint
turn
junction
dead_end
door
entrance
stairs_entry
stairs_exit
elevator_entry
elevator_exit
landmark
```

Znacenje:

- `none`: node nema posebnu semantiku.
- `waypoint`: tehnicka tacka za geometriju, ne generise poseban korak.
- `turn`: mesto gde se ocekuje skretanje.
- `junction`: raskrsnica ili razdvajanje hodnika.
- `dead_end`: kraj hodnika.
- `door`: ulaz u prostoriju.
- `entrance`: ulaz u zgradu.
- `stairs_entry`: ulaz na stepenice.
- `stairs_exit`: izlaz sa stepenica.
- `elevator_entry`: ulaz u lift.
- `elevator_exit`: izlaz iz lifta.
- `landmark`: bitna orijentaciona tacka.

### 3.2 `navigation_edges.path_role`

Dodati novo polje:

```sql
ALTER TABLE navigation_edges
ADD COLUMN path_role VARCHAR(40) NOT NULL DEFAULT 'normal';
```

Dozvoljene vrednosti:

```text
normal
approach_landmark
pass_landmark
enter_room
exit_room
change_floor
building_transfer
```

Znacenje:

- `normal`: obicno kretanje.
- `approach_landmark`: kretanje prema orijentiru.
- `pass_landmark`: prolazak pored orijentira.
- `enter_room`: ulaz u prostoriju ili destinaciju.
- `exit_room`: izlaz iz prostorije.
- `change_floor`: promena sprata.
- `building_transfer`: prelaz izmedju objekata.

### 3.3 `navigation_edges.direction_hint`

Dodati novo polje:

```sql
ALTER TABLE navigation_edges
ADD COLUMN direction_hint VARCHAR(40);
```

Dozvoljene vrednosti:

```text
straight
left
right
slight_left
slight_right
up
down
enter
exit
```

Ovo polje je opcioni override. Ako je prazno, backend racuna smer iz geometrije.

Koristi se samo kada automatski izracunat smer nije dovoljno dobar zbog mape, kratkih edge-eva ili cudne geometrije.

## 4. Konvencija za node-ove

### 4.1 `external_id`

Format:

```text
<building>_<floor>_<zone>_<role>_<name-or-number>
```

Primeri:

```text
G2_pritlicje_entrance_main
G2_pritlicje_hall_main_wp01
G2_pritlicje_hall_main_turn_lift
G2_pritlicje_cafe_door
G2_pritlicje_lift_main
G2_pritlicje_stairs_main_bottom
G2_1_nadstropje_stairs_main_top
```

Pravila:

- `external_id` je stabilan i ne treba ga menjati bez razloga.
- Ne pisati recenice u `external_id`.
- Ne koristiti database ID-jeve u imenima.
- Za tehnicke tacke koristiti `wp01`, `wp02`, `wp03`.
- Za semanticke tacke koristiti naziv orijentira ili funkcije.

### 4.2 `label`

`label` je kratak ljudski naziv:

```text
Glavni vhod
Hodnik pri dvigalu
Zavoj pri kavarni
Vhod v kavarno
Glavno stopnisce spodaj
```

Ne pisati instrukcije u `label`.

Dobro:

```text
Zavoj pri dvigalu
```

Lose:

```text
Zavijte desno pri dvigalu
```

## 5. Konvencija za edge-eve

Edge treba da predstavlja jedan realan segment kretanja.

Dobar graf:

```text
main_entrance -> hall_wp01 -> turn_lift -> hall_cafe -> cafe_door
```

Los graf:

```text
main_entrance -> cafe_door
```

Pravila:

- Kratki edge-evi prate realnu putanju hodnika.
- Dugi hodnik moze imati vise `waypoint` node-ova, ali oni se kasnije grupisu u jedan opis.
- Skretanja, raskrsnice, vrata, stepenice i liftovi moraju imati semanticki node.
- Edge do prostorije obicno ima `path_role=enter_room`.
- Edge pored orijentira ima `path_role=pass_landmark` i popunjen `landmark`.
- Edge prema orijentiru ima `path_role=approach_landmark` i popunjen `landmark`.
- Stepenice/lift izmedju spratova imaju `path_role=change_floor`.

## 6. Semantic presets u adminu

Admin UI treba da dobije preset izbor koji automatski popunjava vise polja.

### 6.1 Node presets

Predlozeni preset-i:

```text
Waypoint
Skretanje
Raskrsnica
Vrata prostorije
Ulaz u zgradu
Lift
Stepenice - ulaz
Stepenice - izlaz
Landmark
```

Mapiranje:

| Preset | node_type | decision_type | is_waypoint | is_public |
| --- | --- | --- | --- | --- |
| Waypoint | waypoint | waypoint | true | false |
| Skretanje | corridor | turn | false | true |
| Raskrsnica | corridor | junction | false | true |
| Vrata prostorije | room | door | false | true |
| Ulaz u zgradu | entrance | entrance | false | true |
| Lift | elevator | elevator_entry | false | true |
| Stepenice - ulaz | stairs | stairs_entry | false | true |
| Stepenice - izlaz | stairs | stairs_exit | false | true |
| Landmark | corridor | landmark | false | true |

### 6.2 Edge presets

Predlozeni preset-i:

```text
Hodnik
Pored landmarka
Prema landmarku
Ulaz u prostoriju
Stepenice
Lift
Prelaz izmedju zgrada
```

Mapiranje:

| Preset | edge_type | path_role | direction_hint | is_cross_floor |
| --- | --- | --- | --- | --- |
| Hodnik | corridor | normal | null | false |
| Pored landmarka | corridor | pass_landmark | null | false |
| Prema landmarku | corridor | approach_landmark | null | false |
| Ulaz u prostoriju | virtual | enter_room | enter | false |
| Stepenice | stairs | change_floor | null | true |
| Lift | elevator | change_floor | null | true |
| Prelaz izmedju zgrada | building_transfer | building_transfer | null | false |

Admin treba da dozvoli rucno menjanje polja posle izbora preset-a.

## 7. Backend generator instrukcija

### 7.1 Ulaz

Generator dobija rezultat A* pretrage:

- listu node-ova,
- listu edge-eva,
- spratove,
- node semantiku,
- edge semantiku,
- opcione rucne instrukcije.

### 7.2 Prioritet instrukcija

Redosled odluke:

1. Ako edge ima rucni `instruction_forward`, koristi ga kao override.
2. Ako edge ima `direction_hint`, koristi hint umesto racunanja geometrije.
3. Ako edge nema hint, backend racuna smer iz prethodnog, trenutnog i sledeceg node-a.
4. Ako `path_role` ili `decision_type` ima posebnu semantiku, generisi specijalnu instrukciju.
5. Ako nema posebne semantike, generisi fallback instrukciju.

### 7.3 Grupisanje edge-eva

Generator ne treba da pravi jednu recenicu za svaki edge.

Treba grupisati uzastopne edge-eve ako:

- svi imaju `path_role=normal`,
- prolaze kroz `decision_type=waypoint`,
- ostaju na istom spratu,
- nema rucne instrukcije,
- nema bitnog landmarka,
- nema skretanja vecih od praga.

Primer:

```text
wp01 -> wp02 -> wp03 -> turn_lift
```

Jedna instrukcija:

```text
Nadaljujte po hodniku do zavoja pri dvigalu.
```

### 7.4 Racunanje smera

Za node `B`, smer se racuna iz:

```text
A -> B -> C
```

Backend izracuna ugao izmedju vektora `A-B` i `B-C`.

Predlog pragova:

```text
-25 do +25 stepeni: straight
25 do 60: slight_right
60 do 140: right
-60 do -25: slight_left
-140 do -60: left
ostalo: turn_back
```

Ako je `direction_hint` popunjen, preskace se automatski izracun.

### 7.5 Jezik instrukcija

Dodati parametar na route endpoint:

```text
GET /api/navigation/route?...&language=sl
GET /api/navigation/route?...&language=en
```

Default:

```text
language=sl
```

Ako se prosledi nepodrzan jezik, fallback je `sl`.

Instrukcije ne treba hardkodovati direktno svuda po servisu. Napraviti helper:

```text
InstructionTextProvider
```

On vraca tekstove za `sl` i `en`.

## 8. Backend izmene

Potrebno je uraditi:

1. Dodati SQL migraciju za nova polja.
2. Dopuniti seed/export SQL da ukljuci nova polja.
3. Dopuniti JPA modele:
   - `NavNode.decisionType`
   - `AdminNavNode.decisionType`
   - `NavEdge.pathRole`
   - `NavEdge.directionHint`
   - `AdminNavEdge.pathRole`
   - `AdminNavEdge.directionHint`
4. Dopuniti DTO objekte:
   - admin `NodeDto`
   - admin `NodeUpsertRequest`
   - admin `EdgeDto`
   - admin `EdgeUpsertRequest`
   - route `RouteStepDto`, ako treba prikazati computed direction.
5. Dopuniti `MapEditorService` da cita i cuva nova polja.
6. Dopuniti `AdminSqlExportService` da exportuje nova polja.
7. Napraviti `InstructionGeneratorService`.
8. Izmeniti `NavigationRouteService` da koristi novi generator.
9. Dodati `language` parametar u `NavigationController`.

## 9. Frontend admin izmene

Potrebno je uraditi:

1. Dodati node preset dropdown u node formu.
2. Dodati `decision_type` dropdown u node formu.
3. Dodati edge preset dropdown u edge formu.
4. Dodati `path_role` dropdown u edge formu.
5. Dodati `direction_hint` dropdown u edge formu sa opcijom prazno/auto.
6. U route preview dodati izbor jezika:
   - Slovenian
   - English
7. Slati `language` parametar ka `/api/navigation/route`.
8. Prikazati generated step text kao i do sada.

## 10. Revidiranje postojeceg grafa

Pre nego sto generator da dobre rezultate, postojece podatke treba srediti.

Za svaki sprat:

1. Proveriti da li dugi hodnici imaju dovoljno waypoint-a.
2. Oznaciti skretanja kao `decision_type=turn`.
3. Oznaciti raskrsnice kao `decision_type=junction`.
4. Oznaciti vrata prostorija kao `decision_type=door`.
5. Oznaciti liftove i stepenice kao `elevator_entry/elevator_exit` ili `stairs_entry/stairs_exit`.
6. Popuniti `landmark` na edge-evima gde korisnik prolazi pored bitnog orijentira.
7. Postaviti `path_role=enter_room` za ulaze u prostorije.
8. Postaviti `path_role=change_floor` za lift/stepenice izmedju spratova.
9. Dodati `direction_hint` samo tamo gde automatski smer ne radi dobro.

## 11. Test plan

### Backend

Testirati:

- migracija dodaje nova polja sa default vrednostima,
- stari seed podaci i dalje prolaze,
- admin create/update node cuva `decision_type`,
- admin create/update edge cuva `path_role` i `direction_hint`,
- SQL export sadrzi nova polja,
- route endpoint podrzava `language=sl`,
- route endpoint podrzava `language=en`,
- route endpoint fallbackuje na `sl`,
- generator grupise waypoint edge-eve,
- generator koristi rucni `instruction_forward` kao override,
- generator koristi `direction_hint` kada postoji,
- generator racuna smer kada hint ne postoji.

### Frontend

Testirati:

- node preset popunjava prava polja,
- edge preset popunjava prava polja,
- rucna izmena posle preset-a ostaje moguca,
- route preview radi za slovenski,
- route preview radi za engleski,
- export SQL i dalje radi posle novih polja.

### Rucni scenariji

Minimalni scenariji:

- glavni ulaz -> kavarna,
- glavni ulaz -> ucionica na istom spratu,
- glavni ulaz -> prostorija na drugom spratu preko stepenica,
- glavni ulaz -> prostorija na drugom spratu preko lifta,
- ruta pored lifta bez ulaska u lift,
- ruta do prostorije preko dugog hodnika sa vise waypoint-a.

## 12. Faze implementacije

### Faza 1: Podaci i admin forma

- Dodati nova polja u bazu.
- Dopuniti modele, DTO i admin CRUD.
- Dodati preset dropdown-e u admin UI.
- Dopuniti SQL export.

Rezultat: admin moze da unosi semantiku grafa, ali route tekst jos moze ostati stari.

### Faza 2: Generator instrukcija

- Dodati `InstructionGeneratorService`.
- Dodati racunanje smera iz geometrije.
- Dodati grupisanje waypoint segmenata.
- Dodati sl/en tekst provider.
- Povezati generator sa `NavigationRouteService`.

Rezultat: rute dobijaju dinamicki generisane instrukcije.

### Faza 3: Revizija grafa

- Proci kroz postojece spratove.
- Oznaciti decision node-ove i edge role-ove.
- Testirati realne rute u admin route preview-u.
- Exportovati SQL.

Rezultat: generisani opisi postaju korisni i konzistentni.

### Faza 4: Poliranje

- Dodati bolje fallback tekstove.
- Dodati upozorenja u admin UI za edge bez role-a ili node bez decision type-a.
- Dodati testove za konkretne poznate rute.
- Dodati dokumentaciju za konvenciju imenovanja.

## 13. Kriterijumi prihvatanja

Funkcionalnost je zavrsena kada:

- admin moze da unese `decision_type`, `path_role` i `direction_hint`,
- preset-i ubrzavaju unos i smanjuju greske,
- route endpoint generise instrukcije na `sl` i `en`,
- waypoint node-ovi se grupisu i ne prave suvisne korake,
- skretanja se racunaju automatski iz geometrije,
- problematicni smerovi mogu da se override-uju kroz admin,
- SQL export cuva svu novu semantiku,
- ruta glavni ulaz -> kavarna daje smislen opis bez rucnog pisanja svakog koraka.
