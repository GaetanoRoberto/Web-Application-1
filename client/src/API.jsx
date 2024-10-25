/**
 * All the API calls
 */

import dayjs from "dayjs";

const URL = 'http://localhost:3001/api';

async function getPagesPublished() {
  // call  /api/pages/frontoffice
  const response = await fetch(URL+'/pages/frontoffice').catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
  const pages = await response.json();
  if (response.ok) {
    return pages.map((page) => ({ id: page.id,autore:page.autore, autoreId: page.autoreId, titolo: page.titolo, dataCreazione: dayjs(page.dataCreazione), dataPubblicazione: dayjs(page.dataPubblicazione) }));
  } else {
    throw pages;  
  }
}
async function getAllPages() {
  // call  /api/pages/backoffice
  const response = await fetch(URL+'/pages/backoffice', {
    credentials: 'include'
  }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
  const pages = await response.json();
  if (response.ok) {
    return pages.map((page) => ({ id: page.id,autore:page.autore, autoreId: page.autoreId, titolo: page.titolo, dataCreazione: dayjs(page.dataCreazione), dataPubblicazione: dayjs(page.dataPubblicazione) }));
  } else {
    throw pages;  
  }
}
async function getUsers() {
  // call  /api/pages/frontoffice
  const response = await fetch(URL+'/users', {
    credentials: 'include'
  }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
  const users = await response.json();
  if (response.ok) {
    return users;
  } else {
    throw users;  
  }
}
async function getImages() {
    const response = await fetch(URL+'/images').catch(() => { throw({ error: "Errore di comunicazione con il server" }) });    
    const data = await response.json();
    if (response.ok) 
      return data;
    else 
      throw data;
}
async function getSiteName() {
    // call  /api/sitename
    const response = await fetch(URL+`/sitename`).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
    const sitename = await response.json();
    if (response.ok) {
      return sitename.nomesito;
    } else {
      throw sitename;  
    }
  }
  async function getEveryPage(id) {
    // call  /api/pages/:id
    const response = await fetch(URL+`/pages/backoffice/${id}`, {
      credentials: 'include'
    }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
    const page = await response.json();
    if (response.ok) {
      return page;
    } else {
      throw page;  
    }
  }
  async function getPagePublished(id) {
    // call  /api/pages/:id
    const response = await fetch(URL+`/pages/frontoffice/${id}` ).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
    const page = await response.json();
    
    if (response.ok) {
      return page;
    } else {
      throw page;  
    }
  }
 
  async function updateSiteName(sitename) {
    // call  PUT /api/sitename
    const response = await fetch(URL+`/sitename`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({sitename}),// stringify oggetto sitename per mandarlo al server
      }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
        if (response.ok) {
          return response;
        } else {
          throw response;
        }
  };


function addPage(page) {
  // call  POST /api/pages
  return new Promise((resolve, reject) => {
    fetch(URL+`/pages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(page),
    }).then((response) => {
      if (response.ok) {
        response.json()
          .then((id) => resolve(id))
          .catch(() => { reject({ error: "Non riesco a fare il parse della risposta del server" }) }); 
      } else {
        // analizzo possibili errori
        response.json()
          //errore in response
          .then((message) => { reject(message); }) 
          .catch(() => { reject({ error: "Non riesco a fare il parse della risposta del server" }) }); 
      }
    }).catch(() => { reject({ error: "Errore di comunicazione con il server" }) }); 
  });
}
// per editare una pagina
function editPage(page) {
  // call  POST /api/edit/:pageId
  return new Promise((resolve, reject) => {
    fetch(URL+`/pages/${page.id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(page),
    }).then((response) => {
      if (response.ok) {
        response.json()
          .then((id) => resolve(id))
          .catch(() => { reject({ error: "Non riesco a fare il parse della risposta del server" }) }); 
      } else {
        // analizzo possibili errori
        response.json()
          //errore in response
          .then((message) => { reject(message); }) 
          .catch(() => { reject({ error: "Non riesco a fare il parse della risposta del server" }) }); 
      }
    }).catch(() => { reject({ error: "Errore di comunicazione con il server" }) }); 
  });
}
function deletePage(pageId) {
  return new Promise((resolve, reject) => {
    fetch(URL + `/pages/${pageId}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        // analizzo possibili errori
        response.json()
          //errore in response
          .then((message) => { reject(message); }) 
          .catch(() => { reject({ error: "Non riesco a fare il parse della risposta del server" }) }); 
      }
    }).catch(() => { reject({ error: "Errore di comunicazione con il server" }) });
  });
}




async function logIn(credentials) {
  let response = await fetch(URL + '/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

async function logOut() {
  await fetch(URL+'/sessions/current', {
    method: 'DELETE', 
    credentials: 'include' 
  }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
}

async function getUserInfo() {
  const response = await fetch(URL+'/sessions/current', {
    credentials: 'include'
  }).catch(() => { throw({ error: "Errore di comunicazione con il server" }) });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo; 
  }
}



const API = {
  getAllPages, getSiteName, updateSiteName, getEveryPage,getPagePublished, getImages, getPagesPublished, 
  addPage,editPage,deletePage,logIn, logOut, getUserInfo,getUsers
};
export default API;