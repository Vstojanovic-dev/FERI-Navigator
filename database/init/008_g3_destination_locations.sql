-- G3 destination nodes, spaces and searchable locations.
-- These are user-facing destinations only: classrooms/labs/meeting rooms/demo/public spaces.
-- Technical rooms, WC, elevators, kitchens and pure route waypoints are intentionally excluded.

WITH destination_input(
    floor_code,
    room_code,
    name,
    space_type_code,
    x,
    y,
    aliases
) AS (
    VALUES
        -- Klet
        ('klet', 'G3-K1-01', 'Amfiteater Gauss', 'classroom', 272.00, 239.00, 'amfiteater gauss lecture hall classroom predavalnica'),
        ('klet', 'G3-K1-03', 'Laboratorij Markova', 'laboratory', 220.00, 715.00, 'laboratorij markova lab laboratory laboratoji'),
        ('klet', 'G3-K1-04', 'Laboratorij Markova', 'laboratory', 520.00, 715.00, 'laboratorij markova lab laboratory laboratoji'),
        ('klet', 'G3-K1-05', 'Laboratorij Lumiere', 'laboratory', 845.00, 715.00, 'laboratorij lumiere lab laboratory laboratoji'),
        ('klet', 'G3-K1-AVLA', 'Avla', 'public_area', 840.00, 238.00, 'avla hall lobby'),
        ('klet', 'G3-K1-RAZSTAVNI-PROSTOR', 'Razstavni prostor', 'public_area', 980.00, 430.00, 'razstavni prostor exhibition public area'),

        -- Pritlicje
        ('pritlicje', 'G3-P1-13', 'Sejna soba', 'classroom', 430.00, 176.00, 'sejna soba meeting room classroom'),
        ('pritlicje', 'G3-P1-14', 'Sejna soba', 'classroom', 190.00, 176.00, 'sejna soba meeting room classroom'),
        ('pritlicje', 'G3-P1-15', 'Laboratorij Turing', 'laboratory', 195.00, 540.00, 'laboratorij turing lab laboratory laboratoji'),
        ('pritlicje', 'G3-P1-16-17', 'Inkubator FERI 1', 'public_area', 520.00, 705.00, 'inkubator feri incubator public area'),
        ('pritlicje', 'G3-P1-20', 'Inkubator FERI 2', 'public_area', 890.00, 705.00, 'inkubator feri incubator public area'),
        ('pritlicje', 'G3-P1-21', 'Demo Center 2', 'public_area', 1080.00, 705.00, 'demo center demonstracijski prostor public area'),
        ('pritlicje', 'G3-P1-24', 'Demo Center 1', 'public_area', 930.00, 480.00, 'demo center demonstracijski prostor public area'),

        -- Nadstropje
        ('nadstropje', 'G3-N1-33', 'Diplomska soba FERI', 'classroom', 740.00, 710.00, 'diplomska soba feri classroom project room'),
        ('nadstropje', 'G3-N1-34', 'Laboratorij Boole', 'laboratory', 1030.00, 710.00, 'laboratorij boole lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-35', 'Laboratorij Boole', 'laboratory', 915.00, 420.00, 'laboratorij boole lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-45', 'Kabinet', 'office', 440.00, 270.00, 'kabinet office'),
        ('nadstropje', 'G3-N1-46', 'Laboratorij Shannon', 'laboratory', 190.00, 360.00, 'laboratorij shannon lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-47', 'Laboratorij Ada', 'laboratory', 190.00, 610.00, 'laboratorij ada lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-48', 'Sejna soba', 'classroom', 515.00, 710.00, 'sejna soba meeting room classroom'),

        -- Mansarda
        ('mansarda', 'G3-M1-50', 'Laboratorij Simon', 'laboratory', 940.00, 365.00, 'laboratorij simon lab laboratory laboratoji'),
        ('mansarda', 'G3-M1-59', 'Laboratorij Martin', 'laboratory', 390.00, 210.00, 'laboratorij martin lab laboratory laboratoji'),
        ('mansarda', 'G3-M1-61', 'Seminarska soba Aleksander', 'classroom', 230.00, 680.00, 'seminarska soba aleksander seminar room classroom')
),
resolved AS (
    SELECT
        b.id AS building_id,
        f.id AS floor_id,
        f.z,
        di.floor_code,
        di.room_code,
        di.name,
        di.space_type_code,
        di.x,
        di.y,
        di.aliases,
        'G3_' || di.floor_code || '_' || LOWER(REPLACE(di.room_code, '-', '_')) AS external_id
    FROM destination_input di
    JOIN buildings b ON b.code = 'G3'
    JOIN floors f ON f.building_id = b.id AND f.code = di.floor_code
),
upserted_nodes AS (
    INSERT INTO navigation_nodes (
        floor_id,
        node_type_id,
        external_id,
        label,
        x,
        y,
        z,
        geom,
        is_waypoint,
        is_public
    )
    SELECT
        r.floor_id,
        nt.id,
        r.external_id,
        r.room_code,
        r.x,
        r.y,
        r.z,
        ST_SetSRID(ST_MakePoint(r.x, r.y), 0),
        FALSE,
        TRUE
    FROM resolved r
    JOIN node_types nt ON nt.code = 'room'
    ON CONFLICT (external_id) DO UPDATE
    SET floor_id = EXCLUDED.floor_id,
        node_type_id = EXCLUDED.node_type_id,
        label = EXCLUDED.label,
        x = EXCLUDED.x,
        y = EXCLUDED.y,
        z = EXCLUDED.z,
        geom = EXCLUDED.geom,
        is_waypoint = EXCLUDED.is_waypoint,
        is_public = EXCLUDED.is_public,
        updated_at = NOW()
    RETURNING id, external_id
),
upserted_spaces AS (
    INSERT INTO spaces (
        building_id,
        floor_id,
        space_type_id,
        code,
        name,
        description,
        image_url,
        primary_node_id,
        is_public
    )
    SELECT
        r.building_id,
        r.floor_id,
        st.id,
        r.external_id,
        r.name || ' (' || r.room_code || ')',
        NULL,
        NULL,
        un.id,
        TRUE
    FROM resolved r
    JOIN upserted_nodes un ON un.external_id = r.external_id
    JOIN space_types st ON st.code = r.space_type_code
    ON CONFLICT (building_id, code) DO UPDATE
    SET floor_id = EXCLUDED.floor_id,
        space_type_id = EXCLUDED.space_type_id,
        name = EXCLUDED.name,
        primary_node_id = EXCLUDED.primary_node_id,
        is_public = EXCLUDED.is_public,
        updated_at = NOW()
    RETURNING id, code, primary_node_id
)
UPDATE navigation_nodes nn
SET space_id = us.id,
    updated_at = NOW()
