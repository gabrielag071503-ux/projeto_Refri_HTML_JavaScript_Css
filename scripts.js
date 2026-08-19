) {
    dots.forEach(dot => dot.classList.remove('active'))
    dots[active].classList.add('active')
}

function goToSlide(index) {
    let activeOld = document.querySelector('.item.active')
    activeOld.classList.remove('active')
    active = index
    list[active].classList.add('active')
    updateDots()
}

next.onclick = () => {
    let novo = active >= count - 1 ? 0 : active + 1
    goToSlide(novo)
}

prev.onclick = () => {
    let novo = active <= 0 ? count - 1 : active - 1
    goToSlide(novo)
}

// Navegação por teclado (setas ← →) — ignora quando o usuário está digitando em um campo
document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return

    let elementoFocado = document.activeElement
    let estaDigitando = elementoFocado && (
        elementoFocado.tagName === 'INPUT' ||
        elementoFocado.tagName === 'TEXTAREA' ||
        elementoFocado.isContentEditable
    )

    if (estaDigitando) return

    if (e.key === 'ArrowRight') next.click()
    if (e.key === 'ArrowLeft') prev.click()
})

// ===== Autoplay (troca sozinho, pausa no hover/toque) =====
let mainEl = document.querySelector('main')
const AUTOPLAY_INTERVAL = 5000 // 5 segundos
let autoplayTimer = null

function iniciarAutoplay() {
    pararAutoplay() // evita criar mais de um timer ao mesmo tempo
    autoplayTimer = setInterval(() => {
        next.click()
    }, AUTOPLAY_INTERVAL)
}

function pararAutoplay() {
    if (autoplayTimer) {
        clearInterval(autoplayTimer)
        autoplayTimer = null
    }
}

// Pausa quando o mouse está em cima (desktop)
mainEl.addEventListener('mouseenter', pararAutoplay)
mainEl.addEventListener('mouseleave', iniciarAutoplay)

// Reinicia a contagem sempre que o usuário navega manualmente
next.addEventListener('click', iniciarAutoplay)
prev.addEventListener('click', iniciarAutoplay)
dotsContainer.addEventListener('click', iniciarAutoplay)

iniciarAutoplay()

// ===== Swipe (arrastar com o dedo) no mobile =====
let touchStartX = 0
let touchEndX = 0
const SWIPE_MIN_DISTANCE = 50 // px mínimos para considerar um swipe

mainEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX
    pararAutoplay()
}, { passive: true })

mainEl.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX
    processarSwipe()
    iniciarAutoplay()
}, { passive: true })

function processarSwipe() {
    let distancia = touchEndX - touchStartX

    if (Math.abs(distancia) < SWIPE_MIN_DISTANCE) return // toque pequeno demais, ignora

    if (distancia < 0) {
        next.click() // arrastou pra esquerda -> próximo
    } else {
        prev.click() // arrastou pra direita -> anterior
    }
}

if (menuToggle) {
    menuToggle.onclick = () => {
        nav.classList.toggle('nav-open')
    }
}

// ===================== CARRINHO =====================
let cartToggle = document.getElementById('cartToggle')
let cartClose = document.getElementById('cartClose')
let cartOverlay = document.getElementById('cartOverlay')
let cartDrawer = document.getElementById('cartDrawer')
let cartItemsEl = document.getElementById('cartItems')
let cartEmptyEl = document.getElementById('cartEmpty')
let cartCountEl = document.getElementById('cartCount')
let cartSubtotalEl = document.getElementById('cartSubtotal')
let btnCheckout = document.getElementById('btnCheckout')

// Carrega o carrinho salvo no localStorage (ou começa vazio)
let cart = JSON.parse(localStorage.getItem('devclub-cart')) || []

// ===================== TOAST (NOTIFICAÇÕES) =====================
let toastContainer = document.getElementById('toastContainer')
const TOAST_DURACAO = 3000 // 3 segundos

function mostrarToast(mensagem, icone = '✅') {
    let toast = document.createElement('div')
    toast.classList.add('toast')

    toast.innerHTML = `
        <span class="toast-icon">${icone}</span>
        <span class="toast-texto">${mensagem}</span>
        <button class="toast-fechar" aria-label="Fechar notificação">✕</button>
    `

    function removerToast() {
        toast.classList.add('toast-saindo')
        toast.addEventListener('animationend', () => toast.remove(), { once: true })
    }

    toast.querySelector('.toast-fechar').onclick = removerToast

    toastContainer.appendChild(toast)

    setTimeout(removerToast, TOAST_DURACAO)
}

function salvarCarrinho() {
    localStorage.setItem('devclub-cart', JSON.stringify(cart))
}

function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ===================== ESTOQUE (FAKE) =====================
const LIMITE_ESTOQUE_BAIXO = 5

// Lê o estoque base de cada sabor a partir do data-estoque dos cards da grid
let estoqueBase = {}
document.querySelectorAll('.sabor-card[data-estoque]').forEach(card => {
    estoqueBase[card.dataset.id] = parseInt(card.dataset.estoque, 10)
})

function qtdNoCarrinhoPorId(id) {
    return cart
        .filter(item => item.id === id)
        .reduce((soma, item) => soma + item.qtd, 0)
}

// Estoque "restante" = estoque base menos o que já está no carrinho
function estoqueDisponivel(id) {
    let base = estoqueBase[id]
    if (base === undefined) return Infinity // sabor sem controle de estoque configurado

    let disponivel = base - qtdNoCarrinhoPorId(id)
    return disponivel < 0 ? 0 : disponivel
}

