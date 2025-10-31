document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const loginButton = document.querySelector('.btn[data-id="login"]');
    let selectedCardId = null;

    function updateButtonState() {
        if (selectedCardId) {
            loginButton.classList.remove('disabled');
            loginButton.disabled = false;
        } else {
            loginButton.classList.add('disabled');
            loginButton.disabled = true;
        }
    }

    updateButtonState();

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const currentCardId = card.dataset.id;

            cards.forEach(c => {
                c.classList.remove('selected');
                const checkmark = c.querySelector('.checkmark-container');
                if (checkmark) {
                    checkmark.remove();
                }
            });
            card.classList.add('selected');
            selectedCardId = currentCardId;

            const checkmarkContainer = document.createElement('div');
            checkmarkContainer.classList.add('checkmark-container');
            checkmarkContainer.innerHTML = '<span class="checkmark">✓</span>';
            card.appendChild(checkmarkContainer);
            updateButtonState();
            console.log(`Card ${selectedCardId} selecionado.`);
        });
    });

    loginButton.addEventListener('click', () => {
        if (selectedCardId) {
            if (selectedCardId === 'adm') {
                window.location.href = 'login';
            } else if (selectedCardId === 'usuario') {
                window.location.href = 'user';
            }
        } else {
            alert('Por favor, selecione uma opção antes de continuar.');
        }
    });
});