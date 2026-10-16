"""Clinique Tchiva — application PostgreSQL/Neon et SQLite local, API et interface française."""
import os, re, json, secrets, hashlib, hmac, time, csv, io, threading
from pathlib import Path
from datetime import datetime, timedelta, date, timezone
from contextlib import contextmanager
import bcrypt
from cryptography.fernet import Fernet
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from database import Database, INTEGRITY_ERRORS, DATABASE_ERRORS
import logging

ROOT=Path(__file__).parent
STORE=Database()
DATA=STORE.data
DB=STORE.path
def private_file(name, value):
    if STORE.postgres:
        raise RuntimeError('Les secrets sont obligatoires en variables privées avec PostgreSQL ; aucun fichier de secours ne sera généré.')
    DATA.mkdir(parents=True,exist_ok=True,mode=0o700)
    path=DATA/name
    if not path.exists():
        fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,'w') as f:f.write(value)
    return path.read_text().strip()
KEY=os.environ.get('ENCRYPTION_KEY','').strip()
if STORE.postgres and not KEY:
    raise RuntimeError('Définissez ENCRYPTION_KEY (clé Fernet) dans les variables privées du déploiement.')
KEY=KEY or private_file('encryption.key',Fernet.generate_key().decode())
try:CIPHER=Fernet(KEY.encode())
except Exception:raise RuntimeError('ENCRYPTION_KEY doit être une clé Fernet valide, inchangée entre les déploiements.') from None
SECURE=os.environ.get('COOKIE_SECURE','1' if STORE.serverless else '0')=='1'
BASE_URL=os.environ.get('PUBLIC_URL','').rstrip('/')
app=FastAPI(title='Clinique Tchiva',docs_url=None,redoc_url=None,openapi_url=None)
@contextmanager
def db():
    STORE.initialize(DEFAULT)
    ensure_initial_admin()
    _sync_admin_phone()
    with STORE.connection() as con:yield con
def now(): return datetime.now(timezone.utc).isoformat()
def enc(x): return CIPHER.encrypt(str(x).encode()).decode()
def dec(x): return CIPHER.decrypt(x.encode()).decode() if x else ''
def digest(x): return hashlib.sha256(x.encode()).hexdigest()
DEFAULT={
 'name':'Clinique Tchiva','address':'Tazibouo, en face du Collège La Paix','city':'Daloa','phone':'+225 27 24 37 50 80','emergency_phone':'+225 07 88 97 55 16','reception_phones':['+225 07 07 99 54 14','+225 05 05 81 94 44'],'whatsapp':'+225 07 88 97 55 16','email':'','hours':'Accueil et consultations disponibles du lundi au samedi et urgences 24h/24.','about':'Au cœur de Daloa, la Clinique Tchiva vous accueille à Tazibouo, en face du Collège La Paix. Une équipe dévouée pour votre santé et celle de vos proches. Contactez notre accueil pour vous renseigner et organiser votre venue.',
 'specialties':[
   {'name':'Médecine générale','description':'Consultations adultes et pédiatriques, bilans de santé et suivi des pathologies chroniques : hypertension, diabète, paludisme.','published':True},
   {'name':'Ophtalmologie','description':'Examens de réfraction et acuité visuelle, dépistage de la cataracte et du glaucome, bilans ophtalmologiques complets.','published':True},
   {'name':'ORL','description':'Consultations et diagnostics des affections des oreilles, du nez et de la gorge, audiométrie et soins spécialisés.','published':True},
   {'name':'Laboratoire','description':'Prélèvements sur place, analyses biochimiques, hématologie (NFS), bilans à jeun et sérologies.','published':True},
   {'name':'Chirurgie','description':'Consultations chirurgicales spécialisées, petites chirurgies, pansements et suivi post-opératoire.','published':True}
 ],
 'team':[], 'schedules':[], 'map_url':'https://www.google.com/maps?q=6.90645,-6.43381&output=embed','plus_code':'WH48+HFJ Daloa','latitude':'6.90645','longitude':'-6.43381',
 'insurances':['CNAM','ASCOMA','SANLAM','AXA','GMC','MUGEF-CI','Autres mutuelles locales'],
 'privacy_contact':'', 'retention_days':180
}
# Fusion défensive : une base existante ne contient pas forcément les nouveaux réglages.
def settings():
    with db() as c:
        data=json.loads(c.execute('SELECT data FROM settings WHERE id=1').fetchone()[0])
        # Mise à niveau des anciennes installations créées sans offre de soins.
        # Le marqueur permet ensuite à l’administration de retirer des services
        # sans que chaque lecture ne les republie automatiquement.
        if not data.get('_services_catalog_v1'):
            if not data.get('specialties'):
                data['specialties']=json.loads(json.dumps(DEFAULT['specialties']))
            data['_services_catalog_v1']=True
            c.execute('UPDATE settings SET data=? WHERE id=1',(json.dumps(data),))
    for k,v in DEFAULT.items():
        if k not in data: data[k]=json.loads(json.dumps(v)) if isinstance(v,(list,dict)) else v
    return data