// Atualiza badges e desabilita botões de "Adicionar" nos cards da grid e do carrossel
function atualizarBadgesEstoque() {
    document.querySelectorAll('[data-id]').forEach(elemento => {
        let id = elemento.dataset.id
        if (!id || estoqueBase[id] === undefined) return

        let disponivel = estoqueDisponivel(id)
        let badge = elemento.querySelector('.badge-estoque')
        let botaoAdd = elemento.querySelector('.btn-add-grid, .btn-add')

        if (disponivel <= 0) {
            if (badge) {
                badge.textContent = 'Esgotado'
                badge.classList.remove('badge-baixo')
                badge.classList.add('badge-esgotado')
            }
            if (botaoAdd) {
                botaoAdd.disabled = true
            }
        } else {
            if (botaoAdd) {
                botaoAdd.disabled = false
            }
            if (badge) {
                if (disponivel <= LIMITE_ESTOQUE_BAIXO) {
                    badge.textContent = `Só ${disponivel} unidade${disponivel > 1 ? 's' : ''}!`
                    badge.classList.remove('badge-esgotado')
                    badge.classList.add('badge-baixo')
                } else {
                    badge.textContent = ''
                    badge.classList.remove('badge-baixo', 'badge-esgotado')
                }
            }
        }
    })
}

function abrirCarrinho() {
    cartDrawer.classList.add('open')
    cartOverlay.classList.add('open')
}

function fecharCarrinho() {
    cartDrawer.classList.remove('open')
    cartOverlay.classList.remove('open')
}

// id único do item no carrinho considera o tamanho (350ml e 500ml são "produtos" diferentes)
function gerarChaveCarrinho(id, tamanho) {
    return id + '-' + tamanho
}

function adicionarAoCarrinho(id, nome, preco, tamanho, qtdASomar) {
    let chave = gerarChaveCarrinho(id, tamanho)
    let itemExistente = cart.find(item => item.chave === chave)

    if (itemExistente) {
        itemExistente.qtd += qtdASomar
    } else {
        cart.push({ chave, id, nome, preco, tamanho, qtd: qtdASomar })
    }

    salvarCarrinho()
    renderizarCarrinho()
    abrirCarrinho()

    mostrarToast(`<strong>${nome}</strong> ${tamanho} adicionado ao carrinho!`)
}

function alterarQuantidade(chave, delta) {
    let item = cart.find(item => item.chave === chave)
    if (!item) return

    item.qtd += delta

    if (item.qtd <= 0) {
        cart = cart.filter(i => i.chave !== chave)
    }

    salvarCarrinho()
    renderizarCarrinho()
}

function removerItem(chave) {
    cart = cart.filter(item => item.chave !== chave)
    salvarCarrinho()
    renderizarCarrinho()
}

// ===================== CUPOM DE DESCONTO =====================
const CUPONS_VALIDOS = {
    'DEVCLUB10': 0.10,
    'BEMVINDO15': 0.15
}

let cupomAplicado = JSON.parse(localStorage.getItem('devclub-cupom')) || null

function salvarCupom() {
    if (cupomAplicado) {
        localStorage.setItem('devclub-cupom', JSON.stringify(cupomAplicado))
    } else {
        localStorage.removeItem('devclub-cupom')
    }
}

function removerCupom() {
    cupomAplicado = null
    salvarCupom()
    renderizarCarrinho()
    mostrarToast('Cupom removido.', 'ℹ️')
}

// ===================== COMBO / KIT PROMOCIONAL =====================
const COMBO_QTD_MINIMA = 6 // a cada 6 latas do mesmo sabor, 1 sai de graça

function calcularDescontoCombo() {
    let idsNoCarrinho = [...new Set(cart.map(item => item.id))]
    let desconto = 0

    idsNoCarrinho.forEach(id => {
        let itensDoId = cart.filter(item => item.id === id)
        let qtdTotal = itensDoId.reduce((soma, item) => soma + item.qtd, 0)
        let unidadesGratis = Math.floor(qtdTotal / COMBO_QTD_MINIMA)

        if (unidadesGratis > 0) {
            let menorPreco = Math.min(...itensDoId.map(item => item.preco))
            desconto += unidadesGratis * menorPreco
        }
    })

    return desconto
}

// Calcula subtotal, descontos e total final do carrinho — usado no drawer, no checkout e na mensagem do WhatsApp
function calcularTotaisCarrinho() {
    let subtotal = cart.reduce((soma, item) => soma + item.qtd * item.preco, 0)
    let descontoCombo = calcularDescontoCombo()
    let subtotalComCombo = subtotal - descontoCombo
    let descontoCupom = cupomAplicado ? subtotalComCombo * cupomAplicado.percentual : 0
    let total = subtotalComCombo - descontoCupom

    if (total < 0) total = 0

    return { subtotal, descontoCombo, descontoCupom, total }
}

