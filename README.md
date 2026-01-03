-- Tabel Role
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 5),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN roles.role_level IS 'Level hierarki: 1=Admin, 2=Ketua Umum, 3=Sekretaris/Bendahara, 4=Kabid, 5=Anggota';

-- Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.password IS 'Hash password menggunakan bcrypt';

-- Function untuk auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index untuk performa
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_username ON users(username);

-- Insert data role default
INSERT INTO roles (role_name, role_level, description) VALUES
('Admin', 1, 'Administrator sistem dengan akses penuh'),
('Ketua Umum', 2, 'Pimpinan tertinggi organisasi'),
('Sekretaris Umum', 3, 'Bertanggung jawab atas administrasi dan kesekretariatan'),
('Bendahara Umum', 3, 'Bertanggung jawab atas keuangan organisasi'),
('Ketua Bidang', 4, 'Pimpinan bidang/divisi tertentu'),
('Anggota', 5, 'Anggota organisasi');

-- Contoh insert user (password: 'password123' - hash bcrypt)
INSERT INTO users (username, email, password, full_name, role_id) VALUES
('admin', 'admin@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Administrator', 1),
('ketua', 'ketua@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Ketua Umum Organisasi', 2),
('sekretaris', 'sekretaris@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Sekretaris Umum', 3),
('bendahara', 'bendahara@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Bendahara Umum', 4),
('kabid1', 'kabid1@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Ketua Bidang Akademik', 5),
('anggota1', 'anggota1@organisasi.com', '$2b$10$YourHashedPasswordHere', 'Anggota Biasa', 6);