def log(c,user,action,entity): c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(user['id'],action,str(entity),now()))
def limit(request,key,max_count,seconds):
    # Sur Vercel, cet en-tête est fourni/écrasé par la plateforme.
    ip=(request.headers.get('x-vercel-forwarded-for') or request.headers.get('x-forwarded-for') or 'unknown').split(',')[0].strip() if STORE.serverless else (request.client.host if request.client else 'unknown')
    pseudonym=hmac.new(KEY.encode(),('tchiva-rate-v1:'+key+':'+ip).encode(),hashlib.sha256).hexdigest()
    t=time.time();bucket=int(t//seconds)
    with db() as c:
        c.execute('DELETE FROM rate_limits WHERE expires<?',(t,))
        count=c.execute('INSERT INTO rate_limits(key,bucket,count,expires) VALUES(?,?,1,?) ON CONFLICT(key,bucket) DO UPDATE SET count=rate_limits.count+1 RETURNING count',(pseudonym,bucket,(bucket+1)*seconds)).fetchone()[0]
    if count>max_count:raise HTTPException(429,'Trop de tentatives. Réessayez plus tard.')

@app.exception_handler(Exception)
async def unexpected_error(request,exc):
    # Ne jamais journaliser une URL de connexion, mot de passe ou corps de requête.
    logging.getLogger('tchiva').error('Erreur interne type=%s',type(exc).__name__)
    return JSONResponse({'detail':'Service temporairement indisponible. Réessayez ou contactez l’accueil.'},status_code=503,headers={'Cache-Control':'no-store'})

@app.middleware('http')
async def security(request,call_next):
    if request.method in ('POST','PATCH','PUT','DELETE'):
        origin=request.headers.get('origin')
        accepted={str(request.base_url).rstrip('/')}
        if BASE_URL: accepted.add(BASE_URL)
        if STORE.serverless:accepted.add('https://'+request.headers.get('host',''))
        if origin and origin.rstrip('/') not in accepted:
            return JSONResponse({'detail':'Origine non autorisée.'},status_code=403)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
    response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
    response.headers['Cross-Origin-Opener-Policy']='same-origin'
    response.headers['Cross-Origin-Resource-Policy']='same-origin'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; frame-ancestors 'self' https://*.arena.ai https://arena.ai https://*.e2b.app; base-uri 'self'; form-action 'self'"
    if STORE.serverless:
        response.headers['Content-Security-Policy']=response.headers['Content-Security-Policy'].replace("frame-ancestors 'self' https://*.arena.ai https://arena.ai https://*.e2b.app","frame-ancestors 'none'")
        response.headers['X-Frame-Options']='DENY'
    if request.url.path.startswith('/api') or request.url.path.startswith('/gestion'):
        response.headers['Cache-Control']='private, no-store'
        response.headers['Vercel-CDN-Cache-Control']='no-store'
    path=request.url.path
    if path.startswith('/static/img/') or path.startswith('/static/font-') or path.endswith('.jpg'):
        response.headers.setdefault('Cache-Control','public, max-age=86400, stale-while-revalidate=604800')
    if SECURE: response.headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains'
    return response

def auth(request:Request):
    token=request.cookies.get('tchiva_session','')
    with db() as c:
        row=c.execute('SELECT u.id,u.name,u.first_name,u.last_name,u.phone,u.email,u.role,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1',(digest(token),time.time())).fetchone()
    if not row: raise HTTPException(401,'Veuillez vous connecter.')
    user=dict(row)
    if request.method not in ('GET','HEAD') and not secrets.compare_digest(request.headers.get('x-csrf-token',''),user['csrf']): raise HTTPException(403,'Session de sécurité invalide. Rechargez la page.')
    return user

def allowed(user,*roles):
    if user['role']!='admin' and user['role'] not in roles: raise HTTPException(403,'Votre rôle ne permet pas cette opération.')

def text(x,n=200): return str(x).strip()[:n]
def valid_day(s,past=True):
    try: d=date.fromisoformat(s)
    except: raise HTTPException(422,'Date invalide.')
    if not past and (d<datetime.now(timezone.utc).date() or d>datetime.now(timezone.utc).date()+timedelta(days=180)): raise HTTPException(422,'Choisissez une date dans les 180 prochains jours.')
    return s

def valid_phone(s):
    s=re.sub(r'[\s().-]','',s)
    if not re.fullmatch(r'\+?\d{8,15}',s): raise HTTPException(422,'Numéro de téléphone invalide (8 à 15 chiffres).')
    return s

def valid_slot(s):
    if s and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',s): raise HTTPException(422,'Heure invalide.')

class Login(BaseModel):
    first_name:str=Field(min_length=1,max_length=100)
    last_name:str=Field(min_length=1,max_length=100)
    phone:str=Field(min_length=8,max_length=30)
    code:str=Field(min_length=12,max_length=72)

def normalize_phone(s):
    """Normalise un numéro : 07 XX XX XX XX → +22507XXXXXXXX.
    Tolère les espaces, points, tirets et parenthèses."""
    s=re.sub(r'[\s.\-()]+','',s)
    if not s:return ''
    if s.startswith('00'):s='+'+s[2:]
    elif s.startswith('0') and not s.startswith('+'):s='+225'+s
    elif not s.startswith('+'):s='+'+s
    return s

def password_hash(password):
    if len(password)<12 or len(password.encode())>72: raise HTTPException(422,'Le code personnel doit contenir au moins 12 caractères et au plus 72 octets.')
    return bcrypt.hashpw(password.encode(),bcrypt.gensalt())
def email_valid(email):
    email=email.strip().lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email): raise HTTPException(422,'Adresse e-mail invalide.')
    return email

# Installation privée : le navigateur ne peut pas choisir le premier admin.
# Les valeurs sont définies par le propriétaire dans les variables Vercel.
_BOOTSTRAP_CHECKED=False
_BOOTSTRAP_LOCK=threading.RLock()
def ensure_initial_admin():
    global _BOOTSTRAP_CHECKED
    if _BOOTSTRAP_CHECKED:return
    with _BOOTSTRAP_LOCK:
        if _BOOTSTRAP_CHECKED:return
        with STORE.connection() as c:
            c.execute('BEGIN IMMEDIATE')
            c.execute('CREATE TABLE IF NOT EXISTS bootstrap_state(id INTEGER PRIMARY KEY CHECK(id=1), initialized_at TEXT NOT NULL)')
            initialized=c.execute('SELECT 1 FROM bootstrap_state WHERE id=1').fetchone()
            if not initialized:
                existing=c.execute('SELECT 1 FROM users LIMIT 1').fetchone()
                if existing:
                    # Une mise à jour ne modifie jamais un compte/mot de passe existant.
                    c.execute('INSERT INTO bootstrap_state(id,initialized_at) VALUES(1,?)',(now(),))
                else:
                    family=os.environ.get('ADMIN_NOM','').strip()
                    given=os.environ.get('ADMIN_PRENOM','').strip()
                    phone=normalize_phone(os.environ.get('ADMIN_TEL','').strip())
                    code=os.environ.get('ADMIN_PASSWORD','')
                    if all((family,given,phone,code)):
                        try:
                            fullname=(given+' '+family).strip()
                            if len(fullname)>100 or len(phone)>30:raise HTTPException(422,'Configuration initiale invalide.')
                            hashed=password_hash(code)
                        except HTTPException:
                            logging.getLogger('tchiva').warning('Compte initial non créé : vérifier ADMIN_NOM, ADMIN_PRENOM, ADMIN_TEL et ADMIN_PASSWORD, sans afficher leurs valeurs.')
                        else:
                            uid=c.insert_id('INSERT INTO users(name,first_name,last_name,phone,password,role) VALUES(?,?,?,?,?,?)',(fullname,given,family,phone,hashed,'admin'))
                            c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(uid,'Création initiale privée du compte administrateur',str(uid),now()))
                            c.execute('INSERT INTO bootstrap_state(id,initialized_at) VALUES(1,?)',(now(),))
                    # Sans configuration complète, rester fermé, jamais d'inscription publique.
        _BOOTSTRAP_CHECKED=True

