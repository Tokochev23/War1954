// Funções utilitárias e de interface (modais, formatação, etc.)

// Modal de Mensagem e Confirmação (customizado para não usar alert/confirm)
export function showMessageBox(title, message) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = message;
    document.getElementById('modal-cancel-btn').classList.add('hidden');
    document.getElementById('message-modal').classList.remove('hidden');
    return new Promise(resolve => {
        document.getElementById('modal-ok-btn').onclick = () => {
            document.getElementById('message-modal').classList.add('hidden');
            resolve(true);
        };
    });
}

export function showConfirmBox(title, message) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = message;
    document.getElementById('modal-cancel-btn').classList.remove('hidden');
    document.getElementById('message-modal').classList.remove('hidden');
    return new Promise(resolve => {
        document.getElementById('modal-ok-btn').onclick = () => {
            document.getElementById('message-modal').classList.add('hidden');
            resolve(true);
        };
        document.getElementById('modal-cancel-btn').onclick = () => {
            document.getElementById('message-modal').classList.add('hidden');
            resolve(false);
        };
    });
}

// Formata um valor numérico para moeda USD
export function formatCurrency(valor) {
    const numero = parseFloat(String(valor).replace(/[$.]+/g, '').replace(',', '.'));
    if (isNaN(numero)) return '$0';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

// Formata a diferença entre dois valores como percentual
export function formatDelta(atual, anterior) {
    if (!anterior || anterior === 0) return '---';
    const diferenca = atual - anterior;
    const percentual = ((diferenca / anterior) * 100).toFixed(1);
    const sinal = diferenca >= 0 ? '+' : '';
    const cor = diferenca >= 0 ? 'text-emerald-400' : 'text-red-400';
    return `<span class="${cor}">${sinal}${percentual}%</span>`;
}

// Anima um contador para um valor final
export function animateCounter(elementId, finalValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const diff = finalValue - currentValue;
    const duration = 1000;
    const increment = diff / (duration / 50);

    let counter = currentValue;
    const timer = setInterval(() => {
        counter += increment;
        if ((increment > 0 && counter >= finalValue) || (increment < 0 && counter <= finalValue)) {
            counter = finalValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(counter);
    }, 50);
}

// Exibe uma notificação toast no canto superior direito
export function showNotification(type, message) {
    const colors = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border ${colors[type]} animate-slide-up`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
