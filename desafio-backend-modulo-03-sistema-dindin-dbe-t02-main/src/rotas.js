const express = require("express");
const { criarUsuario, login, detalharUsuario, cadastrarCategoria, deletarCategoria, atualizarUsuario, detalharCategoria, detalharCategoriaID, cadastrarTransacao, atualizarCategoria, detalharTransacoes, detalharTransacoesID } = require("./controladores/controladores");
const verificarUsuarioLogado = require("./intermediarios/intermedio");
const rotas = express();

rotas.post('/usuarios', criarUsuario);
rotas.post('/login', login);
rotas.post('/categoria', verificarUsuarioLogado, cadastrarCategoria);
rotas.post('/transacao', verificarUsuarioLogado, cadastrarTransacao)

rotas.get('/usuario', verificarUsuarioLogado, detalharUsuario);
rotas.get('/categoria', verificarUsuarioLogado, detalharCategoria);
rotas.get('/categoria/:id', verificarUsuarioLogado, detalharCategoriaID);
rotas.get('/transacao', verificarUsuarioLogado, detalharTransacoes);
rotas.get('/transacao/:id', verificarUsuarioLogado, detalharTransacoesID);


rotas.delete('/categoria/:id', verificarUsuarioLogado, deletarCategoria);

rotas.put('/usuario', verificarUsuarioLogado, atualizarUsuario)
rotas.put('/categoria/:id', verificarUsuarioLogado, atualizarCategoria)

module.exports = rotas;