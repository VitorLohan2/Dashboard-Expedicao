# 🔄 Integração CPlus - Página de Consulta

## ✅ O que foi implementado

### Backend

1. **Endpoint modificado**: `/carregamentos/finalizados`
   - Busca carregamentos finalizados no MongoDB
   - Consulta dados paralelos do CPlus (datainiciocarregamento e datafinalizacaocarregamento)
   - Faz o **match automático** por:
     - **Placa do veículo** (correspondência exata, case-insensitive)
     - **Proximidade de horário** (quando há múltiplos registros da mesma placa)
   - Retorna dados combinados com campos `cplusInicio` e `cplusFim`

2. **Query CPlus executada**:
   ```sql
   SELECT
     v.placa,
     r.datainiciocarregamento,
     r.datafinalizacaocarregamento,
     r.datadocadastro
   FROM dbo.romaneiodeentrega as r
   JOIN dbo.veiculo as v ON r.idveiculo = v.id
   WHERE DATE(r.dataprevistasaida) = $1
   ```

### Frontend

1. **Novas colunas na tabela**:
   - `Início (C-Plus)` - Hora de início do CPlus
   - `Fim (C-Plus)` - Hora de fim do CPlus

2. **Estilo diferenciado**:
   - Colunas do CPlus com fundo verde claro (`success-50`)
   - Fonte monoespaçada para facilitar comparação
   - Cor verde (`success-600`) para destacar

3. **PDF atualizado**:
   - Exportação inclui as colunas do CPlus
   - Layout ajustado para caber todas as colunas

## 📊 Como funciona a comparação

### Algoritmo de Match

1. **Match por Placa**: Busca registros no CPlus com a mesma placa (case-insensitive)
2. **Desempate por Horário**: Se houver múltiplos registros da mesma placa:
   - Compara `r.datainiciocarregamento` (CPlus) com `horaInicio` (MongoDB)
   - Escolhe o registro com menor diferença de tempo
3. **Resultado**: Cada carregamento do MongoDB recebe os campos:
   - `cplusInicio`: timestamp do CPlus ou `null`
   - `cplusFim`: timestamp do CPlus ou `null`

## 🎯 Exemplo de Resposta

```json
{
  "_id": "abc123",
  "placa": "SRB 2D29",
  "modelo": "1016",
  "conferente": "Jhonath",
  "equipe": "7",
  "horaInicio": "2026-02-10T21:03:17.000Z",
  "horaFim": "2026-02-10T22:05:09.000Z",
  "cplusInicio": "2026-02-10T21:03:17.000Z",  ← NOVO
  "cplusFim": "2026-02-10T22:05:09.000Z",     ← NOVO
  "tempo": "01:01:52"
}
```

## 📸 Visualização

A tabela agora mostra:

```
Placa     | Modelo | Conferente | Equipe | Início   | Fim      | Início (C-Plus) | Fim (C-Plus) | Tempo
SRB 2D29  | 1016   | Jhonath    | 7      | 21:03:17 | 22:05:09 | 21:03:17       | 22:05:09     | 01:01:52
```

As colunas do CPlus têm **fundo verde claro** para fácil identificação.

## ⚠️ Tratamento de Erros

- Se o CPlus estiver inacessível, o sistema continua funcionando normalmente
- Placas sem correspondência no CPlus mostram "-" nas colunas
- Log no console indica quantos registros foram encontrados no CPlus

## 🔧 Logs do Backend

Ao buscar carregamentos finalizados, você verá:

```
📊 CPlus: Encontrados 25 registros para 2026-02-10
```

## 🚀 Como Testar

1. **Iniciar o backend**:

   ```bash
   cd backend
   npm start
   ```

2. **Iniciar o frontend**:

   ```bash
   cd frontend
   npm start
   ```

3. **Acessar**: http://localhost:3000/consulta

4. **Selecionar uma data** que tenha carregamentos finalizados

5. **Verificar as colunas** "Início (C-Plus)" e "Fim (C-Plus)"

## 📝 Notas

- A comparação é feita **automaticamente** a cada busca
- Não é necessário configurar nada adicional
- Os dados do CPlus são buscados em tempo real (não são salvos no MongoDB)
- Para melhor performance, a query do CPlus usa índices nas colunas de data

## 🎨 Arquivos Modificados

- ✅ `backend/routes/carregamentos.js` - Lógica de integração
- ✅ `backend/config/db.js` - Funções de query CPlus
- ✅ `frontend/src/pages/Consulta.jsx` - Novas colunas na UI
- ✅ `frontend/src/styles/Consulta.css` - Estilos das colunas CPlus

---

**Data da implementação**: 10 de fevereiro de 2026  
**Status**: ✅ Pronto para uso
