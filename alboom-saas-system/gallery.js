const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Photo, Session } = require('../models/Photo');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 📊 GET /api/gallery/dashboard - Dashboard do fotógrafo
router.get('/dashboard', authenticateToken, (req, res) => {
    try {
        res.json({
            message: 'Dashboard PhotoFlow',
            photographer: req.user,
            stats: {
                total_sessions: 0,
                active_sessions: 0,
                total_photos: 0,
                selected_photos: 0
            },
            recent_sessions: []
        });

    } catch (error) {
        console.log('❌ Erro no dashboard:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
