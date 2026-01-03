const pool = require('../config/database');

class Role {
    // Get all roles
    static async findAll() {
        const query = 'SELECT * FROM roles ORDER BY role_level ASC';
        const result = await pool.query(query);
        return result.rows;
    }

    // Get role by ID
    static async findById(id) {
        const query = 'SELECT * FROM roles WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Get role by name
    static async findByName(roleName) {
        const query = 'SELECT * FROM roles WHERE role_name = $1';
        const result = await pool.query(query, [roleName]);
        return result.rows[0];
    }
}

module.exports = Role;