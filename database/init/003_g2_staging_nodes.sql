-- Staging data for G2 navigation nodes.
-- Coordinates are in the original PDF/map coordinate system, not PNG pixels.
-- 004_load_g2_navigation_nodes.sql imports this data into the core navigation
-- tables and creates PostGIS Point geometries.

-- Kreiranje tabele
CREATE TABLE IF NOT EXISTS g2_navigation_nodes (
    id SERIAL PRIMARY KEY,
    floor VARCHAR(20) NOT NULL,         -- etaža (pritlicje, medetaza, 1_nadstropje, itd.)
    node_key VARCHAR(100) NOT NULL,     -- ključ čvora
    label VARCHAR(100),                 -- oznaka/naziv
    pixel_x NUMERIC(10,2),              -- original PDF/map X coordinate
    pixel_y NUMERIC(10,2),              -- original PDF/map Y coordinate
    UNIQUE(floor, node_key)
);

-- Indeks za prostorne upite
CREATE INDEX IF NOT EXISTS idx_g2_nodes_floor ON g2_navigation_nodes (floor);

-- ============================================================
-- PRITLIČJE
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('pritlicje', 'liftovi', 'liftovi', 863.7, 466.9),
('pritlicje', 'wp1', 'wp1', 861.7, 409.9),
('pritlicje', 'wp2', 'wp2', 827.7, 375.0),
('pritlicje', 'glavni_ulaz', 'glavni_ulaz', 829.7, 300.0),
('pritlicje', 'wp3', 'wp3', 813.7, 222.0),
('pritlicje', 'referat', 'referat', 813.7, 142.0),
('pritlicje', 'izlaz_za_g_objekat', 'izlaz_za_g_objekat', 813.7, 78.0),
('pritlicje', 'wp4', 'wp4', 779.7, 244.0),
('pritlicje', 'stepeniste_seminarske', 'stepeniste_seminarske', 761.7, 202.0),
('pritlicje', 'wp5', 'wp5', 748.7, 300.0),
('pritlicje', 'wp6', 'wp6', 662.7, 298.0),
('pritlicje', 'wp7', 'wp7', 567.8, 298.0),
('pritlicje', 'wp8', 'wp8', 465.8, 299.0),
('pritlicje', 'wp9', 'wp9', 465.8, 362.0),
('pritlicje', 'wp10', 'wp10', 565.8, 361.0),
('pritlicje', 'wp11', 'wp11', 664.7, 364.0),
('pritlicje', 'wp12', 'wp12', 757.7, 373.0),
('pritlicje', 'stepenice_lab', 'stepenice_lab', 759.7, 471.9),
('pritlicje', 'g2_p04', 'G2_P04', 647.8, 397.9),
('pritlicje', 'g2_p05', 'G2_P05', 498.8, 407.9),
('pritlicje', 'g2_p06', 'G2_P06', 368.9, 414.9),
('pritlicje', 'g2_p01', 'G2_P01', 657.8, 244.0),
('pritlicje', 'g2_p02', 'G2_P02', 486.8, 246.0),
('pritlicje', 'g2_p03', 'G2_P03', 338.9, 246.0),
('pritlicje', 'glevne_stepenice', 'glevne_stepenice', 341.9, 287.0),
('pritlicje', 'wp13', 'wp13', 317.9, 415.9),
('pritlicje', 'wp14', 'wp14', 312.9, 496.9),
('pritlicje', 'wp15', 'wp15', 309.9, 529.9),
('pritlicje', 'wp16', 'wp16', 268.9, 533.9),
('pritlicje', 'stepenice_lift', 'stepenice_lift', 265.9, 479.9),
('pritlicje', 'wp17', 'wp17', 252.9, 415.9),
('pritlicje', 'lift', 'lift', 264.9, 378.0),
('pritlicje', 'ulaz_prezihova_ulica', 'ulaz_prezihova_ulica', 221.9, 420.9),
('pritlicje', 'wp18', 'wp18', 245.9, 330.0),
('pritlicje', 'wp19', 'wp19', 160.9, 332.0),
('pritlicje', 'g2_p1_alfa', 'g2_p1_alfa', 141.9, 294.0),
('pritlicje', 'g2_p2_beta', 'g2_p2_beta', 139.9, 366.0),
('pritlicje', 'izlaz_za_g3_objekat', 'izlaz_za_g3_objekat', 67.0, 333.0),
('pritlicje', 'stepenice_wc', 'stepenice_wc', 272.9, 223.0),
('pritlicje', 'stakleni_hodnik', 'stakleni_hodnik', 268.9, 144.0),
('pritlicje', 'izlaz_za_a_objekat', 'izlaz_za_a_objekat', 265.9, 71.0)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;

