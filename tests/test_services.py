"""Régression de la mise à niveau, sans dépendance au serveur ni base réelle."""
import ast
from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ServicesMigrationTests(unittest.TestCase):
    def setUp(self):
        tree = ast.parse((ROOT / 'app.py').read_text())
        nodes = [n for n in tree.body if
                 isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'DEFAULT' for t in n.targets)
                 or isinstance(n, ast.FunctionDef) and n.name == 'settings']
        self.conn = sqlite3.connect(':memory:')
        self.conn.execute('CREATE TABLE settings(id INTEGER PRIMARY KEY, data TEXT)')
        self.conn.execute('INSERT INTO settings VALUES(1, ?)', (json.dumps({'specialties': []}),))

        @contextmanager
        def db():
            with self.conn:
                yield self.conn

        self.ns = {'json': json, 'db': db}
        exec(compile(ast.Module(body=nodes, type_ignores=[]), 'app.py', 'exec'), self.ns)

    def tearDown(self):
        self.conn.close()

    def test_legacy_empty_catalog_is_restored_and_persisted(self):
        result = self.ns['settings']()
        self.assertEqual([s['name'] for s in result['specialties']],
                         ['Médecine générale', 'Ophtalmologie', 'ORL', 'Laboratoire', 'Chirurgie'])
        self.assertTrue(all(s['published'] for s in result['specialties']))
        self.assertTrue(json.loads(self.conn.execute('SELECT data FROM settings').fetchone()[0])['_services_catalog_v1'])

    def test_existing_drafts_and_descriptions_are_preserved(self):
        catalog = [{'name': 'ORL', 'description': 'Texte personnalisé', 'published': False}]
        self.conn.execute('UPDATE settings SET data=?', (json.dumps({'specialties': catalog}),))
        self.assertEqual(self.ns['settings']()['specialties'], catalog)

    def test_deliberate_removal_after_migration_is_preserved(self):
        self.ns['settings']()
        self.conn.execute('UPDATE settings SET data=?', (json.dumps({'specialties': [], '_services_catalog_v1': True}),))
        self.assertEqual(self.ns['settings']()['specialties'], [])


if __name__ == '__main__':
    unittest.main()