# Les comptes administrateur créés avant la migration « nom + prénom +
# téléphone + code » (authentification par e-mail) n'ont pas de téléphone en
# base : la connexion échouait avec « Identifiants incorrects ». Cette
# synchronisation les aligne sur les variables privées Vercel, une seule fois,
# sans requête SQL manuelle dans Neon.
_SYNC_CHECKED=False
_SYNC_LOCK=threading.RLock()
def _sync_admin_phone():
    global _SYNC_CHECKED
    if _SYNC_CHECKED:return
    with _SYNC_LOCK:
        if _SYNC_CHECKED:return
        logger=logging.getLogger('tchiva')
        family=os.environ.get('ADMIN_NOM','').strip()
        given=os.environ.get('ADMIN_PRENOM','').strip()
        phone=normalize_phone(os.environ.get('ADMIN_TEL','').strip())
        code=os.environ.get('ADMIN_PASSWORD','')
        if not all((family,given,phone,code)):
            # Configuration incomplète : on ne modifie rien. L'installation
            # reste fermée et aucune inscription publique n'est ouverte.
            _SYNC_CHECKED=True;return
        fullname=(given+' '+family).strip()
        if len(fullname)>100 or len(phone)>30:
            logger.warning('Synchronisation administrateur ignorée : ADMIN_NOM, ADMIN_PRENOM ou ADMIN_TEL hors limites, sans afficher leurs valeurs.')
            _SYNC_CHECKED=True;return
        try:hashed=password_hash(code)
        except HTTPException:
            logger.warning('Synchronisation administrateur ignorée : ADMIN_PASSWORD doit contenir au moins 12 caractères et au plus 72 octets, sans afficher sa valeur.')
            _SYNC_CHECKED=True;return
        try:
            with STORE.connection() as c:
                c.execute('BEGIN IMMEDIATE')
                rows=c.execute("SELECT id,phone FROM users WHERE role='admin' ORDER BY id").fetchall()
                legacy=[r for r in rows if not str(r['phone'] or '').strip()]
                if not legacy:_SYNC_CHECKED=True;return
                # Un seul compte est aligné : plusieurs administrateurs sans
                # téléphone partageraient sinon exactement les mêmes identifiants.
                uid=legacy[0]['id']
                c.execute('UPDATE users SET name=?,first_name=?,last_name=?,phone=?,password=? WHERE id=?',(fullname,given,family,phone,hashed,uid))
                # Déconnexion forcée : aucune session ne doit survivre à un
                # changement d'identifiants et de code personnel.
                c.execute('DELETE FROM sessions')
                c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(uid,'Synchronisation automatique du compte administrateur (téléphone manquant)',str(uid),now()))
                if len(legacy)>1:
                    logger.warning('Plusieurs comptes administrateur sans téléphone : seul le plus ancien a été synchronisé. Vérifiez les autres depuis /gestion → Paramètres → Comptes du personnel.')
                logger.info('Compte administrateur synchronisé avec la configuration privée ; toutes les sessions ont été fermées.')
        except DATABASE_ERRORS:
            # Base injoignable : rien n'est marqué comme fait, la
            # synchronisation sera retentée au prochain accès.
            logger.warning('Synchronisation administrateur reportée : base de données injoignable.')
            return
        _SYNC_CHECKED=True

@app.get('/api/public')
def public():
    s=settings()
    # Les attributs internes ne doivent jamais apparaître dans la réponse publique.
    for internal_key in ('_services_catalog_v1',):
        s.pop(internal_key, None)
    s['team']=[p for p in s['team'] if p.get('published')]
    # Les praticiens non publiés ne doivent pas fuiter via les plages horaires.
    published_names={p['name'] for p in s['team']}
    s['schedules']=[sc for sc in s.get('schedules',[]) if not sc.get('practitioner') or sc['practitioner'] in published_names]
    s['specialties']=[p for p in s['specialties'] if p.get('published')]
    with db() as c: needs_setup=not bool(c.execute('SELECT 1 FROM users LIMIT 1').fetchone())
    return {'settings':s,'needs_setup':needs_setup,'setup_mode':'private_admin'}

@app.post('/api/setup')
def setup_disabled():
    raise HTTPException(410,'L’inscription administrateur publique est désactivée. Le premier compte est créé depuis la configuration privée du propriétaire.')

@app.post('/api/login')
def login(payload:Login,request:Request):
    limit(request,'login',8,900)
    phone_norm=normalize_phone(payload.phone)
    fn=payload.first_name.strip().lower()
    ln=payload.last_name.strip().lower()
    with db() as c:
        # Recherche par téléphone normalisé + nom/prénom (casse et accents tolérés).
        u=None
        rows=c.execute('SELECT * FROM users WHERE phone=? AND active=1',(phone_norm,)).fetchall()
        for row in rows:
            r_first=(row['first_name'] or '').strip().lower()
            r_last=(row['last_name'] or '').strip().lower()
            if r_first==fn and r_last==ln:
                u=row;break
    # Constant-cost password check even for unknown account.
    h=u['password'] if u else b'$2b$12$BkCpQdfgNUB2PSdvT2DppeWDFY9xJkITM6IqmPQGWioeSHHfs2cNi'
    if not bcrypt.checkpw(payload.code.encode()[:72],h) or not u: raise HTTPException(401,'Identifiants incorrects.')
    token=secrets.token_urlsafe(32); csrf=secrets.token_urlsafe(24)
    with db() as c:
        c.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
        c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(digest(token),u['id'],csrf,time.time()+8*3600)); log(c,u,'Connexion','session')
    response=JSONResponse({'id':u['id'],'name':u['name'],'first_name':dict(u).get('first_name','') or '','last_name':dict(u).get('last_name','') or '','phone':dict(u).get('phone','') or '','email':dict(u).get('email','') or '','role':u['role'],'csrf':csrf})
    response.set_cookie('tchiva_session',token,httponly=True,secure=SECURE,samesite='lax',max_age=8*3600,path='/')
    return response

