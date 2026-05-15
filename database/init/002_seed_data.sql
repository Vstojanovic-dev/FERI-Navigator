INSERT INTO buildings (name, code)
VALUES ('FERI', 'FERI')
ON CONFLICT (code) DO NOTHING;

INSERT INTO floors (building_id, level_number, name, model_url)
SELECT id, 0, 'Ground floor', '/models/feri-ground-floor.glb'
FROM buildings
WHERE code = 'FERI'
ON CONFLICT (building_id, level_number) DO NOTHING;

INSERT INTO rooms (floor_id, name, code, position)
SELECT floors.id, seed.name, seed.code, ST_SetSRID(ST_MakePoint(seed.x, seed.y), 3857)
FROM floors
JOIN buildings ON buildings.id = floors.building_id
JOIN (
    VALUES
        ('Entrance', 'ENTRANCE', 0, 0),
        ('Lecture room A', 'A-001', 12, 0),
        ('Lecture room B', 'B-001', 24, 0)
) AS seed(name, code, x, y) ON TRUE
WHERE buildings.code = 'FERI' AND floors.level_number = 0
ON CONFLICT (floor_id, code) DO NOTHING;

INSERT INTO navigation_nodes (floor_id, label, node_type, position)
SELECT floors.id, seed.label, seed.node_type, ST_SetSRID(ST_MakePoint(seed.x, seed.y), 3857)
FROM floors
JOIN buildings ON buildings.id = floors.building_id
JOIN (
    VALUES
        ('Entrance node', 'entrance', 0, 0),
        ('Hallway node 1', 'walkway', 12, 0),
        ('Hallway node 2', 'walkway', 24, 0)
) AS seed(label, node_type, x, y) ON TRUE
WHERE buildings.code = 'FERI' AND floors.level_number = 0;

INSERT INTO navigation_edges (from_node_id, to_node_id, distance_meters)
SELECT from_node.id, to_node.id, 12.00
FROM navigation_nodes from_node
JOIN navigation_nodes to_node ON to_node.label = 'Hallway node 1'
JOIN floors ON floors.id = from_node.floor_id AND floors.id = to_node.floor_id
JOIN buildings ON buildings.id = floors.building_id
WHERE buildings.code = 'FERI' AND from_node.label = 'Entrance node';

INSERT INTO navigation_edges (from_node_id, to_node_id, distance_meters)
SELECT from_node.id, to_node.id, 12.00
FROM navigation_nodes from_node
JOIN navigation_nodes to_node ON to_node.label = 'Hallway node 2'
JOIN floors ON floors.id = from_node.floor_id AND floors.id = to_node.floor_id
JOIN buildings ON buildings.id = floors.building_id
WHERE buildings.code = 'FERI' AND from_node.label = 'Hallway node 1';
