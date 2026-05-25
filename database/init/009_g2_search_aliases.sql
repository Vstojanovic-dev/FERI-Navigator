-- Improve G2 navigation search aliases without changing graph topology.
-- Search should work by display name, node label, external_id, room code with
-- dashes/underscores removed, and common Slovenian/English/typo aliases.

UPDATE navigation_locations l
SET searchable_name = LEFT(
    LOWER(
        CONCAT_WS(
            ' ',
            l.display_name,
            CASE l.location_type
                WHEN 'laboratory' THEN 'laboratorij laboratoriji laboratoji lab laboratory'
                WHEN 'classroom' THEN 'ucionica ucilnica predavalnica classroom room soba'
                WHEN 'office' THEN 'kabinet pisarna office referat tajnistvo dekan'
                WHEN 'public_area' THEN 'prostor za ucenje public area study'
                WHEN 'service' THEN 'kavarna service cafe'
                WHEN 'entrance' THEN 'vhod ulaz entrance'
                WHEN 'exit' THEN 'izhod izlaz prehod exit'
                WHEN 'stairs' THEN 'stopnice stepenice stepeniste stairs'
                WHEN 'elevator' THEN 'dvigalo lift elevator'
                WHEN 'wc' THEN 'wc toilet studentski osebje osoblje'
                ELSE l.location_type
            END,
            s.name,
            nn.label,
            nn.external_id,
            REPLACE(nn.external_id, '_', ' '),
            REPLACE(nn.external_id, '_', '-'),
            REPLACE(REPLACE(nn.external_id, '_', ''), '-', ''),
            REPLACE(COALESCE(nn.label, ''), '_', ' '),
            REPLACE(COALESCE(nn.label, ''), '_', '-'),
            REPLACE(REPLACE(COALESCE(nn.label, ''), '_', ''), '-', ''),
            b.code,
            f.code,
            f.label,
            CASE
                WHEN LOWER(nn.external_id) LIKE '%teesla%' OR LOWER(l.display_name) LIKE '%teesla%' THEN 'tesla'
                ELSE NULL
            END,
            CASE
                WHEN LOWER(nn.external_id) LIKE '%galrija%' OR LOWER(l.display_name) LIKE '%galrija%' THEN 'galerija galerija gallery'
                ELSE NULL
            END,
            CASE
                WHEN LOWER(nn.external_id) LIKE '%glevne%' OR LOWER(l.display_name) LIKE '%glevne%' THEN 'glavne glavne stepenice'
                ELSE NULL
            END
        )
    ),
    300
),
    updated_at = NOW()
FROM navigation_nodes nn
JOIN floors f ON f.id = nn.floor_id
JOIN buildings b ON b.id = f.building_id
LEFT JOIN spaces s ON s.id = nn.space_id
WHERE l.node_id = nn.id
  AND l.floor_id = f.id
  AND l.building_id = b.id
  AND b.code = 'G2';
