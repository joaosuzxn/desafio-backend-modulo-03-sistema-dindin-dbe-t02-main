create database dindin


create table usuarios( 
  id serial primary key, 
  nome character varying(200) NOT NULL, 
  email character varying(100) unique, 
  senha character varying(200) NOT NULL)

create table categorias( 
  id serial primary key, 
  usuario_id int,
  descricao character varying(200),
  foreign key (usuario_id) references usuarios (id)
  )

create table transacoes (
	id serial primary key,
	descricao character varying(200),
  valor float,
  data date,
  categoria_id int,
  foreign key (categoria_id) references categorias(id),
  usuario_id int,
  foreign key(usuario_id) references usuarios(id),
  tipo character varying(200)
)