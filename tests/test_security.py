"""Tests de régression pour la sécurité : endpoints publics, autorisations, CSRF."""
import json
import os
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path

# Forcer le mode SQLite local avant l'import de l'application.
os.environ.pop('DATABASE_URL', None)
os.environ.pop('VERCEL', None)
os.environ.pop('COOKIE_SECURE', None)

ROOT = Path(__file__).resolve().parents[1]

# Utiliser un répertoire temporaire pour les données locales.
_tmpdir = tempfile.mkdtemp(prefix='tchiva_test_')
os.environ['DATA_DIR'] = _tmpdir

# Créer une clé Fernet de test.
from cryptography.fernet import Fernet
_test_key = Fernet.generate_key().decode()
os.environ['ENCRYPTION_KEY'] = _test_key

# Définir les variables pour le compte initial admin.
os.environ['ADMIN_NOM'] = 'Test'
os.environ['ADMIN_PRENOM'] = 'Admin'
os.environ['ADMIN_TEL'] = '+2250707995414'
os.environ['ADMIN_PASSWORD'] = 'MotDePasse1234!'

import app as app_module


def fresh_client():
    """Crée un nouveau client sans cookies ni session."""
    from fastapi.testclient import TestClient
    return TestClient(app_module.app)


class PublicEndpointTests(unittest.TestCase):
    """Vérifie qu'aucune donnée sensible n'est exposée publiquement."""

    def test_public_settings_no_internal_markers(self):
        """Le marqueur _services_catalog_v1 ne doit pas apparaître dans /api/public."""
        r = fresh_client().get('/api/public')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertNotIn('_services_catalog_v1', data.get('settings', {}))

    def test_public_no_user_data(self):
        """Aucun utilisateur, rendez-vous, consultation ou transaction n'est exposé."""
        r = fresh_client().get('/api/public')
        self.assertEqual(r.status_code, 200)
        body = r.text
        for forbidden in ('"password"', '"token"', '"csrf"'):
            self.assertNotIn(forbidden, body.lower())

    def test_public_no_appointments_or_consultations(self):
        """Les endpoints publics ne retournent aucun rendez-vous ni consultation."""
        for path in ['/api/public', '/api/availability?day=2026-12-01']:
            r = fresh_client().get(path)
            self.assertEqual(r.status_code, 200)
            data = r.json()
            self.assertNotIn('appointments', data)
            self.assertNotIn('patients', data)
            self.assertNotIn('consultations', data)

    def test_public_only_published_team(self):
        """Seuls les praticiens publiés apparaissent dans les données publiques."""
        r = fresh_client().get('/api/public')
        self.assertEqual(r.status_code, 200)
        team = r.json()['settings']['team']
        for member in team:
            self.assertTrue(member.get('published', False))

    def test_public_schedules_no_unpublished_practitioners(self):
        """Les plages horaires ne révèlent pas de praticien non publié."""
        r = fresh_client().get('/api/public')
        self.assertEqual(r.status_code, 200)
        schedules = r.json()['settings'].get('schedules', [])
        published_names = {p['name'] for p in r.json()['settings']['team']}
        for sc in schedules:
            if sc.get('practitioner'):
                self.assertIn(sc['practitioner'], published_names,
                              f"Praticien non publié exposé : {sc['practitioner']}")

    def test_setup_endpoint_disabled(self):
        """L'inscription publique est définitivement désactivée."""
        r = fresh_client().post('/api/setup')
        self.assertEqual(r.status_code, 410)

    def test_robots_txt_blocks_api_and_gestion(self):
        """Le robots.txt interdit l'indexation de /api/ et /gestion."""
        r = fresh_client().get('/robots.txt')
        self.assertEqual(r.status_code, 200)
        body = r.text
        self.assertIn('/api/', body)
        self.assertIn('/gestion', body)
        self.assertIn('Disallow', body)

    def test_public_known_page_returns_200(self):
        """Les pages publiques connues retournent 200."""
        r = fresh_client().get('/')
        self.assertEqual(r.status_code, 200)

    def test_public_unknown_page_returns_404(self):
        """Les pages inconnues retournent 404."""
        r = fresh_client().get('/page-qui-n-existe-pas')
        self.assertEqual(r.status_code, 404)


