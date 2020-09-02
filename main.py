import sqlite3
import json
import sys
import os
from hashlib import blake2b
import time
from flask import Flask, request, send_from_directory, redirect, make_response, abort, g
import threading

lock = threading.Lock()

cwd = os.path.dirname(os.path.abspath(__file__))
users_db = os.path.join(cwd, "users.db")
notes_db = os.path.join(cwd, "notes.db")


app = Flask(__name__, static_folder='static')
allowed_rpc_methods = ('register', 'login', 'forgot_password', 'show_notes', 'show_note', 'add_note', 'edit_note',
                       'remove_note', 'show_profile', 'edit_profile', 'remove_user', 'get_sync_stamp')

try:
    from flask_cors import CORS, cross_origin
    cors = CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})
    app.config['CORS_HEADERS'] = 'Content-Type'
except ModuleNotFoundError:
    pass

def get_usersdb():
    usersdb = getattr(g, '_usersdb', None)
    if usersdb is None:
        if not os.path.exists(users_db):
            usersdb = g._usersdb = sqlite3.connect(users_db)
            users = usersdb.cursor()
            users.execute("""CREATE TABLE "users" (
                "USER_ID"	    INTEGER PRIMARY KEY AUTOINCREMENT,
                "USERNAME"	    TEXT NOT NULL,
                "PASSWORD_HASH"	TEXT NOT NULL,
                "EMAIL"	        TEXT,
                "SYNC_STAMP"    INTEGER DEFAULT 0
            )""")
            users.execute("""CREATE TABLE "sessions" (
                "SESSION"	    TEXT NOT NULL UNIQUE,
                "USER_ID"	    INTEGER NOT NULL,
                "LAST_USAGE"    INTEGER NOT NULL
            )""")
            usersdb.commit()
        else:
            usersdb = g._usersdb = sqlite3.connect(users_db)
            users = usersdb.cursor()
    else:
        users = usersdb.cursor()
    return users, usersdb

def get_notesdb():
    notesdb = getattr(g, '_notesdb', None)
    if notesdb is None:
        notesdb = g._notesdb = sqlite3.connect(notes_db)
        notes = notesdb.cursor()
    else:
        notes = notesdb.cursor()
    return notes, notesdb

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_usersdb', None)
    if db is not None:
        db.close()
    db = getattr(g, '_notesdb', None)
    if db is not None:
        db.close()

@app.route('/')
def root():
    return send_from_directory('static', 'index.html')


@app.route("/api/<url>/", methods=['GET','POST'])
def api_handler(url):
    # request schema:
    # {} - kwargs!
    # response schema:
    # {'status': 1, 'response': [(16, None, None, 1589342406)]} – ok
    # {'status': 2, 'response': '44a3a94b5b1a232d8e9a'}         – new cookie
    # {'status': 3, 'response': 'error message'}                – error occurred
    lock.acquire()
    if url in allowed_rpc_methods:
        try:
            session = request.cookies.get('session')
            json_kwargs = request.get_json(force=True)
            if url in allowed_rpc_methods[:3]:
                response = {'status': 2, 'response': globals()[url](**json_kwargs)}
            else:
                response =  {'status': 1, 'response': globals()[url](session=session, **json_kwargs)}
        except ApiError:
            response = {'status': 3, 'response': str(sys.exc_info()[1])}
        # except Exception:
        #     response = {'status': 4, 'response': str(sys.exc_info()[1])}
    else:
        return abort(404)
    lock.release()
    if response['status'] == 2:
        session = response['response']
        response = make_response(json.dumps(response))
        response.set_cookie('session', session)
    elif response['status'] == 3 and response['response'] == "Сессия недействительна.":
        response = make_response(json.dumps(response))
        response.set_cookie('session', '0', expires=0)
    else:
        response = json.dumps(response)
    return response


@app.errorhandler(404)
def redirect_to_home(e):
    return redirect("/")


class ApiError(Exception):
    def __init__(self, message):
        super().__init__(message)


def check_session(session):
    users, usersConn = get_usersdb()
    if not session:
        raise ApiError("Сессия недействительна.")
    else:
        users.execute("""SELECT * FROM sessions WHERE SESSION = ?""", (session,))
        fetch = users.fetchone()
        if fetch is None:
            raise ApiError("Сессия недействительна.")
        else:
            if fetch[2] < time.time() - 2592000:
                users.execute("""DELETE FROM sessions WHERE SESSION = ?""", (session,))
                usersConn.commit()
                raise ApiError("Сессия недействительна.")
            else:
                users.execute("""UPDATE sessions SET LAST_USAGE = ? WHERE SESSION = ?""", (int(time.time()), session,))
                usersConn.commit()
                return fetch[1]


def update_sync_stamp(user_id):
    users, usersConn = get_usersdb()
    sync_stamp = int(time.time())
    users.execute("""UPDATE users SET SYNC_STAMP = ? WHERE USER_ID = ?""", (sync_stamp, user_id,))
    usersConn.commit()
    return sync_stamp


def get_sync_stamp(session):
    users, usersConn = get_usersdb()
    user_id = check_session(session)
    users.execute("""SELECT SYNC_STAMP FROM users WHERE USER_ID = ?""", (user_id,))
    return users.fetchone()[0]


def create_session(user_id):
    users, usersConn = get_usersdb()
    session = count_hash(f"{user_id}{time.time()}")
    users.execute("""INSERT INTO sessions (SESSION,USER_ID,LAST_USAGE) VALUES (?,?,?)""", (session, user_id, time.time(),))
    usersConn.commit()
    return session


def count_hash(unencoded_str):
    return blake2b(unencoded_str.encode('utf-8'), digest_size=10).hexdigest()


