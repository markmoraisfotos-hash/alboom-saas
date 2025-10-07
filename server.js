const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');  // ✅ PostgreSQL
const path = require('path');
const crypto = require('crypto');

// ✅ Conexão PostgreSQL correta
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ APIs completas: /api/auth/login, /api/sessions, etc.
