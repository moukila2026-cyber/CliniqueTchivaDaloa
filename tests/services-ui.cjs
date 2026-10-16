// Test de rendu isolé : node tests/services-ui.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('static/app.js', 'utf8');
assert.equal(source, fs.readFileSync('app.js', 'utf8'));
const context = {
  S: { address: 'Tazibouo', city: 'Daloa' },
  icon: () => '', pic: () => '', esc: x => String(x), encodeURIComponent,
  mapDirectionsUrl: () => 'https://www.google.com/maps',
  emergencyPhone: () => '+2250788975516', telHref: x => `tel:${x}`,
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('const SERVICE_DETAILS ='), source.indexOf('function insurancesSection')) +
  '\nS.specialties = SERVICE_DETAILS.map(s => ({ name: s.tag, description: s.short }));', context);
const cards = vm.runInContext('serviceCards()', context);
const preview = vm.runInContext('servicesPreview()', context);
const guide = vm.runInContext('visitGuide()', context);
assert.equal((cards.match(/class="service-detail"/g) || []).length, 5);
assert.equal((preview.match(/class="service-tile"/g) || []).length, 5);
assert.equal((preview.match(/Préparer votre visite/g) || []).length, 5);
for (let i = 1; i <= 5; i++) {
  assert(cards.includes(`id="service-${i}"`));
  assert(preview.includes(`/services#service-${i}`));
}
assert(cards.includes('Demander un rendez-vous'));
assert(guide.includes('/services#assurances'));
assert(guide.includes('tel:+2250788975516'));
assert.equal((guide.match(/<li>/g) || []).length, 3);
assert(source.includes('${servicesPreview()}${visitGuide()}'));
assert(source.includes('${visitGuide()}${insurancesSection(true)}'));
console.log('OK : fiches, cartes, liens, préparation et guide sur les deux pages.');
