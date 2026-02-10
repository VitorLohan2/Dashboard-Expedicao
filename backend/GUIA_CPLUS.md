# 📊 Conexão CPlus - Guia de Uso

## ✅ Status da Conexão

A conexão com o banco de dados CPlus (PostgreSQL) foi estabelecida com sucesso!

- **IP**: 186.232.43.142
- **Porta**: 2407
- **Banco**: CPlus5
- **Schema**: dbo
- **Tabelas disponíveis**: 782

## 📁 Arquivos Criados/Modificados

1. **`.env`** - Adicionado `DATABASE_URL_CPLUS`
2. **`config/db.js`** - Configuração de conexão reutilizável
3. **`routes/cplus.js`** - Rotas para consultas ao CPlus
4. **`server/index.js`** - Integração das rotas
5. **`testarConexaoCPlus.js`** - Script de teste (pode ser deletado após validação)

## 🔗 Endpoints Disponíveis

### 1. Teste de Conexão

```http
GET http://localhost:3001/cplus/teste
```

**Resposta:**

```json
{
  "status": "✅ Conectado ao CPlus",
  "servidor": {
    "hora_servidor": "2026-02-10T11:16:05.000Z"
  }
}
```

### 2. Listar Tabelas

```http
GET http://localhost:3001/cplus/tabelas
```

**Resposta:**

```json
{
  "total": 782,
  "tabelas": ["empresa", "cliente", "produto", ...]
}
```

### 3. Executar Consulta Personalizada

```http
POST http://localhost:3001/cplus/consulta
Content-Type: application/json

{
  "query": "SELECT * FROM dbo.empresa LIMIT 10"
}
```

**Resposta:**

```json
{
  "linhas": 5,
  "dados": [
    { "id": 1, "nome": "Empresa A", ... },
    ...
  ]
}
```

## 💡 Exemplos de Uso no Código

### Usar queryCP (múltiplas linhas)

```javascript
const { queryCP } = require("../config/db");

const clientes = await queryCP("SELECT * FROM dbo.cliente WHERE ativo = true");
```

### Usar queryOneCP (uma linha)

```javascript
const { queryOneCP } = require("../config/db");

const empresa = await queryOneCP(
  "SELECT * FROM dbo.empresa WHERE id = $1",
  [1],
);
```

## ⚠️ Segurança

- **Apenas SELECTs**: O endpoint `/cplus/consulta` bloqueia DELETE, DROP, UPDATE e INSERT
- **Limite de resultados**: Máximo 100 registros por consulta
- **Prepared Statements**: Use $1, $2, etc. para parametrização

## 🗝️ Comandos Úteis

### Teste rápido após modificações

```bash
cd backend
node testarConexaoCPlus.js
```

### Iniciar o servidor (com CPlus integrado)

```bash
npm start
```

## 📋 Próximos Passos

Agora você pode:

1. ✅ Consultar dados do CPlus via API
2. ✅ Integrar dados do CPlus com MongoDB
3. ✅ Criar relatórios combinando dados
4. ✅ Exportar dados para o frontend

---

**Data da configuração**: 10 de fevereiro de 2026  
**Versão**: 1.0