@app.get('/api/me')
def me(user=Depends(auth)): return user
@app.post('/api/logout')
def logout(request:Request,user=Depends(auth)):
    with db() as c:c.execute('DELETE FROM sessions WHERE token=?',(digest(request.cookies.get('tchiva_session','')),))
    r=JSONResponse({'ok':True});r.delete_cookie('tchiva_session',path='/');return r

class Appointment(BaseModel):
    patient:str=Field(min_length=2,max_length=120)
    phone:str=Field(min_length=8,max_length=30)
    service:str=Field(default='Demande de consultation',max_length=120)
    practitioner:str=Field(default='',max_length=100)
    day:str
    slot:str=Field(default='',max_length=5)
    privacy:bool
    consent:bool=False
    website:str=Field(default='',max_length=200)

@app.post('/api/appointments',status_code=201)
def create_appointment(p:Appointment,request:Request):
    limit(request,'appointment',8,3600)
    if p.website: raise HTTPException(422,'Demande invalide.')
    if not p.privacy: raise HTTPException(422,'Veuillez accepter le traitement de votre demande.')
    valid_day(p.day,False); valid_slot(p.slot); phone=valid_phone(p.phone)
    if p.slot and datetime.fromisoformat(p.day+'T'+p.slot)<datetime.now(timezone.utc).replace(tzinfo=None):raise HTTPException(422,'Le créneau souhaité est déjà passé.')
    s=settings()
    names=[x['name'] for x in s['specialties'] if x.get('published')]
    if p.service not in names+['Demande de consultation']:raise HTTPException(422,'Service non disponible.')
    doctors=[x['name'] for x in s['team'] if x.get('published')]
    if p.practitioner and p.practitioner not in doctors:raise HTTPException(422,'Praticien non disponible.')
    ref='TC-'+secrets.token_hex(4).upper()
    with db() as c:
        c.execute('INSERT INTO appointments(reference,patient,phone,service,practitioner,day,slot,consent,privacy_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',(ref,enc(text(p.patient,120)),enc(phone),p.service,p.practitioner,p.day,p.slot,int(p.consent),now(),now()))
    return {'reference':ref,'message':'Demande enregistrée. Le rendez-vous ne sera confirmé qu’après validation par la clinique.'}

@app.get('/api/availability')
def availability(day:str,practitioner:str=''):
    valid_day(day,False); s=settings(); weekday=date.fromisoformat(day).weekday(); slots=set()
    for schedule in s['schedules']:
        if schedule['weekday']==weekday and (not practitioner or schedule.get('practitioner','')==practitioner):
            start=datetime.fromisoformat(day+'T'+schedule['start']); end=datetime.fromisoformat(day+'T'+schedule['end'])
            while start<end:
                if start>datetime.now(timezone.utc).replace(tzinfo=None):slots.add(start.strftime('%H:%M'))
                start+=timedelta(minutes=schedule['minutes'])
    with db() as c:
        if practitioner:
            booked={r[0] for r in c.execute("SELECT slot FROM appointments WHERE day=? AND practitioner=? AND status='confirmed'",(day,practitioner))}
        else:booked=set() # Overall suggestions; staff assign a practitioner when confirming.
    return {'slots':sorted(slots-booked),'configured':bool(s['schedules'])}

@app.get('/api/admin/appointments')
def appointments(user=Depends(auth)):
    allowed(user,'reception','medical')
    with db() as c:
        rows=[dict(r) for r in c.execute('SELECT * FROM appointments ORDER BY day DESC,slot DESC,id DESC LIMIT 2000')]
        log(c,user,'Consultation de la liste','rendez-vous')
    for r in rows:r['patient']=dec(r['patient']);r['phone']=dec(r['phone'])
    return rows

class AppointmentUpdate(BaseModel):
    status:str
    day:str
    slot:str=Field(max_length=5)
    practitioner:str=Field(default='',max_length=100)

@app.patch('/api/admin/appointments/{id}')
def update_appointment(id:int,p:AppointmentUpdate,user=Depends(auth)):
    allowed(user,'reception','medical')
    if p.status not in ['pending','confirmed','completed','cancelled']:raise HTTPException(422,'Statut invalide.')
    valid_day(p.day);valid_slot(p.slot)
    if p.status=='confirmed' and not p.slot:raise HTTPException(422,'Une heure est requise pour confirmer.')
    doctors=[x['name'] for x in settings()['team'] if x.get('published')]
    if p.practitioner and p.practitioner not in doctors:raise HTTPException(422,'Choisissez un praticien publié.')
    try:
        with db() as c:
            c.execute('BEGIN IMMEDIATE')
            if not c.execute('SELECT 1 FROM appointments WHERE id=?',(id,)).fetchone():raise HTTPException(404,'Demande introuvable.')
            c.execute('UPDATE appointments SET status=?,day=?,slot=?,practitioner=? WHERE id=?',(p.status,p.day,p.slot,p.practitioner,id)); log(c,user,'Modification du rendez-vous',id)
    except INTEGRITY_ERRORS:raise HTTPException(409,'Ce créneau est déjà confirmé pour ce praticien.')
    return {'ok':True}

