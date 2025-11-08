document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!name || !email || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const userData = {
            // MUDANÇA AQUI: 'senha' para 'password'
            nome: name,
            email: email,
            password: password 
        };

        const apiUrl = '/api/cadastro';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            // **ADICIONEI TRATAMENTO DE RESPOSTA**
            if (response.ok) {
                alert(result.message);
                // Opcional: redirecionar para a página de login
                // window.location.href = '/login'; 
            } else {
                alert(`Erro no cadastro: ${result.message}`);
            }

        } catch (error) {
            console.error('Erro de conexão ou requisição:', error);
            alert('Não foi possível conectar ao servidor. Verifique se o Flask está rodando.');
        }
    });
});
