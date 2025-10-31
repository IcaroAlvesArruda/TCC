const socket = io();

const videoFile = document.getElementById('videoFile');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const uploadForm = document.getElementById('uploadForm');
const uploadButton = document.getElementById('uploadButton');
const videoPlayerContainer = document.getElementById('videoPlayerContainer');
const messagesContainer = document.getElementById('messagesContainer');

let currentVideoPlayer = null;

function displayMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    messagesContainer.appendChild(msgDiv);
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        msgDiv.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => msgDiv.remove(), 500);
    }, 3000);
}

videoFile.addEventListener('change', function() {
    if (this.files.length > 0) {
        fileNameDisplay.textContent = `Vídeo selecionado: ${this.files[0].name}`;
    } else {
        fileNameDisplay.textContent = 'Nenhum vídeo selecionado';
    }
});

uploadForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const file = videoFile.files[0];
    if (!file) {
        displayMessage('Por favor, selecione um vídeo.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('video', file);

    uploadButton.disabled = true;
    uploadButton.textContent = 'Carregando...';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.textContent = 'Carregando vídeo...';
    videoPlayerContainer.innerHTML = '';
    videoPlayerContainer.appendChild(loadingOverlay);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayMessage(data.message, 'success');
            playVideo(data.filename);
        } else {
            displayMessage(data.message, 'error');
            videoPlayerContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        displayMessage('Erro ao carregar o vídeo. Tente novamente.', 'error');
        videoPlayerContainer.innerHTML = '';
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Carregar e Reproduzir';
    }
});

function playVideo(filename) {
    videoPlayerContainer.innerHTML = '';

    const videoPlayer = document.createElement('video');
    videoPlayer.id = 'videoPlayer';
    videoPlayer.controls = true;
    videoPlayer.autoplay = true;
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.style.width = '100%';
    videoPlayer.style.height = 'auto';

    const source = document.createElement('source');
    source.src = `/uploads/${filename}`;
    source.type = 'video/mp4';

    videoPlayer.appendChild(source);
    videoPlayerContainer.appendChild(videoPlayer);
    currentVideoPlayer = videoPlayer;

    videoPlayer.addEventListener("play", () => {
        socket.emit("admin_play_video");
    });

    videoPlayer.addEventListener("pause", () => {
        socket.emit("admin_pause_video");
    });

    videoPlayer.addEventListener("seeked", () => {
        socket.emit("admin_seek_video", videoPlayer.currentTime);
    });

    videoPlayer.addEventListener('loadedmetadata', () => {
        videoPlayer.play().catch(error => {
            console.warn("Autoplay impedido. Erro:", error);
        });
    });

    if (videoPlayer.readyState >= 2) {
        videoPlayer.play().catch(error => console.warn("Autoplay (readyState) impedido:", error));
    }
}

document.getElementById("videoFile").addEventListener("change", function() {
    const fileNameDisplay = document.getElementById("fileNameDisplay");
    if (this.files && this.files.length > 0) {
        fileNameDisplay.textContent = this.files[0].name;
    } else {
        fileNameDisplay.textContent = "Nenhum vídeo selecionado";
    }
});