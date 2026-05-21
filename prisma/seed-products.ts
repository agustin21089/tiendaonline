/**
 * Run with: npx tsx prisma/seed-products.ts
 * Adds 30+ products with subcategories and variants.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

async function main() {
  console.log("🌱 Seeding products...\n");

  // ─── Root categories (must exist) ──────────────────────────────────────────
  const catLiving = await prisma.category.upsert({
    where: { slug: "living" },
    update: { image: img("living-room-modern") },
    create: { name: "Living", slug: "living", order: 1, active: true, image: img("living-room-modern") },
  });
  const catDorm = await prisma.category.upsert({
    where: { slug: "dormitorio" },
    update: { image: img("scandinavian-bedroom") },
    create: { name: "Dormitorio", slug: "dormitorio", order: 2, active: true, image: img("scandinavian-bedroom") },
  });
  const catCocina = await prisma.category.upsert({
    where: { slug: "cocina" },
    update: { image: img("modern-kitchen") },
    create: { name: "Cocina", slug: "cocina", order: 3, active: true, image: img("modern-kitchen") },
  });
  const catExt = await prisma.category.upsert({
    where: { slug: "exterior" },
    update: { image: img("garden-terrace") },
    create: { name: "Exterior", slug: "exterior", order: 4, active: true, image: img("garden-terrace") },
  });

  // ─── Subcategories ─────────────────────────────────────────────────────────
  const subSofas = await upsertCat("Sofás y sillones", "sofas", catLiving.id, 1);
  const subMesas = await upsertCat("Mesas", "mesas-living", catLiving.id, 2);
  const subLamparas = await upsertCat("Iluminación", "lamparas", catLiving.id, 3);
  const subTextil = await upsertCat("Textil", "textil-living", catLiving.id, 4);
  const subEstanterias = await upsertCat("Estanterías & muebles", "estanterias", catLiving.id, 5);

  const subCamas = await upsertCat("Camas", "camas", catDorm.id, 1);
  const subRopa = await upsertCat("Ropa de cama", "ropa-de-cama", catDorm.id, 2);
  const subMesasLuz = await upsertCat("Mesas de luz", "mesas-de-luz", catDorm.id, 3);
  const subOrg = await upsertCat("Organización", "organizacion-dormitorio", catDorm.id, 4);

  const subVajilla = await upsertCat("Vajilla", "vajilla", catCocina.id, 1);
  const subDecoKit = await upsertCat("Deco & almacenamiento", "deco-cocina", catCocina.id, 2);
  const subTextilKit = await upsertCat("Textil de cocina", "textil-cocina", catCocina.id, 3);

  const subMueblesExt = await upsertCat("Muebles de jardín", "muebles-exterior", catExt.id, 1);
  const subDecoExt = await upsertCat("Deco exterior", "deco-exterior", catExt.id, 2);

  console.log("✓ Categories ready\n");

  // ─── Products ──────────────────────────────────────────────────────────────
  type V = { name: string; value: string; sku?: string; stock: number; price?: number };
  type P = {
    name: string; slug: string; description: string;
    price: number; comparePrice?: number; stock: number;
    featured?: boolean; categoryId: string;
    images: string[]; variants?: V[];
  };

  const products: P[] = [
    // ══ LIVING — Sofás ══════════════════════════════════════════════════════
    {
      name: "Sofá Oslo 3 cuerpos", slug: "sofa-oslo-3-cuerpos",
      description: "Sofá de 3 cuerpos con estructura de madera maciza y tapizado en tela de lino natural. Incluye 3 almohadones decorativos. Medidas: 220 x 90 x 80 cm.",
      price: 89000, comparePrice: 105000, stock: 5, featured: true,
      categoryId: subSofas.id,
      images: [img("gray-sofa-interior"), img("sofa-cushions-close"), img("living-sofa-scene")],
      variants: [
        { name: "Color", value: "Arena", sku: "#D4C5A9", stock: 3 },
        { name: "Color", value: "Gris claro", sku: "#B0AFA8", stock: 2 },
      ],
    },
    {
      name: "Sofá Nordic 2 cuerpos", slug: "sofa-nordic-2-cuerpos",
      description: "Sofá compacto de diseño escandinavo. Patas de madera de haya, tapizado desmontable. Perfecto para espacios pequeños. 160 x 85 x 75 cm.",
      price: 65000, stock: 8,
      categoryId: subSofas.id,
      images: [img("beige-sofa-room"), img("nordic-furniture")],
      variants: [
        { name: "Color", value: "Beige", sku: "#E8D5B0", stock: 4 },
        { name: "Color", value: "Azul petróleo", sku: "#3B6978", stock: 4 },
      ],
    },
    {
      name: "Sillón Bergère tapizado", slug: "sillon-bergere-tapizado",
      description: "Sillón de alto diseño con estructura en madera de teca. Tapizado en tela bouclé. Una pieza que combina comodidad y elegancia.",
      price: 42000, comparePrice: 49500, stock: 6, featured: true,
      categoryId: subSofas.id,
      images: [img("armchair-cozy-reading"), img("accent-chair-interior")],
      variants: [
        { name: "Color", value: "Crudo", sku: "#EDE0C8", stock: 3 },
        { name: "Color", value: "Mostaza", sku: "#C8A84B", stock: 3 },
      ],
    },
    // ══ LIVING — Mesas ══════════════════════════════════════════════════════
    {
      name: "Mesa de centro Mila", slug: "mesa-centro-mila",
      description: "Mesa de centro en madera de roble con estructura de acero negro. Tapa de vidrio templado. 110 × 55 × 42 cm.",
      price: 24500, stock: 12,
      categoryId: subMesas.id,
      images: [img("coffee-table-wood-glass"), img("living-room-table")],
      variants: [
        { name: "Tamaño", value: "Pequeña 80x40", stock: 6, price: 19800 },
        { name: "Tamaño", value: "Grande 110x55", stock: 6, price: 24500 },
      ],
    },
    {
      name: "Mesa ratona de mármol travertino", slug: "mesa-ratona-marmol",
      description: "Mesa ratona con tapa de mármol travertino natural y estructura de acero negro. Una pieza de autor para tu living.",
      price: 38500, comparePrice: 45000, stock: 4, featured: true,
      categoryId: subMesas.id,
      images: [img("marble-coffee-table"), img("marble-texture-close")],
    },
    {
      name: "Mesa auxiliar apilable roble", slug: "mesa-auxiliar-apilable",
      description: "Set de 2 mesas auxiliares apilables en madera de roble. Versátiles y de diseño nórdico. Se pueden usar por separado o juntas.",
      price: 16800, stock: 15,
      categoryId: subMesas.id,
      images: [img("nesting-tables"), img("scandinavian-side-table")],
    },
    // ══ LIVING — Iluminación ═════════════════════════════════════════════════
    {
      name: "Lámpara de pie Arco", slug: "lampara-pie-arco",
      description: "Lámpara de pie de arco en acero negro mate con pantalla de lino natural. Altura: 180 cm. Ideal para rincones de lectura.",
      price: 18500, comparePrice: 22000, stock: 7,
      categoryId: subLamparas.id,
      images: [img("arc-floor-lamp"), img("reading-lamp-corner")],
    },
    {
      name: "Lámpara colgante esfera vidrio", slug: "lampara-colgante-esfera",
      description: "Lámpara colgante con difusor de vidrio soplado en forma de esfera. Cable textil negro. 40W max. Incluye bombilla E27.",
      price: 12400, stock: 10,
      categoryId: subLamparas.id,
      images: [img("glass-pendant-lamp"), img("pendant-dining-room")],
      variants: [
        { name: "Color", value: "Humo", sku: "#7A7A72", stock: 5 },
        { name: "Color", value: "Transparente", sku: "#E8E8E8", stock: 5 },
      ],
    },
    {
      name: "Aplique de pared minimalista", slug: "aplique-pared-minimalista",
      description: "Aplique de pared en yeso pintado blanco. Luz difusa y cálida. Instalación sencilla. 25 x 15 cm. Incluye LED integrado.",
      price: 8900, stock: 18,
      categoryId: subLamparas.id,
      images: [img("wall-sconce-minimal"), img("plaster-light")],
    },
    // ══ LIVING — Textil ══════════════════════════════════════════════════════
    {
      name: "Almohadón lino 50x50", slug: "almohadon-lino-natural",
      description: "Almohadón en lino 100% natural. Funda desmontable con cierre invisible. Relleno de fibra hueca incluido. 50 × 50 cm.",
      price: 3200, stock: 30,
      categoryId: subTextil.id,
      images: [img("linen-cushion-beige"), img("cushion-living-scene")],
      variants: [
        { name: "Color", value: "Natural", sku: "#D4C5A9", stock: 10 },
        { name: "Color", value: "Terracota", sku: "#C1694F", stock: 10 },
        { name: "Color", value: "Sage", sku: "#7C9885", stock: 10 },
      ],
    },
    {
      name: "Manta tejida merino XL", slug: "manta-tejida-merino",
      description: "Manta de punto grueso en lana merino. Suave al tacto, ideal para noches frías. 130 × 170 cm.",
      price: 8500, comparePrice: 10200, stock: 20, featured: false,
      categoryId: subTextil.id,
      images: [img("knit-blanket-sofa"), img("merino-wool-texture")],
      variants: [
        { name: "Color", value: "Crudo", sku: "#F5ECD7", stock: 7 },
        { name: "Color", value: "Gris perla", sku: "#C5C5C5", stock: 7 },
        { name: "Color", value: "Camel", sku: "#C19A6B", stock: 6 },
      ],
    },
    {
      name: "Alfombra kilim tejida a mano", slug: "alfombra-kilim-tejida",
      description: "Alfombra de estilo kilim tejida a mano con lana natural. Diseño geométrico en tonos tierra. No se corre ni destiñe.",
      price: 42000, comparePrice: 52000, stock: 5, featured: true,
      categoryId: subTextil.id,
      images: [img("kilim-rug-colorful"), img("rug-living-room-scene"), img("boho-rug-detail")],
      variants: [
        { name: "Tamaño", value: "160×230 cm", stock: 3, price: 42000 },
        { name: "Tamaño", value: "200×300 cm", stock: 2, price: 65000 },
      ],
    },
    // ══ LIVING — Estanterías ═════════════════════════════════════════════════
    {
      name: "Biblioteca escandinava", slug: "biblioteca-escandinava",
      description: "Biblioteca de diseño escandinavo en madera de pino lacado blanco. 5 estantes, patas de roble. 80 × 25 × 180 cm.",
      price: 38000, stock: 6,
      categoryId: subEstanterias.id,
      images: [img("white-bookshelf-nordic"), img("bookcase-interior")],
    },
    {
      name: "Estante flotante de roble", slug: "estante-flotante-roble",
      description: "Estante flotante en madera maciza de roble natural. Soporta hasta 15 kg. Incluye herrajes ocultos. 80 cm de largo.",
      price: 7800, stock: 25,
      categoryId: subEstanterias.id,
      images: [img("floating-shelf-oak"), img("wall-shelf-books")],
      variants: [
        { name: "Tamaño", value: "80 cm", stock: 10, price: 7800 },
        { name: "Tamaño", value: "120 cm", stock: 10, price: 10500 },
        { name: "Tamaño", value: "160 cm", stock: 5, price: 14200 },
      ],
    },
    // ══ DORMITORIO — Camas ═══════════════════════════════════════════════════
    {
      name: "Cama sommier Queen 160", slug: "cama-sommier-queen-160",
      description: "Cama sommier con respaldo tapizado en tela arena. Incluye sommier y patas de madera. 160 × 200 cm. No incluye colchón.",
      price: 145000, comparePrice: 165000, stock: 4, featured: true,
      categoryId: subCamas.id,
      images: [img("upholstered-bed-frame"), img("bedroom-queen-bed"), img("bed-headboard-close")],
      variants: [
        { name: "Tamaño", value: "Queen 160×200", stock: 2, price: 145000 },
        { name: "Tamaño", value: "King 180×200", stock: 2, price: 175000 },
      ],
    },
    {
      name: "Cama baúl con almacenamiento", slug: "cama-baul-almacenamiento",
      description: "Cama baúl con respaldo tapizado y cajón abatible de gran capacidad. Ideal para espacios pequeños. 140 × 200 cm.",
      price: 89000, stock: 6,
      categoryId: subCamas.id,
      images: [img("storage-bed-modern"), img("bed-storage-open")],
    },
    {
      name: "Estructura cama Tokio", slug: "estructura-cama-tokio",
      description: "Estructura de cama baja de diseño japonés en madera de teca. Estética minimalista. 160 × 200 cm.",
      price: 58000, comparePrice: 68000, stock: 8,
      categoryId: subCamas.id,
      images: [img("platform-bed-wooden"), img("japandi-bedroom-scene")],
    },
    // ══ DORMITORIO — Ropa de cama ════════════════════════════════════════════
    {
      name: "Sábanas percal 300 hilos", slug: "sabanas-percal-300h",
      description: "Set de sábanas en percal de algodón egipcio 300 hilos. Bajera ajustable, sábana encimera y 2 fundas. Suave y fresco.",
      price: 12800, comparePrice: 15500, stock: 25, featured: true,
      categoryId: subRopa.id,
      images: [img("white-bed-sheets"), img("percale-sheets-close")],
      variants: [
        { name: "Tamaño", value: "1½ plaza 90×200", stock: 8, price: 9800 },
        { name: "Tamaño", value: "2 plazas 140×200", stock: 10, price: 12800 },
        { name: "Tamaño", value: "Queen 160×200", stock: 7, price: 14500 },
      ],
    },
    {
      name: "Funda nórdica lino lavado", slug: "funda-nordica-lino",
      description: "Funda nórdica en lino 100% pre-lavado, extremadamente suave. Cierre de botones ocultos. Lavable a máquina. 220 × 240 cm.",
      price: 24500, stock: 15, featured: false,
      categoryId: subRopa.id,
      images: [img("linen-duvet-bed"), img("linen-bedroom-morning")],
      variants: [
        { name: "Color", value: "Blanco roto", sku: "#F8F4EC", stock: 5 },
        { name: "Color", value: "Azul cielo", sku: "#A8BFCC", stock: 5 },
        { name: "Color", value: "Arena", sku: "#D4C5A9", stock: 5 },
      ],
    },
    {
      name: "Almohada viscoelástica premium", slug: "almohada-viscoelastica",
      description: "Almohada de memory foam con funda de bambú antiácaros. Soporte ergonómico para cuello y cervicales. 60 × 40 cm.",
      price: 8200, comparePrice: 9800, stock: 30,
      categoryId: subRopa.id,
      images: [img("pillow-white-bed"), img("memory-foam-pillow")],
    },
    // ══ DORMITORIO — Mesas de luz ════════════════════════════════════════════
    {
      name: "Mesa de luz nórdica roble", slug: "mesa-luz-nordica-roble",
      description: "Mesa de luz en roble natural con cajón y estante abierto. Patas cónicas en negro. 50 × 45 × 55 cm.",
      price: 22500, comparePrice: 26000, stock: 10,
      categoryId: subMesasLuz.id,
      images: [img("oak-nightstand"), img("bedside-table-lamp")],
    },
    {
      name: "Mesa de luz flotante con cajón", slug: "mesa-luz-flotante-cajon",
      description: "Mesa de luz para colgar en pared con cajón amplio. Madera de pino pintado. Ahorra espacio en el suelo. 50 × 30 × 20 cm.",
      price: 15800, stock: 14,
      categoryId: subMesasLuz.id,
      images: [img("floating-nightstand-wall"), img("wall-mounted-bedside")],
    },
    // ══ DORMITORIO — Organización ════════════════════════════════════════════
    {
      name: "Espejo redondo dorado 60cm", slug: "espejo-redondo-dorado",
      description: "Espejo con marco circular de metal dorado mate. Diámetro: 60 cm. Incluye kit de pared.",
      price: 16500, comparePrice: 19800, stock: 12, featured: true,
      categoryId: subOrg.id,
      images: [img("round-gold-mirror"), img("mirror-bedroom-decor")],
    },
    {
      name: "Organizador de cajones apilable", slug: "organizador-cajones-apilable",
      description: "Set de 6 cajas organizadoras en bambú. Apilables, con asas. Ideal para cajones, armarios o estantes.",
      price: 9800, stock: 20,
      categoryId: subOrg.id,
      images: [img("bamboo-organizer"), img("drawer-organization")],
    },
    // ══ COCINA — Vajilla ═════════════════════════════════════════════════════
    {
      name: "Set vajilla cerámica 12 piezas", slug: "set-vajilla-ceramica-12",
      description: "Set para 4 personas: 4 platos llanos, 4 hondos, 4 de postre. Cerámica artesanal con esmalte matte. Apto microondas y lavavajillas.",
      price: 28500, comparePrice: 34000, stock: 8, featured: true,
      categoryId: subVajilla.id,
      images: [img("ceramic-dinnerware-set"), img("pottery-table-setting"), img("handmade-plates-close")],
      variants: [
        { name: "Color", value: "Blanco roto", sku: "#F5F0E8", stock: 3 },
        { name: "Color", value: "Gris piedra", sku: "#9B9B8E", stock: 3 },
        { name: "Color", value: "Terracota", sku: "#C1694F", stock: 2 },
      ],
    },
    {
      name: "Set de tazas espresso artesanal", slug: "set-tazas-espresso",
      description: "6 tazas de espresso con platos en cerámica artesanal. Cada pieza es única. Variaciones propias del trabajo manual.",
      price: 9200, stock: 15,
      categoryId: subVajilla.id,
      images: [img("espresso-cups-set"), img("coffee-cups-ceramic")],
    },
    {
      name: "Jarra de agua vidrio soplado", slug: "jarra-agua-vidrio",
      description: "Jarra de agua en vidrio soplado artesanal. 1.2 litros. Líneas orgánicas que la hacen única en la mesa.",
      price: 7400, comparePrice: 8800, stock: 20,
      categoryId: subVajilla.id,
      images: [img("glass-water-jug"), img("glassware-table")],
    },
    {
      name: "Set de bols de cerámica", slug: "set-bols-ceramica",
      description: "4 bols en cerámica artesanal en distintos tamaños. Perfectos para cereales, ensaladas o como deco.",
      price: 11800, stock: 12,
      categoryId: subVajilla.id,
      images: [img("ceramic-bowls-stacked"), img("pottery-bowls-detail")],
    },
    // ══ COCINA — Deco & almacenamiento ═══════════════════════════════════════
    {
      name: "Tarros herméticos de vidrio", slug: "tarros-almacenamiento-vidrio",
      description: "Set de 3 tarros de vidrio borosilicato con tapa de bambú. Para secos y cereales. 500 ml, 1 L, 1.5 L.",
      price: 14200, comparePrice: 16800, stock: 18,
      categoryId: subDecoKit.id,
      images: [img("glass-jars-bamboo"), img("kitchen-storage-counter")],
    },
    {
      name: "Tabla de picar madera de olivo", slug: "tabla-picar-olivo",
      description: "Tabla de picar en madera de olivo, antimicrobiana natural. Con canal de recogida de jugos. 35 × 25 cm.",
      price: 8600, stock: 22,
      categoryId: subDecoKit.id,
      images: [img("olive-wood-cutting-board"), img("kitchen-board-scene")],
    },
    {
      name: "Cesta de mimbre para pan", slug: "cesta-mimbre-pan",
      description: "Cesta tejida a mano en mimbre natural con forro de lino. Diámetro: 28 cm. Ideal como centro de mesa.",
      price: 4800, stock: 30,
      categoryId: subDecoKit.id,
      images: [img("wicker-bread-basket"), img("rustic-kitchen-deco")],
    },
    // ══ COCINA — Textil ══════════════════════════════════════════════════════
    {
      name: "Set de repasadores lino 4u", slug: "repasadores-lino",
      description: "Set de 4 repasadores en lino natural con franja de colores. 45 × 70 cm. Lavable a 40°C.",
      price: 3600, stock: 40,
      categoryId: subTextilKit.id,
      images: [img("linen-tea-towels"), img("kitchen-towels-hanging")],
      variants: [
        { name: "Color", value: "Natural + negro", sku: "#D4C5A9", stock: 15 },
        { name: "Color", value: "Natural + azul", sku: "#5B7FA6", stock: 15 },
        { name: "Color", value: "Natural + terracota", sku: "#C1694F", stock: 10 },
      ],
    },
    {
      name: "Delantal de lino con bolsillos", slug: "delantal-lino",
      description: "Delantal en lino crudo con 2 bolsillos y tiras ajustables. Resistente a manchas. Talle único.",
      price: 5800, stock: 25,
      categoryId: subTextilKit.id,
      images: [img("linen-apron-kitchen"), img("apron-cooking-scene")],
    },
    // ══ EXTERIOR — Muebles ═══════════════════════════════════════════════════
    {
      name: "Mesa de jardín teca 6 personas", slug: "mesa-jardin-teca-6p",
      description: "Mesa de jardín en teca certificada FSC para 6 personas. Resistente a la intemperie. 180 × 90 cm. Incluye tapa de protección.",
      price: 78000, comparePrice: 92000, stock: 4, featured: true,
      categoryId: subMueblesExt.id,
      images: [img("teak-garden-table"), img("outdoor-dining-set"), img("garden-lunch-scene")],
    },
    {
      name: "Set 4 sillas plegables jardín", slug: "set-sillas-plegables-jardin",
      description: "4 sillas plegables en aluminio y textilene. Livianas, resistentes al sol y lluvia. Fácil almacenamiento.",
      price: 56000, stock: 6,
      categoryId: subMueblesExt.id,
      images: [img("folding-garden-chairs"), img("patio-chairs")],
      variants: [
        { name: "Color", value: "Blanco", sku: "#F5F5F5", stock: 3 },
        { name: "Color", value: "Negro", sku: "#2D2D2D", stock: 3 },
      ],
    },
    {
      name: "Sillón de jardín de ratán", slug: "sillon-jardin-ratan",
      description: "Sillón de ratán sintético con cojín removible. Marco de aluminio negro. Resistente a UV. Incluye funda de invierno.",
      price: 38000, comparePrice: 44500, stock: 8,
      categoryId: subMueblesExt.id,
      images: [img("rattan-garden-chair"), img("outdoor-lounge-area")],
    },
    // ══ EXTERIOR — Deco ═══════════════════════════════════════════════════════
    {
      name: "Maceta terracota artesanal", slug: "maceta-terracota-artesanal",
      description: "Maceta de terracota moldeada a mano. Textura natural con pequeñas imperfecciones únicas. Incluye plato.",
      price: 4200, stock: 40,
      categoryId: subDecoExt.id,
      images: [img("terracotta-flower-pot"), img("clay-pots-garden")],
      variants: [
        { name: "Tamaño", value: "Chica 15 cm", stock: 15, price: 3200 },
        { name: "Tamaño", value: "Mediana 22 cm", stock: 15, price: 4200 },
        { name: "Tamaño", value: "Grande 30 cm", stock: 10, price: 6800 },
      ],
    },
    {
      name: "Farol solar de hierro forjado", slug: "farol-solar-hierro",
      description: "Farol de jardín con panel solar. Hierro fundido acabado envejecido. Encendido automático al oscurecer. 45 cm.",
      price: 6400, comparePrice: 7800, stock: 20,
      categoryId: subDecoExt.id,
      images: [img("solar-garden-lantern"), img("garden-lights-dusk")],
    },
    {
      name: "Guirnalda LED para exterior", slug: "guirnalda-luces-exterior",
      description: "Guirnalda de luces LED. 10 metros, 20 bombillas E27 intercambiables. IP44. Perfecta para galerías y jardines.",
      price: 9200, comparePrice: 11500, stock: 25, featured: true,
      categoryId: subDecoExt.id,
      images: [img("string-lights-garden"), img("patio-night-lights")],
    },
    {
      name: "Cojines impermeables para jardín", slug: "cojines-impermeables-jardin",
      description: "Set de 4 cojines con relleno de fibra siliconizada y funda en tela náutica repelente al agua. 45 × 45 cm.",
      price: 5600, stock: 30,
      categoryId: subDecoExt.id,
      images: [img("outdoor-cushions-patio"), img("waterproof-cushions-close")],
      variants: [
        { name: "Color", value: "Blanco nácar", sku: "#F0EDE4", stock: 10 },
        { name: "Color", value: "Verde oliva", sku: "#6B7C5E", stock: 10 },
        { name: "Color", value: "Azul navy", sku: "#2B3A5E", stock: 10 },
      ],
    },
  ];

  // ─── Insert products ────────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        featured: p.featured ?? false,
        active: true,
        trackStock: true,
        categoryId: p.categoryId,
        images: { create: p.images.map((url, i) => ({ url, order: i })) },
        variants: p.variants?.length
          ? {
              create: p.variants.map((v) => ({
                name: v.name,
                value: v.value,
                sku: v.sku ?? null,
                stock: v.stock,
                price: v.price ?? null,
              })),
            }
          : undefined,
      },
    });
    console.log(`  ✓ ${p.name}`);
    created++;
  }

  console.log(`\n✅ Done — ${created} created, ${skipped} already existed.`);
}

async function upsertCat(name: string, slug: string, parentId: string, order: number) {
  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug, parentId, order, active: true },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
