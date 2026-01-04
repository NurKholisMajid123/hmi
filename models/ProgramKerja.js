const pool = require('../config/database');

class ProgramKerja {
  // Get all proker dengan filter
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, 
             k.nama_kategori,
             b.nama_bidang,
             u1.full_name as pengusul_name,
             u2.full_name as penanggung_jawab_name,
             u3.full_name as approved_by_name
      FROM program_kerja p
      JOIN kategori_proker k ON p.kategori_id = k.id
      LEFT JOIN bidang b ON p.bidang_id = b.id
      JOIN users u1 ON p.pengusul_id = u1.id
      JOIN users u2 ON p.penanggung_jawab_id = u2.id
      LEFT JOIN users u3 ON p.approved_by = u3.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (filters.kategori_id) {
      query += ` AND p.kategori_id = $${paramCount}`;
      params.push(filters.kategori_id);
      paramCount++;
    }
    
    if (filters.bidang_id) {
      query += ` AND p.bidang_id = $${paramCount}`;
      params.push(filters.bidang_id);
      paramCount++;
    }
    
    if (filters.status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }
    
    if (filters.pengusul_id) {
      query += ` AND p.pengusul_id = $${paramCount}`;
      params.push(filters.pengusul_id);
      paramCount++;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Get proker berdasarkan role dan user
  static async findByRole(userId, roleLevel, bidangId = null) {
    let query = `
      SELECT p.*, 
             k.nama_kategori,
             b.nama_bidang,
             u1.full_name as pengusul_name,
             u2.full_name as penanggung_jawab_name,
             u3.full_name as approved_by_name
      FROM program_kerja p
      JOIN kategori_proker k ON p.kategori_id = k.id
      LEFT JOIN bidang b ON p.bidang_id = b.id
      JOIN users u1 ON p.pengusul_id = u1.id
      JOIN users u2 ON p.penanggung_jawab_id = u2.id
      LEFT JOIN users u3 ON p.approved_by = u3.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Admin (1) dan Ketua Umum (2) bisa lihat semua
    if (roleLevel === 1 || roleLevel === 2) {
      // No additional filter
    }
    // Sekretaris (3) - hanya kategori sekretaris
    else if (roleLevel === 3) {
      query += ` AND k.nama_kategori = 'Sekretaris'`;
    }
    // Bendahara (4) - hanya kategori bendahara
    else if (roleLevel === 4) {
      query += ` AND k.nama_kategori = 'Bendahara'`;
    }
    // Ketua Bidang (5) - hanya bidangnya
    else if (roleLevel === 5 && bidangId) {
      query += ` AND p.bidang_id = $1`;
      params.push(bidangId);
    }
    // Anggota (6) - hanya bidangnya
    else if (roleLevel === 6 && bidangId) {
      query += ` AND p.bidang_id = $1`;
      params.push(bidangId);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Get proker by ID
  static async findById(id) {
    const query = `
      SELECT p.*, 
             k.nama_kategori,
             b.nama_bidang,
             u1.full_name as pengusul_name, u1.email as pengusul_email,
             u2.full_name as penanggung_jawab_name, u2.email as penanggung_jawab_email,
             u3.full_name as approved_by_name
      FROM program_kerja p
      JOIN kategori_proker k ON p.kategori_id = k.id
      LEFT JOIN bidang b ON p.bidang_id = b.id
      JOIN users u1 ON p.pengusul_id = u1.id
      JOIN users u2 ON p.penanggung_jawab_id = u2.id
      LEFT JOIN users u3 ON p.approved_by = u3.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  // Create proker
  static async create(data) {
    const {
      judul, deskripsi, kategori_id, bidang_id, tanggal_mulai,
      tanggal_selesai, anggaran, penanggung_jawab_id, pengusul_id, status
    } = data;
    
    const query = `
      INSERT INTO program_kerja (
        judul, deskripsi, kategori_id, bidang_id, tanggal_mulai,
        tanggal_selesai, anggaran, penanggung_jawab_id, pengusul_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      judul, deskripsi, kategori_id, bidang_id || null, tanggal_mulai,
      tanggal_selesai, anggaran || 0, penanggung_jawab_id, pengusul_id, status || 'draft'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  // Update proker
  static async update(id, data) {
    const {
      judul, deskripsi, kategori_id, bidang_id, tanggal_mulai,
      tanggal_selesai, anggaran, penanggung_jawab_id, status
    } = data;
    
    const query = `
      UPDATE program_kerja 
      SET judul = $1, deskripsi = $2, kategori_id = $3, bidang_id = $4,
          tanggal_mulai = $5, tanggal_selesai = $6, anggaran = $7,
          penanggung_jawab_id = $8, status = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    
    const values = [
      judul, deskripsi, kategori_id, bidang_id || null, tanggal_mulai,
      tanggal_selesai, anggaran || 0, penanggung_jawab_id, status, id
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  // Delete proker
  static async delete(id) {
    const query = 'DELETE FROM program_kerja WHERE id = $1';
    await pool.query(query, [id]);
  }
  
  // Update status proker
  static async updateStatus(id, status, approvedBy = null, catatan = null) {
    const query = `
      UPDATE program_kerja 
      SET status = $1::varchar, 
          approved_by = $2::integer, 
          approved_at = CASE WHEN $1 IN ('disetujui', 'ditolak') THEN CURRENT_TIMESTAMP ELSE approved_at END,
          catatan_approval = $3::text,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4::integer
      RETURNING *
    `;
    
    const values = [
      status,
      approvedBy || null,
      catatan || null,
      parseInt(id)
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  // Add history
  static async addHistory(prokerId, statusLama, statusBaru, changedBy, catatan = null) {
    const query = `
      INSERT INTO proker_history (proker_id, status_lama, status_baru, catatan, changed_by)
      VALUES ($1::integer, $2::varchar, $3::varchar, $4::text, $5::integer)
      RETURNING *
    `;
    
    const values = [
      parseInt(prokerId),
      statusLama || null,
      statusBaru,
      catatan || null,
      parseInt(changedBy)
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  // Get history
  static async getHistory(prokerId) {
    const query = `
      SELECT h.*, u.full_name as changed_by_name
      FROM proker_history h
      JOIN users u ON h.changed_by = u.id
      WHERE h.proker_id = $1
      ORDER BY h.changed_at DESC
    `;
    
    const result = await pool.query(query, [prokerId]);
    return result.rows;
  }
  
  // Count by status
  static async countByStatus(status) {
    const query = 'SELECT COUNT(*) as total FROM program_kerja WHERE status = $1';
    const result = await pool.query(query, [status]);
    return parseInt(result.rows[0].total);
  }
  
  // Get kategori
  static async getKategori() {
    const query = 'SELECT * FROM kategori_proker ORDER BY nama_kategori ASC';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = ProgramKerja;