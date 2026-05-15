CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(40) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    model_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_floors_building_level UNIQUE (building_id, level_number)
);

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(40) NOT NULL,
    position geometry(Point, 3857),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rooms_floor_code UNIQUE (floor_id, code)
);

CREATE TABLE navigation_nodes (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    label VARCHAR(120),
    node_type VARCHAR(40) NOT NULL DEFAULT 'walkway',
    position geometry(Point, 3857) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE navigation_edges (
    id BIGSERIAL PRIMARY KEY,
    from_node_id BIGINT NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    to_node_id BIGINT NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    distance_meters NUMERIC(10, 2) NOT NULL,
    bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_navigation_edges_distance_positive CHECK (distance_meters > 0),
    CONSTRAINT chk_navigation_edges_different_nodes CHECK (from_node_id <> to_node_id)
);

CREATE INDEX idx_rooms_position ON rooms USING GIST (position);
CREATE INDEX idx_navigation_nodes_position ON navigation_nodes USING GIST (position);
CREATE INDEX idx_navigation_edges_from_node ON navigation_edges (from_node_id);
CREATE INDEX idx_navigation_edges_to_node ON navigation_edges (to_node_id);
