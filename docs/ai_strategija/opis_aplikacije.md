# Opis aplikacije FERI Navigator

## Namen aplikacije

FERI Navigator je spletna aplikacija za navigacijo po prostorih Fakultete za elektrotehniko, računalništvo in informatiko (FERI) Univerze v Mariboru. Omogoča uporabnikom, da hitro najdejo učilnice, laboratorije, pisarne, sanitarije, stopnišča, dvigala in druge prostore ali točke znotraj fakultetnih objektov.

Aplikacija je primarno prilagojena mobilni uporabi: uporabniki jo najpogosteje odprejo v brskalniku na telefonu, ko so že v stavbi in iščejo določen prostor ali pot do njega. Celoten uporabniški vmesnik je v slovenskem jeziku.

Aplikacija ne vsebuje prijave uporabnikov, gesel ali avtentikacije za končne uporabnike. Dostop je odprt in osredotočen na iskanje prostorov in navigacijo.

## Ciljni uporabniki

- študenti in študentke, ki iščejo učilnico ali laboratorij,
- obiskovalci in gostje fakultete,
- zaposleni, ki potrebujejo hitro orientacijo po objektih,
- vsak, ki se prvič znajde v prostorih FERI-ja in potrebuje jasno pot do cilja.

## Glavne funkcionalnosti

- iskanje prostorov po imenu ali tipu,
- filtriranje prostorov po tipu (učilnice, laboratoriji, pisarne, ostalo),
- pregled vseh fakultetnih objektov in prostorov znotraj posameznega objekta,
- podrobni prikaz izbranega prostora z osnovnimi podatki in lokacijo na načrtu,
- navigacija med začetno in ciljno lokacijo z vizualno potjo na načrtu nadstropja,
- tekstualni koraki navigacije z možnostjo premikanja po korakih,
- izbira, ali naj pot uporablja dvigalo ali ne,
- deljenje izračunane poti prek povezave in QR kode (ko je na voljo backend),
- prikaz splošnega zemljevida FERI-ja v pojavnem oknu.

Podatki o prostorih in objektih se v polnem obsegu nanašajo na backend in bazo, ko je sistem zagnan. Del funkcionalnosti ima v frontendu še rezervne demo podatke za primer, ko API ni dosegljiv. Nekatere funkcije (npr. deljenje poti) zahtevajo delujoč backend.

## Strani aplikacije

Aplikacija ima tri glavne URL poti (`/`, `/objekti`, `/navigacija`) in dodatno pot za deljene povezave (`/share/:shareCode`). Podrobnosti prostora ali objekta se pogosto prikažejo znotraj iste poti prek stanja brskalnika (`location.state`), brez ločenega URL-ja.

### Začetna stran

Začetna stran (`/`, komponenta `HomePage`) je glavni vstop v aplikacijo.

Ob prvem obisku se prikaže kratka uvodna animacija z logotipom FERI in naslovom *Navigator*. Po animaciji postanejo vidni gumb za meni, naslov in gumb za zemljevid.

Na strani je glavni iskalnik prostorov. Uporabnik lahko išče učilnice, laboratorije, pisarne in druge prostore. Pod iskalnikom so filtri po tipu prostora: *Vsi*, *Učilnice*, *Laboratoriji*, *Pisarne*, *Ostalo*.

Rezultati iskanja so prikazani kot kartice prostorov. Vsaka kartica vsebuje krajše prikazno ime prostora, tip, objekt, nadstropje in gumb **Poišči učilnico**. Kartice ne prikazujejo fotografij prostorov — le besedilne informacije.

- Klik na kartico odpre podrobnosti prostora (komponenta `SpaceDetailsView`) znotraj iste poti.
- Klik na gumb **Poišči učilnico** odpre stran Navigacija s prednastavljeno ciljno lokacijo.
- Gumb z ikono zemljevida odpre pojavno okno s sliko `zemljevidFERI.png`, ki prikazuje splošni zemljevid FERI-ja.
- Gumb za meni (☰) odpre glavni meni.

