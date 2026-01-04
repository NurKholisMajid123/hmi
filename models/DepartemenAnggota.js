// models/DepartemenAnggota.js
const pool = require('../config/database');

class DepartemenAnggota {
    // Get anggota sekretaris
    static async getAnggotaSekretaris() {
        const query = `
            SELECT u.id, u.username, u.email, u.full_name, u.phone, 
                   u.is_active, u.created_at, r.role_name,
                   ase.created_at as tanggal_bergabung
            FROM anggota_sekretaris ase
            JOIN users u ON ase.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.full_name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Get anggota bendahara
    static async getAnggotaBendahara() {
        const query = `
            SELECT u.id, u.username, u.email, u.full_name, u.phone, 
                   u.is_active, u.created_at, r.role_name,
                   abe.created_at as tanggal_bergabung
            FROM anggota_bendahara abe
            JOIN users u ON abe.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.full_name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Check user membership status (returns: null, 'sekretaris', 'bendahara', 'bidang')
    static async checkUserMembership(userId) {
        // Check sekretaris
        const sekretarisQuery = 'SELECT * FROM anggota_sekretaris WHERE user_id = $1';
        const sekretarisResult = await pool.query(sekretarisQuery, [userId]);
        if (sekretarisResult.rows.length > 0) {
            return {
                status: 'sekretaris',
                message: 'User sudah menjadi anggota Sekretaris'
            };
        }

        // Check bendahara
        const bendaharaQuery = 'SELECT * FROM anggota_bendahara WHERE user_id = $1';
        const bendaharaResult = await pool.query(bendaharaQuery, [userId]);
        if (bendaharaResult.rows.length > 0) {
            return {
                status: 'bendahara',
                message: 'User sudah menjadi anggota Bendahara'
            };
        }

        // Check bidang
        const bidangQuery = 'SELECT b.nama_bidang FROM user_bidang ub JOIN bidang b ON ub.bidang_id = b.id WHERE ub.user_id = $1';
        const bidangResult = await pool.query(bidangQuery, [userId]);
        if (bidangResult.rows.length > 0) {
            return {
                status: 'bidang',
                bidang_name: bidangResult.rows[0].nama_bidang,
                message: `User sudah menjadi anggota Bidang ${bidangResult.rows[0].nama_bidang}`
            };
        }

        return null;
    }

    // Add anggota sekretaris (with validation)
    static async addAnggotaSekretaris(userId) {
        // Check existing membership
        const membership = await this.checkUserMembership(userId);
        if (membership) {
            throw new Error(membership.message);
        }

        const query = `
            INSERT INTO anggota_sekretaris (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }

    // Add anggota bendahara (with validation)
    static async addAnggotaBendahara(userId) {
        // Check existing membership
        const membership = await this.checkUserMembership(userId);
        if (membership) {
            throw new Error(membership.message);
        }

        const query = `
            INSERT INTO anggota_bendahara (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }

    // Remove anggota sekretaris
    static async removeAnggotaSekretaris(userId) {
        const query = 'DELETE FROM anggota_sekretaris WHERE user_id = $1';
        await pool.query(query, [userId]);
    }

    // Remove anggota bendahara
    static async removeAnggotaBendahara(userId) {
        const query = 'DELETE FROM anggota_bendahara WHERE user_id = $1';
        await pool.query(query, [userId]);
    }

    // Check if user is anggota sekretaris
    static async isAnggotaSekretaris(userId) {
        const query = 'SELECT * FROM anggota_sekretaris WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        return result.rows.length > 0;
    }

    // Check if user is anggota bendahara
    static async isAnggotaBendahara(userId) {
        const query = 'SELECT * FROM anggota_bendahara WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        return result.rows.length > 0;
    }

    // Get departemen user (sekretaris/bendahara/bidang/null)
    static async getUserDepartemen(userId) {
        const isSekretaris = await this.isAnggotaSekretaris(userId);
        if (isSekretaris) return 'sekretaris';

        const isBendahara = await this.isAnggotaBendahara(userId);
        if (isBendahara) return 'bendahara';

        // Check bidang
        const bidangQuery = 'SELECT bidang_id FROM user_bidang WHERE user_id = $1';
        const bidangResult = await pool.query(bidangQuery, [userId]);
        if (bidangResult.rows.length > 0) return 'bidang';

        return null;
    }

    // Get available users (tidak punya keanggotaan)
    static async getAvailableUsers() {
        const query = `
            SELECT u.id, u.username, u.email, u.full_name, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.role_id = 6 
            AND u.is_active = true
            AND u.id NOT IN (
                SELECT user_id FROM anggota_sekretaris
                UNION
                SELECT user_id FROM anggota_bendahara
                UNION
                SELECT user_id FROM user_bidang
            )
            ORDER BY u.full_name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Count anggota sekretaris
    static async countAnggotaSekretaris() {
        const query = 'SELECT COUNT(*) as total FROM anggota_sekretaris';
        const result = await pool.query(query);
        return parseInt(result.rows[0].total);
    }

    // Count anggota bendahara
    static async countAnggotaBendahara() {
        const query = 'SELECT COUNT(*) as total FROM anggota_bendahara';
        const result = await pool.query(query);
        return parseInt(result.rows[0].total);
    }
}

module.exports = DepartemenAnggota;