function renderizarCarrinho() {
    cartItemsEl.innerHTML = ''

    if (cart.length === 0) {
        cartItemsEl.appendChild(cartEmptyEl)
    } else {
        cart.forEach(item => {
            let div = document.createElement('div')
            div.classList.add('cart-item')

            div.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.nome} — ${item.tamanho}</h4>
                    <span>${formatarPreco(item.preco)}</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-menos" aria-label="Diminuir quantidade"></button>
                    <span>${item.qtd}</span>
                    <button class="qty-mais" aria-label="Aumentar quantidade"></button>
                </div>
                <button class="cart-item-remove">Remover</button>
            `

            div.querySelector('.qty-menos').textContent = '−'
            div.querySelector('.qty-mais').textContent = '+'
            div.querySelector('.qty-menos').onclick = () => alterarQuantidade(item.chave, -1)
            div.querySelector('.qty-mais').onclick = () => alterarQuantidade(item.chave, 1)
            div.querySelector('.cart-item-remove').onclick = () => removerItem(item.chave)

            cartItemsEl.appendChild(div)
        })
    }

    let totalItens = cart.reduce((soma, item) => soma + item.qtd, 0)
    cartCountEl.textContent = totalItens

    let totais = calcularTotaisCarrinho()
    cartSubtotalEl.textContent = formatarPreco(totais.subtotal)

    // ===== Combo Leve 6 Pague 5 =====
    let linhaComboDesconto = document.getElementById('linhaComboDesconto')
    let cartComboDescontoEl = document.getElementById('cartComboDesconto')
    let cartComboMsgEl = document.getElementById('cartComboMsg')

    if (totais.descontoCombo > 0) {
        linhaComboDesconto.style.display = 'flex'
        cartComboDescontoEl.textContent = '- ' + formatarPreco(totais.descontoCombo)
        cartComboMsgEl.style.display = 'block'
        cartComboMsgEl.textContent = '🎁 Combo aplicado: a cada 6 latas do mesmo sabor, 1 sai de graça!'
    } else {
        linhaComboDesconto.style.display = 'none'
        cartComboMsgEl.style.display = 'none'
    }

    // ===== Cupom de desconto =====
    let linhaCupomDesconto = document.getElementById('linhaCupomDesconto')
    let cartCupomDescontoEl = document.getElementById('cartCupomDesconto')
    let cartCupomCodigoEl = document.getElementById('cartCupomCodigo')
    let cupomMsgEl = document.getElementById('cupomMsg')

    if (cupomAplicado) {
        linhaCupomDesconto.style.display = 'flex'
        cartCupomCodigoEl.textContent = `(${cupomAplicado.codigo})`
        cartCupomDescontoEl.textContent = '- ' + formatarPreco(totais.descontoCupom)

        cupomMsgEl.className = 'cupom-msg cupom-sucesso'
        cupomMsgEl.innerHTML = `Cupom <strong>${cupomAplicado.codigo}</strong> aplicado (-${cupomAplicado.percentual * 100}%) <button class="btn-remover-cupom" id="btnRemoverCupom">remover</button>`

        let btnRemoverCupom = document.getElementById('btnRemoverCupom')
        if (btnRemoverCupom) btnRemoverCupom.onclick = removerCupom
    } else {
        linhaCupomDesconto.style.display = 'none'
    }

    document.getElementById('cartTotal').textContent = formatarPreco(totais.total)

    let META_FRETE_GRATIS = 30.00;
    let faltante = META_FRETE_GRATIS - totais.total;
    let freteTexto = document.getElementById('cartFreteMsg');
    
    if (freteTexto) { // Verifica se a div existe para evitar erros
        if (totais.total === 0) {
            freteTexto.textContent = "Adicione itens para calcular o frete.";
            freteTexto.style.color = "#666"; // Cinza
        } else if (faltante > 0) {
            freteTexto.textContent = `Faltam R$ ${faltante.toFixed(2).replace('.', ',')} para FRETE GRÁTIS!`;
            freteTexto.style.color = "#EA3D41"; // Vermelho da sua marca
        } else {
            freteTexto.textContent = "🎉 Você ganhou FRETE GRÁTIS!";
            freteTexto.style.color = "#2D5643"; // Verde do sabor Abacate
        }
    }

    atualizarBadgesEstoque()
}

// Botão "Adicionar ao carrinho" direto no carrossel (sem abrir o modal, tamanho padrão 350ml)
document.querySelectorAll('.item .btn-add').forEach(botao => {
    botao.onclick = () => {
        let itemDiv = botao.closest('.item')
        let id = itemDiv.dataset.id
        let nome = itemDiv.dataset.nome
        let preco = parseFloat(itemDiv.dataset.preco)

        adicionarAoCarrinho(id, nome, preco, '350ml', 1)
    }
})

cartToggle.onclick = abrirCarrinho
cartClose.onclick = fecharCarrinho
cartOverlay.onclick = fecharCarrinho

// ===== Aplicar cupom =====
let cupomInput = document.getElementById('cupomInput')
let cupomBtn = document.getElementById('cupomBtn')

if (cupomBtn) {
    cupomBtn.onclick = () => {
        let codigo = cupomInput.value.trim().toUpperCase()
        let cupomMsgEl = document.getElementById('cupomMsg')

        if (!codigo) return

        if (CUPONS_VALIDOS[codigo]) {
            cupomAplicado = { codigo, percentual: CUPONS_VALIDOS[codigo] }
            salvarCupom()
            cupomInput.value = ''
            renderizarCarrinho()
            mostrarToast(`Cupom ${codigo} aplicado! 🎉`, '🏷️')
        } else {
            cupomMsgEl.className = 'cupom-msg cupom-erro'
            cupomMsgEl.textContent = 'Cupom inválido ou expirado.'
        }
    }
}

// ===================== CHECKOUT =====================
let checkoutOverlay = document.getElementById('checkoutOverlay')
let checkoutModal = document.getElementById('checkoutModal')
let checkoutClose = document.getElementById('checkoutClose')
let checkoutForm = document.getElementById('checkoutForm')
let checkoutResumo = document.getElementById('checkoutResumo')
let checkoutErro = document.getElementById('checkoutErro')

function abrirCheckout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!')
        return
    }

    renderizarResumoCheckout()
    fecharCarrinho()
    checkoutOverlay.classList.add('open')
    checkoutModal.classList.add('open')
}

function fecharCheckout() {
    checkoutOverlay.classList.remove('open')
    checkoutModal.classList.remove('open')
}

function renderizarResumoCheckout() {
    checkoutResumo.innerHTML = ''

    cart.forEach(item => {
        let linha = document.createElement('div')
        linha.classList.add('checkout-resumo-item')
        linha.innerHTML = `
            <span>${item.qtd}x ${item.nome} (${item.tamanho})</span>
            <span>${formatarPreco(item.qtd * item.preco)}</span>
        `
        checkoutResumo.appendChild(linha)
    })

    let totais = calcularTotaisCarrinho()

    if (totais.descontoCombo > 0) {
        let linhaCombo = document.createElement('div')
        linhaCombo.classList.add('checkout-resumo-item')
        linhaCombo.innerHTML = `<span>Combo Leve 6 Pague 5</span><span>- ${formatarPreco(totais.descontoCombo)}</span>`
        checkoutResumo.appendChild(linhaCombo)
    }

    if (cupomAplicado) {
        let linhaCupom = document.createElement('div')
        linhaCupom.classList.add('checkout-resumo-item')
        linhaCupom.innerHTML = `<span>Cupom (${cupomAplicado.codigo})</span><span>- ${formatarPreco(totais.descontoCupom)}</span>`
        checkoutResumo.appendChild(linhaCupom)
    }

    let totalLinha = document.createElement('div')
    totalLinha.classList.add('checkout-resumo-total')
    totalLinha.innerHTML = `<span>Total</span><span>${formatarPreco(totais.total)}</span>`
    checkoutResumo.appendChild(totalLinha)
}

btnCheckout.onclick = abrirCheckout

checkoutClose.onclick = fecharCheckout
checkoutOverlay.onclick = fecharCheckout

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault()
    checkoutErro.textContent = ''

    let totais = calcularTotaisCarrinho()

    let dadosPedido = {
        cliente: {
            nome: document.getElementById('ckNome').value.trim(),
            email: document.getElementById('ckEmail').value.trim(),
            telefone: document.getElementById('ckTelefone').value.trim(),
        },
        endereco: {
            cep: document.getElementById('ckCep').value.trim(),
            numero: document.getElementById('ckNumero').value.trim(),
            rua: document.getElementById('ckEndereco').value.trim(),
            bairro: document.getElementById('ckBairro').value.trim(),
            cidade: document.getElementById('ckCidade').value.trim(),
        },
        itens: cart,
        subtotal: totais.subtotal,
        descontoCombo: totais.descontoCombo,
        descontoCupom: totais.descontoCupom,
        cupomCodigo: cupomAplicado ? cupomAplicado.codigo : null,
        total: totais.total
    }

    iniciarPagamento(dadosPedido)
})

// ===== ENVIO DO PEDIDO VIA WHATSAPP =====
// Troque pelo número real da loja, com DDI 55 + DDD + número, sem espaços/símbolos.
// Exemplo: (71) 90000-0000 vira "5571900000000"
const NUMERO_WHATSAPP_LOJA = "5571900000000"

// ===================== BOTÃO FLUTUANTE DO WHATSAPP =====================
let whatsappFlutuante = document.getElementById('whatsappFlutuante')

if (whatsappFlutuante) {
    let mensagemContato = 'Olá! Vim pelo site da Dev Club Refri e queria saber mais sobre os sabores 🥤'
    whatsappFlutuante.href = `https://wa.me/${NUMERO_WHATSAPP_LOJA}?text=${encodeURIComponent(mensagemContato)}`
}

function montarMensagemPedido(dadosPedido) {
    let linhas = []

    linhas.push('🥤 *Novo pedido — Dev Club Refri*')
    linhas.push('')
    linhas.push('*Itens:*')

    dadosPedido.itens.forEach(item => {
        linhas.push(
            `• ${item.qtd}x ${item.nome} (${item.tamanho}) — ${formatarPreco(item.qtd * item.preco)}`
        )
    })

    linhas.push('')
    linhas.push(`Subtotal: ${formatarPreco(dadosPedido.subtotal)}`)

    if (dadosPedido.descontoCombo > 0) {
        linhas.push(`Combo Leve 6 Pague 5: - ${formatarPreco(dadosPedido.descontoCombo)}`)
    }

    if (dadosPedido.descontoCupom > 0) {
        linhas.push(`Cupom (${dadosPedido.cupomCodigo}): - ${formatarPreco(dadosPedido.descontoCupom)}`)
    }

    linhas.push(`*Total: ${formatarPreco(dadosPedido.total)}*`)
    linhas.push('')
    linhas.push('*Dados do cliente:*')
    linhas.push(`Nome: ${dadosPedido.cliente.nome}`)
    linhas.push(`E-mail: ${dadosPedido.cliente.email}`)
    linhas.push(`Telefone: ${dadosPedido.cliente.telefone}`)
    linhas.push('')
    linhas.push('*Endereço de entrega:*')
    linhas.push(
        `${dadosPedido.endereco.rua}, ${dadosPedido.endereco.numero} — ${dadosPedido.endereco.bairro}, ${dadosPedido.endereco.cidade}`
    )
    linhas.push(`CEP: ${dadosPedido.endereco.cep}`)

    return linhas.join('\n')
}

function iniciarPagamento(dadosPedido) {
    let mensagem = montarMensagemPedido(dadosPedido)
    let urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP_LOJA}?text=${encodeURIComponent(mensagem)}`

    // Abre o WhatsApp (app no celular ou WhatsApp Web no computador) já com a mensagem pronta
    window.open(urlWhatsApp, '_blank')

    salvarPedidoNoHistorico(dadosPedido)

    cart = []
    cupomAplicado = null
    salvarCupom()
    salvarCarrinho()
    renderizarCarrinho()
    fecharCheckout()
    checkoutForm.reset()
}

// ===== PRÓXIMA ETAPA (FUTURO) =====
// Quando quiser aceitar pagamento online de verdade (cartão/Pix automático),
// troque o conteúdo de iniciarPagamento() por uma chamada a uma função
// serverless (Netlify/Vercel) que gera a cobrança no Mercado Pago/Stripe
// e redirecione o cliente pro link de pagamento retornado.

// ===================== MODAL DE PRODUTO =====================
let productOverlay = document.getElementById('productOverlay')
let productModal = document.getElementById('productModal')
let productClose = document.getElementById('productClose')
let productModalImg = document.getElementById('productModalImg')
let productModalImage = document.getElementById('productModalImage')
let productModalTitle = document.getElementById('productModalTitle')
let productModalDesc = document.getElementById('productModalDesc')
let productModalIngredientes = document.getElementById('productModalIngredientes')
let productModalPrice = document.getElementById('productModalPrice')
let productModalAdd = document.getElementById('productModalAdd')
let sizeOptions = document.getElementById('sizeOptions')
let qtyMenos = document.getElementById('qtyMenos')
let qtyMais = document.getElementById('qtyMais')
let qtyValor = document.getElementById('qtyValor')
let modalEstoqueAviso = document.getElementById('modalEstoqueAviso')

let produtoAtual = null // guarda os dados do item aberto no modal
let tamanhoAtual = { nome: '350ml', extra: 0 }
let qtdAtual = 1

function abrirModalProduto(itemDiv) {
    produtoAtual = {
        id: itemDiv.dataset.id,
        nome: itemDiv.dataset.nome,
        preco: parseFloat(itemDiv.dataset.preco),
        imagem: itemDiv.dataset.imagem,
        descricao: itemDiv.dataset.descricao,
        ingredientes: itemDiv.dataset.ingredientes,
        background: itemDiv.style.getPropertyValue('--background')
    }

    // reseta seleção de tamanho e quantidade toda vez que abre
    tamanhoAtual = { nome: '350ml', extra: 0 }
    qtdAtual = 1
    qtyValor.textContent = qtdAtual

    sizeOptions.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === '350ml')
    })

    productModalImg.style.setProperty('--background', produtoAtual.background)
    productModalImage.src = produtoAtual.imagem
    productModalImage.alt = 'Lata de refrigerante sabor ' + produtoAtual.nome
    productModalTitle.textContent = produtoAtual.nome
    productModalDesc.textContent = produtoAtual.descricao
    productModalIngredientes.textContent = produtoAtual.ingredientes

    // Reseta o zoom sempre que abre um produto novo
    productModalImage.classList.remove('zoom-ativo')
    if (zoomHint) zoomHint.style.opacity = ''

    atualizarPrecoModal()
    atualizarAvisoEstoqueModal()

    productOverlay.classList.add('open')
    productModal.classList.add('open')
}

// Clique/toque na imagem alterna o zoom (essencial no mobile, onde não existe hover)
let zoomHint = document.getElementById('zoomHint')

if (productModalImage) {
    productModalImage.addEventListener('click', () => {
        let ativo = productModalImage.classList.toggle('zoom-ativo')
        if (zoomHint) zoomHint.style.opacity = ativo ? '0' : ''
    })
}

function atualizarAvisoEstoqueModal() {
    let disponivel = estoqueDisponivel(produtoAtual.id)

    if (disponivel <= 0) {
        modalEstoqueAviso.textContent = 'Produto esgotado no momento 😢'
        modalEstoqueAviso.classList.add('aviso-esgotado')
        modalEstoqueAviso.style.display = 'block'
        productModalAdd.disabled = true
        qtyMais.disabled = true
    } else if (disponivel <= LIMITE_ESTOQUE_BAIXO) {
        modalEstoqueAviso.textContent = `Últimas unidades! Restam apenas ${disponivel}.`
        modalEstoqueAviso.classList.remove('aviso-esgotado')
        modalEstoqueAviso.style.display = 'block'
        productModalAdd.disabled = false
        qtyMais.disabled = false
    } else {
        modalEstoqueAviso.style.display = 'none'
        productModalAdd.disabled = false
        qtyMais.disabled = false
    }
}

function fecharModalProduto() {
    productOverlay.classList.remove('open')
    productModal.classList.remove('open')
}

function atualizarPrecoModal() {
    let precoFinal = (produtoAtual.preco + tamanhoAtual.extra) * qtdAtual
    productModalPrice.textContent = formatarPreco(precoFinal)
}

sizeOptions.querySelectorAll('.size-btn').forEach(botao => {
    botao.onclick = () => {
        sizeOptions.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'))
        botao.classList.add('active')

        tamanhoAtual = {
            nome: botao.dataset.size,
            extra: parseFloat(botao.dataset.extra)
        }

        atualizarPrecoModal()
    }
})

qtyMenos.onclick = () => {
    if (qtdAtual > 1) {
        qtdAtual -= 1
        qtyValor.textContent = qtdAtual
        atualizarPrecoModal()
    }
}

qtyMais.onclick = () => {
    let disponivel = estoqueDisponivel(produtoAtual.id)

    if (qtdAtual >= disponivel) {
        mostrarToast(`Só temos ${disponivel} unidade${disponivel > 1 ? 's' : ''} de ${produtoAtual.nome} em estoque.`, '⚠️')
        return
    }

    qtdAtual += 1
    qtyValor.textContent = qtdAtual
    atualizarPrecoModal()
}

productModalAdd.onclick = () => {
    let disponivel = estoqueDisponivel(produtoAtual.id)
    if (qtdAtual > disponivel) {
        mostrarToast(`Só temos ${disponivel} unidade${disponivel > 1 ? 's' : ''} em estoque.`, '⚠️')
        return
    }

    let precoComTamanho = produtoAtual.preco + tamanhoAtual.extra
    adicionarAoCarrinho(produtoAtual.id, produtoAtual.nome, precoComTamanho, tamanhoAtual.nome, qtdAtual)
    fecharModalProduto()
}

document.querySelectorAll('.btn-details').forEach(botao => {
    botao.onclick = () => {
        let itemDiv = botao.closest('.item')
        botao.classList.add('carregando')
        botao.disabled = true

        setTimeout(() => {
            botao.classList.remove('carregando')
            botao.disabled = false
            abrirModalProduto(itemDiv)
        }, 500)
    }
})

productClose.onclick = fecharModalProduto
productOverlay.onclick = fecharModalProduto

// Renderiza o carrinho assim que a página carrega
renderizarCarrinho()

let ckCep = document.getElementById('ckCep')

if (ckCep) {
    ckCep.addEventListener('blur', async () => {
        let cep = ckCep.value.replace(/\D/g, '')
        if (cep.length === 8) {
            try {
                let response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                let data = await response.json()

                if (!data.erro) {
                    document.getElementById('ckEndereco').value = data.logradouro
                    document.getElementById('ckBairro').value = data.bairro
                    document.getElementById('ckCidade').value = data.localidade
                    document.getElementById('ckNumero').focus() // Pula pro número!
                }
            } catch (err) {
                console.error('Erro ao buscar CEP:', err)
            }
        }
    })
}

// ===================== SEÇÃO DE SABORES (GRID) =====================

// Botão Adicionar direto da Grid
document.querySelectorAll('.btn-add-grid').forEach(botao => {
    botao.onclick = () => {
        let cardDiv = botao.closest('.sabor-card')
        let id = cardDiv.dataset.id
        let nome = cardDiv.dataset.nome
        let preco = parseFloat(cardDiv.dataset.preco)

        // Adiciona 1 lata de 350ml por padrão
        adicionarAoCarrinho(id, nome, preco, '350ml', 1)
    }
})

// Botão Ver Detalhes da Grid (Reaproveita a função do modal)
document.querySelectorAll('.btn-details-grid').forEach(botao => {
    botao.onclick = () => {
        let cardDiv = botao.closest('.sabor-card')
        botao.classList.add('carregando')
        botao.disabled = true

        setTimeout(() => {
            botao.classList.remove('carregando')
            botao.disabled = false
            abrirModalProduto(cardDiv)
        }, 500)
    }
})

// ===== Busca / filtro de sabores =====
let buscaInput = document.getElementById('buscaSabor')
let saborCards = document.querySelectorAll('.sabor-card')
let semResultadoEl = document.getElementById('semResultado')

if (buscaInput) {
    buscaInput.addEventListener('input', () => {
        let termo = buscaInput.value.toLowerCase().trim()
        let algumVisivel = false

        saborCards.forEach(card => {
            let nome = card.dataset.nome.toLowerCase()
            let combina = nome.includes(termo)
            card.style.display = combina ? '' : 'none'
            if (combina) algumVisivel = true
        })

        semResultadoEl.style.display = algumVisivel ? 'none' : 'block'
    })
}

// ===== Avaliação por sabor (estrelas) =====
// Valores iniciais "fake" — simulam avaliações que a loja já teria recebido
let avaliacoesSeed = {
    morango: { soma: 45, qtd: 10 },  // média 4.5
    abacate: { soma: 34, qtd: 9 },   // média 3.8
    laranja: { soma: 47, qtd: 10 }   // média 4.7
}

// Mescla com o que já estiver salvo no navegador, sem perder o seed de sabores novos
// que ainda não tenham avaliação salva (ex: se você adicionar mais sabores depois)
let avaliacoesSalvas = JSON.parse(localStorage.getItem('devclub-avaliacoes')) || {}
let avaliacoes = { ...avaliacoesSeed, ...avaliacoesSalvas }
let minhasAvaliacoes = JSON.parse(localStorage.getItem('devclub-minha-avaliacao')) || {}

function salvarAvaliacoes() {
    localStorage.setItem('devclub-avaliacoes', JSON.stringify(avaliacoes))
    localStorage.setItem('devclub-minha-avaliacao', JSON.stringify(minhasAvaliacoes))
}

function mediaAvaliacao(id) {
    let dados = avaliacoes[id]
    if (!dados || dados.qtd === 0) return 0
    return dados.soma / dados.qtd
}

function renderizarEstrelasMedia(media) {
    let cheias = Math.round(media)
    return '★'.repeat(cheias) + '☆'.repeat(5 - cheias)
}

function criarBlocoAvaliacao(id) {
    let bloco = document.createElement('div')
    bloco.classList.add('sabor-avaliacao')

    let media = mediaAvaliacao(id)
    let qtd = avaliacoes[id] ? avaliacoes[id].qtd : 0
    let votoAtual = minhasAvaliacoes[id] || 0

    let estrelasInput = [1, 2, 3, 4, 5].map(n =>
        `<span class="rating-estrela ${n <= votoAtual ? 'votada' : ''}" data-valor="${n}">★</span>`
    ).join('')

    bloco.innerHTML = `
        <div class="rating-media">
            <span class="rating-estrelas-media">${renderizarEstrelasMedia(media)}</span>
            <span class="rating-numero">${media.toFixed(1)} (${qtd})</span>
        </div>
        <div class="rating-input">${estrelasInput}</div>
    `

    bloco.querySelectorAll('.rating-estrela').forEach(estrela => {
        estrela.onclick = () => avaliarSabor(id, parseInt(estrela.dataset.valor, 10))
    })

    return bloco
}

function avaliarSabor(id, valor) {
    if (!avaliacoes[id]) avaliacoes[id] = { soma: 0, qtd: 0 }

    let votoAnterior = minhasAvaliacoes[id]

    if (votoAnterior) {
        // já tinha avaliado esse sabor: só ajusta a diferença, sem contar 2x
        avaliacoes[id].soma += (valor - votoAnterior)
    } else {
        avaliacoes[id].soma += valor
        avaliacoes[id].qtd += 1
    }

    minhasAvaliacoes[id] = valor
    salvarAvaliacoes()
    atualizarBlocoAvaliacao(id)
    mostrarToast(`Você avaliou com ${valor} estrela${valor > 1 ? 's' : ''}. Valeu! 🙌`, '⭐')
}

function atualizarBlocoAvaliacao(id) {
    document.querySelectorAll(`.sabor-card[data-id="${id}"] .sabor-avaliacao`).forEach(blocoAntigo => {
        blocoAntigo.replaceWith(criarBlocoAvaliacao(id))
    })
}

// Insere o bloco de avaliação em cada card, entre o preço e os botões de ação
saborCards.forEach(card => {
    let id = card.dataset.id
    let acoes = card.querySelector('.sabor-actions')
    acoes.insertAdjacentElement('beforebegin', criarBlocoAvaliacao(id))
})

// ===================== REVEAL (INTERSECTION OBSERVER) =====================
let revealEls = document.querySelectorAll('.reveal')

// Aplica um pequeno atraso escalonado pros elementos que ficam lado a lado
// (cards de sabor, review, faq, sobre), pra não animar tudo junto de uma vez.
// Agrupa por elemento pai, assim cards do mesmo grid escalonam entre si.
let indicePorPai = new Map()

revealEls.forEach(el => {
    let pai = el.parentElement
    let indice = indicePorPai.get(pai) || 0
    el.style.transitionDelay = (indice * 0.1) + 's'
    indicePorPai.set(pai, indice + 1)
})

let revealObserver = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('reveal-ativo')
            revealObserver.unobserve(entrada.target) // anima só uma vez
        }
    })
}, {
    threshold: 0.15,       // dispara quando 15% do elemento aparece na tela
    rootMargin: '0px 0px -50px 0px' // antecipa um pouco antes de chegar no fim da viewport
})

revealEls.forEach(el => revealObserver.observe(el))

// ===================== FAQ (ACCORDION) =====================
let accordions = document.querySelectorAll('.accordion-header')

accordions.forEach(accordion => {
    accordion.onclick = function() {
        // Remove a classe active de todos para abrir só um por vez (opcional)
        accordions.forEach(acc => {
            if (acc !== this) {
                acc.classList.remove('active')
                acc.nextElementSibling.style.maxHeight = null
            }
        })

        // Alterna o estado do accordion clicado
        this.classList.toggle('active')
        let panel = this.nextElementSibling
        
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px"
        }
    }
})

// ===================== DARK MODE =====================
let darkModeToggle = document.getElementById('darkModeToggle')

function aplicarPreferenciaDarkMode() {
    let salvo = localStorage.getItem('devclub-dark-mode')
    if (salvo === 'on') {
        document.body.classList.add('dark-mode')
        darkModeToggle.textContent = '☀️'
    }
}

if (darkModeToggle) {
    darkModeToggle.onclick = () => {
        let ativo = document.body.classList.toggle('dark-mode')
        darkModeToggle.textContent = ativo ? '☀️' : '🌙'
        localStorage.setItem('devclub-dark-mode', ativo ? 'on' : 'off')
    }

    aplicarPreferenciaDarkMode()
}

// ===================== FAVORITOS =====================
let favoritos = JSON.parse(localStorage.getItem('devclub-favoritos')) || []

let favToggle = document.getElementById('favToggle')
let favCountEl = document.getElementById('favCount')
let favoritosOverlay = document.getElementById('favoritosOverlay')
let favoritosDrawer = document.getElementById('favoritosDrawer')
let favoritosClose = document.getElementById('favoritosClose')
let favoritosItemsEl = document.getElementById('favoritosItems')
let favoritosEmptyEl = document.getElementById('favoritosEmpty')

function salvarFavoritos() {
    localStorage.setItem('devclub-favoritos', JSON.stringify(favoritos))
}

function atualizarBotoesFavorito() {
    document.querySelectorAll('.sabor-card').forEach(card => {
        let id = card.dataset.id
        let botao = card.querySelector('.favorito-btn')
        if (!botao) return

        let favoritado = favoritos.includes(id)
        botao.textContent = favoritado ? '❤️' : '🤍'
        botao.classList.toggle('favoritado', favoritado)
        botao.setAttribute('aria-label', favoritado ? `Remover ${card.dataset.nome} dos favoritos` : `Favoritar ${card.dataset.nome}`)
    })

    favCountEl.textContent = favoritos.length
}

function alternarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(fid => fid !== id)
    } else {
        favoritos.push(id)
    }

    salvarFavoritos()
    atualizarBotoesFavorito()
    renderizarFavoritos()
}

function renderizarFavoritos() {
    favoritosItemsEl.innerHTML = ''

    if (favoritos.length === 0) {
        favoritosItemsEl.appendChild(favoritosEmptyEl)
        return
    }

    favoritos.forEach(id => {
        let card = document.querySelector(`.sabor-card[data-id="${id}"]`)
        if (!card) return

        let div = document.createElement('div')
        div.classList.add('drawer-item-card')

        div.innerHTML = `
            <img src="${card.dataset.imagem}" alt="${card.dataset.nome}">
            <div class="drawer-item-info">
                <h4>${card.dataset.nome}</h4>
                <span>${formatarPreco(parseFloat(card.dataset.preco))}</span>
            </div>
            <div class="drawer-item-actions">
                <button class="btn-drawer-add">Adicionar</button>
                <button class="btn-drawer-remove">Remover</button>
            </div>
        `

        div.querySelector('.btn-drawer-add').onclick = () => {
            adicionarAoCarrinho(id, card.dataset.nome, parseFloat(card.dataset.preco), '350ml', 1)
        }

        div.querySelector('.btn-drawer-remove').onclick = () => alternarFavorito(id)

        favoritosItemsEl.appendChild(div)
    })
}

function fecharTodasAsDrawers() {
    fecharCarrinho()
    favoritosOverlay.classList.remove('open')
    favoritosDrawer.classList.remove('open')
    historicoOverlay.classList.remove('open')
    historicoDrawer.classList.remove('open')
}

if (favToggle) {
    favToggle.onclick = () => {
        fecharTodasAsDrawers()
        renderizarFavoritos()
        favoritosOverlay.classList.add('open')
        favoritosDrawer.classList.add('open')
    }

    favoritosClose.onclick = () => {
        favoritosOverlay.classList.remove('open')
        favoritosDrawer.classList.remove('open')
    }

    favoritosOverlay.onclick = favoritosClose.onclick
}

// Liga o clique de cada coração de favorito
document.querySelectorAll('.favorito-btn').forEach(botao => {
    botao.onclick = (e) => {
        e.stopPropagation()
        let card = botao.closest('.sabor-card')
        alternarFavorito(card.dataset.id)
    }
})

atualizarBotoesFavorito()

// ===================== HISTÓRICO DE PEDIDOS =====================
let historico = JSON.parse(localStorage.getItem('devclub-historico')) || []

let historicoToggle = document.getElementById('historicoToggle')
let historicoOverlay = document.getElementById('historicoOverlay')
let historicoDrawer = document.getElementById('historicoDrawer')
let historicoClose = document.getElementById('historicoClose')
let historicoItemsEl = document.getElementById('historicoItems')
let historicoEmptyEl = document.getElementById('historicoEmpty')
let historicoFooterEl = document.getElementById('historicoFooter')
let btnLimparHistorico = document.getElementById('btnLimparHistorico')

function salvarHistorico() {
    localStorage.setItem('devclub-historico', JSON.stringify(historico))
}

function salvarPedidoNoHistorico(dadosPedido) {
    historico.unshift({
        data: new Date().toLocaleString('pt-BR'),
        itens: dadosPedido.itens.map(item => ({
            id: item.id, nome: item.nome, preco: item.preco, tamanho: item.tamanho, qtd: item.qtd
        })),
        total: dadosPedido.total
    })

    // Mantém só os últimos 20 pedidos pra não crescer indefinidamente
    historico = historico.slice(0, 20)
    salvarHistorico()
}

function renderizarHistorico() {
    historicoItemsEl.innerHTML = ''

    if (historico.length === 0) {
        historicoItemsEl.appendChild(historicoEmptyEl)
        historicoFooterEl.style.display = 'none'
        return
    }

    historicoFooterEl.style.display = 'block'

    historico.forEach((pedido, index) => {
        let div = document.createElement('div')
        div.classList.add('pedido-historico')

        let resumoItens = pedido.itens
            .map(item => `${item.qtd}x ${item.nome} (${item.tamanho})`)
            .join(', ')

        div.innerHTML = `
            <div class="pedido-historico-topo">
                <span class="pedido-historico-data">${pedido.data}</span>
                <span class="pedido-historico-total">${formatarPreco(pedido.total)}</span>
            </div>
            <p class="pedido-historico-itens">${resumoItens}</p>
            <button class="btn-pedir-novamente">🔁 Pedir novamente</button>
        `

        div.querySelector('.btn-pedir-novamente').onclick = () => {
            pedido.itens.forEach(item => {
                adicionarAoCarrinho(item.id, item.nome, item.preco, item.tamanho, item.qtd)
            })
            fecharTodasAsDrawers()
            abrirCarrinho()
        }

        historicoItemsEl.appendChild(div)
    })
}

if (historicoToggle) {
    historicoToggle.onclick = () => {
        fecharTodasAsDrawers()
        renderizarHistorico()
        historicoOverlay.classList.add('open')
        historicoDrawer.classList.add('open')
    }

    historicoClose.onclick = () => {
        historicoOverlay.classList.remove('open')
        historicoDrawer.classList.remove('open')
    }

    historicoOverlay.onclick = historicoClose.onclick
}

if (btnLimparHistorico) {
    btnLimparHistorico.onclick = () => {
        historico = []
        salvarHistorico()
        renderizarHistorico()
        mostrarToast('Histórico de pedidos limpo.', '🗑️')
    }
}

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