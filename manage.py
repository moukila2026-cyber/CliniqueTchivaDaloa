"""Maintenance hors ligne : exécuter sur votre ordinateur/serveur, pas en Build Command."""
import argparse, os, getpass, secrets, base64
from pathlib import Path
from datetime import datetime,timezone

def main():
    p=argparse.ArgumentParser(description='Maintenance Clinique Tchiva — Neon/PostgreSQL ou SQLite local')
    p.add_argument('command',choices=['generate-secrets','init-db','backup','reset-password'])
    p.add_argument('--output',help='Archive de sauvegarde chiffrée .fernet')
    p.add_argument('--phone',help='Téléphone du compte à réinitialiser')
    a=p.parse_args()
    if a.command=='generate-secrets':
        print('À copier dans les variables privées Vercel et dans votre coffre. NE PAS committer ni partager.')
        print('ENCRYPTION_KEY='+base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())
        print('BACKUP_KEY='+base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())
        print('Ne régénérez pas ENCRYPTION_KEY après les premières données.')
        return
    import app as m
    m.STORE.initialize(m.DEFAULT)
    if a.command=='init-db':
        print('Schéma initialisé :','PostgreSQL' if m.STORE.postgres else 'SQLite local')
        return
    if a.command=='reset-password':
        if not a.phone:p.error('--phone requis')
        password=getpass.getpass('Nouveau code personnel (12 caractères minimum) : ')
        if password!=getpass.getpass('Confirmez : '):p.error('Les codes diffèrent.')
        hashed=m.password_hash(password)
        phone_norm=m.normalize_phone(a.phone.strip())
        with m.db() as c:
            r=c.execute('SELECT id FROM users WHERE phone=?',(phone_norm,)).fetchone()
            if not r:p.error('Compte introuvable')
            c.execute('UPDATE users SET password=? WHERE id=?',(hashed,r[0]))
            c.execute('DELETE FROM sessions WHERE user_id=?',(r[0],))
            c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(r[0],'Réinitialisation locale du code personnel',str(r[0]),m.now()))
        print('Code personnel modifié. Sessions fermées.')
        return
    if not a.output:p.error('--output requis')
    backup_key=os.environ.get('BACKUP_KEY','')
    if not backup_key:p.error('BACKUP_KEY requise ; utilisez une clé distincte conservée hors du site.')
    from cryptography.fernet import Fernet
    try:cipher=Fernet(backup_key.encode())
    except Exception:p.error('BACKUP_KEY doit être une clé Fernet valide.')
    import tempfile,zipfile,io,json,sqlite3,subprocess
    with tempfile.TemporaryDirectory() as tmp:
        target=Path(tmp)/('tchiva.pgdump' if m.STORE.postgres else 'tchiva.sqlite3')
        if m.STORE.postgres:
            # Le client PostgreSQL doit être installé sur le poste de maintenance.
            # La DSN n'est jamais passée dans les arguments visibles ou affichée.
            from psycopg.conninfo import conninfo_to_dict
            info=conninfo_to_dict(os.environ.get('DATABASE_URL_UNPOOLED') or m.STORE.url)
            names={'dbname':'PGDATABASE','application_name':'PGAPPNAME','connect_timeout':'PGCONNECT_TIMEOUT','channel_binding':'PGCHANNELBINDING','target_session_attrs':'PGTARGETSESSIONATTRS'}
            env=dict(os.environ)
            # PGDATABASE seul n'interprète pas une URI complète dans pg_dump.
            # Transmettre chaque paramètre via libpq garde les secrets hors argv.
            for name in list(env):
                if name.startswith('PG'):env.pop(name,None)
            for key,value in info.items():env[names.get(key,'PG'+key.replace('_','').upper())]=value
            try:
                r=subprocess.run(['pg_dump','--format=custom','--no-owner','--no-acl','--file',str(target)],env=env,capture_output=True)
            except FileNotFoundError:p.error('Installez pg_dump compatible avec la version du serveur PostgreSQL.')
            if r.returncode:p.error('Échec de pg_dump ; vérifiez les accès, la version du client et la connexion directe, sans publier les secrets.')
        else:
            src=sqlite3.connect(m.DB);dst=sqlite3.connect(target)
            src.backup(dst);dst.close();src.close()
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
            z.write(target,target.name)
            z.writestr('encryption.key',m.KEY)
            z.writestr('metadata.json',json.dumps({'created_at':datetime.now(timezone.utc).isoformat(),'app':'Clinique Tchiva','backend':'postgresql' if m.STORE.postgres else 'sqlite','format':2}))
        encrypted=cipher.encrypt(buffer.getvalue())
        fd=os.open(a.output,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,'wb') as f:f.write(encrypted)
    print('Sauvegarde cohérente et chiffrée créée :',a.output)
    print('Conservez BACKUP_KEY séparément. Testez la restauration hors production.')

if __name__=='__main__':main()
