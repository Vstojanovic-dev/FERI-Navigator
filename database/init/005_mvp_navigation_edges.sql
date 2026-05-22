-- Minimal MVP navigation edges for early route integration.
-- This is not the complete G2 graph. It provides a small connected path across
-- two floors and documents how production edges should be represented.

WITH edge_input(
    from_external_id,
    to_external_id,
    edge_type_code,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark
) AS (
    VALUES
        ('G2_pritlicje_lift', 'G2_pritlicje_wp18', 'corridor', FALSE, FALSE, 'Pojdi od lifta proti hodniku.', 'Pojdi iz hodnika proti liftu.', 'Lift'),
        ('G2_pritlicje_wp18', 'G2_pritlicje_wp19', 'corridor', FALSE, FALSE, 'Nadaljuj po hodniku proti predavalnicama Alfa in Beta.', 'Nadaljuj po hodniku proti liftu.', NULL),
        ('G2_pritlicje_wp19', 'G2_pritlicje_g2_p1_alfa', 'virtual', FALSE, FALSE, 'Ucilnica Alfa je ob hodniku.', 'Vrni se iz ucilnice Alfa na hodnik.', 'G2-P1 Alfa'),
        ('G2_pritlicje_wp19', 'G2_pritlicje_g2_p2_beta', 'virtual', FALSE, FALSE, 'Ucilnica Beta je ob hodniku.', 'Vrni se iz ucilnice Beta na hodnik.', 'G2-P2 Beta'),
        ('G2_pritlicje_lift', 'G2_2_nadstropje_lift', 'elevator', TRUE, FALSE, 'Z liftom pojdi v 2. nadstropje.', 'Z liftom pojdi v pritlicje.', 'Lift'),
        ('G2_pritlicje_stepenice_lift', 'G2_2_nadstropje_stepeniste_lift', 'stairs', TRUE, FALSE, 'Po stopnicah pojdi v 2. nadstropje.', 'Po stopnicah pojdi v pritlicje.', 'Stopnisce'),
        ('G2_2_nadstropje_lift', 'G2_2_nadstropje_wp8', 'corridor', FALSE, FALSE, 'Pojdi od lifta do hodnika.', 'Pojdi iz hodnika proti liftu.', 'Lift'),
        ('G2_2_nadstropje_wp8', 'G2_2_nadstropje_wp9', 'corridor', FALSE, FALSE, 'Nadaljuj po hodniku proti stopniscu.', 'Nadaljuj po hodniku proti liftu.', NULL),
        ('G2_2_nadstropje_wp9', 'G2_2_nadstropje_wp10', 'corridor', FALSE, FALSE, 'Nadaljuj do razcepa pri stopniscu.', 'Nadaljuj nazaj po hodniku.', 'Stopnisce'),
        ('G2_2_nadstropje_wp10', 'G2_2_nadstropje_stepeniste_lift', 'virtual', FALSE, FALSE, 'Stopnisce je pred tabo.', 'Vrni se od stopnisca na hodnik.', 'Stopnisce'),
        ('G2_2_nadstropje_wp10', 'G2_2_nadstropje_wp11', 'corridor', FALSE, FALSE, 'Nadaljuj po spodnjem hodniku.', 'Nadaljuj nazaj proti stopniscu.', NULL),
        ('G2_2_nadstropje_wp11', 'G2_2_nadstropje_wp12', 'corridor', FALSE, FALSE, 'Nadaljuj do hodnika pri laboratorijih.', 'Nadaljuj nazaj po hodniku.', 'Laboratoriji'),
        ('G2_2_nadstropje_wp12', 'G2_2_nadstropje_farad_lab', 'virtual', FALSE, FALSE, 'Laboratorij Farad je ob hodniku.', 'Vrni se iz laboratorija Farad na hodnik.', 'Farad'),
        ('G2_2_nadstropje_wp12', 'G2_2_nadstropje_weber_lab', 'virtual', FALSE, FALSE, 'Laboratorij Weber je ob hodniku.', 'Vrni se iz laboratorija Weber na hodnik.', 'Weber'),
        ('G2_2_nadstropje_wp12', 'G2_2_nadstropje_wp13', 'corridor', FALSE, FALSE, 'Nadaljuj po hodniku proti laboratoriju Tesla.', 'Nadaljuj nazaj proti laboratorijema Farad in Weber.', NULL),
        ('G2_2_nadstropje_wp13', 'G2_2_nadstropje_teesla_lab', 'virtual', FALSE, FALSE, 'Laboratorij Tesla je ob hodniku.', 'Vrni se iz laboratorija Tesla na hodnik.', 'Tesla')
),
resolved_edges AS (
    SELECT
        from_node.id AS from_node_id,
        to_node.id AS to_node_id,
        et.id AS edge_type_id,
        ROUND(
            (
                ST_Distance(from_node.geom, to_node.geom)
                + CASE WHEN ei.is_cross_floor THEN 100 ELSE 0 END
            )::NUMERIC,
            3
        ) AS weight,
        ST_MakeLine(from_node.geom, to_node.geom) AS geom,
        ei.is_cross_floor,
        ei.is_cross_building,
        ei.instruction_forward,
        ei.instruction_backward,
        ei.landmark
    FROM edge_input ei
    JOIN navigation_nodes from_node ON from_node.external_id = ei.from_external_id
    JOIN navigation_nodes to_node ON to_node.external_id = ei.to_external_id
    JOIN edge_types et ON et.code = ei.edge_type_code
),
directed_edges AS (
    SELECT
        from_node_id,
        to_node_id,
        edge_type_id,
        weight,
        geom,
        is_cross_floor,
        is_cross_building,
        instruction_forward,
        instruction_backward,
        landmark
    FROM resolved_edges
    UNION ALL
    SELECT
        to_node_id,
        from_node_id,
        edge_type_id,
        weight,
        ST_Reverse(geom),
        is_cross_floor,
        is_cross_building,
        instruction_backward,
        instruction_forward,
        landmark
    FROM resolved_edges
)
INSERT INTO navigation_edges (
    from_node_id,
    to_node_id,
    edge_type_id,
    weight,
    geom,
    is_bidirectional,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark
)
SELECT
    from_node_id,
    to_node_id,
    edge_type_id,
    weight,
    geom,
    TRUE,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark
FROM directed_edges
ON CONFLICT (from_node_id, to_node_id) DO UPDATE
SET edge_type_id = EXCLUDED.edge_type_id,
    weight = EXCLUDED.weight,
    geom = EXCLUDED.geom,
    is_bidirectional = EXCLUDED.is_bidirectional,
    is_cross_floor = EXCLUDED.is_cross_floor,
    is_cross_building = EXCLUDED.is_cross_building,
    instruction_forward = EXCLUDED.instruction_forward,
    instruction_backward = EXCLUDED.instruction_backward,
    landmark = EXCLUDED.landmark,
    updated_at = NOW();