@app.post('/api/admin/appointments/{id}/reminder')
def reminder(id:int,user=Depends(auth)):
    allowed(user,'reception','medical')
    with db() as c:
        r=c.execute('SELECT * FROM appointments WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Demande introuvable.')
        if not r['consent'] or r['status']!='confirmed':raise HTTPException(422,'Un consentement aux rappels et un rendez-vous confirmé sont nécessaires.')
        if r['day']<datetime.now(timezone.utc).date().isoformat():raise HTTPException(422,'Le rendez-vous est passé.')
        log(c,user,'Préparation d’un rappel manuel (envoi non vérifié)',id)
    phone=dec(r['phone']).lstrip('+')
    if len(phone)==10:phone='225'+phone
    return {'phone':phone,'message':f"Bonjour, la Clinique Tchiva vous rappelle votre rendez-vous du {date.fromisoformat(r['day']).strftime('%d/%m/%Y')} à {r['slot']}, à Tazibouo, Daloa, en face du Collège La Paix. Merci de prévenir l’accueil en cas d’empêchement."}

class ConsentUpdate(BaseModel):
    consent:bool
    confirmation:bool
@app.patch('/api/admin/appointments/{id}/consent')
def update_consent(id:int,p:ConsentUpdate,user=Depends(auth)):
    allowed(user,'reception','medical')
    if not p.confirmation:raise HTTPException(422,'Confirmez avoir recueilli la demande du patient.')
    with db() as c:
        if not c.execute('SELECT 1 FROM appointments WHERE id=?',(id,)).fetchone():raise HTTPException(404,'Demande introuvable.')
        c.execute('UPDATE appointments SET consent=? WHERE id=?',(int(p.consent),id))
        log(c,user,'Consentement rappels : '+('accord recueilli' if p.consent else 'retrait demandé'),id)
    return {'ok':True}

@app.delete('/api/admin/appointments/{id}')
def delete_appointment(id:int,user=Depends(auth)):
    allowed(user)
    with db() as c:
        if c.execute('SELECT 1 FROM consultations WHERE appointment_id=?',(id,)).fetchone():raise HTTPException(409,'Rendez-vous lié à une consultation : appliquez la procédure de conservation.')
        c.execute('DELETE FROM appointments WHERE id=?',(id,));log(c,user,'Suppression d’une demande',id)
    return {'ok':True}

class Consultation(BaseModel):
    patient:str=Field(min_length=2,max_length=120)
    service:str=Field(min_length=2,max_length=120)
    practitioner:str=Field(default='',max_length=100)
    day:str
    amount:int=Field(ge=0,le=100000000)
    paid:int=Field(ge=0,le=100000000)
    appointment_id:int|None=None

@app.get('/api/admin/consultations')
def consultations(user=Depends(auth)):
    allowed(user,'medical')
    with db() as c:
        rows=[dict(r) for r in c.execute('SELECT * FROM consultations ORDER BY day DESC,id DESC LIMIT 2000')];log(c,user,'Consultation de la liste','consultations')
    for r in rows:r['patient']=dec(r['patient'])
    return rows

@app.post('/api/admin/consultations',status_code=201)
def create_consultation(p:Consultation,user=Depends(auth)):
    allowed(user,'medical');valid_day(p.day)
    if p.paid>p.amount:raise HTTPException(422,'L’encaissement ne peut pas dépasser le montant dû.')
    if p.day>datetime.now(timezone.utc).date().isoformat():raise HTTPException(422,'Une consultation ne peut être enregistrée à une date future.')
    try:
        with db() as c:
            c.execute('BEGIN IMMEDIATE')
            if p.appointment_id and not c.execute('SELECT 1 FROM appointments WHERE id=?',(p.appointment_id,)).fetchone():raise HTTPException(404,'Rendez-vous introuvable.')
            id=c.insert_id('INSERT INTO consultations(patient,service,practitioner,day,amount,paid,appointment_id,created_at) VALUES(?,?,?,?,?,?,?,?)',(enc(text(p.patient,120)),text(p.service,120),text(p.practitioner,100),p.day,p.amount,p.paid,p.appointment_id,now()))
            if p.paid:c.execute('INSERT INTO transactions(kind,category,label,amount,day,consultation_id,created_at) VALUES(?,?,?,?,?,?,?)',('income','Consultations',f'Encaissement consultation #{id}',p.paid,p.day,id,now()))
            if p.appointment_id:c.execute("UPDATE appointments SET status='completed' WHERE id=?",(p.appointment_id,))
            log(c,user,'Création consultation et encaissement',id)
    except INTEGRITY_ERRORS:raise HTTPException(409,'Ce rendez-vous possède déjà une consultation.')
    return {'id':id}

class Payment(BaseModel):
    amount:int=Field(gt=0,le=100000000)
@app.post('/api/admin/consultations/{id}/payment')
def payment(id:int,p:Payment,user=Depends(auth)):
    allowed(user,'medical','accounting')
    with db() as c:
        c.execute('BEGIN IMMEDIATE');r=c.execute('SELECT * FROM consultations WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Consultation introuvable.')
        if p.amount>r['amount']-r['paid']:raise HTTPException(422,'Le paiement dépasse le solde restant.')
        c.execute('UPDATE consultations SET paid=paid+? WHERE id=?',(p.amount,id))
        c.execute('INSERT INTO transactions(kind,category,label,amount,day,created_at) VALUES(?,?,?,?,?,?)',('income','Consultations',f'Complément consultation #{id}',p.amount,datetime.now(timezone.utc).date().isoformat(),now()));log(c,user,'Paiement complémentaire',id)
    return {'ok':True}

class Transaction(BaseModel):
    kind:str
    category:str=Field(min_length=2,max_length=80)
    label:str=Field(min_length=2,max_length=200)
    amount:int=Field(gt=0,le=100000000)
    day:str

@app.get('/api/admin/transactions')
def transactions(user=Depends(auth)):
    allowed(user,'accounting')
    with db() as c:return [dict(r) for r in c.execute('SELECT * FROM transactions ORDER BY day DESC,id DESC LIMIT 5000')]
@app.post('/api/admin/transactions',status_code=201)
def create_transaction(p:Transaction,user=Depends(auth)):
    allowed(user,'accounting');valid_day(p.day)
    if p.kind not in ['income','expense']:raise HTTPException(422,'Type invalide.')
    if p.day>datetime.now(timezone.utc).date().isoformat():raise HTTPException(422,'La date ne peut pas être future.')
    with db() as c:
        id=c.insert_id('INSERT INTO transactions(kind,category,label,amount,day,created_at) VALUES(?,?,?,?,?,?)',(p.kind,p.category,p.label,p.amount,p.day,now()));log(c,user,'Écriture financière',id)
    return {'id':id}

