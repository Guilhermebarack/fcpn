import os
import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__, static_folder='.', static_url_path='')
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

@app.before_request
def handle_options_preflight():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-User-Email'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-User-Email'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    return response

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member'
            )
        ''')
        cursor = conn.cursor()
        
        # Cria administrador padrão caso não exista
        cursor.execute("SELECT * FROM users WHERE email = ?", ('admin@fcpn.org',))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
                           ('admin@fcpn.org', 'admin123', 'admin'))
            print("Administrador padrão criado.")
            
        # Cria membro padrão caso não exista
        cursor.execute("SELECT * FROM users WHERE email = ?", ('membro@fcpn.org',))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
                           ('membro@fcpn.org', 'fcpn2026', 'member'))
            print("Membro padrão criado.")
            
        conn.commit()

# Inicializa o banco de dados
init_db()

# Rotas de segurança para impedir download direto do banco de dados na pasta pública
@app.route('/database.db')
@app.route('/database.bd')
def block_db():
    return jsonify({"success": False, "message": "Acesso negado. O arquivo de banco de dados não está disponível publicamente."}), 403

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({"success": False, "message": "E-mail e senha são obrigatórios."}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role FROM users WHERE email = ? AND password = ?", (email, password))
        user = cursor.fetchone()
        
    if user:
        return jsonify({
            "success": True,
            "email": user['email'],
            "role": user['role']
        })
    else:
        return jsonify({"success": False, "message": "Credenciais inválidas. Tente novamente."}), 401

@app.route('/api/members', methods=['GET'])
def list_members():
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    with get_db() as conn:
        cursor = conn.cursor()
        # Verifica permissão (apenas admin vê a lista completa)
        cursor.execute("SELECT role FROM users WHERE email = ?", (requester_email,))
        requester = cursor.fetchone()
        if not requester or requester['role'] != 'admin':
            return jsonify({"success": False, "message": "Acesso não autorizado. Apenas administradores podem listar membros."}), 403
            
        cursor.execute("SELECT id, email, role FROM users ORDER BY id DESC")
        users = cursor.fetchall()
        
    members_list = [{"id": row['id'], "email": row['email'], "role": row['role']} for row in users]
    return jsonify({"success": True, "members": members_list})

@app.route('/api/members', methods=['POST'])
def register_member():
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    data = request.get_json() or {}
    new_email = data.get('email', '').strip().lower()
    new_password = data.get('password', '')
    new_role = data.get('role', 'member')
    
    if new_role not in ('admin', 'member'):
        new_role = 'member'
    
    if not new_email or not new_password:
        return jsonify({"success": False, "message": "E-mail e senha são obrigatórios."}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verifica se quem solicita o cadastro é um usuário válido (está logado e cadastrado)
        cursor.execute("SELECT role FROM users WHERE email = ?", (requester_email,))
        requester = cursor.fetchone()
        if not requester:
            return jsonify({"success": False, "message": "Acesso não autorizado."}), 403
        
        if new_role == 'admin' and requester['role'] != 'admin':
            return jsonify({"success": False, "message": "Apenas administradores podem criar novos administradores."}), 403
            
        try:
            cursor.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
                           (new_email, new_password, new_role))
            conn.commit()
            return jsonify({"success": True, "message": "Membro cadastrado com sucesso!"}), 201
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Este e-mail já está cadastrado."}), 409

@app.route('/api/members/<int:user_id>', methods=['DELETE'])
def delete_member(user_id):
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    with get_db() as conn:
        cursor = conn.cursor()
        # Apenas admin pode excluir
        cursor.execute("SELECT role FROM users WHERE email = ?", (requester_email,))
        requester = cursor.fetchone()
        if not requester or requester['role'] != 'admin':
            return jsonify({"success": False, "message": "Acesso não autorizado. Apenas administradores podem excluir membros."}), 403
            
        # Busca o usuário a ser excluído
        cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
        target_user = cursor.fetchone()
        if not target_user:
            return jsonify({"success": False, "message": "Membro não encontrado."}), 404
            
        # Impede auto-exclusão
        if target_user['email'].lower() == requester_email.lower():
            return jsonify({"success": False, "message": "Você não pode excluir a sua própria conta."}), 400
            
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        
    return jsonify({"success": True, "message": "Membro excluído com sucesso!"})

@app.route('/api/change-password', methods=['POST'])
def change_password():
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not current_password or not new_password:
        return jsonify({"success": False, "message": "Senha atual e nova senha são obrigatórias."}), 400
        
    with get_db() as conn:
        cursor = conn.cursor()
        # Verifica se a senha atual está correta
        cursor.execute("SELECT password FROM users WHERE email = ?", (requester_email,))
        user = cursor.fetchone()
        
        if not user or user['password'] != current_password:
            return jsonify({"success": False, "message": "Senha atual incorreta."}), 401
            
        # Atualiza a senha no banco
        cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, requester_email))
        conn.commit()
        
    return jsonify({"success": True, "message": "Senha alterada com sucesso!"})

@app.route('/api/admin/change-password', methods=['POST'])
def admin_change_password():
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    with get_db() as conn:
        cursor = conn.cursor()
        # Verifica se quem solicita é de fato um admin
        cursor.execute("SELECT role FROM users WHERE email = ?", (requester_email,))
        requester = cursor.fetchone()
        if not requester or requester['role'] != 'admin':
            return jsonify({"success": False, "message": "Acesso não autorizado. Apenas administradores podem alterar senhas de outros membros."}), 403
            
        data = request.get_json() or {}
        user_id = data.get('user_id')
        new_password = data.get('new_password', '')
        
        if not user_id or not new_password:
            return jsonify({"success": False, "message": "ID do usuário e nova senha são obrigatórios."}), 400
            
        # Verifica se o usuário existe
        cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
        target_user = cursor.fetchone()
        if not target_user:
            return jsonify({"success": False, "message": "Membro não encontrado."}), 404
            
        # Atualiza a senha do usuário no banco SQLite
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_password, user_id))
        conn.commit()
        
    return jsonify({"success": True, "message": f"Senha do membro {target_user['email']} alterada com sucesso!"})

@app.route('/api/admin/change-role', methods=['POST'])
def admin_change_role():
    requester_email = request.headers.get('X-User-Email', '').strip().lower()
    
    if not requester_email:
        return jsonify({"success": False, "message": "Usuário não autenticado."}), 401
        
    with get_db() as conn:
        cursor = conn.cursor()
        # Verifica se quem solicita é de fato um admin
        cursor.execute("SELECT role FROM users WHERE email = ?", (requester_email,))
        requester = cursor.fetchone()
        if not requester or requester['role'] != 'admin':
            return jsonify({"success": False, "message": "Acesso não autorizado. Apenas administradores podem alterar o nível de membros."}), 403
            
        data = request.get_json() or {}
        user_id = data.get('user_id')
        new_role = data.get('new_role', '').strip().lower()
        
        if not user_id or new_role not in ['admin', 'member']:
            return jsonify({"success": False, "message": "ID do usuário e novo nível válido (admin ou member) são obrigatórios."}), 400
            
        # Verifica se o usuário de destino existe
        cursor.execute("SELECT email, role FROM users WHERE id = ?", (user_id,))
        target_user = cursor.fetchone()
        if not target_user:
            return jsonify({"success": False, "message": "Membro não encontrado."}), 404
            
        # Impede o admin de alterar o próprio nível (auto-rebaixamento)
        if target_user['email'].lower() == requester_email.lower():
            return jsonify({"success": False, "message": "Você não pode alterar o nível de acesso da sua própria conta."}), 400
            
        # Atualiza o nível (role) no banco SQLite
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        conn.commit()
        
    role_name = "Administrador" if new_role == 'admin' else "Membro Padrão"
    return jsonify({"success": True, "message": f"Nível de acesso do membro {target_user['email']} alterado para {role_name}!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
