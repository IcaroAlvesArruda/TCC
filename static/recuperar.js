document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const password1 = document.getElementById('password1');
    const password2 = document.getElementById('password2');

    // Função para mostrar mensagens de erro
    function showError(message) {
        // Remove mensagens de erro anteriores
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        
        form.insertBefore(errorDiv, form.firstChild);
    }

    // Função para mostrar mensagens de sucesso
    function showSuccess(message) {
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            color: #155724;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 14px;
        `;
        successDiv.textContent = message;
        
        form.insertBefore(successDiv, form.firstChild);
    }

    // Função para validar a força da senha
    function validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'A senha deve ter pelo menos 8 caracteres.';
        }
        if (!hasUpperCase) {
            return 'A senha deve conter pelo menos uma letra maiúscula.';
        }
        if (!hasLowerCase) {
            return 'A senha deve conter pelo menos uma letra minúscula.';
        }
        if (!hasNumbers) {
            return 'A senha deve conter pelo menos um número.';
        }
        
        return null; // Senha válida
    }

    // Validação em tempo real da confirmação de senha
    password2.addEventListener('input', function() {
        if (password1.value && password2.value) {
            if (password1.value !== password2.value) {
                password2.style.borderColor = '#dc3545';
            } else {
                password2.style.borderColor = '#28a745';
            }
        }
    });

    // Manipulador do envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newPassword = password1.value.trim();
        const confirmPassword = password2.value.trim();

        // Validações
        if (!newPassword || !confirmPassword) {
            showError('Por favor, preencha todos os campos.');
            return;
        }

        // Validar força da senha
        const passwordError = validatePasswordStrength(newPassword);
        if (passwordError) {
            showError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('As senhas não coincidem.');
            return;
        }

        // Desabilitar o botão durante o envio
        const submitBtn = form.querySelector('.login-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processando...';

        try {
            // Obter o token da URL (normalmente passado como parâmetro)
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                throw new Error('Token de recuperação não encontrado.');
            }

            const response = await fetch('/api/recuperar-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    nova_senha: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Senha alterada com sucesso! Redirecionando para o login...');
                
                // Limpar o formulário
                form.reset();
                
                // Redirecionar após 2 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                throw new Error(data.error || 'Erro ao alterar a senha.');
            }

        } catch (error) {
            console.error('Erro:', error);
            showError(error.message || 'Erro interno do servidor. Tente novamente.');
        } finally {
            // Reabilitar o botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Adicionar indicador de força da senha
    function addPasswordStrengthIndicator() {
        const strengthIndicator = document.createElement('div');
        strengthIndicator.id = 'password-strength';
        strengthIndicator.style.cssText = `
            margin-top: 5px;
            font-size: 12px;
            height: 20px;
        `;
        password1.parentNode.appendChild(strengthIndicator);

        password1.addEventListener('input', function() {
            const password = password1.value;
            const indicator = document.getElementById('password-strength');
            
            if (!password) {
                indicator.textContent = '';
                return;
            }

            const error = validatePasswordStrength(password);
            if (error) {
                indicator.style.color = '#dc3545';
                indicator.textContent = error;
            } else {
                indicator.style.color = '#28a745';
                indicator.textContent = 'Senha forte ✓';
            }
        });
    }

    // Inicializar indicador de força da senha
    addPasswordStrengthIndicator();
});