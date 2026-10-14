"""Clinique Tchiva — application mono-instance, SQLite, API et interface française."""
import os, re, json, sqlite3, secrets, hashlib, time, csv, io
from pathlib import Path
from datetime import datetime, timedelta, date, timezone
from collections import defaultdict, deque
from contextlib import contextmanager
import bcrypt
from cryptography.fernet import Fernet
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT=Path(__file__).parent
DATA=Path(os.environ.get('DATA_DIR',ROOT/'data')); DATA.mkdir(parents=True,exist_ok=True,mode=0o700)
DB=DATA/'tchiva.sqlite3'
def private_file(name, value):
    path=DATA/name
    if not path.exists():
        fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,'w') as f: f.write(value)
    return path.read_text().strip()
KEY=os.environ.get('ENCRYPTION_KEY') or private_file('encryption.key',Fernet.generate_key().decode())
CIPHER=Fernet(KEY.encode())
SETUP_KEY=os.environ.get('SETUP_KEY') or private_file('setup.key',secrets.token_urlsafe(24))
SECURE=os.environ.get('COOKIE_SECURE','0')=='1'
BASE_URL=os.environ.get('PUBLIC_URL','').rstrip('/')
app=FastAPI(title='Clinique Tchiva',docs_url=None,redoc_url=None,openapi_url=None)
@contextmanager
def db():
    con=sqlite3.connect(DB,timeout=15); con.row_factory=sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON'); con.execute('PRAGMA busy_timeout=15000')
    try: yield con; con.commit()
    except: con.rollback(); raise
    finally: con.close()
