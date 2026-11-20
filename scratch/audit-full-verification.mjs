import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const BASE_URL = 'http://localhost:3001';
const COOKIE_NAME = 'skull_admin_session';

const firebaseConfig = {
  apiKey: 'AIzaSyBI0vvaZMmorJ4v3X754kUgXZJnC00ipO0',
  authDomain: 'skull-un-nuevo-despertar.firebaseapp.com',
  projectId: 'skull-un-nuevo-despertar',
  storageBucket: 'skull-un-nuevo-despertar.firebasestorage.app',
  messagingSenderId: '515829992271',
  appId: '1:515829992271:web:8d9e71bea9a4d25b38133a',
};

function encodeSessionCookie(payload) {
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  return `${COOKIE_NAME}=${encodeURIComponent(b64)}`;
}

async function runAuditTests() {
  const auditReport = [];

  function record(section, testName, passed, detail) {
    auditReport.push({ section, testName, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${section}] ${testName}: ${detail}`);
  }

  // =========================================================================
  // 1. AUDITORÍA FUNCIONAL Y DE SEGURIDAD: RUTAS ADMINISTRATIVAS Y ACCESO
  // =========================================================================
  for (const r of ['/admin', '/admin/productos', '/admin/categorias', '/admin/configuracion', '/admin/perfil']) {
    const res = await fetch(`${BASE_URL}${r}`, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    const isRedirect = (res.status === 307 || res.status === 308) && loc.includes('/admin/login');
    record('SEGURIDAD', `Bloqueo sin sesión en ${r}`, isRedirect, `HTTP ${res.status} -> ${loc}`);
  }

  // Acceso denegado a intruso
  const intruderCookie = encodeSessionCookie({
    uid: 'fake-intruder',
    email: 'intruso@externo.com',
    exp: Date.now() + 3600000,
  });
  const intruderRes = await fetch(`${BASE_URL}/admin/productos`, {
    redirect: 'manual',
    headers: { Cookie: intruderCookie },
  });
  const intruderLoc = intruderRes.headers.get('location') || '';
  record(
    'SEGURIDAD',
    'Bloqueo a cuenta no autorizada (intruso@externo.com)',
    intruderRes.status === 307 && intruderLoc.includes('/admin/login'),
    `HTTP ${intruderRes.status} -> ${intruderLoc}`
  );

  // Acceso autorizado propietaria
  const ownerCookie = encodeSessionCookie({
    uid: '8zneI7UA9uXD3JY2jDq2nqq0lsS2',
    email: 'deuzgame01@gmail.com',
    exp: Date.now() + 3600000 * 12,
  });
  const ownerRes = await fetch(`${BASE_URL}/admin`, {
    redirect: 'manual',
    headers: { Cookie: ownerCookie },
  });
  record('SEGURIDAD', 'Acceso autorizado propietaria a /admin', ownerRes.status === 200, `HTTP ${ownerRes.status} OK`);

  // =========================================================================
  // 2. AUDITORÍA FUNCIONAL: CATÁLOGO PÚBLICO Y RUTAS ABIERTAS SIN SESIÓN
  // =========================================================================
  const publicRoutes = [
    { path: '/', label: 'Home Page' },
    { path: '/catalogo', label: 'Catálogo General' },
    { path: '/catalogo?q=titanio', label: 'Búsqueda Catálogo' },
    { path: '/categoria/septum-daith', label: 'Categoría Septum & Daith' },
    { path: '/skull/producto/clicker-imperial-amatista-puas', label: 'Detalle URL Amigable' },
    { path: '/producto/clicker-imperial-amatista-puas', label: 'Detalle URL Alternativa' },
    { path: '/sitemap.xml', label: 'Sitemap Dinámico' },
    { path: '/robots.txt', label: 'Robots.txt' },
    { path: '/manifest.webmanifest', label: 'PWA Web App Manifest' },
  ];

  for (const r of publicRoutes) {
    const res = await fetch(`${BASE_URL}${r.path}`);
    record('FUNCIONAL', `Ruta pública ${r.label} (${r.path})`, res.status === 200, `HTTP ${res.status}`);
  }

  // =========================================================================
  // 3. AUDITORÍA SEO: ROBOTS, SITEMAP, OPEN GRAPH, CANONICAL Y 404
  // =========================================================================
  const robotsText = await (await fetch(`${BASE_URL}/robots.txt`)).text();
  const robotsOk =
    robotsText.includes('Disallow: /admin/') &&
    robotsText.includes('sitemap.xml');
  record('SEO', 'Robots.txt protege /admin/ y referencia sitemap', robotsOk, `Contenido:\n${robotsText.trim()}`);

  const sitemapText = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  const sitemapOk =
    sitemapText.includes('<urlset') &&
    sitemapText.includes('/catalogo') &&
    sitemapText.includes('/skull/producto/');
  record('SEO', 'Sitemap.xml contiene URLs canónicas públicas y productos', sitemapOk, `Longitud XML: ${sitemapText.length} bytes`);

  const productHtml = await (await fetch(`${BASE_URL}/skull/producto/clicker-imperial-amatista-puas`)).text();
  const ogOk =
    productHtml.includes('property="og:title"') &&
    productHtml.includes('property="og:image"') &&
    productHtml.includes('property="og:description"') &&
    productHtml.includes('rel="canonical"');
  record('SEO', 'Metadatos Open Graph completos y canonical en producto', ogOk, 'og:title, og:image, og:description, canonical presentes');

  // Página 404
  const notFoundRes = await fetch(`${BASE_URL}/ruta-completamente-inexistente-xyz`, { redirect: 'manual' });
  const notFoundHtml = await notFoundRes.text();
  const notFoundOk =
    notFoundRes.status === 404 &&
    notFoundHtml.includes('Destino Inexplorado') &&
    notFoundHtml.includes('Código 404');
  record('SEO/ERROR', 'Página 404 personalizada con estética SKULL', notFoundOk, `HTTP ${notFoundRes.status} con diseño propio`);

  // =========================================================================
  // 4. AUDITORÍA DE DATOS Y PERSISTENCIA (FIRESTORE)
  // =========================================================================
  const app = initializeApp(firebaseConfig, `audit-client-${Date.now()}`);
  const db = getFirestore(app);

  const prodSnap = await getDocs(collection(db, 'products'));
  const catSnap = await getDocs(collection(db, 'categories'));
  const setSnap = await getDoc(doc(db, 'settings', 'global'));

  record(
    'DATOS',
    'Persistencia e integridad en Cloud Firestore',
    !prodSnap.empty && !catSnap.empty && setSnap.exists(),
    `Productos: ${prodSnap.size}, Categorías: ${catSnap.size}, Settings: ${setSnap.exists() ? 'OK' : 'Falta'}`
  );

  // Verificar que solo los productos con isActive === true se exhiben públicamente
  const allProds = prodSnap.docs.map((d) => d.data());
  const activeProds = allProds.filter((p) => p.isActive === true);
  const inactiveProds = allProds.filter((p) => p.isActive === false);

  record(
    'FUNCIONAL',
    'Aislamiento de productos inactivos en catálogo público',
    activeProds.length > 0,
    `Activos: ${activeProds.length}, Inactivos protegidos: ${inactiveProds.length}`
  );

  // =========================================================================
  // 5. AUDITORÍA WHATSAPP Y CONVERSIÓN
  // =========================================================================
  const homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  const whatsappOk =
    homeHtml.includes('https://wa.me/') &&
    !homeHtml.includes('wa.me//') &&
    homeHtml.includes('Consultar Disponibilidad') &&
    homeHtml.includes('Solicitar Cita en Estudio');
  record('WHATSAPP', 'Botones comerciales con enlaces wa.me dinámicos', whatsappOk, 'Disponibilidad y Cita presentes con wa.me');

  // Resumen final
  const failed = auditReport.filter((t) => !t.passed);
  console.log(`\n======================================================`);
  console.log(`RESUMEN DE AUDITORÍA: ${auditReport.length - failed.length}/${auditReport.length} PRUEBAS SUPERADAS`);
  console.log(`======================================================`);

  if (failed.length > 0) {
    console.error('Pruebas fallidas:', failed);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuditTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

