BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "utenti" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"username"	TEXT NOT NULL UNIQUE,
	"email"	TEXT NOT NULL UNIQUE,
	"hash"	TEXT NOT NULL,
	"salt" TEXT NOT NULL,
	"isAdmin" BOOLEAN NOT NULL
);
CREATE TABLE IF NOT EXISTS "pagine" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"autoreId" INTEGER NOT NULL, 
	"titolo"	TEXT NOT NULL ,
	"dataCreazione"	DATE NOT NULL,
	"dataPubblicazione" DATE,
	FOREIGN KEY("autoreId") REFERENCES "utenti"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "blocchi" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"paginaId" INTEGER NOT NULL,
	"tipo"	TEXT NOT NULL,
	"contenuto"	TEXT NOT NULL,
	"posizione" INTEGER NOT NULL ,   
	FOREIGN KEY("paginaId") REFERENCES "pagine"("id") ON DELETE CASCADE

);

CREATE TABLE IF NOT EXISTS "sito" (
	"nomesito" TEXT NOT NULL
);
INSERT INTO "utenti" VALUES (1,'Gaetano','u1@p.it','5464874ac09c4899ab8553db6618b602f5c7c3825b4d2694bd090cd881b769d3','12349e538f8d547a',false);
INSERT INTO "utenti" VALUES (2,'admin','u2@p.it','5ce4d82233fca54ccdee6505ba43e85c354ea59386de3c34983856dc6e08b2bd','1234567891113156',true);
INSERT INTO "utenti" VALUES (3,'Roberto','u3@p.it','426e8fd4f12178d743e1f0669af7757c1504187412dd98d89d5c1de00c365b95','53349e538f8d547e',false);
INSERT INTO "utenti" VALUES (4,'user4','u4@p.it','9456ae1d7da4e2a3768dcd7153c8a05504d15a22b9ef17937421b6bad87b94ab','df345678911131ab',false);

INSERT INTO "pagine" VALUES (1,1,'Pagina1',DATE('2023-06-23'),DATE('2023-06-24'));
INSERT INTO "pagine" VALUES (2,1,'Pagina2',DATE('2023-06-22'),DATE('2023-06-22'));
INSERT INTO "pagine" VALUES (3,2,'Pagina admin',DATE('2023-06-24'),null);
INSERT INTO "pagine" VALUES (4,3,'Pagina pubblicata',DATE('2023-06-24'),DATE('2023-06-25'));
INSERT INTO "pagine" VALUES (5,3,'Pagina user3 draft',DATE('2023-06-24'),null);
INSERT INTO "pagine" VALUES (6,3,'Pagina user3 programmata',DATE('2023-06-24'),DATE('2023-10-24'));
INSERT INTO "pagine" VALUES (7,3,'Pagina user3 programmata 2025',DATE('2023-06-24'),DATE('2025-01-24'));

INSERT INTO "blocchi" VALUES (1,1,'header','HEADER',0),(2,1,'paragrafo','Paragrafo di Gaetano',1); 
INSERT INTO "blocchi" VALUES (3,2,'header','Mostra artistica',0),(4,2,'paragrafo','Mostra delle migliori foto scattate  a Torino',1),(5,2,'immagine','Gattino.jpg',2); 

INSERT INTO "blocchi" VALUES (6,3,'header','La pizza napoletana',0),(7,3,'immagine','Pizza.jpg',1); 

INSERT INTO "blocchi" VALUES (8,4,'header','Il cavallo che ha cavalcato le onde',0),(9,4,'immagine','Tramonto.jpg',1); 
INSERT INTO "blocchi" VALUES (10,5,'header','Napoli',0),(11,5,'immagine','Napoli.jpeg',1); 
INSERT INTO "blocchi" VALUES (12,6,'header','Film',0),(13,6,'paragrafo','Pirati dei Caraibi è uno dei film maggiormente apprezzati dalla critica',1); 
INSERT INTO "blocchi" VALUES (14,7,'header','Dieta',0),(15,7,'paragrafo','7 giorni senza carboidrati per vedere i risultati',1); 

INSERT INTO "sito" VALUES("CMS");
COMMIT;

