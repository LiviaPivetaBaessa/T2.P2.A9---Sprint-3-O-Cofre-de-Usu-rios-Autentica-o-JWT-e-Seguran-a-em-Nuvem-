const express = require('express');
const { processarMensagem, limparHistorico } = require('../controllers/chatController');
const { autenticarToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// O "Segurança do Prédio" vem ANTES do controlador
router.post('/', autenticarToken, processarMensagem);          // POST   /api/chat
router.delete('/limpar', autenticarToken, limparHistorico);    // DELETE /api/chat/limpar

module.exports = router;