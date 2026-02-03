# Instruções de Deploy - Rota de Pausa

## ⚠️ Problema Atual

A rota `/carregamentos/:idPlaca/pausar` foi adicionada ao backend, mas o servidor em produção (https://dashboard-expedicao.onrender.com) ainda não tem essa rota.

**Erro no console:**

```
PUT https://dashboard-expedicao.onrender.com/carregamentos/14/pausar 404 (Not Found)
```

## ✅ Solução

Você precisa **reimplantar o backend** no Render.com para que a nova rota seja disponibilizada.

### Passos para Deploy:

#### Opção 1: Deploy Automático (se configurado com Git)

1. Faça commit das alterações:

   ```bash
   cd c:\Users\vitor.lohan\documents\dashboard-expedicao\backend
   git add .
   git commit -m "Adicionar rota de pausar carregamento"
   git push origin main
   ```

2. O Render.com irá detectar as mudanças e fazer deploy automaticamente

#### Opção 2: Deploy Manual no Render.com

1. Acesse https://dashboard.render.com/
2. Faça login na sua conta
3. Encontre o serviço **dashboard-expedicao** (backend)
4. Clique em **"Manual Deploy"** > **"Deploy latest commit"**
5. Aguarde o deploy completar (geralmente 2-5 minutos)

### Como Testar Localmente (Opcional)

Se quiser testar antes de fazer deploy em produção:

1. **Inicie o backend local:**

   ```bash
   cd backend
   npm start
   ```

2. **Configure o frontend para usar backend local:**
   - Crie arquivo `.env` em `frontend/` (se não existir):
     ```
     REACT_APP_API_URL=http://localhost:3001
     ```

3. **Inicie o frontend:**

   ```bash
   cd frontend
   npm start
   ```

4. **Teste a funcionalidade de pausar** no navegador

### Verificar se Deploy Funcionou

Após o deploy, teste a rota diretamente:

```bash
# No PowerShell ou Terminal
curl https://dashboard-expedicao.onrender.com/health
```

Se retornar status "ok", o servidor está rodando.

## 📝 Alterações Feitas

### Backend (`routes/carregamentos.js`)

- ✅ Nova rota `PUT /carregamentos/:idPlaca/pausar`
- ✅ Rota `/iniciar` reseta campos de pausa
- ✅ Rota `/finalizar` desconta tempo pausado

### Frontend (`Dashboard.jsx`)

- ✅ Timer global atualiza imediatamente (sem delay)
- ✅ Botão pausar integrado com nova API
- ✅ Sincronização após iniciar/pausar/finalizar

### Modelo (`models/carregamento.js`)

- ✅ Campo `isPaused` (Boolean)
- ✅ Campo `tempoPausado` (Number)
- ✅ Campo `horaPausa` (Date)

## 🔍 Como Funciona o Cronômetro

| Ação          | Backend                                 | Frontend             |
| ------------- | --------------------------------------- | -------------------- |
| **Iniciar**   | Salva `horaInicio`, reseta pausas       | Inicia timer global  |
| **Pausar**    | Salva `horaPausa`, `isPaused=true`      | Para contagem visual |
| **Retomar**   | Acumula tempo pausado, `isPaused=false` | Retoma contagem      |
| **Finalizar** | Calcula tempo efetivo - pausas          | Mostra tempo final   |

**Fórmula do tempo:**

- **Em andamento:** `(agora - horaInicio) - tempoPausado`
- **Pausado:** `(horaPausa - horaInicio) - tempoPausado`
- **Finalizado:** Tempo salvo no campo `tempo`

## ⚡ Após Deploy

1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Recarregue a página (F5 ou Ctrl + R)
3. Teste iniciar um carregamento
4. Teste pausar e retomar
5. Teste finalizar

Se ainda houver problemas, verifique os logs no Render.com.
