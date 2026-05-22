-- Baseline lookup data and G2 map metadata.

INSERT INTO space_types (code, name, description) VALUES
    ('classroom', 'Classroom', 'Lecture room or classroom.'),
    ('laboratory', 'Laboratory', 'Laboratory or practical work room.'),
    ('office', 'Office', 'Office or administration room.'),
    ('wc', 'WC', 'Toilet location.'),
    ('service', 'Service', 'Service or support area.'),
    ('public_area', 'Public area', 'Public student or visitor area.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO node_types (code, name, description) VALUES
    ('room', 'Room', 'Navigable point for a room or destination.'),
    ('entrance', 'Entrance', 'Building entrance.'),
    ('exit', 'Exit', 'Building or floor exit.'),
    ('elevator', 'Elevator', 'Elevator point.'),
    ('stairs', 'Stairs', 'Staircase point.'),
    ('corridor', 'Corridor', 'Corridor or hallway point.'),
    ('waypoint', 'Waypoint', 'Technical routing point without user-facing meaning.'),
    ('wc', 'WC', 'Toilet point.'),
    ('building_transfer', 'Building transfer', 'Transfer point between buildings.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO edge_types (code, name, description) VALUES
    ('corridor', 'Corridor', 'Regular hallway or walkable connection.'),
    ('stairs', 'Stairs', 'Vertical movement via stairs.'),
    ('elevator', 'Elevator', 'Vertical movement via elevator.'),
    ('entrance', 'Entrance', 'Entrance or exit connection.'),
    ('building_transfer', 'Building transfer', 'Connection between buildings.'),
    ('virtual', 'Virtual', 'Technical connection used to attach a room to the graph.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings (code, name, description, image_url)
VALUES
    ('G2', 'Objekt G2', 'FERI G2 building with classrooms, laboratories and public areas.', NULL)
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
        ('pritlicje', 'Pritlicje', 0.00, 0.000, '/maps/1_pritlicje.png'),
        ('1_nadstropje', '1. nadstropje', 1.00, 1.000, '/maps/2_nadstropje1.png'),
        ('medetaza', 'Medetaza', 1.50, 1.500, '/maps/3_medetaza.png'),
        ('2_nadstropje', '2. nadstropje', 2.00, 2.000, '/maps/4_nadstropje2.png'),
        ('3_nadstropje', '3. nadstropje', 3.00, 3.000, '/maps/5_nadstropje3.png'),
        ('4_nadstropje', '4. nadstropje', 4.00, 4.000, '/maps/6_nadstropje4.png')
) AS f(code, label, level_number, z, map_image_url) ON TRUE
WHERE b.code = 'G2'
ON CONFLICT (building_id, code) DO UPDATE
SET label = EXCLUDED.label,
    level_number = EXCLUDED.level_number,
    z = EXCLUDED.z,
    map_image_url = EXCLUDED.map_image_url,
    coordinate_width = EXCLUDED.coordinate_width,
    coordinate_height = EXCLUDED.coordinate_height,
    updated_at = NOW();
