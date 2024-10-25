'use strict';


const sqlite = require('sqlite3');
const dayjs = require('dayjs');

const db = require('./db');


//GET
// get all pages
exports.getPages = () => {
    return new Promise((resolve, reject) => {
        //join con users per prendere username dell'autore
        const sql = 'SELECT pagine.id,autoreId,username,titolo,dataCreazione,dataPubblicazione from pagine,utenti WHERE utenti.id = pagine.autoreId';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return; //senza il codice continuerebbe
            }
            //caso senza pagine
            if (rows.length == 0) {
                resolve("Pagine non trovate")
            }
            // map dell'oggetto page con i campi della tabella pagine, devo creare oggetti dayjs() per le date
            const pages = rows.map((page) => ({ id: page.id,autore:page.username, autoreId: page.autoreId, titolo: page.titolo, dataCreazione: dayjs(page.dataCreazione).format("YYYY-MM-DD"), dataPubblicazione: dayjs(page.dataPubblicazione).format("YYYY-MM-DD") }));
            resolve(pages);
        });
    });
};
// get one page by id without blocks
exports.getPage = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT pagine.id,autoreId,username,titolo,dataCreazione,dataPubblicazione from pagine,utenti WHERE utenti.id = pagine.autoreId AND pagine.id =?';
        db.get(sql, [id], (err, page) => {
            if (err) {
                reject(err);
                return;
            }
            if (page == undefined) {
                resolve({ error: 'Pagina non trovata.' });
            } else {
                resolve(page)
            }
        })
    }
    )
};
// get blocks by page {paginaId}
exports.getBlocks = (paginaId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM blocchi WHERE paginaId=? ORDER BY posizione';
        db.all(sql, [paginaId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length == 0) {
                resolve({ error: 'Blocchi non presenti => errore.' });
            } else {
                //- Tabella `blocchi` - (id, paginaId, tipo, contenuto, posizione)
                const blocks = rows.map((block) => ({ id: block.id, paginaId: block.paginaId, tipo: block.tipo, contenuto: block.contenuto, posizione: block.posizione }));
                resolve(blocks);
            }
        });
    });
};
// get all users
exports.getUsers = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM utenti';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            //  - Tabella `utenti` - (id, username, email, hash, salt, isAdmin)
            const utenti = rows.map((u) => ({ id: u.id, username: u.username, isAdmin: u.isAdmin }));
            resolve(utenti);
        });
    });
};
// get nome corrente del sito
exports.getNomeSito = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT nomesito FROM sito';
        db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            const nome = { nomesito: row.nomesito };
            resolve(nome);
        });
    });
};



// CREATE
// aggiungo nuova pagina ( POST )
exports.createPage = (page) => {
    return new Promise((resolve, reject) => {
        //- Tabella `pagine` - (id(server), autoreId, titolo, dataCreazione, dataPubblicazione)
        const sql = 'INSERT INTO pagine(autoreId, titolo, dataCreazione, dataPubblicazione) VALUES(?, ?, DATE(?), DATE(?))';
        db.run(sql, [page.autoreId, page.titolo, page.dataCreazione, page.dataPubblicazione], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};
exports.createBlock = (block) => {
    return new Promise((resolve, reject) => {
        //- Tabella `blocchi` - (id, paginaId, tipo, contenuto, posizione)
        const sql = 'INSERT INTO blocchi(paginaId, tipo, contenuto, posizione) VALUES(?, ?, ?,?)';
        db.run(sql, [block.paginaId, block.tipo, block.contenuto, block.posizione], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(block);
        });
    });
};
// AGGIORNA NOME SITO SOLO SE SONO ADMIN
exports.updateSiteName = (sitename,isAdmin) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE sito SET nomesito=? WHERE ?';
        db.run(sql, [sitename,isAdmin], function (err) {
            if (err) {
                reject(err);
                return;
            }
            if (this.changes !== 1)
                resolve({ error: 'Aggiornamento fallito' });
            else
                resolve(this.changes);
        });
    });
};

// QUESTA FUNZIONE AGGIORNA LA PAGINA E LE SUE PROPRIETA' (BLOCCHI ESCLUSI)
exports.updatePage = ( id, page,user,isAdmin) => {
        // doppio check per quanto riguarda isAdmin oppure se utente autore della pagina è user loggato
      return new Promise((resolve, reject) => {
      const sql = 'UPDATE pagine SET titolo=?, autoreId=?, dataCreazione=DATE(?), dataPubblicazione=DATE(?) WHERE id=? AND (autoreId = ? OR ?)';
      db.run(sql, [page.titolo, page.autoreId, page.dataCreazione, page.dataPubblicazione, id, user,isAdmin], function (err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes !== 1) {
          resolve({ error: 'La pagina non è stata aggiornata.' });
        } else {
          resolve(this.changes); 
        }
      });
    });
  };

// QUESTA FUNZIONE CANCELLA UNA PAGINA IN BASE AL SUO ID (no blocchi) se autore della pagina o admin
exports.deletePage = (userId,isAdmin, id) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM pagine WHERE id=? AND (autoreId = ? OR ?)';
      db.run(sql, [id, userId , isAdmin], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);// righe cancellate
      });
    });
  }
  // QUESTA FUNZIONE CANCELLA I BLOCCHI DI UNA PAGINA IN BASE ALL'ID DELLA PAGINA
exports.deleteBlocks = ( id) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM blocchi WHERE paginaId=? ';
      db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes !== 1)
            resolve({ error: 'Nessun blocco cancellato' });
        else
        resolve(this.changes);// righe cancellate
      });
    });
  }