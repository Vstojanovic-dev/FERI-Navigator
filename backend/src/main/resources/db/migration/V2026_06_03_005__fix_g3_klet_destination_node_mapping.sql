WITH remap(code, target_external_id, target_label) AS (
    VALUES
        ('G3_klet_g3_k1_01', 'G3_klet_amfiteatar_gaus', 'Amfiteater Gauss'),
        ('G3_klet_g3_k1_03', 'G3_klet_labaratorija_markova', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_04', 'G3_klet_labaratorija_markova_2', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_05', 'G3_klet_labaratorij_lumiere', 'Laboratorij Lumiere')
),
resolved AS (
    SELECT
        source_space.id AS space_id,
        source_location.id AS location_id,
        source_node.id AS source_node_id,
        target_node.id AS target_node_id,
        remap.target_label
    FROM remap
    JOIN spaces AS source_space
        ON source_space.code = remap.code
    JOIN navigation_locations AS source_location
        ON source_location.space_id = source_space.id
    JOIN navigation_nodes AS source_node
        ON source_node.id = source_space.primary_node_id
    JOIN navigation_nodes AS target_node
        ON target_node.external_id = remap.target_external_id
)
UPDATE spaces AS s
SET primary_node_id = resolved.target_node_id,
    updated_at = NOW()
FROM resolved
WHERE s.id = resolved.space_id
  AND s.primary_node_id IS DISTINCT FROM resolved.target_node_id;

WITH remap(code, target_external_id, target_label) AS (
    VALUES
        ('G3_klet_g3_k1_01', 'G3_klet_amfiteatar_gaus', 'Amfiteater Gauss'),
        ('G3_klet_g3_k1_03', 'G3_klet_labaratorija_markova', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_04', 'G3_klet_labaratorija_markova_2', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_05', 'G3_klet_labaratorij_lumiere', 'Laboratorij Lumiere')
),
resolved AS (
    SELECT
        source_location.id AS location_id,
        target_node.id AS target_node_id
    FROM remap
    JOIN spaces AS source_space
        ON source_space.code = remap.code
    JOIN navigation_locations AS source_location
        ON source_location.space_id = source_space.id
    JOIN navigation_nodes AS target_node
        ON target_node.external_id = remap.target_external_id
)
UPDATE navigation_locations AS nl
SET node_id = resolved.target_node_id,
    updated_at = NOW()
FROM resolved
WHERE nl.id = resolved.location_id
  AND nl.node_id IS DISTINCT FROM resolved.target_node_id;

WITH remap(code, target_external_id, target_label) AS (
    VALUES
        ('G3_klet_g3_k1_01', 'G3_klet_amfiteatar_gaus', 'Amfiteater Gauss'),
        ('G3_klet_g3_k1_03', 'G3_klet_labaratorija_markova', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_04', 'G3_klet_labaratorija_markova_2', 'Laboratorij Markova'),
        ('G3_klet_g3_k1_05', 'G3_klet_labaratorij_lumiere', 'Laboratorij Lumiere')
),
resolved AS (
    SELECT
        source_space.id AS space_id,
        source_node.id AS source_node_id,
        target_node.id AS target_node_id,
        remap.target_label
    FROM remap
    JOIN spaces AS source_space
        ON source_space.code = remap.code
    JOIN navigation_nodes AS source_node
        ON source_node.external_id = remap.code
    JOIN navigation_nodes AS target_node
        ON target_node.external_id = remap.target_external_id
)
UPDATE navigation_nodes AS nn
SET space_id = CASE
        WHEN nn.id = resolved.target_node_id THEN resolved.space_id
        ELSE NULL
    END,
    label = CASE
        WHEN nn.id = resolved.target_node_id THEN resolved.target_label
        ELSE nn.label
    END,
    updated_at = NOW()
FROM resolved
WHERE nn.id IN (resolved.source_node_id, resolved.target_node_id);
