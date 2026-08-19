(function () {
    'use strict';

    const CONFIG = {
        WHATSAPP_NUMERO: "5511999999999",
        LIMITE_ESTOQUE_BAIXO: 5,
        CUPONS_VALIDOS: {
            "DEV10": 0.10,
            "REFRI20": 0.20
        }
    };

    let carrinho = [];
    let ultimoElementoFocado = null;

    function escaparHTML(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function criarBolhas() {
        const container = document.createElement('div');
        container.className = 'bubbles-container';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 12 + 6 + 'px';

            bubble.style.width = size;
            bubble.style.height = size;
            bubble.style.left = Math.random() * 100 + 'vw';
            bubble.style.setProperty('--duration', Math.random() * 6 + 4 + 's');
            bubble.style.animationDelay = Math.random() * 5 + 's';

            container.appendChild(bubble);
        }
    }

    function prenderFocoModal(modal) {
        const elementosFocaveis = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (elementosFocaveis.length === 0) return;

        const primeiro = elementosFocaveis[0];
        const ultimo = elementosFocaveis[elementosFocaveis.length - 1];

        primeiro.focus();

        modal.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === primeiro) {
                    e.preventDefault();
                    ultimo.focus();
                } else if (!e.shiftKey && document.activeElement === ultimo) {
                    e.preventDefault();
                    primeiro.focus();
                }
            }
            if (e.key === 'Escape') {
                fecharModal(modal);
            }
        });
    }

    function abrirModal(modal) {
        if (!modal) return;
        ultimoElementoFocado = document.activeElement;
        modal.classList.add('active');
        prenderFocoModal(modal);
    }

    function fecharModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        if (ultimoElementoFocado) {
            ultimoElementoFocado.focus();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        criarBolhas();

        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                fecharModal(modal);
            });
        });
    });
})();
