       const SERVER_IP = "192.168.0.237";
        const SERVER_URL = `http://${SERVER_IP}:5000`;
        const MAX_RECONNECT_ATTEMPTS = 10;
        const RECONNECT_DELAY = 3000;

        const videoPlayer = document.getElementById('videoPlayer');
        const statusBar = document.getElementById('statusBar');
        const connectionStatus = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        const loadingSubtext = document.getElementById('loadingSubtext');

        let reconnectAttempts = 0;
        let isRemoteUpdate = false;

        const socket = io(SERVER_URL, {
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: RECONNECT_DELAY,
            transports: ['websocket', 'polling'],
            upgrade: true,
            forceNew: true,
            timeout: 20000
        });

        function updateConnectionStatus(status, message) {
            statusBar.className = status;
            statusText.textContent = message;

            if (status === 'connected') {
                loadingText.textContent = 'Conectado!';
                loadingSubtext.textContent = 'Aguardando vídeo...';
                setTimeout(() => {
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }, 1000);
            } else {
                loadingOverlay.style.display = 'flex';
                loadingText.textContent = message;
                loadingSubtext.textContent = status === 'connecting' ? 'Aguarde um momento' : 'Verifique sua conexão';
            }
        }

        socket.on('connect', () => {
            reconnectAttempts = 0;
            updateConnectionStatus('connected', `Conectado: ${SERVER_IP}`);
            console.log('Conectado ao servidor via Wi-Fi');
            fetchCurrentVideo();
        });

        socket.on('disconnect', (reason) => {
            updateConnectionStatus('disconnected', `Desconectado: ${reason}`);
            console.warn('Desconectado do servidor:', reason);
        });

        socket.on('reconnect_attempt', (attempt) => {
            reconnectAttempts = attempt;
            updateConnectionStatus('connecting', `Tentando reconectar (${attempt}/${MAX_RECONNECT_ATTEMPTS})...`);
        });

        socket.on('reconnect_failed', () => {
            updateConnectionStatus('disconnected', 'Falha na conexão. Recarregue a página.');
        });

        socket.on('connect_error', (error) => {
            updateConnectionStatus('connecting', 'Erro na conexão Wi-Fi...');
            console.error('Erro na conexão:', error.message);
        });

        socket.on("new_video_uploaded", (data) => {
            updateConnectionStatus('connected', `Novo vídeo: ${data.filename}`);
            playVideo(data.filename);
        });

        socket.on("video_play", () => {
            isRemoteUpdate = true;
            if (videoPlayer.paused) {
                videoPlayer.play().catch(err => console.log("Erro ao reproduzir:", err));
            }
            isRemoteUpdate = false;
            statusText.textContent = "Reproduzindo...";
        });

        socket.on("video_pause", () => {
            isRemoteUpdate = true;
            if (!videoPlayer.paused) {
                videoPlayer.pause();
            }
            isRemoteUpdate = false;
            statusText.textContent = "Pausado";
        });

        socket.on("video_seek", (time) => {
            isRemoteUpdate = true;
            videoPlayer.currentTime = time;
            isRemoteUpdate = false;
        });

        videoPlayer.addEventListener("play", () => {
            if (!isRemoteUpdate) {
                statusText.textContent = "Reproduzindo...";
            }
        });

        videoPlayer.addEventListener("pause", () => {
            if (!isRemoteUpdate) {
                statusText.textContent = "Pausado";
            }
        });

        async function fetchCurrentVideo() {
            try {
                const response = await fetch(`${SERVER_URL}/api/videos`);
                const videos = await response.json();
                
                if (videos && videos.length > 0) {
                    const latestVideo = videos[videos.length - 1];
                    playVideo(latestVideo.filename);
                }
            } catch (error) {
                console.error('Erro ao buscar vídeos:', error);
            }
        }

        function playVideo(filename) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
            loadingText.textContent = 'Carregando vídeo...';
            loadingSubtext.textContent = 'Aguarde um momento';

            videoPlayer.src = `${SERVER_URL}/uploads/${filename}`;
            videoPlayer.load();

            videoPlayer.onloadeddata = () => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);

                videoPlayer.play().catch(e => {
                    console.log('Autoplay bloqueado:', e);
                    loadingText.textContent = 'Clique para reproduzir';
                    loadingSubtext.textContent = 'Interação necessária';
                    loadingOverlay.style.display = 'flex';
                    loadingOverlay.style.opacity = '1';
                    loadingOverlay.onclick = () => {
                        videoPlayer.play();
                        loadingOverlay.style.display = 'none';
                    };
                });
            };

            videoPlayer.onended = () => {
                videoPlayer.currentTime = 0;
                videoPlayer.play().catch(console.warn);
            };

            videoPlayer.onerror = () => {
                loadingText.textContent = 'Erro ao carregar vídeo';
                loadingSubtext.textContent = 'Tentando novamente...';
                setTimeout(() => {
                    fetchCurrentVideo();
                }, 2000);
            };
        }