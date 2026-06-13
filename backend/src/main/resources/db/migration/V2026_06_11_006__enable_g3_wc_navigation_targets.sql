WITH wc_nodes(external_id, display_name, searchable_name) AS (
    VALUES
        ('G3_klet_wc_enski', 'Ženski WC - G3, Klet', 'zenski wc women toilet g3 klet'),
        ('G3_klet_wc_mu_ki', 'Moški WC - G3, Klet', 'moski wc men toilet g3 klet'),
        ('G3_pritlicje_wc_enski', 'Ženski WC - G3, Pritličje', 'zenski wc women toilet g3 pritlicje'),
        ('G3_pritlicje_wc_mu_ki', 'Moški WC - G3, Pritličje', 'moski wc men toilet g3 pritlicje'),
        ('G3_nadstropje_wc_enski', 'Ženski WC - G3, Nadstropje', 'zenski wc women toilet g3 nadstropje'),
        ('G3_nadstropje_wc_mo_ki', 'Moški WC - G3, Nadstropje', 'moski wc men toilet g3 nadstropje'),
        ('G3_mansarda_wc_enski', 'Ženski WC - G3, Mansarda', 'zenski wc women toilet g3 mansarda'),
        ('G3_mansarda_wc_mo_ki', 'Moški WC - G3, Mansarda', 'moski wc men toilet g3 mansarda')
)
UPDATE navigation_nodes AS node
SET node_type_id = node_type.id,
    updated_at = NOW()
FROM wc_nodes
JOIN node_types AS node_type ON node_type.code = 'wc'
WHERE node.external_id = wc_nodes.external_id
  AND node.node_type_id IS DISTINCT FROM node_type.id;

WITH wc_nodes(external_id, display_name, searchable_name) AS (
    VALUES
        ('G3_klet_wc_enski', 'Ženski WC - G3, Klet', 'zenski wc women toilet g3 klet'),
        ('G3_klet_wc_mu_ki', 'Moški WC - G3, Klet', 'moski wc men toilet g3 klet'),
        ('G3_pritlicje_wc_enski', 'Ženski WC - G3, Pritličje', 'zenski wc women toilet g3 pritlicje'),
        ('G3_pritlicje_wc_mu_ki', 'Moški WC - G3, Pritličje', 'moski wc men toilet g3 pritlicje'),
        ('G3_nadstropje_wc_enski', 'Ženski WC - G3, Nadstropje', 'zenski wc women toilet g3 nadstropje'),
        ('G3_nadstropje_wc_mo_ki', 'Moški WC - G3, Nadstropje', 'moski wc men toilet g3 nadstropje'),
        ('G3_mansarda_wc_enski', 'Ženski WC - G3, Mansarda', 'zenski wc women toilet g3 mansarda'),
        ('G3_mansarda_wc_mo_ki', 'Moški WC - G3, Mansarda', 'moski wc men toilet g3 mansarda')
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
    wc_nodes.display_name,
    wc_nodes.searchable_name,
    'wc',
    floor.building_id,
    node.floor_id,
    node.id,
    NULL,
    TRUE
FROM wc_nodes
JOIN navigation_nodes AS node ON node.external_id = wc_nodes.external_id
JOIN floors AS floor ON floor.id = node.floor_id
ON CONFLICT (node_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    searchable_name = EXCLUDED.searchable_name,
    location_type = EXCLUDED.location_type,
    building_id = EXCLUDED.building_id,
    floor_id = EXCLUDED.floor_id,
    space_id = EXCLUDED.space_id,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();
