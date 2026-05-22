-- Load G2 staging points into the core navigation schema.
-- This file intentionally runs after 003_g2_staging_nodes.sql by filename order.

WITH typed_nodes AS (
    SELECT
        b.id AS building_id,
        f.id AS floor_id,
        f.z,
        n.floor,
        n.node_key,
        n.label,
        n.pixel_x,
        n.pixel_y,
        CASE
            WHEN LOWER(n.node_key) LIKE 'wp%' OR LOWER(COALESCE(n.label, '')) LIKE 'wp%' THEN 'waypoint'
            WHEN LOWER(n.node_key) LIKE '%stepen%' OR LOWER(COALESCE(n.label, '')) LIKE '%stepen%' THEN 'stairs'
            WHEN LOWER(n.node_key) LIKE '%lift%' OR LOWER(COALESCE(n.label, '')) LIKE '%lift%' THEN 'elevator'
            WHEN LOWER(n.node_key) LIKE '%wc%' OR LOWER(COALESCE(n.label, '')) LIKE '%wc%' THEN 'wc'
            WHEN LOWER(n.node_key) LIKE 'ulaz%' OR LOWER(n.node_key) LIKE '%ulaz%' THEN 'entrance'
            WHEN LOWER(n.node_key) LIKE 'izlaz%' OR LOWER(n.node_key) LIKE '%izlaz%' THEN 'exit'
            WHEN LOWER(n.node_key) LIKE '%hodnik%' OR LOWER(COALESCE(n.label, '')) LIKE '%hodnik%' THEN 'corridor'
            ELSE 'room'
        END AS node_type_code
    FROM g2_navigation_nodes n
    JOIN buildings b ON b.code = 'G2'
    JOIN floors f ON f.building_id = b.id AND f.code = n.floor
)
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
    tn.floor_id,
    nt.id,
    'G2_' || tn.floor || '_' || tn.node_key,
    NULLIF(tn.label, ''),
    tn.pixel_x,
    tn.pixel_y,
    tn.z,
    ST_SetSRID(ST_MakePoint(tn.pixel_x, tn.pixel_y), 0),
    tn.node_type_code = 'waypoint',
    tn.node_type_code NOT IN ('waypoint', 'corridor')
FROM typed_nodes tn
JOIN node_types nt ON nt.code = tn.node_type_code
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
    updated_at = NOW();

WITH destination_nodes AS (
    SELECT
        b.id AS building_id,
        f.id AS floor_id,
        nn.id AS node_id,
        nn.external_id,
        COALESCE(NULLIF(nn.label, ''), REPLACE(SPLIT_PART(nn.external_id, '_', 3), '_', ' ')) AS raw_name,
        nt.code AS node_type_code,
        CASE
            WHEN nt.code = 'wc' THEN 'wc'
            WHEN LOWER(nn.external_id) LIKE '%lab%' THEN 'laboratory'
            WHEN LOWER(nn.external_id) LIKE '%referat%' OR LOWER(nn.external_id) LIKE '%tajnistvo%' OR LOWER(nn.external_id) LIKE '%dekan%' THEN 'office'
            WHEN LOWER(nn.external_id) LIKE '%kavarna%' THEN 'service'
            WHEN LOWER(nn.external_id) LIKE '%prostor_za_ucenje%' THEN 'public_area'
            ELSE 'classroom'
        END AS space_type_code
    FROM navigation_nodes nn
    JOIN floors f ON f.id = nn.floor_id
    JOIN buildings b ON b.id = f.building_id
    JOIN node_types nt ON nt.id = nn.node_type_id
    WHERE b.code = 'G2'
      AND nt.code IN ('room', 'wc')
)
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
    dn.building_id,
    dn.floor_id,
    st.id,
    dn.external_id,
    INITCAP(REPLACE(dn.raw_name, '_', ' ')),
    NULL,
    NULL,
    dn.node_id,
    TRUE
FROM destination_nodes dn
JOIN space_types st ON st.code = dn.space_type_code
ON CONFLICT (building_id, code) DO UPDATE
SET floor_id = EXCLUDED.floor_id,
    space_type_id = EXCLUDED.space_type_id,
    name = EXCLUDED.name,
    primary_node_id = EXCLUDED.primary_node_id,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

UPDATE navigation_nodes nn
SET space_id = s.id,
    updated_at = NOW()
FROM spaces s
WHERE s.primary_node_id = nn.id
  AND nn.space_id IS DISTINCT FROM s.id;

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
    COALESCE(s.name, INITCAP(REPLACE(COALESCE(nn.label, nn.external_id), '_', ' ')))
        || ' - '
        || b.code
        || ', '
        || f.label AS display_name,
    LOWER(
        COALESCE(s.name, nn.label, nn.external_id)
        || ' '
        || b.code
        || ' '
        || f.label
    ) AS searchable_name,
    COALESCE(st.code, nt.code) AS location_type,
    b.id,
    f.id,
    nn.id,
    s.id,
    TRUE
FROM navigation_nodes nn
JOIN floors f ON f.id = nn.floor_id
JOIN buildings b ON b.id = f.building_id
JOIN node_types nt ON nt.id = nn.node_type_id
LEFT JOIN spaces s ON s.primary_node_id = nn.id
LEFT JOIN space_types st ON st.id = s.space_type_id
WHERE b.code = 'G2'
  AND nt.code NOT IN ('waypoint', 'corridor')
ON CONFLICT (node_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    searchable_name = EXCLUDED.searchable_name,
    location_type = EXCLUDED.location_type,
    building_id = EXCLUDED.building_id,
    floor_id = EXCLUDED.floor_id,
    space_id = EXCLUDED.space_id,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();