class Item(BaseModel):
    name:str=Field(min_length=2,max_length=100)
    unit:str=Field(min_length=1,max_length=30)
    quantity:int=Field(ge=0,le=10000000)
    threshold:int=Field(ge=0,le=10000000)
class Movement(BaseModel):
    delta:int=Field(ge=-10000000,le=10000000)
    reason:str=Field(min_length=2,max_length=180)
@app.get('/api/admin/inventory')
def inventory(user=Depends(auth)):
    allowed(user,'reception','medical','accounting')
    with db() as c:return [dict(r) for r in c.execute('SELECT * FROM inventory ORDER BY name')]
@app.post('/api/admin/inventory',status_code=201)
def create_item(p:Item,user=Depends(auth)):
    allowed(user,'reception','medical','accounting')
    try:
        with db() as c:
            id=c.insert_id('INSERT INTO inventory(name,unit,quantity,threshold) VALUES(?,?,?,?)',(p.name,p.unit,p.quantity,p.threshold))
            c.execute('INSERT INTO movements(item_id,delta,reason,created_at) VALUES(?,?,?,?)',(id,p.quantity,'Stock initial',now()));log(c,user,'Création consommable',id)
    except INTEGRITY_ERRORS:raise HTTPException(409,'Ce consommable existe déjà.')
    return {'id':id}
@app.post('/api/admin/inventory/{id}/movement')
def movement(id:int,p:Movement,user=Depends(auth)):
    allowed(user,'reception','medical','accounting')
    if not p.delta:raise HTTPException(422,'La quantité doit être non nulle.')
    with db() as c:
        c.execute('BEGIN IMMEDIATE');r=c.execute('SELECT quantity FROM inventory WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Article introuvable.')
        if r[0]+p.delta<0:raise HTTPException(422,'Stock insuffisant pour cette sortie.')
        c.execute('UPDATE inventory SET quantity=quantity+? WHERE id=?',(p.delta,id));c.execute('INSERT INTO movements(item_id,delta,reason,created_at) VALUES(?,?,?,?)',(id,p.delta,p.reason,now()));log(c,user,'Mouvement de stock',id)
    return {'ok':True}
@app.get('/api/admin/movements')
def movements(user=Depends(auth)):
    allowed(user,'reception','medical','accounting')
    with db() as c:return [dict(r) for r in c.execute('SELECT m.*,i.name FROM movements m JOIN inventory i ON i.id=m.item_id ORDER BY m.id DESC LIMIT 100')]

@app.get('/api/admin/summary')
def summary(user=Depends(auth)):
    with db() as c:
        result={'role':user['role']}
        if user['role'] in ['admin','reception','medical']:
            result.update({'pending':c.execute("SELECT COUNT(*) FROM appointments WHERE status='pending'").fetchone()[0], 'today':c.execute("SELECT COUNT(*) FROM appointments WHERE day=? AND status!='cancelled'",(datetime.now(timezone.utc).date().isoformat(),)).fetchone()[0]})
        if user['role'] in ['admin','accounting']:
            month=datetime.now(timezone.utc).date().strftime('%Y-%m')
            result['income']=c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='income' AND substr(day,1,7)=?",(month,)).fetchone()[0]
            result['expense']=c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='expense' AND substr(day,1,7)=?",(month,)).fetchone()[0]
        result['low_stock']=c.execute('SELECT COUNT(*) FROM inventory WHERE quantity<=threshold').fetchone()[0]
        if user['role']=='admin':result['audit']=[dict(r) for r in c.execute('SELECT a.*,u.name,u.first_name,u.last_name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8')]
    return result

@app.get('/api/admin/settings')
def admin_settings(user=Depends(auth)):
    allowed(user);return settings()
class Specialty(BaseModel):
    name:str=Field(min_length=2,max_length=100)
    description:str=Field(default='',max_length=500)
    published:bool=False
class Practitioner(BaseModel):
    name:str=Field(min_length=2,max_length=100)
    specialty:str=Field(max_length=100)
    bio:str=Field(default='',max_length=500)
    published:bool=False
class Schedule(BaseModel):
    weekday:int=Field(ge=0,le=6)
    start:str=Field(pattern=r'^(?:[01]\d|2[0-3]):[0-5]\d$')
    end:str=Field(pattern=r'^(?:[01]\d|2[0-3]):[0-5]\d$')
    minutes:int=Field(ge=10,le=120)
    practitioner:str=Field(default='',max_length=100)
class Settings(BaseModel):
    name:str=Field(min_length=2,max_length=100)
    address:str=Field(min_length=2,max_length=200)
    city:str=Field(min_length=2,max_length=100)
    phone:str=Field(default='',max_length=30)
    whatsapp:str=Field(default='',max_length=30)
    email:str=Field(default='',max_length=150)
    hours:str=Field(default='',max_length=1000)
    about:str=Field(max_length=2500)
    specialties:list[Specialty]=Field(max_length=50)
    team:list[Practitioner]=Field(max_length=50)
    schedules:list[Schedule]=Field(max_length=100)
    map_url:str=Field(default='',max_length=600)
    plus_code:str=Field(default='',max_length=60)
    latitude:str=Field(default='',max_length=20)
    longitude:str=Field(default='',max_length=20)
    emergency_phone:str=Field(default='',max_length=30)
    reception_phones:list[str]=Field(default_factory=list,max_length=6)
    insurances:list[str]=Field(default_factory=list,max_length=20)
    privacy_contact:str=Field(default='',max_length=200)
    retention_days:int=Field(default=180,ge=30,le=3650)
