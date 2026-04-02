Credenciais do admin:
Email: admin@cidadao.to
Senha: admin123

-- SUBIR PARA GIT (local)
git add .
git commit -m "mensagem aqui"
git push origin main

-- BAIXAR E RODAR LOCAL
git pull origin main
npm install
npm install --prefix backend
npm install --prefix frontend
npm run migrate
npm run dev


============================================================
-- DEPLOY NO SERVIDOR (rodar via SSH no CloudPanel)
-- Caminho: /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
============================================================

-- 1. Entrar na pasta do projeto
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to

-- 2. Instalar Node 20 (só na primeira vez)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v

-- 3. Instalar PM2 (só na primeira vez)
npm install -g pm2

-- 4. Instalar dependencias
npm install
npm install --prefix backend
npm install --prefix frontend

-- 5. Criar backend/.env (só na primeira vez - ajustar senhas)
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=NOME_DO_BANCO
DB_USER=USUARIO_DO_BANCO
DB_PASS=SENHA_DO_BANCO
JWT_SECRET=chave_longa_e_secreta_aqui
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=
TOGETHER_API_KEY=
EOF

-- 6. Criar frontend/.env (só na primeira vez)
echo "VITE_API_URL=/api" > frontend/.env

-- 7. Rodar migrations
npm run migrate

-- 8. Popular admin (só na primeira vez)
npm run seed

-- 9. Build
npm run build --prefix backend
npm run build --prefix frontend

-- 10. Publicar frontend no root do dominio
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online
find . -mindepth 1 -maxdepth 1 ! -name 'cidadao-to' ! -name '.well-known' -exec rm -rf {} \;
cp -r cidadao-to/frontend/dist/* .

-- 11. Subir backend com PM2
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

-- 12. Ver logs
pm2 logs cidadao-to-backend
pm2 status


-- ATUALIZAR SERVIDOR (apos git push local)
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to
git pull origin main
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix backend
npm run build --prefix frontend
cp -r frontend/dist/* /home/cidadaotocantins/htdocs/cidadaotocantins.online/
pm2 restart cidadao-to-backend