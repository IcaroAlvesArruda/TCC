from flask import Flask, render_template, request, send_from_directory, jsonify
from flask_socketio import SocketIO, emit
import os
import time

app = Flask(__name__)
app.secret_key = 'supersecretkey'
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=300, ping_interval=25)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Rota principal
@app.route('/')
def index():
    return render_template('index.html')

# Rota para mostrar página de login do administrador
@app.route('/login')
def login_page():
    return render_template('login.html')
    
@app.route('/user')
def user_page():
    return render_template('user.html')

@app.route('/adm')
def admin_dashboard():
    return render_template('adm.html')

@app.route('/esqueci-senha')
def esqueciasenha():
    return render_template('esqueci-senha.html')

# Admin
ADMIN = {
    "admin@example.com": "senha123"
}

@app.route('/login', methods=['POST'])
def login_adm():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'}), 400

    # Verifica se o administrador existe e a senha está correta
    if email in ADMIN and ADMIN[email] == password:
        return jsonify({'success': True, 'redirect': '/adm'})
    else:
        return jsonify({'success': False, 'message': 'Email ou senha incorretos'}), 401



@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'}), 400
    
    if file and allowed_file(file.filename):
        for filename_old in os.listdir(app.config['UPLOAD_FOLDER']):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename_old)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Erro ao deletar {file_path}: {e}")

        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        socketio.emit('video_updated', {
            'filename': filename,
            'timestamp': time.time()
        })
        
        return jsonify({'success': True, 'filename': filename, 'message': f'Vídeo "{filename}" carregado com sucesso!'})
    else:
        return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido. Apenas vídeos são aceitos.'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@socketio.on('request_video_update')
def handle_video_request():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    if files:
        emit('video_updated', {
            'filename': files[-1],
            'timestamp': time.time()
        })

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)