@app.put('/api/admin/settings')
def save_settings(p:Settings,user=Depends(auth)):
    allowed(user)
    if p.phone:valid_phone(p.phone)
    if p.whatsapp:valid_phone(p.whatsapp)
    if p.emergency_phone:valid_phone(p.emergency_phone)
    p.reception_phones=[valid_phone(x) for x in p.reception_phones if x.strip()]
    p.insurances=[text(x,60) for x in p.insurances if x.strip()]
    for field_name in ('latitude','longitude'):
        value=getattr(p,field_name).strip()
        if value:
            try:float(value)
            except ValueError:raise HTTPException(422,'Coordonnée GPS invalide (exemple : 6.90645).')
            if not re.fullmatch(r'-?\d{1,2}\.\d{1,8}',value):raise HTTPException(422,'Coordonnée GPS invalide (exemple : 6.90645).')
            setattr(p,field_name,value)
    if p.email:email_valid(p.email)
    if p.map_url and not (p.map_url.startswith('https://www.google.com/maps/embed?') or p.map_url.startswith('https://www.google.com/maps?')):raise HTTPException(422,'Utilisez une URL d’intégration https://www.google.com/maps?...')
    names=[x.name for x in p.team if x.published]
    for s in p.schedules:
        if s.end<=s.start:raise HTTPException(422,'La fin d’une plage doit être après le début.')
        if s.practitioner and s.practitioner not in names:raise HTTPException(422,'Une disponibilité doit être associée à un praticien publié.')
    with db() as c:c.execute('UPDATE settings SET data=? WHERE id=1',(json.dumps({**p.model_dump(), '_services_catalog_v1':True}),));log(c,user,'Modification des informations','configuration')
    return {'ok':True}

class UserCreate(BaseModel):
    first_name:str=Field(min_length=1,max_length=100)
    last_name:str=Field(min_length=1,max_length=100)
    phone:str=Field(min_length=8,max_length=30)
    code:str=Field(max_length=72)
    role:str
@app.get('/api/admin/users')
def users(user=Depends(auth)):
    allowed(user)
    with db() as c:return [dict(r) for r in c.execute('SELECT id,name,first_name,last_name,phone,email,role,active FROM users ORDER BY id')]
@app.post('/api/admin/users',status_code=201)
def create_user(p:UserCreate,user=Depends(auth)):
    allowed(user)
    if p.role not in ['admin','reception','medical','accounting']:raise HTTPException(422,'Rôle invalide.')
    if len(p.code)<12:raise HTTPException(422,'Le code personnel doit contenir au moins 12 caractères.')
    h=password_hash(p.code);phone_norm=normalize_phone(p.phone)
    if not phone_norm:raise HTTPException(422,'Numéro de téléphone invalide.')
    fullname=(p.first_name.strip()+' '+p.last_name.strip()).strip()
    try:
        with db() as c:
            # Vérifier qu'aucun compte actif n'a déjà ce téléphone.
            existing=c.execute('SELECT id FROM users WHERE phone=? AND active=1',(phone_norm,)).fetchone()
            if existing:raise HTTPException(409,'Un compte actif existe déjà avec ce numéro de téléphone.')
            id=c.insert_id('INSERT INTO users(name,first_name,last_name,phone,password,role) VALUES(?,?,?,?,?,?)',(fullname,p.first_name.strip(),p.last_name.strip(),phone_norm,h,p.role));log(c,user,'Création compte',id)
    except INTEGRITY_ERRORS:raise HTTPException(409,'Ce numéro de téléphone existe déjà.')
    return {'id':id}
@app.patch('/api/admin/users/{id}')
def disable_user(id:int,user=Depends(auth)):
    allowed(user)
    if id==user['id']:raise HTTPException(422,'Vous ne pouvez pas désactiver votre propre compte.')
    with db() as c:
        r=c.execute('SELECT active FROM users WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Compte introuvable.')
        c.execute('UPDATE users SET active=? WHERE id=?',(0 if r['active'] else 1,id));c.execute('DELETE FROM sessions WHERE user_id=?',(id,));log(c,user,'Activation / désactivation compte',id)
    return {'ok':True}
class PasswordChange(BaseModel):
    current:str=Field(max_length=72)
    password:str=Field(max_length=72)
@app.post('/api/admin/password')
def change_password(p:PasswordChange,user=Depends(auth)):
    with db() as c:
        h=c.execute('SELECT password FROM users WHERE id=?',(user['id'],)).fetchone()[0]
        if not bcrypt.checkpw(p.current.encode()[:72],h):raise HTTPException(422,'Code actuel incorrect.')
        c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(p.password),user['id']));c.execute('DELETE FROM sessions WHERE user_id=?',(user['id'],));log(c,user,'Changement de code personnel',user['id'])
    return {'ok':True}

class ResetCode(BaseModel):
    code:str=Field(min_length=12,max_length=72)
@app.post('/api/admin/users/{id}/reset-code')
def reset_user_code(id:int,p:ResetCode,user=Depends(auth)):
    """L'administrateur remet le code personnel d'un membre."""
    allowed(user)
    if id==user['id']:raise HTTPException(422,'Utilisez le changement de code depuis votre propre compte.')
    with db() as c:
        r=c.execute('SELECT id,name,active FROM users WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Compte introuvable.')
        if not r['active']:raise HTTPException(422,'Ce compte est désactivé.')
        c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(p.code),id))
        c.execute('DELETE FROM sessions WHERE user_id=?',(id,))
        log(c,user,'Remise du code personnel',id)
    return {'ok':True}

@app.get('/api/admin/audit')
def full_audit(user=Depends(auth)):
    """Journal d'activité complet, réservé à l'administrateur (direction)."""
    allowed(user)
    with db() as c:
        rows=[dict(r) for r in c.execute('SELECT a.id,a.user_id,a.action,a.entity,a.created_at,u.name,u.first_name,u.last_name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 200')]
        log(c,user,'Consultation journal d\'activité','audit')
    return rows

@app.get('/api/admin/report.csv')
def report(start:str,end:str,user=Depends(auth)):
    allowed(user,'accounting');valid_day(start);valid_day(end)
    if start>end:raise HTTPException(422,'Période invalide.')
    def safe(x):
        s=str(x)
        return "'"+s if s.lstrip().startswith(('=','+','-','@')) else s
    out=io.StringIO();writer=csv.writer(out,delimiter=';');writer.writerow(['Date','Type','Catégorie','Libellé','Montant (FCFA)'])
    with db() as c:
        for r in c.execute('SELECT day,kind,category,label,amount FROM transactions WHERE day BETWEEN ? AND ? ORDER BY day,id',(start,end)):writer.writerow([safe(r[k]) for k in r.keys()])
        log(c,user,'Export financier',f'{start} / {end}')
    return Response('\ufeff'+out.getvalue(),media_type='text/csv; charset=utf-8',headers={'Content-Disposition':f'attachment; filename="tchiva-finances-{start}-{end}.csv"'})

