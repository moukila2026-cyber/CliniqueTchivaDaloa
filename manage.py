"""Outils d’exploitation. À exécuter uniquement par l'administrateur serveur."""
import argparse, os, sqlite3, getpass, secrets, hashlib
from pathlib import Path
from datetime import datetime,timezone
p=argparse.ArgumentParser(description='Maintenance Clinique Tchiva')
p.add_argument('command',choices=['backup','reset-password'])
p.add_argument('--output',help='Fichier de sauvegarde chiffré .fernet')
p.add_argument('--email',help='Compte à réinitialiser')
a=p.parse_args()
root=Path(__file__).parent;data=Path(os.environ.get('DATA_DIR',root/'data'));db=data/'tchiva.sqlite3'
if not db.exists():p.error('Base introuvable. Démarrez l’application au moins une fois.')
if a.command=='reset-password':
    if not a.email:p.error('--email requis')
    import bcrypt
    password=getpass.getpass('Nouveau mot de passe (12 caractères minimum) : ')
    if len(password)<12 or len(password.encode())>72:p.error('12 caractères minimum, 72 octets maximum.')
    if password!=getpass.getpass('Confirmez : '):p.error('Les mots de passe diffèrent.')
    with sqlite3.connect(db) as c:
        r=c.execute('SELECT id FROM users WHERE email=?',(a.email.lower().strip(),)).fetchone()
        if not r:p.error('Compte introuvable')
        c.execute('UPDATE users SET password=? WHERE id=?',(bcrypt.hashpw(password.encode(),bcrypt.gensalt()),r[0]))
        c.execute('DELETE FROM sessions WHERE user_id=?',(r[0],))
        c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(r[0],'Réinitialisation serveur du mot de passe',r[0],datetime.now(timezone.utc).isoformat()))
    print('Mot de passe modifié. Sessions fermées.')
else:
    if not a.output:p.error('--output requis')
    from cryptography.fernet import Fernet
    key=os.environ.get('BACKUP_KEY')
    if not key:p.error('BACKUP_KEY requise : clé Fernet distincte, conservée hors du serveur.')
    import tempfile,zipfile,io,json
    with tempfile.TemporaryDirectory() as tmp:
        target=Path(tmp)/'tchiva.sqlite3'
        src=sqlite3.connect(db);dst=sqlite3.connect(target);src.backup(dst);dst.close();src.close()
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
            z.write(target,'tchiva.sqlite3')
            encryption=os.environ.get('ENCRYPTION_KEY') or (data/'encryption.key').read_text().strip()
            z.writestr('encryption.key',encryption)
            z.writestr('metadata.json',json.dumps({'created_at':datetime.now(timezone.utc).isoformat(),'app':'Clinique Tchiva','format':1}))
        encrypted=Fernet(key.encode()).encrypt(buffer.getvalue())
        fd=os.open(a.output,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,'wb') as f:f.write(encrypted)
    print('Sauvegarde cohérente et chiffrée créée :',a.output)
    print('Conservez BACKUP_KEY séparément. Testez la restauration hors production.')
