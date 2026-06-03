WITH edges_to_remove AS (
    SELECT from_node.id AS from_node_id, to_node.id AS to_node_id
    FROM (
        VALUES
            ('G3_pritlicje_g3_p1_16_17', 'G3_pritlicje_inkubator_feri1'),
            ('G3_pritlicje_inkubator_feri1', 'G3_pritlicje_g3_p1_16_17'),
            ('G3_pritlicje_g3_p1_20', 'G3_pritlicje_inkubator_feri2'),
            ('G3_pritlicje_inkubator_feri2', 'G3_pritlicje_g3_p1_20'),
            ('G3_pritlicje_g3_p1_21', 'G3_pritlicje_g3_p1_24'),
            ('G3_pritlicje_g3_p1_24', 'G3_pritlicje_g3_p1_21')
    ) AS edge_input(from_external_id, to_external_id)
    JOIN navigation_nodes AS from_node
        ON from_node.external_id = edge_input.from_external_id
    JOIN navigation_nodes AS to_node
        ON to_node.external_id = edge_input.to_external_id
)
DELETE FROM navigation_edges AS edge
USING edges_to_remove
WHERE edge.from_node_id = edges_to_remove.from_node_id
  AND edge.to_node_id = edges_to_remove.to_node_id;

WITH remap(code, target_external_id, target_label) AS (
    VALUES
        ('G3_pritlicje_g3_p1_16_17', 'G3_pritlicje_inkubator_feri1', 'G3-P1-16-17'),
        ('G3_pritlicje_g3_p1_20', 'G3_pritlicje_inkubator_feri2', 'G3-P1-20'),
        ('G3_pritlicje_g3_p1_21', 'G3_pritlicje_demo_center1', 'G3-P1-21')
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
        ('G3_pritlicje_g3_p1_16_17', 'G3_pritlicje_inkubator_feri1', 'G3-P1-16-17'),
        ('G3_pritlicje_g3_p1_20', 'G3_pritlicje_inkubator_feri2', 'G3-P1-20'),
        ('G3_pritlicje_g3_p1_21', 'G3_pritlicje_demo_center1', 'G3-P1-21')
),
resolved AS (
    SELECT
        source_location.id AS location_id,
        source_node.id AS source_node_id,
        target_node.id AS target_node_id
    FROM remap
    JOIN spaces AS source_space
        ON source_space.code = remap.code
    JOIN navigation_locations AS source_location
        ON source_location.space_id = source_space.id
    JOIN navigation_nodes AS source_node
        ON source_node.id = source_location.node_id
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
        ('G3_pritlicje_g3_p1_16_17', 'G3_pritlicje_inkubator_feri1', 'G3-P1-16-17'),
        ('G3_pritlicje_g3_p1_20', 'G3_pritlicje_inkubator_feri2', 'G3-P1-20'),
        ('G3_pritlicje_g3_p1_21', 'G3_pritlicje_demo_center1', 'G3-P1-21')
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

DELETE FROM navigation_nodes AS node
WHERE node.external_id IN (
    'G3_pritlicje_g3_p1_16_17',
    'G3_pritlicje_g3_p1_20',
    'G3_pritlicje_g3_p1_21'
);
