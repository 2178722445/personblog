import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// 使用可复现的知识图解生成 WebP 封面，修改主题内容后重新运行此脚本。
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size = 24, color = '#263d38', weight = 500) => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`;
const rect = (x, y, w, h, fill, stroke = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line = (x1, y1, x2, y2, color = '#81958f') => `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="3"/>`;
const arrow = (x1, y1, x2, y2, color = '#81958f') => line(x1, y1, x2, y2, color) + `<path d="M${x2-10} ${y2-7} L${x2} ${y2} L${x2-10} ${y2+7}" fill="none" stroke="${color}" stroke-width="3"/>`;
const box = (x, y, w, title, subtitle, tint, accent) => rect(x,y,w,120,tint) + text(x+24,y+48,title,30,accent,700) + text(x+24,y+88,subtitle,20);
const covers = [
  { slug:'javascript-data', title:'Objects. Arrays. Ideas.', label:'JAVASCRIPT / DATA STRUCTURES', accent:'#9b731b', bg:'#f7f5e9', diagram:
    rect(72,275,405,280,'#fff') + text(102,325,'const places = [',28) + text(126,378,'{ id: 1, city: "Taiyuan" },',23) + text(126,421,'{ id: 2, city: "Datong" }',23) + text(102,470,'];',28) + text(102,524,'ONE OBJECT, ONE PLACE',17,'#8b938b') + arrow(500,410,565,410) +
    box(594,275,530,'filter()', 'Keep the places that match', '#efe4bb','#8c6717') + box(594,420,530,'map()', 'Turn places into map features', '#dceae9','#326e69') },
  { slug:'async-fetch', title:'A request takes time.', label:'JAVASCRIPT / ASYNC + AWAIT', accent:'#3f6da1', bg:'#eef3f8', diagram:
    box(72,295,290,'fetch()', 'Send a request', '#fff','#3f6da1') + arrow(382,355,442,355) + box(460,295,290,'await', 'Wait for a response', '#dce7f5','#3f6da1') + arrow(770,355,830,355) + box(850,295,278,'render()', 'Show the data', '#d9eade','#42785b') +
    line(605,435,605,502,'#b37660') + line(605,502,850,502,'#b37660') + rect(850,456,278,93,'#f1dfd8') + text(879,510,'catch(error)',26,'#a65b44',700) + text(72,532,'PENDING  /  FULFILLED  /  REJECTED',22,'#5f7893') },
  { slug:'vue-reactivity', title:'State becomes a view.', label:'VUE 3 / REACTIVITY', accent:'#34785e', bg:'#edf5f0', diagram:
    box(72,290,300,'ref()', 'The source of truth', '#d8eadd','#34785e') + arrow(392,350,445,350) + box(465,290,310,'computed()', 'A derived value', '#fff','#34785e') + arrow(794,350,847,350) + box(867,290,260,'template', 'The interface', '#dce8f4','#3f6da1') +
    line(220,429,220,507) + arrow(220,507,465,507) + rect(465,457,662,100,'#fff') + text(490,501,'watch()',28,'#ac7255',700) + text(675,501,'Side effects, not derived state',23) + text(490,538,'One source. Predictable updates.',19,'#7c8c82') },
  { slug:'vue-lifecycle', title:'Mount. Update. Clean up.', label:'VUE 3 / COMPONENT LIFECYCLE', accent:'#946252', bg:'#f7efec', diagram:
    box(72,287,310,'onMounted', 'Create the map', '#fff','#946252') + arrow(400,347,435,347) + box(455,287,310,'ResizeObserver', 'Update its size', '#e1eaf0','#426d8c') + arrow(785,347,818,347) + box(838,287,290,'onUnmounted', 'Release resources', '#e3e9dc','#57744f') +
    rect(72,448,1056,108,'#fff') + text(105,492,'map.setTarget(undefined)',29,'#946252',700) + text(105,532,'Disconnect observers. Remove listeners. Dispose owned instances.',22) },
  { slug:'geojson-crs', title:'Coordinates need context.', label:'GIS / GEOJSON + PROJECTIONS', accent:'#356d91', bg:'#edf3f6', diagram:
    `<circle cx="267" cy="413" r="133" fill="#dfebe6" stroke="#6b9a8d" stroke-width="2"/><ellipse cx="267" cy="413" rx="65" ry="133" fill="none" stroke="#6b9a8d" stroke-width="2"/><ellipse cx="267" cy="413" rx="133" ry="49" fill="none" stroke="#6b9a8d" stroke-width="2"/>` + line(134,413,400,413,'#6b9a8d') + line(267,280,267,546,'#6b9a8d') + arrow(452,408,568,408) +
    rect(630,284,470,260,'#fff') + [1,2,3,4].map(i=>line(630+i*94,284,630+i*94,544,'#d3e2ea')).join('') + [1,2,3].map(i=>line(630,284+i*65,1100,284+i*65,'#d3e2ea')).join('') + `<path d="M696 480 L778 402 L875 425 L1006 328" fill="none" stroke="#447f9f" stroke-width="6"/><circle cx="875" cy="425" r="10" fill="#c47960"/>` + text(160,592,'4326 / DEGREES',24,'#437b69',700) + text(708,592,'3857 / MAP METERS',24,'#356d91',700) },
  { slug:'python-json', title:'Raw data. Clear results.', label:'PYTHON / JSON WORKFLOW', accent:'#456f9b', bg:'#f1f4f8', diagram:
    box(72,289,300,'READ', 'json.load(file)', '#dfe9f5','#456f9b') + arrow(391,349,446,349) + box(465,289,300,'VALIDATE', 'Check every feature', '#f1e8c6','#8c7427') + arrow(784,349,840,349) + box(858,289,270,'EXPORT', 'json.dump(data)', '#deebe1','#407256') +
    rect(72,450,1056,110,'#fff') + text(104,493,'with open("places.geojson", encoding="utf-8") as file:',27,'#456f9b') + text(136,537,'data = json.load(file)',27) },
];
await mkdir('public/images', {recursive:true});
for (const [index, cover] of covers.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="${cover.bg}"/>${rect(72,82,44,5,cover.accent)}${text(132,92,cover.label,19,cover.accent,700)}${text(72,193,cover.title,56,'#263d38',700)}${cover.diagram}${line(72,627,1128,627,'#d6dfda')}${text(72,655,'HERMIT / LEARNING NOTES',15,'#7b8b85')}${text(1022,655,`BASICS 0${index+1}`,15,cover.accent)}</svg>`;
  const output = `public/images/basics-${cover.slug}.webp`;
  const result = await sharp(Buffer.from(svg)).webp({quality:88}).toFile(output);
  console.log(`${output}: ${Math.round(result.size/1024)} KB`);
}
