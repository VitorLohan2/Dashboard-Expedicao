# Migração Backend Expedição: Render → VM

## Arquitetura

- **Backend**: Container Docker na VM (porta `3501` externa → `3001` interna)
- **MongoDB**: Continua no Atlas (cloud) — sem mudança
- **CPlus PostgreSQL**: Continua apontando para `186.232.43.142:2407` — sem mudança
- **Frontend**: Atualizar `REACT_APP_API_URL` para apontar para a VM

---

## Passo a Passo na VM

### 1. Criar diretório separado do outro projeto

```bash
mkdir -p ~/expedicao
cd ~/expedicao
```

### 2. Enviar os arquivos do backend para a VM

**Opção A — Git (recomendado):**

```bash
cd ~/expedicao
git clone <url-do-repositorio> .
cd backend
```

**Opção B — SCP direto da sua máquina:**

```bash
# Na sua máquina local (PowerShell):
scp -r .\backend\* dev@ip-10-110-11-89:~/expedicao/
```

### 3. Verificar que os arquivos estão lá

```bash
cd ~/expedicao
ls -la
# Deve ter: Dockerfile, docker-compose-expedicao.yml, package.json, server/, config/, models/, routes/
```

### 4. Build e subir o container

```bash
cd ~/expedicao
docker compose -f docker-compose-expedicao.yml up -d --build
```

### 5. Verificar se está rodando

```bash
# Ver logs
docker logs expedicao_backend

# Testar health check
curl http://localhost:3501/health

# Testar status das conexões
curl http://localhost:3501/status

# Ver container rodando
docker ps | grep expedicao
```

**Saída esperada do `/health`:**

```json
{ "status": "ok", "timestamp": "2026-02-23T..." }
```

**Saída esperada do `/status`:**

```json
{ "status": "online", "conexoes": { "mongodb": true, "cplus": true } }
```

---

## Atualizar o Frontend

O frontend precisa apontar para o novo endereço do backend na VM.

### Se o frontend está em Vercel/build estático:

Atualizar a variável de ambiente:

```
REACT_APP_API_URL=http://<IP-PUBLICO-DA-VM>:3501
```

### Se usar HTTPS (recomendado para produção):

Você pode reutilizar o nginx do outro projeto para fazer proxy reverso. Nesse caso, adicione um bloco no nginx:

```nginx
# Adicionar em ~/sistema/prod/nginx/conf.d/ um novo arquivo: expedicao.conf

server {
    listen 443 ssl;
    server_name expedicao.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/expedicao.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/expedicao.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://host.docker.internal:3501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **Nota:** Como os containers estão em redes Docker diferentes, use `host.docker.internal` ou o IP da VM (`172.17.0.1` geralmente funciona para acessar o host de dentro do container nginx). Alternativamente, coloque ambos na mesma rede.

Se preferir manter simples sem subdomínio, pode abrir a porta 3501 no Security Group da AWS e acessar diretamente: `http://<IP-PUBLICO>:3501`

---

## Comandos Úteis

```bash
# Parar
docker compose -f docker-compose-expedicao.yml down

# Rebuild após alterações de código
docker compose -f docker-compose-expedicao.yml up -d --build

# Ver logs em tempo real
docker logs -f expedicao_backend

# Restart
docker compose -f docker-compose-expedicao.yml restart

# Entrar no container
docker exec -it expedicao_backend sh
```

---

## Checklist Pós-Migração

- [ ] Container rodando: `docker ps | grep expedicao`
- [ ] Health check OK: `curl http://localhost:3501/health`
- [ ] MongoDB conectado: verificar no `/status`
- [ ] CPlus conectado: verificar no `/status`
- [ ] Frontend apontando para novo URL
- [ ] Testar funcionalidades no frontend (carregamentos, consulta CPlus)
- [ ] Desligar o serviço no Render depois de confirmar que tudo funciona

---

## Segurança (Security Group AWS)

Liberar no Security Group da instância EC2:

- **Porta 3501** (TCP) — para acesso direto ao backend
- Ou só porta **443** se for usar nginx com HTTPS

---

## Portas em uso na VM

| Serviço                | Porta Externa | Porta Interna |
| ---------------------- | ------------- | ------------- |
| Nginx (outro projeto)  | 80, 443       | 80, 443       |
| Postgres (outro proj.) | 5786          | 5432          |
| **Expedição Backend**  | **3501**      | **3001**      |
