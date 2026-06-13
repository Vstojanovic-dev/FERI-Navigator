# Uporabniška navodila

FERI Navigator pomaga poiskati prostor na FERI in prikazati pot od izbrane začetne lokacije do cilja. Aplikacijo lahko uporabljate na računalniku ali telefonu.

## Glavni deli aplikacije

V glavnem meniju so na voljo tri strani:

- **Navigator** za hitro iskanje prostorov;
- **Objekti** za pregled stavb in prostorov v njih;
- **Navigacija** za izračun poti.

V meniju lahko preklopite tudi med slovenščino in angleščino. Izbrani jezik ostane shranjen za naslednji obisk.

## Iskanje prostora

Na začetni strani v iskalno polje vnesite ime ali oznako učilnice, laboratorija, pisarne ali drugega prostora.

Rezultate lahko omejite glede na vrsto prostora:

- učilnice;
- laboratoriji;
- pisarne;
- drugi prostori.

Pri vsakem rezultatu so lahko prikazani objekt, nadstropje in vrsta prostora. S klikom na rezultat odprete podrobnosti, kjer so glede na razpoložljive podatke prikazani:

- opis prostora;
- objekt in nadstropje;
- oznaka prostora;
- položaj prostora na tlorisu.

Z gumbom **Poišči učilnico** odprete navigacijo z že izbranim ciljem.

## Pregled objektov

Stran **Objekti** prikazuje stavbe FERI. Objekte lahko iščete po imenu.

Po izbiri objekta se odprejo:

- načrt objekta, če je na voljo;
- seznam prostorov v objektu;
- iskalno polje za iskanje znotraj izbranega objekta.

S klikom na prostor odprete njegove podrobnosti in lahko nadaljujete v navigacijo.

## Izračun poti

Na strani **Navigacija**:

1. V polje **Začetna lokacija** začnite vnašati trenutno lokacijo.
2. Izberite ustrezen rezultat s seznama.
3. V polje **Ciljna lokacija** vnesite želeni prostor.
4. Izberite ustrezen rezultat s seznama.
5. Po potrebi vklopite ali izklopite možnost **Uporabi lift**.
6. Izberite **Prikaži pot**.

Lokaciji morate izbrati s ponujenega seznama. Sam vpis besedila brez izbire rezultata ne zadostuje.

Začetna in ciljna lokacija ne smeta biti enaki.

## Najbližji WC

Namesto določenega ciljnega prostora lahko izberete **Najbližji WC**. Aplikacija med razpoložljivimi podatki poišče najprimernejši dosegljivi cilj in prikaže pot do njega.

Če primeren WC ali pot do njega še nista vnesena v navigacijske podatke, aplikacija prikaže obvestilo.

## Sledenje poti

Po izračunu poti aplikacija prikaže:

- tloris trenutnega nadstropja;
- označen del poti;
- besedilna navodila;
- trenutno aktivni korak.

Med koraki se premikate s puščicama za prejšnji in naslednji korak. Izberete lahko tudi posamezen korak na seznamu.

Če pot poteka čez več nadstropij, je razdeljena na več odsekov. Ko pridete do konca odseka, aplikacija preklopi na tloris naslednjega nadstropja. Med odseki lahko preklapljate tudi z gumbom ob imenu nadstropja.

Za spremembo začetne lokacije, cilja ali uporabe dvigala izberite vrstico z izbranima lokacijama nad prikazom poti.

## Povezava z določeno začetno lokacijo

Povezava v obliki `/?fromLocationId=11` odpre začetno stran in si zapomni določeno začetno navigacijsko lokacijo. Uporabnik nato poišče ciljni prostor in izbere **Poišči učilnico**. Na strani navigacije je začetna lokacija že izbrana, cilj pa je prostor, ki ga je uporabnik izbral na začetni strani.

Takšno povezavo je mogoče zapisati tudi v zunanjo QR-kodo. Če identifikator ni veljaven ali lokacija ne obstaja, aplikacija odpre običajen navigacijski obrazec brez izbrane začetne lokacije.

## Deljenje poti

Ko je pot izračunana, jo lahko delite:

1. Izberite gumb **Deli pot**.
2. Kopirajte ustvarjeno povezavo ali uporabite sistemsko možnost deljenja.
3. Po potrebi izberite **Prikaži QR kodo**.

Prejemnik povezave odpre shranjeno izbiro začetne lokacije, cilja in nastavitve uporabe dvigala. Aplikacija nato ponovno izračuna pot s trenutnimi navigacijskimi podatki.

Če povezava ni veljavna ali je potekla, se prikaže ustrezno obvestilo.

## Zemljevid FERI

Na začetni strani lahko z gumbom zemljevida odprete pregled objektov FERI. Ta zemljevid je namenjen splošni orientaciji med objekti, podrobni tlorisi pa se uporabljajo pri prikazu posamezne poti.

## Če aplikacija ne najde poti

Najprej preverite:

- ali sta obe lokaciji izbrani s seznama;
- ali začetna in ciljna lokacija nista enaki;
- ali ste izbrali pravilni objekt in nadstropje;
- ali se rezultat spremeni po spremembi možnosti **Uporabi lift**.

Če aplikacija sporoči, da pot ni določena, navigacijski podatki za izbrani lokaciji verjetno še niso popolni. Izberite drugo začetno lokacijo ali o težavi obvestite skrbnika projekta.

Če se rezultati ali zemljevidi ne naložijo, osvežite stran in preverite internetno oziroma lokalno povezavo do aplikacije.

## Povezana dokumentacija

- [`README.md`](../README.md) za opis projekta in lokalni zagon;
- [`docs/README.md`](README.md) za celotno kazalo dokumentacije.