class AuthenticationTests(unittest.TestCase):
    """Vérifie que les endpoints admin exigent l'authentification."""

    ADMIN_ENDPOINTS = [
        ('get', '/api/admin/appointments'),
        ('get', '/api/admin/consultations'),
        ('get', '/api/admin/transactions'),
        ('get', '/api/admin/inventory'),
        ('get', '/api/admin/movements'),
        ('get', '/api/admin/summary'),
        ('get', '/api/admin/settings'),
        ('get', '/api/admin/users'),
    ]

    def test_unauthenticated_admin_endpoints_rejected(self):
        """Tous les endpoints admin renvoient 401 sans authentification."""
        c = fresh_client()
        for method, path in self.ADMIN_ENDPOINTS:
            r = getattr(c, method)(path)
            self.assertIn(r.status_code, (401, 403),
                          f"{method.upper()} {path} devrait être refusé sans authentification (reçu {r.status_code})")

    def test_me_requires_auth(self):
        """L'endpoint /api/me exige l'authentification."""
        r = fresh_client().get('/api/me')
        self.assertIn(r.status_code, (401, 403))

    def test_logout_requires_auth(self):
        """La déconnexion exige l'authentification."""
        r = fresh_client().post('/api/logout')
        self.assertIn(r.status_code, (401, 403))

    def test_admin_csv_report_requires_auth(self):
        """Le rapport CSV exige l'authentification."""
        r = fresh_client().get('/api/admin/report.csv?start=2026-01-01&end=2026-01-31')
        self.assertIn(r.status_code, (401, 403))

    def test_login_wrong_credentials(self):
        """Un mauvais mot de passe renvoie 401 sans révéler si le compte existe."""
        r = fresh_client().post('/api/login', json={'first_name': 'Nobody', 'last_name': 'None', 'phone': '+22500000000', 'code': 'wrongpassword1'})
        self.assertEqual(r.status_code, 401)
        self.assertNotIn('inconnu', r.json().get('detail', '').lower())
        self.assertNotIn('existe', r.json().get('detail', '').lower())


class AuthenticatedAdminTests(unittest.TestCase):
    """Vérifie le contrôle d'accès après authentification admin."""

    @classmethod
    def setUpClass(cls):
        c = fresh_client()
        r = c.post('/api/login', json={'first_name': 'Admin', 'last_name': 'Test', 'phone': '+2250707995414', 'code': 'MotDePasse1234!'})
        if r.status_code == 200:
            cls.client = c
            cls.csrf = r.json().get('csrf', '')
            cls.admin_ok = True
        else:
            cls.admin_ok = False

    def _headers(self):
        return {'x-csrf-token': self.csrf}

    @unittest.skipUnless(True, "always run")
    def test_admin_can_access_summary(self):
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        r = self.client.get('/api/admin/summary')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data['role'], 'admin')

    @unittest.skipUnless(True, "always run")
    def test_admin_can_access_settings(self):
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        r = self.client.get('/api/admin/settings')
        self.assertEqual(r.status_code, 200)

    @unittest.skipUnless(True, "always run")
    def test_admin_can_list_users(self):
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        r = self.client.get('/api/admin/users')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIsInstance(data, list)
        self.assertTrue(len(data) >= 1)

    @unittest.skipUnless(True, "always run")
    def test_admin_me_returns_user_info(self):
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        r = self.client.get('/api/me')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn('role', data)
        self.assertEqual(data['role'], 'admin')

    @unittest.skipUnless(True, "always run")
    def test_csrf_required_for_mutation(self):
        """Les mutations POST sans CSRF sont rejetées même avec session valide."""
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        # Créer un nouveau client avec les cookies admin mais SANS CSRF
        from fastapi.testclient import TestClient
        c2 = TestClient(app_module.app, cookies=dict(self.client.cookies))
        r = c2.post('/api/admin/users', json={
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '+2250700000001',
            'code': 'MotDePasse5678!',
            'role': 'reception',
        })
        self.assertEqual(r.status_code, 403)

    @unittest.skipUnless(True, "always run")
    def test_admin_can_mutation_with_csrf(self):
        """Les mutations POST avec CSRF fonctionnent pour l'admin."""
        if not self.admin_ok:
            self.skipTest("Admin non connecté")
        r = self.client.post('/api/admin/users', headers=self._headers(), json={
            'first_name': 'Test',
            'last_name': 'Reception',
            'phone': '+2250700000002',
            'code': 'MotDePasse5678!',
            'role': 'reception',
        })
        self.assertIn(r.status_code, (201, 409))  # 409 si téléphone existe déjà