-- ============================================================
-- MEĐUETAŽA (medetaza)
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('medetaza', 'stepeniste_seminarske', 'stepeniste_seminarske', 759.7, 205.1),
('medetaza', 'wp1', 'wp1', 758.7, 169.1),
('medetaza', 'wc_osoblje', 'wc_osoblje', 747.7, 126.1),
('medetaza', 'wp2', 'wp2', 690.7, 168.1),
('medetaza', 'wp3', 'wp3', 612.8, 168.1),
('medetaza', 'profesorski_hodnik', 'profesorski_hodnik', 512.8, 166.1),
('medetaza', 'wp4', 'wp4', 412.8, 166.1),
('medetaza', 'wp5', 'wp5', 318.9, 167.1),
('medetaza', 'wp6', 'wp6', 270.9, 165.1),
('medetaza', 'studentski_wc', 'studentski_wc', 271.9, 125.1),
('medetaza', 'stepeniste_wc', 'stepeniste_wc', 271.9, 217.1)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;

-- ============================================================
-- 1. NADSTROPJE
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('1_nadstropje', 'liftovi', 'liftovi', 860.7, 467.9),
('1_nadstropje', 'wp1', 'wp1', 834.7, 408.9),
('1_nadstropje', 'wp2', 'wp2', 815.7, 330.0),
('1_nadstropje', 'wp3', 'wp3', 808.7, 224.0),
('1_nadstropje', 'ohm', 'ohm', 813.7, 141.0),
('1_nadstropje', 'izlaz_za_g_objekat', 'izlaz_za_g_objekat', 814.7, 77.0),
('1_nadstropje', 'wp4', 'wp4', 782.7, 166.0),
('1_nadstropje', 'wp5', 'wp5', 743.7, 165.0),
('1_nadstropje', 'wc_osoblje', 'wc_osoblje', 743.7, 127.0),
('1_nadstropje', 'stepeniste_seminarske', 'stepeniste_seminarske', 749.7, 206.0),
('1_nadstropje', 'seminarska_soba', 'seminarska_soba', 691.7, 167.0),
('1_nadstropje', 'wp6', 'wp6', 590.8, 170.0),
('1_nadstropje', 'profesorski_hodnik', 'profesorski_hodnik', 492.8, 167.0),
('1_nadstropje', 'wp7', 'wp7', 368.9, 168.0),
('1_nadstropje', 'wp8', 'wp8', 271.9, 170.0),
('1_nadstropje', 'studentski_wc', 'studentski_wc', 273.9, 128.0),
('1_nadstropje', 'stepeniste_wc', 'stepeniste_wc', 273.9, 221.0),
('1_nadstropje', 'stepeniste_lift', 'stepeniste_lift', 268.9, 474.9),
('1_nadstropje', 'wp9', 'wp9', 269.9, 529.9),
('1_nadstropje', 'wp10', 'wp10', 309.9, 527.9),
('1_nadstropje', 'wp11', 'wp11', 313.9, 450.9),
('1_nadstropje', 'wp12', 'wp12', 316.9, 413.9),
('1_nadstropje', 'amper_lab', 'amper_lab', 375.9, 410.9),
('1_nadstropje', 'pascal_lab', 'pascal_lab', 500.8, 403.9),
('1_nadstropje', 'newton_lab', 'newton_lab', 648.8, 398.9),
('1_nadstropje', 'wp13', 'wp13', 761.7, 397.9),
('1_nadstropje', 'prostor_za_ucenje', 'prostor_za_ucenje', 762.7, 327.0),
('1_nadstropje', 'stepeniste_lab', 'stepeniste_lab', 760.7, 472.9)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;

