const form = document.getElementById('form-esqueci-senha');
const botao = document.querySelector('.login-btn');
const emailInput = document.getElementById('email');
const mensagemDiv = document.getElementById('mensagem');

const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

if (form && botao && emailInput && mensagemDiv) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = emailInput.value.trim();

        mensagemDiv.textContent = '';
        mensagemDiv.className = 'mensagem-escondida';

        if (email === '') {
            exibirMensagem('Por favor, digite seu e-mail.', 'erro');
            emailInput.focus();
            return;
        }

        if (!validarEmail(email)) {
            exibirMensagem('Por favor, digite um e-mail válido.', 'erro');
            emailInput.focus();
            return;
        }

        botao.textContent = 'Enviando...';
        botao.disabled = true;

        fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
            
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na rede ou no servidor.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                exibirMensagem(data.message, 'sucesso');
                form.style.display = 'none';
            } else {
                exibirMensagem(data.message, 'erro');
            }
        })
        .catch((error) => {
            console.error('Erro:', error);
            exibirMensagem('Ocorreu um erro ao tentar enviar a solicitação. Tente novamente.', 'erro');
        })
        .finally(() => {
            botao.disabled = false;
            botao.textContent = 'Enviar Link';
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

function validarEmail(email) {
    return EMAIL_REGEX.test(email);
}