### Navigacija

Stran Navigacija (`/navigacija`, komponenta `NavigationPage` z `NavigationView`) služi za iskanje poti med začetno in ciljno lokacijo.

Vsebuje:

- polje za **začetno lokacijo** z iskanjem in predlogi,
- polje za **ciljno lokacijo** z iskanjem in predlogi,
- možnost **Uporabi lift** (pot z dvigalom) ali pot brez dvigala (samo stopnice),
- gumb **Prikaži pot**, ki pošlje zahtevo backendu za izračun poti,
- prikaz načrta oziroma slike nadstropja za aktivni segment poti,
- prikaz poti na sliki z označeno rutno črto,
- seznam korakov navigacije z besedilnimi navodili,
- puščici za premikanje med koraki in med segmenti (npr. ob menjavi nadstropja),
- gumb za **deljenje poti**, ki ustvari povezavo prek backend API-ja; v pojavnem oknu so na voljo kopiranje povezave, QR koda in (kjer brskalnik podpira) sistemsko deljenje.

Če uporabnik pride na navigacijo iz kartice prostora ali gumba **Poišči učilnico**, je ciljna lokacija samodejno prednastavljena. Če stran odpre neposredno iz menija, mora uporabnik izbrati obe lokaciji sam.

Pot `/share/:shareCode` omogoča odpiranje vnaprej deljene poti. Aplikacija razreši kodo prek backend API-ja in nato prikaže navigacijo z ustreznimi lokacijami. Če povezava ni veljavna ali je potekla, se prikaže sporočilo o napaki.

Navigacija zahteva delujoč backend za izračun poti. Brez backenda iskanje lokacij in prikaz poti ne delujeta v polnem obsegu.

### Vsi objekti

Stran Vsi objekti (`/objekti`, komponenta `BuildingsPage`) prikazuje vse fakultetne objekte.

Na vrhu je iskalnik objektov. Objekti so prikazani kot kartice. Vsaka kartica vsebuje:

- sliko oziroma načrt objekta (če je na voljo),
- naziv objekta,
- število prostorov v objektu.

Objekti so sortirani po številu prostorov — najprej tisti z največ prostori. Klik na kartico odpre podrobnosti izbranega objekta.

Če backend ni dosegljiv, se za število prostorov in seznam prostorov lahko uporabijo rezervni demo podatki, shranjeni v frontendu.

### Podrobnosti objekta

Podrobnosti objekta se prikažejo znotraj poti `/objekti`, ko uporabnik izbere objekt.

Prikaz vsebuje:

- naslov z imenom objekta in gumboma za nazaj ter meni,
- načrt objekta (slika iz mape načrtov),
- seznam prostorov v objektu,
- iskalnik prostorov znotraj izbranega objekta.

Kartice prostorov prikazujejo ime, tip, nadstropje in oznako, brez slik posameznih prostorov. Klik na prostor odpre podrobnosti prostora.

### Podrobnosti prostora

Podrobnosti prostora (`SpaceDetailsView`, komponenta `UcilnicaPage` v starejši terminologiji) se prikažejo, ko uporabnik izbere prostor s začetne strani ali s seznama prostorov v objektu.

Prikaz vsebuje:

- krajše prikazno ime prostora in oznako tipa,
- generiran opis prostora na podlagi razpoložljivih podatkov (tip, objekt, nadstropje, oznaka),
- osnovne podatke: objekt, nadstropje, oznaka,
- gumb **Poišči učilnico**, ki odpre navigacijo s prednastavljenim ciljem,
- prikaz lokacije prostora na načrtu objekta oziroma nadstropja z markerjem.

Fotografije prostorov se ne uporabljajo, ker jih ni mogoče zanesljivo zagotoviti. Namesto tega se uporabljajo načrti objektov in nadstropij.