def register(username, password):
    users, usersConn = get_usersdb()
    notes, notesConn = get_notesdb()
    username = username.strip()
    password = count_hash(password)
    users.execute("""SELECT * FROM users WHERE USERNAME = ?""", (username,))
    fetch = users.fetchone()
    # noinspection PyPackageRequirements
    if fetch is not None:
        raise ApiError("Пользователь с таким именем уже существует.")
    users.execute("""INSERT INTO users (USERNAME,PASSWORD_HASH) VALUES (?,?)""", (username, password,))
    usersConn.commit()
    users.execute("""SELECT last_insert_rowid()""")
    fetch = users.fetchone()
    notes.execute("""CREATE TABLE "{}" (
        "NOTE_ID"       INTEGER PRIMARY KEY AUTOINCREMENT,
        "LABEL"	        TEXT DEFAULT "",
        "NOTE"          TEXT DEFAULT "",
        "LAST_CHANGE"   INTEGER NOT NULL
    )""".format(fetch[0]))
    notesConn.commit()
    return create_session(fetch[0])


def login(username, password):
    users, usersConn = get_usersdb()
    username = username.strip()
    password = count_hash(password)
    users.execute("""SELECT * FROM users WHERE USERNAME = ? or EMAIL = ?""", (username, username,))
    fetch = users.fetchone()
    if fetch is None:
        raise ApiError("Пользователь с таким именем не найден.")
    elif fetch[2] != password:
        raise ApiError("Неверный пароль.")
    else:
        return create_session(fetch[0])


def forgot_password(email, password):
    users, usersConn = get_usersdb()
    email = email.strip()
    password = count_hash(password)
    users.execute("""SELECT * FROM users WHERE EMAIL = ?""", (email,))
    fetch = users.fetchone()
    if fetch is None:
        raise ApiError("Пользователь с таким именем не найден.")
    users.execute("""UPDATE users SET PASSWORD_HASH = ? WHERE EMAIL = ?""", (password, email,))
    users.execute("""DELETE FROM sessions WHERE USER_ID = ?""", (fetch[0],))
    usersConn.commit()
    return create_session(fetch[0])


def show_notes(session):
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    notes.execute("""SELECT * FROM "{}" ORDER BY LAST_CHANGE DESC""".format(user_id))
    fetch = notes.fetchall()
    if fetch is None:
        return []
    return fetch


def show_note(session, note_id):
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    notes.execute("""SELECT * FROM "{}" WHERE NOTE_ID = ?""".format(user_id), (note_id,))
    return notes.fetchone()


def add_note(session):
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    notes.execute("""INSERT INTO "{}" (LAST_CHANGE) VALUES ({})""".format(user_id, int(time.time())))
    notesConn.commit()
    notes.execute("""SELECT last_insert_rowid()""")
    fetch = notes.fetchone()
    update_sync_stamp(user_id)
    return fetch[0]


def edit_note(session, note_id, label, note):
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    cur_time = update_sync_stamp(user_id)
    notes.execute("""UPDATE "{}" SET LABEL = ?, NOTE = ?, LAST_CHANGE = ? WHERE NOTE_ID = ?""".format(user_id),
                  (label, note, cur_time, note_id,))
    notesConn.commit()
    return cur_time


def remove_note(session, note_id):
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    notes.execute("""DELETE FROM "{}" WHERE NOTE_ID = ?""".format(user_id), (note_id,))
    notesConn.commit()
    update_sync_stamp(user_id)


def show_profile(session):
    users, usersConn = get_usersdb()
    user_id = check_session(session)
    users.execute("""SELECT USER_ID, USERNAME, EMAIL FROM users WHERE USER_ID = ?""", (user_id,))
    return users.fetchone()


def edit_profile(session, username="", email="", password="",old_password=""):
    # body schema: {'username': None, 'email': None, 'password': None, 'old_password': None}
    users, usersConn = get_usersdb()
    user_id = check_session(session)
    users.execute("""SELECT * FROM users WHERE USER_ID = ?""", (user_id,))
    user = users.fetchone()
    if username != "":
        if user[1] != username:
            users.execute("""UPDATE users SET USERNAME = ? WHERE USER_ID = ?""", (username, user_id,))
    else:
        raise ApiError("Имя пользователя не может быть пустым.")
    if email != "":
        users.execute("""SELECT * FROM users WHERE EMAIL = ?""", (email,))
        fetch = users.fetchall()
        if len(fetch) == 0 or (len(fetch) == 1 and fetch[0][0] == user_id):
            if user[3] != email.strip():
                users.execute("""UPDATE users SET EMAIL = ? WHERE USER_ID = ?""", (email.strip(), user_id,))
        else:
            raise ApiError("Эта почта уже занята.")
    else:
        users.execute("""UPDATE users SET EMAIL = ? WHERE USER_ID = ?""", ('', user_id,))
    if password != "":
        password = count_hash(password)
        old_password = count_hash(old_password)
        if user[2] != old_password:
            raise ApiError("Неверный старый пароль.")
        else:
            users.execute("""UPDATE users SET PASSWORD_HASH = ? WHERE USER_ID = ?""", (password, user_id,))
            users.execute("""DELETE FROM sessions WHERE USER_ID = ? AND SESSION != ?""", (user_id, session,))
    usersConn.commit()


def remove_user(session):
    users, usersConn = get_usersdb()
    notes, notesConn = get_notesdb()
    user_id = check_session(session)
    users.execute("""DELETE FROM users WHERE USER_ID = ?""", (user_id,))
    users.execute("""DELETE FROM sessions WHERE USER_ID = ?""", (user_id,))
    notes.execute("""DROP TABLE '{}'""".format(user_id))
    usersConn.commit()
    notesConn.commit()


try:
    sys.argv.index('interactive')
    exit()
except ValueError:
    pass


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
