const pool = require('../conx/conx')
const bcrypt = require('bcrypt');
const senhajwt = require('../senhajwt');
const jwt = require('jsonwebtoken');

const verify = async (ID, secondID, type) => {

    const response = await pool.query(
        `select * from ${type} where id = $1`, [ID]
    )

    if (response.rows[0]) {
        if (response.rows[0].usuario_id !== secondID) {

            return true

        } else {
            return false
        }

    }
}

const criarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body
    if (!nome) {
        return res.status(400).json({ message: "Voce deve inserir o nome do usuario" });
    }

    if (!email) {
        return res.status(400).json({ message: "Voce deve inserir o email do usuario" });
    }

    if (!senha) {
        return res.status(400).json({ message: "Voce deve inserir a senha do usuario" });
    }
    try {

        const senhaCripto = await bcrypt.hash(senha, 10)
        const novoUsuario = await pool.query('insert into usuarios (nome, email, senha) values ($1, $2, $3) returning id, nome, email', [nome, email, senhaCripto]);

        res.status(200).json(novoUsuario.rows[0]);

    } catch (err) {
        return res.status(500).json({ message: 'Esse email ja foi inserido' });
    }
}

const login = async (req, res) => {
    const { email, senha } = req.body;

    try {

        const usuario = await pool.query('select * from usuarios where email = $1', [email]);

        if (usuario.rowCount < 1) {
            return res.status(404).json({ message: 'Email ou senha invalida' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

        if (!senhaValida) {
            return res.status(400).json({ message: 'Email ou senha invalida' });
        }

        const token = jwt.sign({ id: usuario.rows[0].id }, senhajwt, { expiresIn: '8h' });

        const { senha: _, ...usuarioLogado } = usuario.rows[0];

        return res.json({ usuario: usuarioLogado, token });

    } catch (err) {
        return res.status(500).json(err.message);
    }


}

const detalharUsuario = async (req, res) => {
    try {

        const { id } = req.usuario

        const user = await pool.query(
            'select * from usuarios where id = $1',
            [id]
        );

        const response = {
            id: user.rows[0].id,
            nome: user.rows[0].nome,
            email: user.rows[0].email
        }

        res.status(200).json(response)
    } catch (err) {
        return res.status(401).json({ message: 'Nao autorizado' })
    }
}

const cadastrarCategoria = async (req, res) => {
    const { descricao } = req.body;

    try {
        const { id } = req.usuario

        const response = await pool.query(
            'insert into categorias (descricao, usuario_id) values ($1, $2) returning id, descricao, usuario_id ', [descricao, id]
        )

        res.status(201).json(response.rows[0])
    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const deletarCategoria = async (req, res) => {
    const { id } = req.params

    try {


        if (await verify(id, req.usuario.id, 'categorias')) {
            return res.status(400).json({ 'mensagem': 'Voce nao pode excluir uma categoria que nao eh sua' })
        }

        const response = await pool.query(
            `select * from categorias where id = $1`, [id]
        )
        if (response.rows[0]) {
            const resposta = await pool.query( //seria const resposta ou response
                'delete from categorias where id = $1', [id]
            )
            return res.status(204).send()
        }



        return res.status(404).json({ 'message': 'categoria nao encontrada' })




    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body

    try {
        const { id } = req.usuario
        const senhaCripto = await bcrypt.hash(senha, 10)
        const response = await pool.query('UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4', [nome, email, senhaCripto, id])

        return res.status(204).send()

    } catch (err) {
        return res.status(500).json(err.message)
    }
}


const detalharCategoria = async (req, res) => {
    try {
        const { id } = req.usuario
        const response = await pool.query('select * from categorias where usuario_id = $1', [id])

        return res.status(200).json(response.rows[0])
    } catch (err) {
        return res.status(500).json(err.message)
    }
}


const detalharCategoriaID = async (req, res) => {
    const { id } = req.params
    try {
        const idUser = req.usuario.id

        const response = await pool.query('select * from categorias where usuario_id = $1 and id = $2', [idUser, id])
        if (response.rows[0]) {
            return res.status(200).json(response.rows[0])
        }
        return res.status(404).json({ message: 'Categoria nao encontrada' })
    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const cadastrarTransacao = async (req, res) => {
    const { tipo, descricao, valor, data, categoria_id } = req.body
    if (!tipo || !descricao || !valor || !data || !categoria_id) {
        return res.status(400).json({ 'message': 'verifique os campos' })
    }
    if (tipo !== 'saida' && tipo !== 'entrada') {
        return res.status(400).json({ 'message': 'apenas saida e entrada eh permitido para o tipo de transacao' })
    }
    try {
        const { id } = req.usuario

        if (await verify(categoria_id, id, 'categorias')) {
            return res.status(400).json({ 'mensagem': 'Voce deve informar uma categoria de sua posse' })
        }


        const response = await pool.query('insert into transacoes (tipo, descricao, valor, data, categoria_id, usuario_id) values ($1, $2, $3, $4, $5, $6) returning *', [tipo, descricao, valor, data, categoria_id, id])

        return res.status(201).json(response.rows[0])
    } catch (err) {
        if (err.message === 'insert or update on table "transacoes" violates foreign key constraint "transacoes_categoria_id_fkey"') {
            return res.status(401).json({ "message": "Insira um id de categoria existente" })
        }

        return res.status(500).json(err.message)
    }
}

const atualizarCategoria = async (req, res) => {
    const { id } = req.params

    const { descricao } = req.body
    if (!id) {
        return res.status(401).json({ "mensagem": "A id da categoria deve ser informada." })
    }
    if (!descricao) {
        return res.status(401).json({ "mensagem": "A descricao da categoria deve ser informada." })
    }
    try {
        if (await verify(id, req.usuario.id, 'categorias')) {
            return res.status(400).json({ 'mensagem': 'Voce deve informar uma categoria de sua posse' })
        }

        await pool.query('UPDATE categorias SET descricao = $1 where id = $2', [descricao, id])
        return res.status(204).send()

    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const detalharTransacoes = async (req, res) => { //FALTA MEXER NESSE (CONFERIR)
    const { id } = req.usuario
    const { filtro } = req.query;

    try {

        if (!filtro) {
            const response = await pool.query('select t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome from transacoes t left join categorias c on c.id = t.categoria_id where t.usuario_id = $1', [id])
            // if (!response.rows[0]) {
            //     return res.status(201).json({ 'message': 'nao ha transacoes deste usuario' })
            // }

            return res.status(200).json(response.rows)

        }

        let query = 'select t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome from transacoes t left join categorias c on c.id = t.categoria_id where'


        for (let i = 2; i < filtro.length + 2; i++) {
            query += ` t.usuario_id = $1 and c.descricao = $${i} or`
        }

        const response = await pool.query(query.slice(0, query.length - 3), [id, ...filtro]);
        // if (!response.rows[0]) {
        //     return res.status(201).json({ 'message': 'nao ha transacoes deste usuario' })
        // }
        return res.status(200).json(response.rows)

    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const detalharTransacoesID = async (req, res) => {
    const { id } = req.params
    const idUser = req.usuario.id
    try {

        if (await verify(id, idUser, 'transacoes')) {
            return res.status(400).json({ 'mensagem': 'Voce deve informar uma transacao de sua posse' })
        }


        const response = await pool.query('select t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome from transacoes t left join categorias c on c.id = t.categoria_id where t.usuario_id = $1 and t.id = $2', [idUser, id])
        if (response.rows[0]) {
            return res.status(200).json(response.rows[0])
        }
        return res.status(404).json({ message: 'Transacao nao encontrada' })
    } catch (err) {
        return res.status(500).json(err.message)
    }
}

const obterExtratoTransacao = async (req, res) => {
    const { id } = req.usuario;

    try {
        const responseEntrada = await pool.query('select coalesce (sum (valor), 0) from transacoes WHERE usuario_id = $1 and tipo = $2', [id, 'saida']);
        const responseSaida = await pool.query('select coalesce (sum (valor), 0) from transacoes WHERE usuario_id =$1 and tipo = $2', [id, 'entrada']);

        const response = {
            Entrada: responseEntrada.rows[0].coalesce,
            Saida: responseSaida.rows[0].coalesce
        }

        return res.status(200).json(response)
    } catch (err) {
        return res.status(500).json(err.message);
    }
}

const deletarTransacao = async (req, res) => {
    const { id } = req.params;

    try {

        if (!id) {
            res.status(401).json({ 'mensagem': 'A id da transacao deve ser informada.' })
        }

        if (await verify(id, req.usuario.id, 'transacoes')) {
            return res.status(400).json({ 'mensagem': 'Voce nao pode excluir uma transacao que nao e sua' })
        }

        const response = await pool.query(
            'select * from transacoes where id = $1', [id]
        )
        if (response.rows[0]) {
            const response = await pool.query(
                'delete from transacoes where id = $1', [id]
            )
            return res.status(204).send()
        }

        return res.status(404).json({ 'message': 'transacao nao encontrada' })

    } catch (err) {
        return res.status(500).json(err.message);
    }
}

module.exports = {
    criarUsuario,
    login,
    detalharUsuario,
    cadastrarCategoria,
    deletarCategoria,
    atualizarUsuario,
    detalharCategoria,
    detalharCategoriaID,
    cadastrarTransacao,
    atualizarCategoria,
    detalharTransacoes,
    detalharTransacoesID,
    obterExtratoTransacao,
    deletarTransacao
}