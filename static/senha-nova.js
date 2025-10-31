const form = document.getElementById('form-reset-senha');
const botao = document.querySelector('.login-btn');
const tokenInput = document.getElementById('token');
const novaSenhaInput = document.getElementById('nova_senha');
const confirmarSenhaInput = document.getElementById('confirmar_senha');
const mensagemDiv = document.getElementById('mensagem');

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
tokenInput.value = token;

if (form && botao) {
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const token = tokenInput.value;
        const novaSenha = novaSenhaInput.value.trim();
        const confirmarSenha = confirmarSenhaInput.value.trim();

        mensagemDiv.textContent = '';
        mensagemDiv.className = 'mensagem-escondida';

        if (!token) {
            exibirMensagem('Token inválido ou expirado.', 'erro');
            return;
        }

        if (novaSenha === '' || confirmarSenha === '') {
            exibirMensagem('Por favor, preencha todos os campos.', 'erro');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            exibirMensagem('As senhas não coincidem.', 'erro');
            return;
        }

        if (novaSenha.length < 4) {
            exibirMensagem('A senha deve ter pelo menos 4 caracteres.', 'erro');
            return;
        }

        botao.textContent = 'Redefinindo...';
        botao.disabled = true;

        fetch('/api/senha-nova', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                new_password: novaSenha
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na rede');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    exibirMensagem(data.message, 'sucesso');
                    form.style.display = 'none';

                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                } else {
                    exibirMensagem(data.message, 'erro');
                }
            })
            .catch((error) => {
                console.error('Erro:', error);
                exibirMensagem('Ocorreu um erro ao tentar redefinir a senha. Tente novamente.', 'erro');
            })
            .finally(() => {
                botao.disabled = false;
                botao.textContent = 'Redefinir Senha';
            });
    });
}

function exibirMensagem(texto, tipo) {
    mensagemDiv.textContent = texto;
    if (tipo === 'sucesso') {
        mensagemDiv.className = 'mensagem-visivel mensagem-sucesso';
    } else {
        mensagemDiv.className = 'mensagem-visivel mensagem-erro';
    }
}