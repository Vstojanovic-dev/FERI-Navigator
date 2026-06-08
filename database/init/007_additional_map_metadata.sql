-- Additional building/floor map metadata.
-- Images live in database/maps and are served by the backend under /maps/**.
-- Coordinates intentionally keep the same logical map coordinate system as G2,
-- even when PNG pixel dimensions differ.

INSERT INTO buildings (code, name, description, image_url)
VALUES
    ('C', 'Objekt C', 'FERI Objekt C map set.', NULL),
    ('E', 'Objekt E', 'FERI Objekt E map set.', NULL),
    ('F', 'Objekt F', 'FERI Objekt F map set.', NULL),
    ('G', 'Objekt G', 'FERI Objekt G map set.', NULL),
    ('G3', 'Objekt G3', 'FERI Objekt G3 map set.', NULL)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO floors (
    building_id,
    code,
    label,
    level_number,
    z,
    map_image_url,
    coordinate_width,
    coordinate_height
)
SELECT
    b.id,
    f.code,
    f.label,
    f.level_number,
    f.z,
    f.map_image_url,
    1190.55,
    841.89
FROM buildings b
JOIN (
    VALUES
        ('C', 'pritlicje', 'Pritličje', 0.00, 0.000, '/maps/objekt_c.png'),

        ('E', 'pritlicje', 'Pritličje', 0.00, 0.000, '/maps/objekt_e.png'),

        ('F', 'pritlicje', 'Pritličje', 0.00, 0.000, '/maps/objekt_f_p.png'),
        ('F', '1_nadstropje', '1. nadstropje', 1.00, 1.000, '/maps/objekt_f_1_n.png'),

        ('G', 'pritlicje', 'Pritličje', 0.00, 0.000, '/maps/objekt_g_p.png'),
        ('G', '1_medetaza', '1. medetaza', 0.50, 0.500, '/maps/objekt_g_1_m.png'),
        ('G', '1_nadstropje', '1. nadstropje', 1.00, 1.000, '/maps/objekt_g_1_n.png'),
        ('G', '2_medetaza', '2. medetaza', 1.50, 1.500, '/maps/objekt_g_2_m.png'),
        ('G', '2_nadstropje', '2. nadstropje', 2.00, 2.000, '/maps/objekt_g_2_n.png'),
        ('G', '3_nadstropje', '3. nadstropje', 3.00, 3.000, '/maps/objekt_g_3_n.png'),
        ('G', '4_nadstropje', '4. nadstropje', 4.00, 4.000, '/maps/objekt_g_4_n.png'),

        ('G3', 'klet', 'Klet', -1.00, -1.000, '/maps/g3_klet.png'),
        ('G3', 'pritlicje', 'Pritličje', 0.00, 0.000, '/maps/g3_pritlicje.png'),
        ('G3', 'nadstropje', 'Nadstropje', 1.00, 1.000, '/maps/g3_nadstropje.png'),
        ('G3', 'mansarda', 'Mansarda', 2.00, 2.000, '/maps/g3_mansarda.png')
) AS f(building_code, code, label, level_number, z, map_image_url)
    ON f.building_code = b.code
ON CONFLICT (building_id, code) DO UPDATE
SET label = EXCLUDED.label,
    level_number = EXCLUDED.level_number,
    z = EXCLUDED.z,
    map_image_url = EXCLUDED.map_image_url,
    coordinate_width = EXCLUDED.coordinate_width,
    coordinate_height = EXCLUDED.coordinate_height,
    updated_at = NOW();
