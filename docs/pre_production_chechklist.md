# Pre-production checklist

Ovaj dokument vise nije wish-list. Statusi ispod prate trenutno stanje repoa za pre-production hardening.

Status oznake:

- `[x]` zatvoreno u repou
- `[ ]` i dalje otvoren posao
- `[-]` svesno odlozeno posle staging readiness ciklusa

## P0

- [x] Spring profili `dev`, `test`, `prod` postoje i produkcija vise nije na dev defaultima.
- [x] Centralizovana CORS konfiguracija postoji kroz `SecurityConfig` i typed properties.
- [x] Admin endpointi su fail-closed i `app.admin.enabled=false` je production default.
- [x] Admin frontend je definisan kao lokalni alat, ne kao stalno hostovan servis.
- [x] Produkcioni compose postoji i izlaže samo frontend; backend i Postgres su privatni unutar compose mreze.
- [x] Health/readiness endpointi su ukljuceni za backend.
- [x] Frontend production runtime vise ne koristi tihi `localhost` fallback za API base URL.
- [x] Flyway skeleton i `admin export -> migration` workflow su uvedeni.
- [x] Backup/restore workflow dokumentacija postoji.
- [x] Global API error handling je centralizovan za navigacione greske.
- [ ] HTTPS/TLS terminacija jos nije implementirana u deployment runtime-u.
- [ ] Secrets management jos nije zavrsen za stvarne staging/production vrednosti.
- [ ] Rate limiting jos nije implementiran.
- [ ] Write/import endpointi van `/api/admin/**` jos nisu posebno zakljucani ili ugaseni po potrebi.
- [ ] Admin autentifikacija/autorizacija nije uvedena; trenutno je oslonac da admin nije hostovan i da je backend admin mode ugasen u production profilu.

## P1

- [x] Backend test path, frontend build i admin build sada imaju CI workflow.
- [x] Frontend smoke test pokriva route flow signal, ne samo page load.
- [x] Nginx SPA fallback i cache/no-store split su uvedeni za production frontend image.
- [x] Admin workflow je dokumentovan kao `lokalni editor -> export -> reviewed migration`.
- [x] A* i malformed route data hardening su implementirani.
- [x] Frontend search debounce i route rendering guardovi su uvedeni.
- [ ] Puni backend integration testovi sa realnom Postgres bazom/Testcontainers i dalje nedostaju.
- [ ] Validacija query parametara i admin koordinata nije jos sistematski zavrsena za sve endpoint-e.
- [ ] Audit log za admin izmene nije uveden.
- [ ] Optimistic locking / zastita od konkurentnih admin izmena nije uvedena.
- [ ] Resource limits, restart policy i log rotation nisu jos dodati u deployment manifestima.
- [ ] Monitoring i alerting nisu jos implementirani.
- [ ] Security headers na reverse proxy sloju nisu jos eksplicitno definisani.

## P2

- [x] `.env.example` postoji za glavni backend/runtime path.
- [x] Release checklist postoji u `docs/workflows/release-checklist.md`.
- [x] Production deployment i backup workflow dokumentacija sada postoje.
- [ ] Rollback plan jos nije razradjen u poseban workflow dokument.
- [ ] Graph integrity script jos nije dodat.
- [ ] Sistematska orphan-data provera jos nije dodata.
- [ ] Performance benchmark i caching odluke jos nisu dokumentovani.
- [ ] Error boundary i sira frontend resiliency proveravanja ostaju follow-up.
- [ ] Accessibility i mobile verification jos nisu zatvoreni kao formalni gate.

## Trenutni staging readiness zakljucak

Repo je znacajno blize staging-ready stanju nego na pocetku ciklusa, ali jos nije kompletno spreman za javni staging ili production-like deploy bez sledecih preostalih blokera:

1. definisati stvarne production secrets i domen/env vrednosti,
2. postaviti TLS na runtime sloju,
3. odluciti sta se radi sa preostalim write/import endpointima,
4. dodati bar minimalan rate limiting,
5. odraditi staging smoke run na stvarnom hostovanom okruzenju.