-- ============================================================
-- 2. NADSTROPJE
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('2_nadstropje', 'liftovi', 'liftovi', 862.7, 467.0),
('2_nadstropje', 'wp1', 'wp1', 841.7, 418.0),
('2_nadstropje', 'wp2', 'wp2', 821.7, 333.0),
('2_nadstropje', 'wp3', 'wp3', 805.7, 244.9),
('2_nadstropje', 'hertz', 'hertz', 815.7, 154.9),
('2_nadstropje', 'izlaz_za_g_objekat', 'izlaz_za_g_objekat', 812.7, 76.7),
('2_nadstropje', 'stepenistee_seminarske', 'stepenistee_seminarske', 760.7, 211.7),
('2_nadstropje', 'wc_osoblje', 'wc_osoblje', 760.7, 152.7),
('2_nadstropje', 'wp4', 'wp4', 739.7, 165.7),
('2_nadstropje', 'seminarska_soba', 'seminarska_soba', 688.7, 168.7),
('2_nadstropje', 'wp5', 'wp5', 603.8, 164.7),
('2_nadstropje', 'profesorkski_hodnik', 'profesorkski_hodnik', 491.8, 166.7),
('2_nadstropje', 'wp6', 'wp6', 389.9, 165.7),
('2_nadstropje', 'wp7', 'wp7', 305.9, 165.7),
('2_nadstropje', 'studentski_wc', 'studentski_wc', 271.9, 148.7),
('2_nadstropje', 'stepeniste_wc', 'stepeniste_wc', 272.9, 219.7),
('2_nadstropje', 'prostor_za_ucenje2', 'prostor_za_ucenje2', 273.9, 321.7),
('2_nadstropje', 'g2_p4_delta', 'G2_P4 delta', 145.9, 359.7),
('2_nadstropje', 'g2_p3_gama', 'G2_P3 Gama', 146.9, 297.7),
('2_nadstropje', 'izlaz_za_g3_objekat', 'izlaz_za_g3_objekat', 71.0, 327.7),
('2_nadstropje', 'lift', 'lift', 269.9, 387.9),
('2_nadstropje', 'wp8', 'wp8', 221.9, 386.9),
('2_nadstropje', 'wp9', 'wp9', 220.9, 531.9),
('2_nadstropje', 'wp10', 'wp10', 268.9, 529.9),
('2_nadstropje', 'stepeniste_lift', 'stepeniste_lift', 268.9, 478.9),
('2_nadstropje', 'wp11', 'wp11', 308.9, 528.9),
('2_nadstropje', 'wp12', 'wp12', 312.9, 417.9),
('2_nadstropje', 'farad_lab', 'farad_lab', 370.9, 412.9),
('2_nadstropje', 'weber_lab', 'weber_lab', 498.8, 402.9),
('2_nadstropje', 'teesla_lab', 'teesla_lab', 649.8, 396.9),
('2_nadstropje', 'wp13', 'wp13', 762.7, 393.9),
('2_nadstropje', 'prostor_za_ucenje', 'prostor_za_ucenje', 759.7, 317.9),
('2_nadstropje', 'stepeniste_lab', 'stepeniste_lab', 759.7, 476.9)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;

