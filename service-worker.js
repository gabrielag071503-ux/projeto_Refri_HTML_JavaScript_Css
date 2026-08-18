// ===================== SERVICE WORKER — Dev Club Refri =====================
// Estratégia: cache-first pros arquivos estáticos do app, com fallback pra rede.
// Isso permite abrir o site (já visitado antes) mesmo sem internet.

const CACHE_NOME = 'devclub-refri-v1'

const ARQUIVOS_PARA_CACHE = [
    './',
    './index.html',
    './style.css',
    './scripts.js',
    './manifest.json',
    './img/icon-192.png',
    './img/icon-512.png'
]

// Instala o service worker e guarda os arquivos principais em cache
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NOME).then((cache) => {
            return cache.addAll(ARQUIVOS_PARA_CACHE)
        })
    )
    self.skipWaiting()
})

// Remove caches antigos quando uma nova versão do service worker assume
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nomes) => {
            return Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_NOME)
                    .map((nome) => caches.delete(nome))
            )
        })
    )
    self.clients.claim()
})

// Intercepta requisições: tenta o cache primeiro, senão busca na rede
self.addEventListener('fetch', (evento) => {
    // Só trata requisições GET (evita interferir em chamadas POST, ex: ViaCEP)
    if (evento.request.method !== 'GET') return

    evento.respondWith(
        caches.match(evento.request).then((respostaCache) => {
            if (respostaCache) return respostaCache

            return fetch(evento.request)
                .then((respostaRede) => {
                    // Guarda no cache uma cópia dos arquivos do próprio site (não de APIs externas)
                    if (evento.request.url.startsWith(self.location.origin)) {
                        let respostaClone = respostaRede.clone()
                        caches.open(CACHE_NOME).then((cache) => {
                            cache.put(evento.request, respostaClone)
                        })
                    }
                    return respostaRede
                })
                .catch(() => {
                    // Sem internet e sem cache: se for navegação de página, cai no index
                    if (evento.request.mode === 'navigate') {
                        return caches.match('./index.html')
                    }
                })
        })
    )
})