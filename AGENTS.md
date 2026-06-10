# Navodila za agente

Za vsako spremembo v tem repozitoriju je obvezno prebrati in upoštevati [`docs/ai-agents.md`](docs/ai-agents.md).

Minimalna pravila:

1. Najprej preberite kodo, teste in dokument področja, ki ga spreminjate.
2. Ne prepisujte ali odstranjujte obstoječih sprememb, ki niso del naloge.
3. Spremembe naj bodo ozke in skladne z obstoječo arhitekturo.
4. Že uporabljene Flyway migracije se ne spreminjajo.
5. Admin in `/api/graph` endpointov ne obravnavajte kot varne javne funkcije.
6. Pred zaključkom zaženite ustrezne teste in jasno navedite, česa ni bilo mogoče preveriti.
7. Ne commitajte, pushajte ali ustvarjajte PR-ja brez izrecnega uporabniškega navodila.
