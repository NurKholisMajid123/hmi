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
















-- Tabel kategori program kerja
CREATE TABLE kategori_proker (
  id SERIAL PRIMARY KEY,
  nama_kategori VARCHAR(50) NOT NULL UNIQUE,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert kategori default
INSERT INTO kategori_proker (nama_kategori, deskripsi) VALUES
('Bidang', 'Program kerja bidang organisasi'),
('Sekretaris', 'Program kerja sekretaris'),
('Bendahara', 'Program kerja bendahara');

-- Tabel program kerja
CREATE TABLE program_kerja (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  kategori_id INTEGER NOT NULL REFERENCES kategori_proker(id) ON DELETE RESTRICT,
  bidang_id INTEGER REFERENCES bidang(id) ON DELETE CASCADE,
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  anggaran DECIMAL(15,2) DEFAULT 0,
  penanggung_jawab_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pengusul_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'diajukan', 'disetujui', 'ditolak', 'selesai', 'dibatalkan')),
  catatan_approval TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX idx_proker_kategori ON program_kerja(kategori_id);
CREATE INDEX idx_proker_bidang ON program_kerja(bidang_id);
CREATE INDEX idx_proker_status ON program_kerja(status);
CREATE INDEX idx_proker_pengusul ON program_kerja(pengusul_id);
CREATE INDEX idx_proker_penanggung_jawab ON program_kerja(penanggung_jawab_id);

-- Tabel riwayat perubahan status
CREATE TABLE proker_history (
  id SERIAL PRIMARY KEY,
  proker_id INTEGER NOT NULL REFERENCES program_kerja(id) ON DELETE CASCADE,
  status_lama VARCHAR(20),
  status_baru VARCHAR(20),
  catatan TEXT,
  changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proker_history_proker ON proker_history(proker_id);


-- Tabel untuk menyimpan anggota sekretaris
CREATE TABLE IF NOT EXISTS anggota_sekretaris (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Tabel untuk menyimpan anggota bendahara
CREATE TABLE IF NOT EXISTS anggota_bendahara (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Index untuk performa
CREATE INDEX idx_anggota_sekretaris_user ON anggota_sekretaris(user_id);
CREATE INDEX idx_anggota_bendahara_user ON anggota_bendahara(user_id);

-- Tambah comment untuk dokumentasi
COMMENT ON TABLE anggota_sekretaris IS 'Menyimpan anggota yang berada di bawah Sekretaris';
COMMENT ON TABLE anggota_bendahara IS 'Menyimpan anggota yang berada di bawah Bendahara';

-- Function untuk check double membership
CREATE OR REPLACE FUNCTION check_double_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already in sekretaris
    IF EXISTS (SELECT 1 FROM anggota_sekretaris WHERE user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'User sudah menjadi anggota Sekretaris';
    END IF;
    
    -- Check if user already in bendahara
    IF EXISTS (SELECT 1 FROM anggota_bendahara WHERE user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'User sudah menjadi anggota Bendahara';
    END IF;
    
    -- Check if user already in bidang
    IF EXISTS (SELECT 1 FROM user_bidang WHERE user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'User sudah menjadi anggota Bidang';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk anggota_sekretaris
CREATE TRIGGER prevent_double_membership_sekretaris
    BEFORE INSERT ON anggota_sekretaris
    FOR EACH ROW
    EXECUTE FUNCTION check_double_membership();

-- Trigger untuk anggota_bendahara
CREATE TRIGGER prevent_double_membership_bendahara
    BEFORE INSERT ON anggota_bendahara
    FOR EACH ROW
    EXECUTE FUNCTION check_double_membership();

-- Trigger untuk user_bidang
CREATE TRIGGER prevent_double_membership_bidang
    BEFORE INSERT ON user_bidang
    FOR EACH ROW
    EXECUTE FUNCTION check_double_membership();