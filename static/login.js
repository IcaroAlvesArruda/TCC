document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validação básica
        if (!email || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        try {
            // Faz POST para a rota Flask do admin
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Login bem-sucedido - redireciona para dashboard
                window.location.href = data.redirect;
            } else {
                // Erro no login
                alert(data.message || 'Email ou senha incorretos. Tente novamente.');
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    });
});

// Efeitos visuais do link "Esqueci a senha"
document.addEventListener('DOMContentLoaded', () => {
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('mouseenter', function() {
            this.style.textDecoration = 'underline';
        });

        forgotPassword.addEventListener('mouseleave', function() {
            this.style.textDecoration = 'none';
        });
    }
});