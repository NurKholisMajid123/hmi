const pool = require('../config/database');

class Bidang {
    // Get all bidang
    static async findAll() {
        const query = `
      SELECT b.*, 
             u.full_name as ketua_name, u.username as ketua_username,
             (SELECT COUNT(*) FROM user_bidang WHERE bidang_id = b.id) as jumlah_anggota
      FROM bidang b
      LEFT JOIN users u ON b.ketua_bidang_id = u.id
      ORDER BY b.nama_bidang ASC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Get bidang by ID
    static async findById(id) {
        const query = `
      SELECT b.*, 
             u.full_name as ketua_name, u.username as ketua_username, u.email as ketua_email
      FROM bidang b
      LEFT JOIN users u ON b.ketua_bidang_id = u.id
      WHERE b.id = $1
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Get bidang by ketua ID
    static async findByKetuaId(ketuaId) {
        const query = `
      SELECT b.*, 
             (SELECT COUNT(*) FROM user_bidang WHERE bidang_id = b.id) as jumlah_anggota
      FROM bidang b
      WHERE b.ketua_bidang_id = $1
    `;
        const result = await pool.query(query, [ketuaId]);
        return result.rows[0];
    }

    // Create bidang
    static async create(data) {
        const { nama_bidang, deskripsi, ketua_bidang_id } = data;
        const query = `
      INSERT INTO bidang (nama_bidang, deskripsi, ketua_bidang_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const result = await pool.query(query, [nama_bidang, deskripsi, ketua_bidang_id || null]);
        return result.rows[0];
    }

    // Update bidang
    static async update(id, data) {
        const { nama_bidang, deskripsi, ketua_bidang_id } = data;
        const query = `
      UPDATE bidang 
      SET nama_bidang = $1, deskripsi = $2, ketua_bidang_id = $3, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
        const result = await pool.query(query, [nama_bidang, deskripsi, ketua_bidang_id || null, id]);
        return result.rows[0];
    }

    // Delete bidang
    static async delete(id) {
        const query = 'DELETE FROM bidang WHERE id = $1';
        await pool.query(query, [id]);
    }

    // Get anggota bidang
    static async getAnggota(bidangId) {
        const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, 
             u.is_active, u.created_at, r.role_name
      FROM user_bidang ub
      JOIN users u ON ub.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE ub.bidang_id = $1
      ORDER BY u.full_name ASC
    `;
        const result = await pool.query(query, [bidangId]);
        return result.rows;
    }

    // Add anggota ke bidang
    static async addAnggota(bidangId, userId) {
        const query = `
      INSERT INTO user_bidang (bidang_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, bidang_id) DO NOTHING
      RETURNING *
    `;
        const result = await pool.query(query, [bidangId, userId]);
        return result.rows[0];
    }

    // Remove anggota dari bidang
    static async removeAnggota(bidangId, userId) {
        const query = 'DELETE FROM user_bidang WHERE bidang_id = $1 AND user_id = $2';
        await pool.query(query, [bidangId, userId]);
    }

    // Check if user is anggota of bidang
    static async isAnggotaOf(userId, bidangId) {
        const query = 'SELECT * FROM user_bidang WHERE user_id = $1 AND bidang_id = $2';
        const result = await pool.query(query, [userId, bidangId]);
        return result.rows.length > 0;
    }

    // Get bidang-bidang yang diikuti user
    static async getUserBidang(userId) {
        const query = `
    SELECT DISTINCT b.*, 
           u.full_name as ketua_name,
           CASE 
             WHEN b.ketua_bidang_id = $1 THEN 'Ketua Bidang'
             ELSE 'Anggota'
           END as posisi
    FROM bidang b
    LEFT JOIN users u ON b.ketua_bidang_id = u.id
    WHERE b.id IN (
      -- Bidang dimana user adalah anggota
      SELECT bidang_id FROM user_bidang WHERE user_id = $1
      UNION
      -- Bidang dimana user adalah ketua
      SELECT id FROM bidang WHERE ketua_bidang_id = $1
    )
    ORDER BY b.nama_bidang ASC
  `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }
}

module.exports = Bidang;