def now(): return datetime.now(timezone.utc).isoformat()
def enc(x): return CIPHER.encrypt(str(x).encode()).decode()
def dec(x): return CIPHER.decrypt(x.encode()).decode() if x else ''
def digest(x): return hashlib.sha256(x.encode()).hexdigest()
DEFAULT={
 'name':'Clinique Tchiva','address':'Tazibouo, en face du Collège La Paix','city':'Daloa','phone':'','whatsapp':'','email':'','hours':'','about':'Au cœur de Daloa, la Clinique Tchiva vous accueille à Tazibouo, en face du Collège La Paix. Contactez notre accueil pour vous renseigner et organiser votre venue.',
 'specialties':[], 'team':[], 'schedules':[], 'map_url':'', 'privacy_contact':'', 'retention_days':180
}
with db() as c:
    c.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password BLOB NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, reference TEXT UNIQUE NOT NULL, patient TEXT NOT NULL, phone TEXT NOT NULL, service TEXT NOT NULL, practitioner TEXT NOT NULL DEFAULT '', day TEXT NOT NULL, slot TEXT NOT NULL, consent INTEGER NOT NULL, privacy_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS confirmed_slot ON appointments(day,slot,practitioner) WHERE status='confirmed' AND slot!='';
    CREATE TABLE IF NOT EXISTS consultations(id INTEGER PRIMARY KEY, patient TEXT NOT NULL, service TEXT NOT NULL, practitioner TEXT NOT NULL, day TEXT NOT NULL, amount INTEGER NOT NULL, paid INTEGER NOT NULL, appointment_id INTEGER UNIQUE REFERENCES appointments(id), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, kind TEXT NOT NULL, category TEXT NOT NULL, label TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), day TEXT NOT NULL, consultation_id INTEGER UNIQUE REFERENCES consultations(id), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inventory(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, unit TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>=0), threshold INTEGER NOT NULL CHECK(threshold>=0));
    CREATE TABLE IF NOT EXISTS movements(id INTEGER PRIMARY KEY, item_id INTEGER REFERENCES inventory(id), delta INTEGER NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, entity TEXT NOT NULL, created_at TEXT NOT NULL);
    ''')
    c.execute('INSERT OR IGNORE INTO settings VALUES(1,?)',(json.dumps(DEFAULT,ensure_ascii=False),))
    c.execute('DELETE FROM sessions WHERE expires < ?',(time.time(),))
    os.chmod(DB,0o600)

def settings():
    with db() as c: return json.loads(c.execute('SELECT data FROM settings WHERE id=1').fetchone()[0])
def log(c,user,action,entity): c.execute('INSERT INTO audit(user_id,action,entity,created_at) VALUES(?,?,?,?)',(user['id'],action,str(entity),now()))
LIMITS=defaultdict(deque)
def limit(request,key,max_count,seconds):
    # The deployment proxy must pass a trustworthy client IP via uvicorn's configured proxy allowlist.
    ip=request.client.host if request.client else 'unknown'; k=(key,ip); q=LIMITS[k]; t=time.time()
    while q and q[0]<t-seconds:q.popleft()
    if len(q)>=max_count: raise HTTPException(429,'Trop de tentatives. Réessayez plus tard.')
    q.append(t)
    if len(LIMITS)>10000:
        for x in list(LIMITS):
            if not LIMITS[x] or LIMITS[x][-1]<t-86400: del LIMITS[x]

@app.middleware('http')
async def security(request,call_next):
    if request.method in ('POST','PATCH','PUT','DELETE'):
        origin=request.headers.get('origin')
        accepted={str(request.base_url).rstrip('/')}
        if BASE_URL: accepted.add(BASE_URL)
        if origin and origin.rstrip('/') not in accepted:
            return JSONResponse({'detail':'Origine non autorisée.'},status_code=403)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
    response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; frame-ancestors 'self' https://*.arena.ai https://arena.ai https://*.e2b.app; base-uri 'self'; form-action 'self'"
    if request.url.path.startswith('/api'): response.headers['Cache-Control']='no-store'
    if SECURE: response.headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains'
    return response

def auth(request:Request):
    token=request.cookies.get('tchiva_session','')
    with db() as c:
        row=c.execute('SELECT u.id,u.name,u.email,u.role,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1',(digest(token),time.time())).fetchone()
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
    if not past and (d<date.today() or d>date.today()+timedelta(days=180)): raise HTTPException(422,'Choisissez une date dans les 180 prochains jours.')
    return s

def valid_phone(s):
    s=re.sub(r'[\s().-]','',s)
    if not re.fullmatch(r'\+?\d{8,15}',s): raise HTTPException(422,'Numéro de téléphone invalide (8 à 15 chiffres).')
    return s

def valid_slot(s):
    if s and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',s): raise HTTPException(422,'Heure invalide.')

class Login(BaseModel):
    email:str=Field(min_length=3,max_length=150)
    password:str=Field(min_length=1,max_length=72)
class Setup(Login):
    key:str=Field(max_length=150)
    name:str=Field(min_length=2,max_length=100)

def password_hash(password):
    if len(password)<12 or len(password.encode())>72: raise HTTPException(422,'Le mot de passe doit contenir au moins 12 caractères et au plus 72 octets.')
    return bcrypt.hashpw(password.encode(),bcrypt.gensalt())
def email_valid(email):
    email=email.strip().lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email): raise HTTPException(422,'Adresse e-mail invalide.')
    return email

@app.get('/api/public')
def public():
    s=settings()
    s['team']=[p for p in s['team'] if p.get('published')]
    s['specialties']=[p for p in s['specialties'] if p.get('published')]
    with db() as c: needs_setup=not bool(c.execute('SELECT 1 FROM users LIMIT 1').fetchone())
    return {'settings':s,'needs_setup':needs_setup}

@app.post('/api/setup',status_code=201)
def setup(payload:Setup,request:Request):
    limit(request,'setup',5,900)
    if not secrets.compare_digest(payload.key,SETUP_KEY): raise HTTPException(403,'Code d’installation incorrect.')
    h=password_hash(payload.password); email=email_valid(payload.email)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if c.execute('SELECT 1 FROM users LIMIT 1').fetchone(): raise HTTPException(409,'Installation déjà terminée.')
        c.execute('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)',(text(payload.name,100),email,h,'admin'))
    return {'ok':True}

@app.post('/api/login')
def login(payload:Login,request:Request):
    limit(request,'login',8,900)
    with db() as c: u=c.execute('SELECT * FROM users WHERE email=? AND active=1',(payload.email.lower().strip(),)).fetchone()
    # Constant-cost password check even for unknown account.
    h=u['password'] if u else b'$2b$12$BkCpQdfgNUB2PSdvT2DppeWDFY9xJkITM6IqmPQGWioeSHHfs2cNi'
    if not bcrypt.checkpw(payload.password.encode()[:72],h) or not u: raise HTTPException(401,'Identifiants incorrects.')
    token=secrets.token_urlsafe(32); csrf=secrets.token_urlsafe(24)
    with db() as c:
        c.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
        c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(digest(token),u['id'],csrf,time.time()+8*3600)); log(c,u,'Connexion','session')
    response=JSONResponse({'id':u['id'],'name':u['name'],'email':u['email'],'role':u['role'],'csrf':csrf})
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
    if p.slot and datetime.fromisoformat(p.day+'T'+p.slot)<datetime.now():raise HTTPException(422,'Le créneau souhaité est déjà passé.')
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
                if start>datetime.now():slots.add(start.strftime('%H:%M'))
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
    except sqlite3.IntegrityError:raise HTTPException(409,'Ce créneau est déjà confirmé pour ce praticien.')
    return {'ok':True}

@app.post('/api/admin/appointments/{id}/reminder')
def reminder(id:int,user=Depends(auth)):
    allowed(user,'reception','medical')
    with db() as c:
        r=c.execute('SELECT * FROM appointments WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Demande introuvable.')
        if not r['consent'] or r['status']!='confirmed':raise HTTPException(422,'Un consentement aux rappels et un rendez-vous confirmé sont nécessaires.')
        if r['day']<date.today().isoformat():raise HTTPException(422,'Le rendez-vous est passé.')
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
    if p.day>date.today().isoformat():raise HTTPException(422,'Une consultation ne peut être enregistrée à une date future.')
    try:
        with db() as c:
            c.execute('BEGIN IMMEDIATE')
            if p.appointment_id and not c.execute('SELECT 1 FROM appointments WHERE id=?',(p.appointment_id,)).fetchone():raise HTTPException(404,'Rendez-vous introuvable.')
            id=c.execute('INSERT INTO consultations(patient,service,practitioner,day,amount,paid,appointment_id,created_at) VALUES(?,?,?,?,?,?,?,?)',(enc(text(p.patient,120)),text(p.service,120),text(p.practitioner,100),p.day,p.amount,p.paid,p.appointment_id,now())).lastrowid
            if p.paid:c.execute('INSERT INTO transactions(kind,category,label,amount,day,consultation_id,created_at) VALUES(?,?,?,?,?,?,?)',('income','Consultations',f'Encaissement consultation #{id}',p.paid,p.day,id,now()))
            if p.appointment_id:c.execute("UPDATE appointments SET status='completed' WHERE id=?",(p.appointment_id,))
            log(c,user,'Création consultation et encaissement',id)
    except sqlite3.IntegrityError:raise HTTPException(409,'Ce rendez-vous possède déjà une consultation.')
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
        c.execute('INSERT INTO transactions(kind,category,label,amount,day,created_at) VALUES(?,?,?,?,?,?)',('income','Consultations',f'Complément consultation #{id}',p.amount,date.today().isoformat(),now()));log(c,user,'Paiement complémentaire',id)
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
    if p.day>date.today().isoformat():raise HTTPException(422,'La date ne peut pas être future.')
    with db() as c:
        id=c.execute('INSERT INTO transactions(kind,category,label,amount,day,created_at) VALUES(?,?,?,?,?,?)',(p.kind,p.category,p.label,p.amount,p.day,now())).lastrowid;log(c,user,'Écriture financière',id)
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
            id=c.execute('INSERT INTO inventory(name,unit,quantity,threshold) VALUES(?,?,?,?)',(p.name,p.unit,p.quantity,p.threshold)).lastrowid
            c.execute('INSERT INTO movements(item_id,delta,reason,created_at) VALUES(?,?,?,?)',(id,p.quantity,'Stock initial',now()));log(c,user,'Création consommable',id)
    except sqlite3.IntegrityError:raise HTTPException(409,'Ce consommable existe déjà.')
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
            result.update({'pending':c.execute("SELECT COUNT(*) FROM appointments WHERE status='pending'").fetchone()[0], 'today':c.execute("SELECT COUNT(*) FROM appointments WHERE day=? AND status!='cancelled'",(date.today().isoformat(),)).fetchone()[0]})
        if user['role'] in ['admin','accounting']:
            month=date.today().strftime('%Y-%m')
            result['income']=c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='income' AND substr(day,1,7)=?",(month,)).fetchone()[0]
            result['expense']=c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='expense' AND substr(day,1,7)=?",(month,)).fetchone()[0]
        result['low_stock']=c.execute('SELECT COUNT(*) FROM inventory WHERE quantity<=threshold').fetchone()[0]
        if user['role']=='admin':result['audit']=[dict(r) for r in c.execute('SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8')]
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
    privacy_contact:str=Field(default='',max_length=200)
    retention_days:int=Field(default=180,ge=30,le=3650)
@app.put('/api/admin/settings')
def save_settings(p:Settings,user=Depends(auth)):
    allowed(user)
    if p.phone:valid_phone(p.phone)
    if p.whatsapp:valid_phone(p.whatsapp)
    if p.email:email_valid(p.email)
    if p.map_url and not p.map_url.startswith('https://www.google.com/maps/embed?'):raise HTTPException(422,'Utilisez une URL d’intégration https://www.google.com/maps/embed?...')
    names=[x.name for x in p.team if x.published]
    for s in p.schedules:
        if s.end<=s.start:raise HTTPException(422,'La fin d’une plage doit être après le début.')
        if s.practitioner and s.practitioner not in names:raise HTTPException(422,'Une disponibilité doit être associée à un praticien publié.')
    with db() as c:c.execute('UPDATE settings SET data=? WHERE id=1',(p.model_dump_json(),));log(c,user,'Modification des informations','configuration')
    return {'ok':True}

class UserCreate(BaseModel):
    name:str=Field(min_length=2,max_length=100)
    email:str=Field(max_length=150)
    password:str=Field(max_length=72)
    role:str
@app.get('/api/admin/users')
def users(user=Depends(auth)):
    allowed(user)
    with db() as c:return [dict(r) for r in c.execute('SELECT id,name,email,role,active FROM users ORDER BY id')]
@app.post('/api/admin/users',status_code=201)
def create_user(p:UserCreate,user=Depends(auth)):
    allowed(user)
    if p.role not in ['admin','reception','medical','accounting']:raise HTTPException(422,'Rôle invalide.')
    h=password_hash(p.password);email=email_valid(p.email)
    try:
        with db() as c:
            id=c.execute('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)',(p.name,email,h,p.role)).lastrowid;log(c,user,'Création compte',id)
    except sqlite3.IntegrityError:raise HTTPException(409,'Cet e-mail existe déjà.')
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
        if not bcrypt.checkpw(p.current.encode()[:72],h):raise HTTPException(422,'Mot de passe actuel incorrect.')
        c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(p.password),user['id']));c.execute('DELETE FROM sessions WHERE user_id=?',(user['id'],));log(c,user,'Changement de mot de passe',user['id'])
    return {'ok':True}

@app.get('/api/admin/report.csv')
def report(start:str,end:str,user=Depends(auth)):
    allowed(user,'accounting');valid_day(start);valid_day(end)
    if start>end:raise HTTPException(422,'Période invalide.')
    def safe(x):
        s=str(x)
        return "'"+s if s.lstrip().startswith(('=','+','-','@')) else s
    out=io.StringIO();writer=csv.writer(out,delimiter=';');writer.writerow(['Date','Type','Catégorie','Libellé','Montant (FCFA)'])
    with db() as c:
        for r in c.execute('SELECT day,kind,category,label,amount FROM transactions WHERE day BETWEEN ? AND ? ORDER BY day,id',(start,end)):writer.writerow([safe(x) for x in r])
        log(c,user,'Export financier',f'{start} / {end}')
    return Response('\ufeff'+out.getvalue(),media_type='text/csv; charset=utf-8',headers={'Content-Disposition':f'attachment; filename="tchiva-finances-{start}-{end}.csv"'})

@app.get('/robots.txt')
def robots():
    return Response('User-agent: *\nAllow: /\nDisallow: /gestion\nDisallow: /api/\n'+(f'Sitemap: {BASE_URL}/sitemap.xml\n' if BASE_URL else ''),media_type='text/plain')
@app.get('/sitemap.xml')
def sitemap():
    if not BASE_URL:return Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',media_type='application/xml')
    from html import escape
    return Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{escape(BASE_URL+p)}</loc></url>' for p in ['/','/clinique','/services','/equipe','/contact','/rendez-vous'])+'</urlset>',media_type='application/xml')
app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
@app.get('/{path:path}')
def frontend(path:str=''):
    if path and path not in ['clinique','services','equipe','contact','rendez-vous','confidentialite','mentions-legales','gestion'] and not path.startswith('gestion/'):raise HTTPException(404,'Page introuvable.')
    html=(ROOT/'static/index.html').read_text()
    s=settings()
    from html import escape
    titles={'':'Clinique Tchiva à Daloa · Votre santé, notre priorité','services':'Services et spécialités · Clinique Tchiva Daloa','equipe':'Équipe médicale · Clinique Tchiva Daloa','contact':'Contact et accès à Tazibouo · Clinique Tchiva','rendez-vous':'Demande de rendez-vous · Clinique Tchiva Daloa','clinique':'Notre clinique à Daloa · Clinique Tchiva'}
    html=html.replace('__TITLE__',escape(titles.get(path,'Clinique Tchiva · Espace sécurisé')))
    schema={'@context':'https://schema.org','@type':'MedicalClinic','name':s['name'],'address':{'@type':'PostalAddress','streetAddress':s['address'],'addressLocality':s['city'],'addressCountry':'CI'}}
    if s['phone']:schema['telephone']=s['phone']
    if BASE_URL:schema['url']=BASE_URL
    html=html.replace('__SCHEMA__',json.dumps(schema,ensure_ascii=False).replace('<','\\u003c'))
    html=html.replace('__CANONICAL__',f'<link rel="canonical" href="{escape(BASE_URL+"/"+path,quote=True)}">' if BASE_URL else '')
    html=html.replace('__ROBOTS__','noindex, nofollow' if path.startswith('gestion') else 'index, follow')
    return Response(html,media_type='text/html')
