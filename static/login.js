document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        try {
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
                window.location.href = data.redirect;
            } else {
                alert(data.message || 'Email ou senha incorretos. Tente novamente.');
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    });
});

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