FROM upserted_spaces us
WHERE us.primary_node_id = nn.id
  AND nn.space_id IS DISTINCT FROM us.id;

WITH destination_input(
    floor_code,
    room_code,
    name,
    space_type_code,
    x,
    y,
    aliases
) AS (
    VALUES
        ('klet', 'G3-K1-01', 'Amfiteater Gauss', 'classroom', 272.00, 239.00, 'amfiteater gauss lecture hall classroom predavalnica'),
        ('klet', 'G3-K1-03', 'Laboratorij Markova', 'laboratory', 220.00, 715.00, 'laboratorij markova lab laboratory laboratoji'),
        ('klet', 'G3-K1-04', 'Laboratorij Markova', 'laboratory', 520.00, 715.00, 'laboratorij markova lab laboratory laboratoji'),
        ('klet', 'G3-K1-05', 'Laboratorij Lumiere', 'laboratory', 845.00, 715.00, 'laboratorij lumiere lab laboratory laboratoji'),
        ('klet', 'G3-K1-AVLA', 'Avla', 'public_area', 840.00, 238.00, 'avla hall lobby'),
        ('klet', 'G3-K1-RAZSTAVNI-PROSTOR', 'Razstavni prostor', 'public_area', 980.00, 430.00, 'razstavni prostor exhibition public area'),
        ('pritlicje', 'G3-P1-13', 'Sejna soba', 'classroom', 430.00, 176.00, 'sejna soba meeting room classroom'),
        ('pritlicje', 'G3-P1-14', 'Sejna soba', 'classroom', 190.00, 176.00, 'sejna soba meeting room classroom'),
        ('pritlicje', 'G3-P1-15', 'Laboratorij Turing', 'laboratory', 195.00, 540.00, 'laboratorij turing lab laboratory laboratoji'),
        ('pritlicje', 'G3-P1-16-17', 'Inkubator FERI 1', 'public_area', 520.00, 705.00, 'inkubator feri incubator public area'),
        ('pritlicje', 'G3-P1-20', 'Inkubator FERI 2', 'public_area', 890.00, 705.00, 'inkubator feri incubator public area'),
        ('pritlicje', 'G3-P1-21', 'Demo Center 2', 'public_area', 1080.00, 705.00, 'demo center demonstracijski prostor public area'),
        ('pritlicje', 'G3-P1-24', 'Demo Center 1', 'public_area', 930.00, 480.00, 'demo center demonstracijski prostor public area'),
        ('nadstropje', 'G3-N1-33', 'Diplomska soba FERI', 'classroom', 740.00, 710.00, 'diplomska soba feri classroom project room'),
        ('nadstropje', 'G3-N1-34', 'Laboratorij Boole', 'laboratory', 1030.00, 710.00, 'laboratorij boole lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-35', 'Laboratorij Boole', 'laboratory', 915.00, 420.00, 'laboratorij boole lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-45', 'Kabinet', 'office', 440.00, 270.00, 'kabinet office'),
        ('nadstropje', 'G3-N1-46', 'Laboratorij Shannon', 'laboratory', 190.00, 360.00, 'laboratorij shannon lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-47', 'Laboratorij Ada', 'laboratory', 190.00, 610.00, 'laboratorij ada lab laboratory laboratoji'),
        ('nadstropje', 'G3-N1-48', 'Sejna soba', 'classroom', 515.00, 710.00, 'sejna soba meeting room classroom'),
        ('mansarda', 'G3-M1-50', 'Laboratorij Simon', 'laboratory', 940.00, 365.00, 'laboratorij simon lab laboratory laboratoji'),
        ('mansarda', 'G3-M1-59', 'Laboratorij Martin', 'laboratory', 390.00, 210.00, 'laboratorij martin lab laboratory laboratoji'),
        ('mansarda', 'G3-M1-61', 'Seminarska soba Aleksander', 'classroom', 230.00, 680.00, 'seminarska soba aleksander seminar room classroom')
),
resolved AS (
    SELECT
        b.id AS building_id,
        f.id AS floor_id,
        f.label AS floor_label,
        di.room_code,
        di.name,
        di.space_type_code,
        di.aliases,
        'G3_' || di.floor_code || '_' || LOWER(REPLACE(di.room_code, '-', '_')) AS external_id
    FROM destination_input di
    JOIN buildings b ON b.code = 'G3'
    JOIN floors f ON f.building_id = b.id AND f.code = di.floor_code
)
INSERT INTO navigation_locations (
    display_name,
    searchable_name,
    location_type,
    building_id,
    floor_id,
    node_id,
    space_id,
    is_enabled
)
SELECT
    r.name || ' (' || r.room_code || ') - G3, ' || r.floor_label,
    LOWER(
        r.name
        || ' '
        || r.room_code
        || ' '
        || REPLACE(r.room_code, '-', '')
        || ' '
        || REPLACE(r.room_code, '-', ' ')
        || ' '
        || r.aliases
        || ' g3 '
        || r.floor_label
    ),
    r.space_type_code,
    r.building_id,
    r.floor_id,
    nn.id,
    s.id,
    TRUE
FROM resolved r
JOIN navigation_nodes nn ON nn.external_id = r.external_id
LEFT JOIN spaces s ON s.primary_node_id = nn.id
ON CONFLICT (node_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    searchable_name = EXCLUDED.searchable_name,
    location_type = EXCLUDED.location_type,
    building_id = EXCLUDED.building_id,
    floor_id = EXCLUDED.floor_id,
    space_id = EXCLUDED.space_id,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();
