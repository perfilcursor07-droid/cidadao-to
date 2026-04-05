Credenciais do admin:
Email: admin@cidadao.to
Senha: admin123

-- BAIXAR DO PARA GIT
git pull origin main
npm run migrate
npm run seed
npm run dev


-- SUBIR PARA GIT
git add .
git commit -m "Implementação de questionários dinâmicos e override de competência"
git push -u origin main


-- PULL PRODUÇÃO
# Entrar na pasta do projeto
cd /home/cidadaotocantins/htdocs/cidadaotocantins.online/cidadao-to

# Baixar do git
git pull origin main


# Rodar migrations
npm run migrate

# Build do backend (compila o TypeScript para dist/)
npm run build --prefix backend

# Build do frontend
npm run build --prefix frontend

# Copiar frontend atualizado para o root do domínio
cp -r frontend/dist/* /home/cidadaotocantins/htdocs/cidadaotocantins.online/

# Reiniciar o backend com o código novo compilado
pm2 restart cidadao-to-backend

