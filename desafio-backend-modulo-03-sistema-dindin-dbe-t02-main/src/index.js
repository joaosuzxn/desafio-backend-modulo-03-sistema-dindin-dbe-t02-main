const app = require('./server');
const rotas = require('./rotas');


app.use(rotas);

app.listen(8000);