

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


self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NOME).then((cache) => {
            return cache.addAll(ARQUIVOS_PARA_CACHE)
        })
    )
    self.skipWaiting()
})


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


self.addEventListener('fetch', (evento) => {
    
    if (evento.request.method !== 'GET') return

    evento.respondWith(
        caches.match(evento.request).then((respostaCache) => {
            if (respostaCache) return respostaCache

            return fetch(evento.request)
                .then((respostaRede) => {
                    
                    if (evento.request.url.startsWith(self.location.origin)) {
                        let respostaClone = respostaRede.clone()
                        caches.open(CACHE_NOME).then((cache) => {
                            cache.put(evento.request, respostaClone)
                        })
                    }
                    return respostaRede
                })
                .catch(() => {
                    
                    if (evento.request.mode === 'navigate') {
                        return caches.match('./index.html')
                    }
                })
        })
    )
})