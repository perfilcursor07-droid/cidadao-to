Credenciais do admin:
Email: admin@cidadao.to
Senha: admin123

-- BAIXAR DO PARA GIT
git pull origin main
php artisan migrate
php artisan db:seed


-- SUBIR PARA GIT
git add .
git commit -m "Implementação de questionários dinâmicos e override de competência"
git push -u origin main