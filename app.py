from flask import Flask, render_template, request, send_from_directory, jsonify
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import uuid
from datetime import datetime, timedelta
import hashlib
import mysql.connector

STATIC_FOLDER = 'static'
if not os.path.exists(STATIC_FOLDER):
    os.makedirs(STATIC_FOLDER)

app = Flask(__name__)
CORS(app)
app.secret_key = 'supersecretkey'
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=300, ping_interval=25)

load_dotenv()
EMAIL_REMETENTE = os.getenv("EMAIL_REMETENTE")
EMAIL_SENHA = os.getenv("EMAIL_SENHA")
    
def callEmail(emailDestina='', remetente='', assunto='', mensagem=''):
    try:    
        email = EmailMessage()
        email["Subject"] = assunto
        email["From"] = EMAIL_REMETENTE
        email["To"] = emailDestina
        corpo = f"Mensagem de: {remetente}\n\n{mensagem}"
        email.set_content(corpo)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_REMETENTE, EMAIL_SENHA)
            smtp.send_message(email)

        resultado = "E-mail enviado com sucesso!"
    except Exception as e:
        resultado = f"Erro ao enviar e-mail: {str(e)}"
    print(resultado)
    return resultado

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"mp4", "webm", "ogg", "mov", "avi", "mkv"}

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'admin#321',
    'database': 'video_app'
}

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_user_by_email(email):
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor(dictionary=True)
        query = "SELECT * FROM usuarios WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        cursor.close()
        cnx.close()
        return user
    except mysql.connector.Error as err:
        print(f"Erro ao buscar usuário por email: {err}")
        return None

def update_reset_token(email, token, expiration_time):
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor()
        query = "UPDATE usuarios SET token_reset = %s, token_expiracao = %s WHERE email = %s"
        cursor.execute(query, (token, expiration_time, email))
        cnx.commit()
        cursor.close()
        cnx.close()
        return True
    except mysql.connector.Error as err:
        print(f"Erro ao atualizar token de reset: {err}")
        return False

def reset_user_password(token, new_hashed_password):
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor()
        query_select = "SELECT id FROM usuarios WHERE token_reset = %s AND token_expiracao > NOW()"
        cursor.execute(query_select, (token,))
        user_row = cursor.fetchone()
        
        if not user_row:
            cursor.close()
            cnx.close()
            return False
            
        user_id = user_row[0]
        
        query_update = "UPDATE usuarios SET senha = %s, token_reset = NULL, token_expiracao = NULL WHERE id = %s"
        cursor.execute(query_update, (new_hashed_password, user_id))
        cnx.commit()
        
        cursor.close()
        cnx.close()
        return True
    except mysql.connector.Error as err:
        print(f"Erro ao redefinir senha: {err}")
        return False

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')
    
@app.route('/user')
def user_page():
    return render_template('user.html')
                           
@app.route('/adm')
def admin_dashboard():
    return render_template('adm.html')

@app.route('/cliente')
def cliente_page():
    return render_template('cliente.html')

@app.route('/esqueci-senha')
def esqueciasenha():
    return render_template('esqueci-senha.html')


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'}), 400

    user = get_user_by_email(email)

    if user and user['senha'] == hash_password(password):
        return jsonify({'success': True, 'redirect': '/adm'})
    else:
        return jsonify({'success': False, 'message': 'Email ou senha incorretos'}), 401

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email é obrigatório'}), 400

    user = get_user_by_email(email)
    
    if not user:
        print(f"Tentativa de recuperação de senha para email não encontrado: {email}")
        return jsonify({'success': True, 'message': 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'})

    try:
        update_reset_token(email, None, None)
        
        token = str(uuid.uuid4())
        expiration_time = datetime.now() + timedelta(hours=1)
        
        if not update_reset_token(email, token, expiration_time.strftime('%Y-%m-%d %H:%M:%S')):
            raise Exception("Falha ao salvar token no banco de dados.")

        reset_url = request.url_root.replace('https://', 'http://') + f'senha-nova?token={token}'

        assunto = "Recuperação de Senha"
        mensagem = f"""
Olá,

Você solicitou a recuperação de senha para sua conta.
Clique no link abaixo para redefinir sua senha:

{reset_url}

Se você não solicitou esta alteração, por favor, ignore este e-mail.

Atenciosamente,
Equipe de Suporte
"""
        callEmail(emailDestina=email, remetente=EMAIL_REMETENTE, assunto=assunto, mensagem=mensagem)
        print(f"E-mail de recuperação simulado enviado para {email} com link: {reset_url}")

        return jsonify({'success': True, 'message': 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'})
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return jsonify({'success': True, 'message': 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'})


@app.route('/api/videos')
def list_videos():
    videos_data = get_videos()
    return jsonify(videos_data)

def get_videos():
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor(dictionary=True)
        
        query = "SELECT id, filename, upload_time FROM videos"
        cursor.execute(query)
        
        videos = []
        for row in cursor.fetchall():
            row['upload_time'] = row['upload_time'].isoformat() if row['upload_time'] else None
            videos.append(row)
        
        cursor.close()
        cnx.close()
        
        return videos
    except mysql.connector.Error as err:
        print(f"Erro ao conectar ou consultar o banco de dados: {err}")
        return []

@app.route('/api/videos/<filename>', methods=['DELETE'])
def delete_video(filename):
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor()
        
        cursor.execute("DELETE FROM videos WHERE filename = %s", (filename,))
        cnx.commit()
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        cursor.close()
        cnx.close()
        
        return jsonify({'success': True, 'message': 'Vídeo excluído com sucesso!'})
    
    except Exception as e:
        print(f"Erro ao excluir vídeo: {e}")
        return jsonify({'success': False, 'message': 'Erro ao excluir vídeo'}), 500

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

        try:
            cnx = mysql.connector.connect(**db_config)
            cursor = cnx.cursor()
            cursor.execute("INSERT INTO videos (filename) VALUES (%s)", (filename,))
            cnx.commit()
            cursor.close()
            cnx.close()

            socketio.emit('new_video_uploaded', {
                'filename': filename,
                'url': f'/uploads/{filename}'
            })
            
            return jsonify({'success': True, 'filename': filename, 'message': f'Vídeo "{filename}" carregado com sucesso!'})
        except Exception as e:
            print("Erro ao salvar no banco:", e)
            return jsonify({'success': False, 'message': 'Erro ao salvar no banco de dados.'}), 500
    else:
        return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido. Apenas vídeos são aceitos.'}), 400
    
@app.route('/senha-nova')
def reset_password_page():
    token = request.args.get('token')
    return render_template('senha-nova.html')

@app.route('/api/senha-nova', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({'success': False, 'message': 'Token e nova senha são obrigatórios'}), 400
    
    hashed_password = hash_password(new_password)
    
    if reset_user_password(token, hashed_password):
        return jsonify({
            'success': True, 
            'message': 'Senha redefinida com sucesso! Redirecionando para login...'
        })
    else:
        return jsonify({'success': False, 'message': 'Token inválido ou expirado. Tente novamente.'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@socketio.on("admin_play_video")
def handle_admin_play():
    socketio.emit("video_play")

@socketio.on("admin_pause_video")
def handle_admin_pause():
    socketio.emit("video_pause")

@socketio.on("admin_seek_video")
def handle_admin_seek(data):
    socketio.emit("video_seek", data)

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)