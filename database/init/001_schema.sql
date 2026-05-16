-- Omogući PostGIS ekstenziju
CREATE EXTENSION IF NOT EXISTS postgis;

-- Spratovi
CREATE TABLE floors (
    id        SERIAL PRIMARY KEY,
    number    INT NOT NULL UNIQUE,
    label     VARCHAR(50) NOT NULL
);

-- Tipovi prostora
CREATE TABLE room_types (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE  -- 'predavalnica', 'laboratorij', 'pisarna', 'wc', 'hodnik'...
);

-- Prostori/učionice
CREATE TABLE rooms (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20),            -- npr. 'G2-P3', 'ALFA'
    floor_id    INT REFERENCES floors(id),
    type_id     INT REFERENCES room_types(id),
    description TEXT,
    image_url   VARCHAR(255),
    geom        GEOMETRY(POINT, 3857)  -- pozicija na mapi
);

-- Čvorovi navigacijskog grafa
CREATE TABLE nav_nodes (
    id         SERIAL PRIMARY KEY,
    floor_id   INT REFERENCES floors(id),
    label      VARCHAR(100),           -- NULL za waypointe
    is_waypoint BOOLEAN DEFAULT FALSE,
    node_type  VARCHAR(30),            -- 'room', 'stairs', 'elevator', 'corridor', 'waypoint'
    room_id    INT REFERENCES rooms(id) ON DELETE SET NULL,
    geom       GEOMETRY(POINT, 3857) NOT NULL
);

-- Veze između čvorova (hodnici, stepenice, liftovi)
CREATE TABLE nav_edges (
    id          SERIAL PRIMARY KEY,
    from_node   INT REFERENCES nav_nodes(id) ON DELETE CASCADE,
    to_node     INT REFERENCES nav_nodes(id) ON DELETE CASCADE,
    weight      FLOAT GENERATED ALWAYS AS (ST_Distance(
                    (SELECT geom FROM nav_nodes WHERE id = from_node),
                    (SELECT geom FROM nav_nodes WHERE id = to_node)
                )) STORED,
    edge_type   VARCHAR(20) DEFAULT 'corridor',  -- 'corridor', 'stairs', 'elevator'
    is_cross_floor BOOLEAN DEFAULT FALSE,
    geom        GEOMETRY(LINESTRING, 3857)
);

-- 360° panorame vezane za čvorove
CREATE TABLE panoramas (
    id          SERIAL PRIMARY KEY,
    node_id     INT REFERENCES nav_nodes(id) ON DELETE CASCADE,
    image_url   VARCHAR(255) NOT NULL,
    heading     FLOAT DEFAULT 0        -- početni ugao pogleda u stepenima
);

-- Hotspotovi unutar panorame (strelice za prelaz)
CREATE TABLE panorama_hotspots (
    id              SERIAL PRIMARY KEY,
    panorama_id     INT REFERENCES panoramas(id) ON DELETE CASCADE,
    target_node_id  INT REFERENCES nav_nodes(id),
    longitude       FLOAT NOT NULL,    -- ugao u panorami (kao u Photo-Sphere-Viewer)
    latitude        FLOAT NOT NULL,
    label           VARCHAR(100)
);

-- Indeksi za brže upite
CREATE INDEX idx_rooms_floor       ON rooms(floor_id);
CREATE INDEX idx_rooms_type        ON rooms(type_id);
CREATE INDEX idx_rooms_geom        ON rooms USING GIST(geom);
CREATE INDEX idx_nav_nodes_floor   ON nav_nodes(floor_id);
CREATE INDEX idx_nav_nodes_geom    ON nav_nodes USING GIST(geom);
CREATE INDEX idx_nav_edges_from    ON nav_edges(from_node);
CREATE INDEX idx_nav_edges_to      ON nav_edges(to_node);
CREATE INDEX idx_nav_edges_geom    ON nav_edges USING GIST(geom);