PUBLIC_PAGES={
 '':('Clinique Tchiva à Daloa · Votre santé, notre priorité','Clinique Tchiva à Daloa, Tazibouo, en face du Collège La Paix : urgences médicales 24h/24, médecine générale, ophtalmologie, ORL, laboratoire, chirurgie et demande de rendez-vous en ligne.'),
 'clinique':('La clinique · Clinique Tchiva Daloa','Découvrez la Clinique Tchiva à Tazibouo, Daloa : accueil, orientation, prise en charge assurance et urgences 24h/24.'),
 'services':('Nos services · Clinique Tchiva Daloa','Médecine générale, ophtalmologie, ORL, laboratoire d’analyses et chirurgie : fiches pratiques et consignes pour préparer votre venue à la Clinique Tchiva.'),
 'equipe':('Notre équipe · Clinique Tchiva Daloa','Équipe médicale de la Clinique Tchiva à Daloa : les profils sont publiés après validation par la direction.'),
 'contact':('Contact & accès à Tazibouo · Clinique Tchiva','Adresse, carte Google Maps, Plus Code WH48+HFJ Daloa, numéros du standard, des urgences 24h/24 et de l’accueil de la Clinique Tchiva.'),
 'rendez-vous':('Demande de rendez-vous · Clinique Tchiva Daloa','Demandez un rendez-vous à la Clinique Tchiva de Daloa : demande enregistrée et envoyée sur WhatsApp, confirmation par l’accueil.'),
 'confidentialite':('Confidentialité · Clinique Tchiva Daloa','Politique de confidentialité du site de la Clinique Tchiva : données collectées, usage, conservation et droits.'),
 'mentions-legales':('Mentions légales · Clinique Tchiva Daloa','Mentions légales du site de la Clinique Tchiva, Tazibouo, Daloa.'),
}
@app.get('/robots.txt')
def robots():
    return Response('User-agent: *\nAllow: /\nDisallow: /gestion\nDisallow: /api/\n'+(f'Sitemap: {BASE_URL}/sitemap.xml\n' if BASE_URL else ''),media_type='text/plain')
@app.get('/sitemap.xml')
def sitemap():
    if not BASE_URL:return Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',media_type='application/xml')
    from html import escape
    return Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{escape(BASE_URL+"/"+p)}</loc></url>' for p in PUBLIC_PAGES)+'</urlset>',media_type='application/xml')
app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
@app.get('/{path:path}')
def frontend(path:str=''):
    path=path.strip('/')
    if path.startswith('api/') or path.startswith('static/'):raise HTTPException(404,'Ressource introuvable.')
    known=path in PUBLIC_PAGES or path=='gestion' or path.startswith('gestion/')
    html=(ROOT/'static/index.html').read_text()
    s=settings()
    from html import escape
    title,description=PUBLIC_PAGES.get(path,('Clinique Tchiva · Espace sécurisé' if known else 'Page introuvable · Clinique Tchiva Daloa',PUBLIC_PAGES[''][1]))
    html=html.replace('__TITLE__',escape(title))
    html=html.replace('__DESCRIPTION__',escape(description,quote=True))
    # Image principale préchargée sur l’accueil (meilleur affichage initial).
    html=html.replace('__PRELOAD__','<link rel="preload" as="image" href="/static/hero-clinic.jpg" imagesrcset="/static/hero-clinic-720.jpg 720w, /static/hero-clinic.jpg 1400w" imagesizes="(max-width: 860px) 100vw, 46vw" fetchpriority="high">' if path=='' else '')
    schema={'@context':'https://schema.org','@type':'MedicalClinic','name':s['name'],'description':PUBLIC_PAGES[''][1],'address':{'@type':'PostalAddress','streetAddress':s['address'],'addressLocality':s['city'],'addressCountry':'CI'}}
    phones=[x for x in (s['phone'],s.get('emergency_phone','')) if x]
    if phones:schema['telephone']=phones[0] if len(phones)==1 else phones
    try:
        lat=float(str(s.get('latitude','')).strip());lng=float(str(s.get('longitude','')).strip())
        schema['geo']={'@type':'GeoCoordinates','latitude':lat,'longitude':lng}
        schema['hasMap']=f'https://www.google.com/maps?q={lat},{lng}'
    except ValueError:pass
    if s.get('plus_code'):schema['plusCode']=s['plus_code']
    if s.get('specialties'):schema['medicalSpecialty']=[x['name'] for x in s['specialties'] if x.get('published')]
    if s.get('insurances'):schema['paymentAccepted']='Tiers-payant : '+', '.join(s['insurances'])
    if BASE_URL:
        schema['url']=BASE_URL
        schema['logo']=BASE_URL+'/static/logo.png'
        schema['image']=[BASE_URL+'/static/hero-clinic.jpg',BASE_URL+'/static/logo.png']
    html=html.replace('__LOGO_META__',f'<meta property="og:image" content="{escape(BASE_URL+"/static/hero-clinic.jpg",quote=True)}"><meta property="og:image:alt" content="Clinique Tchiva à Daloa (illustration)"><meta property="og:url" content="{escape(BASE_URL+"/"+path,quote=True)}">' if BASE_URL else '')
    html=html.replace('__SCHEMA__',json.dumps(schema,ensure_ascii=False).replace('<','\\u003c'))
    html=html.replace('__CANONICAL__',f'<link rel="canonical" href="{escape(BASE_URL+"/"+path,quote=True)}">' if BASE_URL and path in PUBLIC_PAGES else '')
    html=html.replace('__ROBOTS__','noindex, nofollow' if (path.startswith('gestion') or not known) else 'index, follow')
    # Une adresse inconnue renvoie la page « introuvable » de l’interface avec un vrai statut 404.
    return Response(html,media_type='text/html',status_code=200 if known else 404)
