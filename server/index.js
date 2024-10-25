'use strict';

const dayjs = require('dayjs')
const express = require('express');
const morgan = require('morgan'); // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const userDao = require('./dao-users'); // module for accessing the user info in the DB
const cors = require('cors');

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: "Forse hai sbagliato a digitare...Riprova!" });

      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user 
      // USER ha campi id, isAdmin e username
    }).catch(err => {
      done(err, null);
    });
});


// init express
const app = express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  //console.log(isLoggedIn)
  return res.status(401).json({ error: 'Non sei loggato' });
}

// set up the session
app.use(session({
  secret: 'chiavesegretissima',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else {
    res.status(401).json({ error: 'User non autenticato! ' });;
  }
});


// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.end(); });
});

/*** APIs ***/

const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));
const imagesDir = path.join(__dirname, 'public', 'images');
// FUNZIONE PER LEGGERE IMMAGINI DA CARTELLA
const getImages = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        reject({ error: 'Errore durante la lettura della cartella con le immagini.' });
        return;
      }
      //controllo estensione delle immagini
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
      resolve(imageFiles);
    });
  });
};
// Endpoint per ottenere la lista dei file nella cartella statica
app.get('/api/images', async (req, res) => {
  try {
    const images = await getImages();
    res.json({ images: images });
  } catch (err) { return res.status(500).json(err) }
});
// GET /api/pages/backoffice
app.get('/api/pages/backoffice', isLoggedIn, (req, res) => {
  dao.getPages()
    .then(pages => {
      if (pages == "Pagine non trovate")
        return res.json([]);
      else
        return res.json(pages)
    })
    .catch(() => res.status(500).json({ error: `DB error durante la visualizzazione delle pagine.` }));
});
// GET /api/pages/frontoffice    solo pubblicate
app.get('/api/pages/frontoffice', (req, res) => {
  dao.getPages()
    .then(pages => {
      if (pages == "Pagine non trovate")
        return res.json([])
      //filtro pubblicate
      const filteredPages = pages.filter(page => dayjs(page.dataPubblicazione).isBefore(dayjs()));
      // ordino per dataPubblicazione crescente
      const sortedPages = filteredPages.sort((a, b) => dayjs(a.dataPubblicazione).diff(dayjs(b.dataPubblicazione), "day"));
      res.json(sortedPages);
    })
    .catch(() => res.status(500).json({ error: `DB error durante la visualizzazione delle pagine.` }));
});
// GET /api/nomesito [qualsiasi utente]
app.get('/api/sitename', (req, res) => {
  dao.getNomeSito()
    .then(name => res.json(name))
    .catch(() => res.status(500).json({ error: `DB error durante la visualizzazione del nome del sito.` }));
});
// GET /api/pages/backoffice/<id> qualsiasi ma devo essere loggato
app.get('/api/pages/backoffice/:id', [
  check('id').isInt({ min: 1 })],
  isLoggedIn, async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(422).json({ error: error.array() });
      }
      const page = await dao.getPage(req.params.id);
      if (page.error)
        return res.status(404).json(page);   // pageId non esiste
      else {
        const blocks = await dao.getBlocks(req.params.id);
        if (blocks.error)
          return res.status(404).json(blocks);
        else {
          const pageWithBlocks = {
            id: page.id,
            autore: page.username,
            autoreId: page.autoreId,
            titolo: page.titolo,
            dataCreazione: page.dataCreazione,
            dataPubblicazione: page.dataPubblicazione,
            blocchi: blocks
          };
          res.json(pageWithBlocks);
        }
      }
    } catch (err) {
      res.status(500).json({ error: `DB error durante la visualizzazione della pagina.` });
    }
  });