-- ============================================================
-- 3. NADSTROPJE
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('3_nadstropje', 'liftovi', 'liftovi', 851.2, 470.0),
('3_nadstropje', 'wp1', 'wp1', 814.2, 448.0),
('3_nadstropje', 'tajnistvo_fakulteta', 'tajnistvo_fakulteta', 810.2, 392.0),
('3_nadstropje', 'tajnistvo_dekana', 'tajnistvo_dekana', 809.2, 338.0),
('3_nadstropje', 'dekan', 'dekan', 807.2, 256.0),
('3_nadstropje', 'senatna_soba', 'senatna_soba', 813.2, 167.1),
('3_nadstropje', 'izlaz_za_g_objekat', 'Izlaz_za_G_objekat', 812.2, 82.1),
('3_nadstropje', 'stepeniste_seminarske', 'stepeniste_seminarske', 749.3, 199.1),
('3_nadstropje', 'wc_osoblje', 'wc_osoblje', 760.3, 155.1),
('3_nadstropje', 'seminarska_soba', 'seminarska_soba', 690.3, 178.1),
('3_nadstropje', 'profesorski_hodnik', 'profesorski_hodnik', 513.4, 164.1),
('3_nadstropje', 'wp2', 'wp2', 404.4, 167.1),
('3_nadstropje', 'wp', 'wp', 616.3, 165.1),
('3_nadstropje', 'wp4', 'wp4', 318.4, 165.1),
('3_nadstropje', 'studentski_wc', 'studentski_wc', 271.4, 134.1),
('3_nadstropje', 'wp5', 'wp5', 272.4, 164.1),
('3_nadstropje', 'stepeniste_wc', 'stepeniste_wc', 272.4, 217.1),
('3_nadstropje', 'kavarna', 'kavarna', 264.4, 330.1),
('3_nadstropje', 'lift', 'Lift', 283.4, 393.0),
('3_nadstropje', 'wp6', 'wp6', 251.5, 409.0),
('3_nadstropje', 'stepeniste_lift', 'stepeniste_lift', 253.4, 479.0),
('3_nadstropje', 'wp7', 'wp7', 254.4, 526.0),
('3_nadstropje', 'wp8', 'wp8', 311.4, 525.0),
('3_nadstropje', 'wp9', 'wp9', 313.4, 439.0),
('3_nadstropje', 'henry_lab', 'henry_lab', 372.4, 411.0),
('3_nadstropje', 'becquerel_lab', 'becquerel_lab', 494.4, 406.0),
('3_nadstropje', 'lumen_lab', 'lumen_lab', 638.3, 396.0),
('3_nadstropje', 'wp10', 'wp10', 720.3, 395.0),
('3_nadstropje', 'prostor_za_ucenje', 'prostor_za_ucenje', 759.3, 328.0),
('3_nadstropje', 'wp11', 'wp11', 774.3, 393.0),
('3_nadstropje', 'stepeniste_lab', 'stepeniste_lab', 763.3, 475.0)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;

-- ============================================================
-- 4. NADSTROPJE
-- ============================================================
INSERT INTO g2_navigation_nodes (floor, node_key, label, pixel_x, pixel_y) VALUES
('4_nadstropje', 'stepeniste_seminarske', 'stepeniste_seminarske', 759.7, 209.4),
('4_nadstropje', 'wp1', 'wp1', 759.7, 162.4),
('4_nadstropje', 'galrija', 'galrija', 786.7, 163.4),
('4_nadstropje', 'wc_osoblje', 'wc_osoblje', 744.7, 128.4),
('4_nadstropje', 'wp2', 'wp2', 685.7, 169.4),
('4_nadstropje', 'wp3', 'wp3', 597.8, 167.4),
('4_nadstropje', 'profesorski_hodnik', 'profesorski_hodnik', 517.8, 167.4),
('4_nadstropje', 'wp4', 'wp4', 427.8, 164.4),
('4_nadstropje', 'wp5', 'wp5', 323.9, 165.4),
('4_nadstropje', 'wp6', 'wp6', 271.9, 164.4),
('4_nadstropje', 'studentski_wc', 'studentski_wc', 269.9, 128.4),
('4_nadstropje', 'stepeniste_wc', 'stepeniste_wc', 272.9, 219.4)
ON CONFLICT (floor, node_key) DO UPDATE
  SET label = EXCLUDED.label,
      pixel_x = EXCLUDED.pixel_x,
      pixel_y = EXCLUDED.pixel_y;
