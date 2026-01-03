const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Get all users dengan role
  static async findAll() {
    const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, 
             u.address, u.is_active, u.profile_photo, u.created_at,
             r.role_name, r.role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY r.role_level ASC, u.full_name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get user by ID
  static async findById(id) {
    const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, 
             u.address, u.is_active, u.profile_photo, u.role_id, 
             u.password, u.created_at, u.updated_at,
             r.role_name, r.role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get user by username
  static async findByUsername(username) {
    const query = `
      SELECT u.*, r.role_name, r.role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Get user by email
  static async findByEmail(email) {
    const query = `
      SELECT u.*, r.role_name, r.role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Create new user - FIXED: Tambahkan is_active
  static async create(userData) {
    const { username, email, password, full_name, phone, address, role_id, is_active } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, password, full_name, phone, address, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, full_name, role_id, is_active, created_at
    `;
    const values = [
      username, 
      email, 
      hashedPassword, 
      full_name, 
      phone, 
      address, 
      role_id,
      is_active !== undefined ? is_active : true // Default true jika tidak diset
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update user
  static async update(id, userData) {
    const { username, email, full_name, phone, address, role_id, is_active } = userData;
    
    const query = `
      UPDATE users 
      SET username = $1, email = $2, full_name = $3, phone = $4, 
          address = $5, role_id = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, username, email, full_name, updated_at
    `;
    const values = [username, email, full_name, phone, address, role_id, is_active, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(query, [hashedPassword, id]);
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get users by role
  static async findByRole(roleId) {
    const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.created_at,
             r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.role_id = $1 AND u.is_active = true
      ORDER BY u.full_name ASC
    `;
    const result = await pool.query(query, [roleId]);
    return result.rows;
  }

  // Count total users
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }

  // Count active users
  static async countActive() {
    const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }
}

module.exports = User;