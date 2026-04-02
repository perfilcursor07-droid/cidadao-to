# Deploy em producao no CloudPanel

Este projeto funciona bem no CloudPanel com esta divisao:

- frontend React/Vite servido como site estatico em `cidadaotocantins.online`
- backend Node/Express rodando em `127.0.0.1:3001`
- Nginx do CloudPanel fazendo proxy de `/api` para o backend

## 1. Estrutura recomendada no servidor

No seu caso, o dominio aponta para:

- `/home/cidadaotocantins/htdocs/cidadaotocantins.online`

Use esta estrutura:

- codigo do repositorio: `/home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to`
- frontend publicado: direto em `/home/cidadaotocantins/htdocs/cidadaotocantins.online`

## 2. Dependencias do servidor

Instale Node 20 e PM2 se ainda nao estiverem disponiveis:

```bash
node -v
npm -v
npm install -g pm2
```

## 3. Clonar e instalar

```bash
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online
git clone https://github.com/perfilcursor07-droid/cidadao-to.git
cd cidadao-to
npm install
npm install --prefix backend
npm install --prefix frontend
```

## 4. Configurar backend

Crie o arquivo `backend/.env` com valores de producao:

```env
NODE_ENV=production
PORT=3001

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cidadotocantins
DB_USER=SEU_USUARIO_MYSQL
DB_PASS=SUA_SENHA_MYSQL

JWT_SECRET=troque_por_uma_chave_longa_e_unica
JWT_EXPIRES_IN=7d

ANTHROPIC_API_KEY=
TOGETHER_API_KEY=
```

Observacao:

- se o banco estiver no proprio servidor, prefira `127.0.0.1`
- use um usuario MySQL proprio para o projeto, nao `root`

## 5. Configurar frontend

Crie o arquivo `frontend/.env`:

```env
VITE_API_URL=/api
```

## 6. Rodar migration e build

```bash
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
npm run migrate --prefix backend
npm run build --prefix backend
npm run build --prefix frontend
```

## 7. Publicar frontend no dominio

Limpe o root do site, preservando a pasta do repositorio:

```bash
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online
find . -mindepth 1 -maxdepth 1 ! -name 'cidadao-to' -exec rm -rf {} \;
cp -r /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to/frontend/dist/* /home/cidadaotocantins/htdocs/cidadaotocantins.online/
```

## 8. Subir backend com PM2

```bash
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Logs:

```bash
pm2 logs cidadao-to-backend
pm2 status
```

## 9. Configurar Nginx no CloudPanel

No painel do dominio, abra `Vhost` e adicione estas regras no server block principal.

### Proxy da API

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300;
}
```

### Fallback da SPA

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Depois recarregue o Nginx pelo painel ou via CLI.

## 10. Atualizar depois de um git pull

```bash
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
git pull origin main
npm install
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix backend
npm run build --prefix frontend
cp -r frontend/dist/* /home/cidadaotocantins/htdocs/cidadaotocantins.online/
pm2 restart cidadao-to-backend
```

## 11. Checklist final

- frontend abrindo em `https://cidadaotocantins.online`
- API respondendo em `https://cidadaotocantins.online/api/politicians`
- backend ativo no `pm2 status`
- SSL ativo no CloudPanel
- banco acessivel com as credenciais de producao