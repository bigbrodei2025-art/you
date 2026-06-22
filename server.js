const express = require('express');
const ytSearch = require('yt-search');
const app = express();
const PORT = 1000;

// Permite que o Express entenda JSON e dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota principal: Entrega a página HTML com a interface de busca e player
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Busca e Player do YouTube</title>
        <style>
            body { font-family: Arial, sans-serif; background: #121212; color: #fff; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; }
            .search-box { margin-bottom: 20px; display: flex; gap: 10px; justify-content: center; }
            input { padding: 10px; font-size: 16px; border: none; border-radius: 4px; width: 60%; }
            button { padding: 10px 20px; font-size: 16px; border: none; border-radius: 4px; background: #ff0000; color: white; cursor: pointer; font-weight: bold; }
            button:hover { background: #cc0000; }
            #player-container { margin: 20px 0; display: none; background: #000; padding: 10px; border-radius: 8px; }
            .video-list { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 20px; text-align: left; }
            .video-item { display: flex; gap: 15px; background: #1e1e1e; padding: 10px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
            .video-item:hover { background: #2d2d2d; }
            .video-item img { width: 120px; height: 90px; object-fit: cover; border-radius: 4px; }
            .video-info h3 { margin: 0 0 5px 0; font-size: 16px; color: #fff; }
            .video-info p { margin: 0; font-size: 12px; color: #aaa; }
        </style>
    </head>
    <body>

        <h2>Buscar Vídeos no YouTube</h2>
        
        <div class="search-box">
            <input type="text" id="query" placeholder="Digite o nome do vídeo ou artista...">
            <button onclick="buscar()">Buscar</button>
        </div>

        <div id="player-container">
            <h3 id="playing-title" style="margin-top:0;"></h3>
            <iframe id="youtube-player" width="100%" height="400" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>

        <div id="results" class="video-list"></div>

        <script>
            async function buscar() {
                const query = document.getElementById('query').value;
                if (!query) return alert('Digite algo para buscar!');
                
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '<p>Buscando...</p>';

                try {
                    const response = await fetch('/search?q=' + encodeURIComponent(query));
                    const videos = await response.json();
                    
                    resultsDiv.innerHTML = '';
                    if (videos.length === 0) {
                        resultsDiv.innerHTML = '<p>Nenhum vídeo encontrado.</p>';
                        return;
                    }

                    videos.forEach(video => {
                        const item = document.createElement('div');
                        item.className = 'video-item';
                        // Ao clicar, chama a função para tocar o vídeo no iframe
                        item.onclick = () => tocarVideo(video.id, video.title);

                        item.innerHTML = \`
                            <img src="\${video.thumbnail}" alt="thumbnail">
                            <div class="video-info">
                                <h3>\${video.title}</h3>
                                <p>\${video.author} • \${video.duration}</p>
                            </div>
                        \`;
                        resultsDiv.appendChild(item);
                    });
                } catch (error) {
                    resultsDiv.innerHTML = '<p>Erro ao buscar vídeos.</p>';
                }
            }

            function tocarVideo(id, title) {
                const container = document.getElementById('player-container');
                const player = document.getElementById('youtube-player');
                const titleElement = document.getElementById('playing-title');

                titleElement.innerText = "Tocando agora: " + title;
                player.src = "https://www.youtube.com/embed/" + id + "?autoplay=1";
                container.style.display = 'block';
                
                // Rola a página suavemente para o player
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        </script>
    </body>
    </html>
    `);
});

// Rota de API: Faz a busca no YouTube usando o pacote yt-search
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Busca os vídeos no YouTube
        const r = await ytSearch(query);
        const videos = r.videos.slice(0, 10); // Limita aos 10 primeiros resultados

        // Formata os dados que o HTML precisa
        const responseData = videos.map(v => ({
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.timestamp,
            author: v.author.name
        }));

        res.json(responseData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao buscar' });
    }
});

// Inicia o servidor na porta 1000
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando com sucesso!`);
    console.log(`🔗 Acesse no seu navegador: http://localhost:${PORT}`);
});