class SecurityHeadersTests(unittest.TestCase):
    """Vérifie les en-têtes de sécurité sur les réponses."""

    def test_security_headers_present(self):
        r = fresh_client().get('/api/public')
        headers = r.headers
        self.assertEqual(headers.get('x-content-type-options'), 'nosniff')
        self.assertEqual(headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
        self.assertIn('camera=()', headers.get('permissions-policy', ''))

    def test_no_cache_on_api(self):
        r = fresh_client().get('/api/public')
        cache = r.headers.get('cache-control', '')
        self.assertIn('no-store', cache)

    def test_csp_header_present(self):
        r = fresh_client().get('/')
        self.assertIn('content-security-policy', r.headers)
        csp = r.headers['content-security-policy']
        self.assertIn("default-src 'self'", csp)
        self.assertIn("frame-ancestors", csp)

    def test_cross_origin_headers(self):
        r = fresh_client().get('/api/public')
        self.assertEqual(r.headers.get('cross-origin-opener-policy'), 'same-origin')
        self.assertEqual(r.headers.get('cross-origin-resource-policy'), 'same-origin')

    def test_openapi_disabled(self):
        """La documentation OpenAPI/Swagger est désactivée."""
        r = fresh_client().get('/docs')
        self.assertIn(r.status_code, (404, 307))
        r = fresh_client().get('/redoc')
        self.assertIn(r.status_code, (404, 307))
        r = fresh_client().get('/openapi.json')
        self.assertIn(r.status_code, (404, 307))


class AppointmentSecurityTests(unittest.TestCase):
    """Vérifie la sécurité de la prise de rendez-vous publique."""

    def test_appointment_requires_privacy_consent(self):
        """La création de rendez-vous exige l'acceptation de la politique."""
        r = fresh_client().post('/api/appointments', json={
            'patient': 'Test Patient',
            'phone': '+22507070707',
            'service': 'Médecine générale',
            'day': '2026-12-15',
            'slot': '10:00',
            'privacy': False,
        })
        self.assertEqual(r.status_code, 422)

    def test_appointment_honeypot_rejected(self):
        """Le champ honeypot (website) bloque les bots."""
        r = fresh_client().post('/api/appointments', json={
            'patient': 'Test Patient',
            'phone': '+22507070707',
            'service': 'Médecine générale',
            'day': '2026-12-15',
            'slot': '10:00',
            'privacy': True,
            'website': 'http://spam.example.com',
        })
        self.assertEqual(r.status_code, 422)

    def test_appointment_no_patient_data_in_response(self):
        """La réponse à la création ne renvoie pas les données du patient."""
        r = fresh_client().post('/api/appointments', json={
            'patient': 'Test Patient',
            'phone': '+22507070707',
            'service': 'Médecine générale',
            'day': '2027-06-15',
            'slot': '',
            'privacy': True,
        })
        if r.status_code == 201:
            data = r.json()
            self.assertNotIn('patient', data)
            self.assertNotIn('phone', data)
            self.assertIn('reference', data)

    def test_appointment_invalid_service_rejected(self):
        """Un service non publié est rejeté."""
        r = fresh_client().post('/api/appointments', json={
            'patient': 'Test Patient',
            'phone': '+22507070707',
            'service': 'Service Inexistant',
            'day': '2027-06-15',
            'privacy': True,
        })
        self.assertEqual(r.status_code, 422)


class InputValidationTests(unittest.TestCase):
    """Vérifie la validation des entrées utilisateur."""

    def test_invalid_phone_rejected(self):
        r = fresh_client().post('/api/appointments', json={
            'patient': 'Test',
            'phone': 'not-a-phone',
            'service': 'Médecine générale',
            'day': '2027-06-15',
            'privacy': True,
        })
        self.assertEqual(r.status_code, 422)

    def test_invalid_date_rejected(self):
        r = fresh_client().get('/api/availability', params={'day': 'not-a-date'})
        self.assertEqual(r.status_code, 422)

    def test_past_date_rejected(self):
        r = fresh_client().get('/api/availability', params={'day': '2020-01-01'})
        self.assertEqual(r.status_code, 422)

    def test_invalid_role_rejected(self):
        """Un rôle invalide est rejeté lors de la création d'utilisateur."""
        c = fresh_client()
        r = c.post('/api/login', json={'first_name': 'Admin', 'last_name': 'Test', 'phone': '+2250707995414', 'code': 'MotDePasse1234!'})
        if r.status_code != 200:
            self.skipTest("Admin non disponible")
        csrf = r.json().get('csrf', '')
        r = c.post('/api/admin/users', headers={'x-csrf-token': csrf}, json={
            'first_name': 'Bad',
            'last_name': 'Role',
            'phone': '+2250700000003',
            'code': 'MotDePasse5678!',
            'role': 'superadmin',
        })
        self.assertEqual(r.status_code, 422)


class ErrorHandlingTests(unittest.TestCase):
    """Vérifie que les erreurs ne révèlent pas d'informations sensibles."""

    def test_unknown_page_returns_404_no_leak(self):
        r = fresh_client().get('/nonexistent-page-that-does-not-exist')
        self.assertEqual(r.status_code, 404)
        body = r.text
        self.assertNotIn('Traceback', body)
        self.assertNotIn('File "', body)

    def test_error_message_is_generic(self):
        """Les erreurs ne révèlent pas la technique."""
        r = fresh_client().get('/api/admin/appointments')
        body = r.text.lower()
        self.assertNotIn('sqlite', body)
        self.assertNotIn('postgres', body)
        self.assertNotIn('traceback', body)


class Shopin30LinkTests(unittest.TestCase):
    """Vérifie que le crédit discret Shopin30 est correctement implémenté."""

    def test_shopin30_in_app_js(self):
        content = (ROOT / 'app.js').read_text()
        self.assertIn('Conçu par Shopin30', content)
        self.assertIn('wa.me/2250501303343', content)
        self.assertIn('noopener noreferrer', content)
        self.assertIn('target="_blank"', content)

    def test_shopin30_static_matches(self):
        a = (ROOT / 'app.js').read_text()
        b = (ROOT / 'static' / 'app.js').read_text()
        self.assertEqual(a, b, "app.js et static/app.js ont divergé !")

    def test_shopin30_no_patient_data_in_message(self):
        content = (ROOT / 'app.js').read_text()
        self.assertIn('Clinique Tchiva', content)
        self.assertIn('site web', content)

    def test_shopin30_css_present(self):
        content = (ROOT / 'static' / 'vivant.css').read_text()
        self.assertIn('.footer-credit', content)
        self.assertNotIn('.x-footer-shopin', content)

    def test_shopin30_accessibility(self):
        content = (ROOT / 'app.js').read_text()
        self.assertIn('aria-label="Concepteur du site : Shopin30', content)

    def test_shopin30_independence_note(self):
        content = (ROOT / 'app.js').read_text()
        self.assertIn('Contact professionnel indépendant de la clinique', content)

    def test_shopin30_phone_not_displayed(self):
        """Le numéro de téléphone de Shopin30 ne doit plus être affiché."""
        content = (ROOT / 'app.js').read_text()
        self.assertNotIn('+225 05 01 30 33 43', content)

    def test_shopin30_block_removed(self):
        """L'encart promotionnel Shopin30 ne doit plus exister."""
        content = (ROOT / 'app.js').read_text()
        self.assertNotIn('x-footer-shopin', content)
        self.assertNotIn('Un site web pour votre entreprise', content)

    def test_no_ai_visuals_mention_in_footer(self):
        content = (ROOT / 'app.js').read_text()
        self.assertNotIn('Visuels : illustrations générées par IA', content)


if __name__ == '__main__':
    unittest.main()
