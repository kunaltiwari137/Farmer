// STEP 1: Import the tools this file needs
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//------------------Signup---------------//

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (role !== "farmer" && role !== "buyer") {
      return res.status(400).json({ error: "Role must be 'farmer' or 'buyer'" });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, password_hash, phone || null, role]
    );

    res.status(201).json({ message: "User registered successfully", user_id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
};

//------------------Login---------------//

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

//------------------Google Sign-In---------------//

exports.googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential || !role) {
      return res.status(400).json({ error: "Missing Google credential or role" });
    }

    if (role !== "farmer" && role !== "buyer") {
      return res.status(400).json({ error: "Role must be 'farmer' or 'buyer'" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      const randomPassword = await bcrypt.hash(Date.now().toString() + email, 10);

      const [result] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, randomPassword, role]
      );

      user = { user_id: result.insertId, name, email, role };
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google sign-in successful",
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Google authentication failed" });
  }
};