// GET /api/pages/frontoffice/<id> solo pubblicate senza login
app.get('/api/pages/frontoffice/:id', [
  check('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({ error: error.array() });
    }
    const page = await dao.getPage(req.params.id);
    if (page.error)
      return res.status(404).json(page);   // pageId does not exist
    // non loggato puo' vedere solo pagine pubblicate
    else if (!dayjs(page.dataPubblicazione).isBefore(dayjs()))
      return res.status(403).json("Non puoi vedere le pagine non ancora pubblicate senza effettuare il login");
    else {
      const blocks = await dao.getBlocks(req.params.id);
      if (blocks.error)
        return res.status(404).json(blocks);
      else {
        const pageWithBlocks = {
          id: page.id,
          autore: page.username,
          autoreId: page.autoreId,
          titolo: page.titolo,
          dataCreazione: page.dataCreazione,
          dataPubblicazione: page.dataPubblicazione,
          blocchi: blocks
        };
        res.json(pageWithBlocks);
      }
    }
  } catch (err) {
    res.status(500).json({ error: `DB error durante la visualizzazione della pagina.` });
  }
});
// GET /api/users [solo admin]
app.get('/api/users', isLoggedIn, (req, res) => {
  dao.getUsers()
    .then(users => {
      if (!req.user.isAdmin)
        return res.status(403).json({ error: `Devi essere admin per visualizzare tutti gli utenti.` });
      res.status(200).json(users)
    })
    .catch(() => res.status(500).json({ error: `DB error durante la visualizzazione degli utenti` }));
});
// Operazione idempotente => PUT(il risultato non cambia se scrivi sempre lo stesso nome)
// PUT /api/sitename
app.put('/api/sitename', isLoggedIn, [
  check('sitename', "Nome del sito non valido").trim().isLength({ min: 1 })],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({ error: error.array() });
    }
    if (!req.user.isAdmin)
      return res.status(403).json({ error: `Devi essere admin per effettuare questa operazione.` });
    try {
      const sitename = req.body.sitename;
      const result = await dao.updateSiteName(sitename, req.user.isAdmin);
      if (result.error)
        return res.status(404).json(result);
      else
        return res.status(200).json(result);
    } catch (err) {
      return res.status(503).json({ error: `DB error durante l'update del nome del sito.` });
    }
  });