## Navigacijski tok uporabnika

Tipični toki:

1. **Iskanje prostora na začetni strani**  
   Začetna stran → iskanje → kartica prostora → podrobnosti prostora ali navigacija s prednastavljenim ciljem.

2. **Pregled objektov**  
   Meni → Vsi objekti → izbira objekta → iskanje prostora v objektu → podrobnosti prostora ali navigacija.

3. **Neposredna navigacija**  
   Meni → Navigacija → izbira začetne in ciljne lokacije → prikaz poti → sledenje korakom → po želji deljenje poti.

4. **Deljena pot**  
   Odprtje povezave `/share/...` → razrešitev poti → prikaz navigacije.

### Glavni meni

Glavni meni je dostopen na vseh straneh prek gumba ☰. Vsebuje:

- **Domov** (začetna stran),
- **Vsi objekti**,
- **Navigacija**.

Trenutna stran se v meniju ne prikaže kot možnost (razen v posebnih primerih, ko je nastavljen `showAllMenuItems`). Na začetni strani to pomeni, da možnost *Domov* ni vidna, ker je uporabnik že na njej.

Gumb **nazaj** (←) vrne uporabnika en korak nazaj v zgodovini brskalnika, ne vedno na začetno stran. Če zgodovine ni, se uporabi rezervna pot (npr. `/` ali `/objekti`).

Stran **O FERI** je bila odstranjena in se trenutno ne uporablja. Ni je v meniju niti med potmi aplikacije.

## Podatki in prikaz imen

Iskanje in prikaz uporabljajo krajša **prikazna imena** (`displayName`), ki so za uporabnika bolj berljiva. Interna imena v podatkih ali API-ju se lahko razlikujejo (npr. polno ime z objektom in nadstropjem v enem nizu).

Logika za krajša imena je v pomožnih funkcijah v `frontend/src/utils/displayNames.ts` in sorodnih iskalnih pomožnikih. Pri iskanju se upoštevajo tudi vzdevki in normalizacija besedila.

Podatki o prostorih, objektih in navigacijskih točkah prihajajo iz backend REST API-ja, ko je sistem zagnan. V frontendu obstajajo še rezervni demo podatki (npr. za prostore v posameznih objektih), ki se uporabijo, če API klic ne uspe.

## Trenutne omejitve in demo funkcionalnosti

- Aplikacija **ni** namenjena namestitvi kot native mobilna aplikacija (ni React Native ali Expo); deluje v spletnem brskalniku.
- **Ni** prijave uporabnikov ali upravljanja osebnih računov v glavni aplikaciji.
- **Ni** strani O FERI.
- **Ne** uporablja fotografij prostorov — le načrti in zemljevidi.
- Kartice prostorov na začetni strani in v objektu ne prikazujejo slik prostorov.
- Navigacija, iskanje lokacij in katalog zahtevajo delujoč backend in bazo za polno funkcionalnost.
- Rezervni demo podatki v frontendu pokrivajo le del scenarijev (predvsem seznam prostorov v objektih ob nedostopnem API-ju).
- Deljenje poti in QR koda delujeta prek backend API-ja; brez backenda deljenje ni na voljo.
- Pokritost navigacijskega grafa in podatkov ni enaka za vse objekte — nekateri prostori ali poti so lahko še v pripravi.

## Funkcionalnosti za prihodnjo nadgradnjo

- popolna povezava vseh objektov in prostorov z bazo brez demo nadomestkov,
- razširitev navigacijskega grafa na vse objekte FERI-ja,
- izboljšave iskanja (sinonimi, priljubljene prostore, zgodovina iskanja),
- dostopnost (beralniki zaslona, izboljšana tipkovnica na mobilnih napravah),
- offline način ali predpomnjenje pogosto uporabljenih poti,
- morebitne slike prostorov, če bodo na voljo zanesljivi viri in pravice za objavo.
