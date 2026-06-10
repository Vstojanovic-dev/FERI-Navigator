# Dokumentacija FERI Navigatorja

Ta stran je osrednje kazalo dokumentacije. Izberite dokument glede na nalogo, ki jo želite opraviti.

## Kam nadaljevati

| Če želite ... | Preberite |
|---|---|
| uporabljati aplikacijo | [`user-guide.md`](user-guide.md) |
| razumeti delovanje celotnega sistema | [`architecture.md`](architecture.md) |
| preveriti tehnologije, različice ali strukturo map | [`repository-structure.md`](repository-structure.md) |
| zagnati projekt in preveriti spremembe | [`development.md`](development.md) |
| spreminjati javni ali administratorski frontend | [`frontend.md`](frontend.md) |
| spreminjati backend ali API | [`backend-and-api.md`](backend-and-api.md) |
| spreminjati podatkovno bazo, zemljevide ali navigacijski graf | [`data-and-navigation.md`](data-and-navigation.md) |
| pripraviti namestitev, nadgradnjo ali obnovitev | [`deployment-and-operations.md`](deployment-and-operations.md) |

## Prvi prevzem projekta

Novemu razvijalcu priporočamo naslednji vrstni red:

1. [`../README.md`](../README.md) za namen projekta in hiter zagon;
2. [`architecture.md`](architecture.md) za mentalni model sistema;
3. [`repository-structure.md`](repository-structure.md) za tehnologije, pomembne mape in vire resnice;
4. [`development.md`](development.md) za lokalno delo in preverjanje sprememb;
5. dokument področja, ki ga bo spreminjal.

Celotne dokumentacije ni treba prebrati pred prvo spremembo. Po skupnem uvodu nadaljujte samo z dokumenti, ki so povezani z vašim delom.

## Zgodovinski načrti

Mapi [`superpowers/plans/`](superpowers/plans/) in [`superpowers/specs/`](superpowers/specs/) vsebujeta načrte in zasnove preteklih implementacij. Namenjeni sta razumevanju zgodovine odločitev in ne opisujeta nujno trenutnega delovanja sistema.

Za trenutno stanje imajo prednost:

1. izvorna koda in avtomatizirani testi;
2. konfiguracija, podatkovna shema in migracije;
3. dokumenti, povezani na tej strani.

Če dokumentacija ne ustreza implementaciji, jo je treba popraviti v isti spremembi.
