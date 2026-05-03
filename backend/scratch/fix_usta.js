import db from '../src/database.js';

const res = db.prepare("UPDATE personnel SET position = 'Operatör' WHERE position = 'Usta'").run();
console.log(`${res.changes} kayıt Usta'dan Operatör'e çevrildi.`);
process.exit(0);