// CREARE UNA PAGINA
// POST /api/pages
app.post('/api/pages', isLoggedIn, [
  check('titolo', "il Titolo non puo' essere vuoto ").trim().isLength({ min: 1 }),
  check('autoreId', "autoreId non valido").isInt(),
  //solo valori positivi e inoltre non posso avere blocchi senza posizione
  check('blocchi.*.posizione', "Ogni blocco deve avere una posizione maggiore di 0").isInt({ min: 0 }),
  //no blocchi vuoti
  check('blocchi.*.contenuto', "Non possono esistere blocchi vuoti").trim().isLength({ min: 1 }),
  check('blocchi.*.tipo', "Tipo del blocco non valido").custom((value) => value == 'header' || value == "paragrafo" || value == 'immagine'),
  check('dataCreazione').default(dayjs().format('YYYY-MM-DD')).isDate({ format: 'YYYY-MM-DD', strictMode: true }),
  // controllo se almeno un blocco header e almeno un blocco diverso da header:
  check('blocchi').isArray({ min: 2 }).withMessage("La pagina deve contenere almeno due blocchi"),
  check('blocchi').custom((value) => {
    // Verifica che ci sia almeno un elemento di tipo header e almeno un elemento di tipo paragrafo o immagine
    const header = value.some((blocco) => blocco.tipo === 'header');
    const paragOrImage = value.some((blocco) => blocco.tipo === 'paragrafo' || blocco.tipo === 'immagine');
    return header && paragOrImage;// true se contiene entrambi
  }).withMessage('La pagina deve contenere almeno un header e almeno un blocco di tipo paragrafo o immagine')
],
  async (req, res) => {
    // check errori formato body
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({ error: error.array() });
    }
    //check autoreId della pagine è utente loggato o sono admin
    if (req.body.autoreId != req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: "Devi essere admin per creare una pagina cambiando autore" });
    // check se autoreId passato esiste nel db
    try {
      const userIds = await dao.getUsers()
      const isUserIdPresent = userIds.some(user => user.id === req.body.autoreId);
      if (!isUserIdPresent)
        return res.status(422).json({ error: "Attenzione, l'autore selezionato non esiste" });
      //catch della getUsers()
    } catch (err) { return res.status(503).json({ error: `Errore durante la visualizzazione degli utenti per vedere se esiste l'autore.` }) }

    //check che blocchi.posizione siano tutti diversi tra loro e che siano consecutivi
    let wrongOrders = [];
    req.body.blocchi.forEach((block, index) => {
      if (block.posizione != index) {
        wrongOrders.push(block.posizione);
      }
    });
    if (wrongOrders.length !== 0) {
      return res.status(422).json({ error: `Ogni blocco deve avere una posizione distinta e consecutiva: errore nella posizione ${wrongOrders}` });
    }
    // check che data di creazione sia data giusta
    if (req.body.dataCreazione != dayjs().format("YYYY-MM-DD"))
      return res.status(422).json({ error: `Non puoi cambiare la data di creazione della pagina` });

    // DATA DI PUBBLICAZIONE
    let dataPubblicazione = req.body.dataPubblicazione;
    if (dataPubblicazione) {//definito
      // check formato
      if (!dayjs(dataPubblicazione, 'YYYY-MM-DD').isValid())
        return res.status(422).json({ error: "Formato data di pubblicazione non valido" });//definita ma non valida (es. "maggio 2023")
      if (dataPubblicazione < dayjs().format("YYYY-MM-DD"))
        //check che dataPubblicazione non sia antecedente a data di creazione
        return res.status(422).json({ error: "La data di pubblicazione non puo' essere antecedente alla data di creazione" });
    } else {
      dataPubblicazione = null;//se data non definita 
    }
    // CHECK CHE IMMAGINI BODY ESISTONO
    try {
      const images = await getImages();
      const immaginiBlocchi = req.body.blocchi.filter(blocco => blocco.tipo === 'immagine');
      const immaginiNonPresenti = immaginiBlocchi.filter(blocco => !images.includes(blocco.contenuto));
      if (immaginiNonPresenti.length > 0)
        return res.status(422).json({ error: "una o piu' immagini non esistono" });
    } catch (err) { return res.status(500).json(err) }
    // CREAZIONE OGGETTO PAGINA
    const page = {
      autoreId: req.body.autoreId,//check che autore è utente loggato o diverso solo se admin già fatto
      titolo: req.body.titolo,
      dataCreazione: dayjs().format("YYYY-MM-DD"),//data creazione non puo' essere modificata
      dataPubblicazione: dataPubblicazione
    };
    try {// try createPage
      const pageId = await dao.createPage(page);
      const blocks = req.body.blocchi.map((block) => ({
        paginaId: pageId,
        tipo: block.tipo,
        contenuto: block.contenuto,
        posizione: block.posizione
      }));
      // creo i blocchi con promise all cosi attendo la fine di tutte le promise (una per blocco)
      try {
        await Promise.all(blocks.map(async (block) => {
          return await dao.createBlock(block);
        }));
      } catch (err) {
        //se ci sono errori cancello la pagina creata e grazie al DELETE ON CASCADE si eliminano eventuali blocchi creati
        await dao.deletePage(req.user.id, req.user.isAdmin, pageId);
        throw { error: `Errore durante la creazione dei blocchi: ${err}.` };
      }
      return res.status(201).json(pageId); //201 creato con successo
    } catch (err) {
      return res.status(503).json({ error: `Errore durante la creazione della pagina:${page.titolo} \n ${err}.` });
    }
  }
);
// EDIT PAGINA  post e non put perché non idempotente (cancello blocchi e poi li ricreo)
// POST /api/pages/<id>
app.post('/api/pages/:id', isLoggedIn, [
  check('id').isInt(),
  check('titolo', "il Titolo non puo' essere vuoto ").trim().isLength({ min: 1 }),
  check('autoreId', "autoreId non valido").isInt(),
  // blocchi.posizione non puo' essere assente e deve essere positivo
  check('blocchi.*.posizione', "Ogni blocco deve avere una posizione maggiore di 0").exists().isInt({ min: 0 }),
  //no blocchi vuoti
  check('blocchi.*.contenuto', "Non possono esistere blocchi vuoti").trim().isLength({ min: 1 }),
  check('blocchi.*.tipo', "Tipo del blocco non valido").custom((value) => value == 'header' || value == "paragrafo" || value == 'immagine'),
  check('dataCreazione').default(dayjs().format('YYYY-MM-DD')).isDate({ format: 'YYYY-MM-DD', strictMode: true }),
  // controllo se almeno un blocco header e almeno un blocco diverso da header:
  check('blocchi').isArray({ min: 2 }).withMessage("La pagina deve contenere almeno due blocchi"),
  check('blocchi').custom((value) => {
    // Verifica che ci sia almeno un elemento di tipo header
    const header = value.some((blocco) => blocco.tipo === 'header');
    // Verifica che ci sia almeno un elemento di tipo paragrafo o immagine
    const paragOrImage = value.some((blocco) => blocco.tipo === 'paragrafo' || blocco.tipo === 'immagine');
    return header && paragOrImage;// true se contiene entrambi
  }).withMessage('La pagina deve contenere almeno un header e almeno un blocco di tipo paragrafo o immagine')
], async (req, res) => {
  //primo check pagina esiste e se posso modificarla
  try {
    const pageToEdit = await dao.getPage(req.params.id);
    if (pageToEdit.error)
      return res.status(404).json({ error: `La pagina non esiste.` });
    //primo check  se admin o autore della pagina
    if (!req.user.isAdmin && req.user.id != req.body.autoreId)
      return res.status(403).json({ error: `Devi essere admin per poter editare pagine di cui non sei l'autore.` });
    // mostro errori di validazione se presenti
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({ error: error.array() });
    }
    // check se autoreId passato esiste nel db
    const userIds = await dao.getUsers();

    const isUserIdPresent = userIds.some(user => user.id === req.body.autoreId);
    if (!isUserIdPresent)
      return res.status(422).json({ error: "Attenzione, l'autore selezionato non esiste" });

    // check che data di creazione sia data giusta
    if (req.body.dataCreazione != pageToEdit.dataCreazione)
      return res.status(422).json({ error: `Non puoi cambiare la data di creazione della pagina` });

    //check che blocchi.posizione siano tutti diversi tra loro e che siano consecutivi
    let wrongOrders = [];
    req.body.blocchi.forEach((block, index) => {
      if (block.posizione != index) {
        wrongOrders.push(block.posizione);
      }
    });
    if (wrongOrders.length !== 0) {
      return res.status(422).json({ error: `Ogni blocco deve avere una posizione distinta e consecutiva: errore nella posizione ${wrongOrders}` });
    }
    // check formato data di pubblicazione
    let dataPubblicazione = req.body.dataPubblicazione;
    if (dataPubblicazione) {//definito
      if (!dayjs(dataPubblicazione, 'YYYY-MM-DD').isValid())
        return res.status(422).json({ error: "Formato data di pubblicazione non valido" });//definita ma non valida (es. "maggio 2023")
      if (dataPubblicazione < pageToEdit.dataCreazione)
        //check che dataPubblicazione non sia antecedente a data di creazione
        return res.status(422).json({ error: "La data di pubblicazione non puo' essere antecedente alla data di creazione" });
    } else {
      dataPubblicazione = null;//se data non definita ancora
    }
    //check autoreId della pagine diverso da utente loggato e non sono admin
    if (pageToEdit.autoreId != req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: "Devi essere admin per cambiare autore di una pagina" });//definita ma non valida (es. "maggio 2023")
    // CHECK CHE IMMAGINI BODY ESISTONO
    try {
      const images = await getImages();
      const immaginiBlocchi = req.body.blocchi.filter(blocco => blocco.tipo === 'immagine');
      const immaginiNonPresenti = immaginiBlocchi.filter(blocco => !images.includes(blocco.contenuto));
      if (immaginiNonPresenti.length > 0)
        return res.status(422).json({ error: "una o piu' immagini non esistono" });
    } catch (err) { return res.status(500).json(err) }
    // creo oggetto page da passare alla funzione
    const page = {
      autoreId: req.body.autoreId, //check che sia autore è utente loggato o diverso solo se admin già fatto
      titolo: req.body.titolo,
      dataCreazione: pageToEdit.dataCreazione,//dataCreazione non puo' essere modificata
      dataPubblicazione: dataPubblicazione
    };
    // aggiorno pagina
    const rowsEdited = await dao.updatePage(req.params.id, page, req.user.id, req.user.isAdmin);
    //cancello blocchi esistenti
    try {
      await dao.deleteBlocks(req.params.id);
    } catch (err) { return res.status(503).json({ error: `errore durante la cancellazione dei blocchi della pagina ${req.params.id}: ${err} ` }) }
    //ricreo nuovi blocchi
    const blocks = req.body.blocchi.map((block) => ({
      paginaId: req.params.id,
      tipo: block.tipo,
      contenuto: block.contenuto,
      posizione: block.posizione
    }));
    // creo i blocchi con promise all cosi attendo la fine di tutte le promise (una per blocco)
    let createdBlocks = await Promise.all(blocks.map(async (block) => {
      return await dao.createBlock(block);
    }));
    return res.status(201).json(req.params.id); //201 aggiornato con successo
  } catch (err) {
    return res.status(503).json({ error: `Errore durante l'edit della pagina.ERRORE: ${err}.` });
  }
}
);
// DELETE /api/pages/<id>  cancello pagina by id
app.delete('/api/pages/:id', isLoggedIn, [
  check('id').isInt({ min: 1 })],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({ error: error.array() });
    }
    try {
      // check pagina esiste
      const pageToDelete = await dao.getPage(req.params.id);
      if (pageToDelete.error)
        return res.status(404).json({ error: `La pagina non esiste.` });
      //primo check  se admin o autore della pagina è utente loggato
      if (!req.user.isAdmin && req.user.id != pageToDelete.autoreId)
        return res.status(403).json({ error: `Devi essere admin per poter cancellare pagine di cui non sei l'autore.` });
      //cancello pagina
      const pageDeleted = await dao.deletePage(req.user.id, req.user.isAdmin, req.params.id);
      if (pageDeleted == 1) {// pagina cancellata
        // gestisco cancellazione dei blocchi con DELETE ON CASCADE già nel db ma per sicurezza inserisco commentata una cancellazione manuale
        return res.status(200).json({});//cancello pagina
      }
      else
        return res.status(500).json(pageDeleted);//errore generico
    } catch (err) {
      return res.status(503).json({ error: `errore durante la cancellazione della pagina ${req.params.id}: ${err} ` });
    }

  }
);
// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});