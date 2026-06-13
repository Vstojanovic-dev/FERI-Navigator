# Opisna navodila od G2 P01 do kavarne

## Cilj

Privzeta pot od predavalnice G2 P01 v pritličju do kavarne v 3. nadstropju mora
pri uporabi dvigala prikazati konkretna orientacijska navodila namesto splošnega
besedila »Nadaljujte po hodniku.«.

## Obseg

Sprememba velja samo za privzeto pot z dvigalom med lokacijama G2 P01 in
kavarna. Poti po stopnicah in globalno ustvarjanje hodniških navodil ostanejo
nespremenjeni.

## Rešitev

`NavigationRouteService` po izračunu poti prepozna točno kombinacijo začetnega
vozlišča `G2_pritlicje_g2_p01` in ciljnega vozlišča
`G2_3_nadstropje_kavarna`, kadar je uporaba dvigala omogočena. Samo za to
kombinacijo generična navodila zamenja z vnaprej določenimi predstavitvenimi
navodili:

1. iz G2 P01 proti hodniku in dvigalu;
2. vstop v dvigalo in vožnja v 3. nadstropje;
3. izhod iz dvigala ter usmeritev proti kavarni;
4. prihod do kavarne ob hodniku pri dvigalu.

Navodila uporabljajo vidne orientacijske točke in smer gibanja. Besedilo ne
omenja tehničnih imen vozlišč, kot so `wp6`. Navigacijski graf, migracije,
uteži in izbira poti ostanejo nespremenjeni.

## Lokalizacija

Slovenska in angleška različica predstavitvenih navodil sta določeni v backendu.
Izbrana različica sledi jeziku zahtevka.

## Preverjanje

Backend test preveri, da ima točna dvigalna pot pričakovana opisna navodila v
slovenščini in angleščini. Dodatni negativni primer preveri, da druga pot ne
dobi predstavitvenih navodil.

Izvedejo se ciljni backend testi in celoten backend testni sklop.

## Omejitve

To je namenska predstavitvena izjema in ne splošna produkcijska rešitev.
Sprememba ne spreminja izbire najkrajše poti. Če se struktura izračunane poti
spremeni, bo treba prilagoditi preslikavo predstavitvenih korakov.
