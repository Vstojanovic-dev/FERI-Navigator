UPDATE navigation_nodes AS node
SET node_type_id = node_type.id,
    is_waypoint = FALSE,
    updated_at = NOW()
FROM node_types AS node_type
WHERE node.external_id = 'E_pritlicje_masina_za_sokove'
  AND node_type.code = 'service'
  AND (
      node.node_type_id IS DISTINCT FROM node_type.id
      OR node.is_waypoint
  );

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
    'Avtomat za kavo - E, Pritličje',
    'avtomat za kavo aparat za kafu coffee vending machine masina za sokove',
    'service',
    floor.building_id,
    node.floor_id,
    node.id,
    NULL,
    TRUE
FROM navigation_nodes AS node
JOIN floors AS floor ON floor.id = node.floor_id
WHERE node.external_id = 'E_pritlicje_masina_za_sokove'
ON CONFLICT (node_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    searchable_name = EXCLUDED.searchable_name,
    location_type = EXCLUDED.location_type,
    building_id = EXCLUDED.building_id,
    floor_id = EXCLUDED.floor_id,
    space_id = EXCLUDED.space_id,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();
