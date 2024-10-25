import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MyNavbar, DefaultRoute } from './components/utility';
import API from './API';
import { Container, Toast } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { PagesList } from './components/PagesList';
import { PageForm } from './components/PageForm';
import { DirtyContext, UserContext, MessageContext } from './components/UserErrorsContextDirty';

function App() {
  return (
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  );
}

function Main() {

  const [siteName, setSiteName] = useState('CMS');
  const [dirty, setDirty] = useState(true);
  // user loggato?
  const [loggedIn, setLoggedIn] = useState(false);
  // user info
  const [user, setUser] = useState(null);
  // lista pagine
  const [pages, setPages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    const checkAuth = async () => {
      try {
        // se sono già loggato prendo info
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {
        // se sono qui non sono autenticato
        return
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (dirty) {
      API.getSiteName()
        .then((sitename) => {
          setSiteName(sitename)
        })
        .catch((err) => handleErrors(err));

      if (loggedIn) {
        // loggato? => prendo tutte pagine
        API.getAllPages()
          .then((p) => {
            setPages(p)
            setDirty(false);
            setInitialLoading(false);

          })
          .catch((err) => handleErrors(err));
      } else {
        // prendo solo pagine pubblicate
        API.getPagesPublished()
          .then((p) => {
            setPages(p)
            setDirty(false);
            setInitialLoading(false);
          })
          .catch((err) => handleErrors(err));
      }
    }
  }, [dirty]);

  // errori
  const handleErrors = (err) => {
    let msg = '';
    //console.log(err)
    if (err.error) {
      msg = err.error;
    } else if (typeof err === "string") {
      msg = err;
    } else {
      msg = "Errore sconosciuto";
    }
    setMessage(msg);
    setTimeout(() => setDirty(true), 2000);
  }

  const handleLogout = async () => {
    await API.logOut().catch((err) => handleErrors(err));
    setLoggedIn(false);
    setUser(undefined);
    setDirty(true)
    navigate("/")
    /* set state to empty if appropriate */

  }
  const handleLogin = (user) => {
    setUser(user);
    setLoggedIn(true);
    setDirty(true);
  }

  const deletePage = (pageId) => {
    API.deletePage(pageId)
      .then(() => setDirty(true))
      .catch(e => handleErrors(e));
  }

  const addPage = (page) => {
    // se non sono admin allora prendo user.id 
    // è presente anche il controllo lato server
    if (!user.isAdmin)
      page.autoreId = user.id;
    API.addPage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleErrors(e));
  }
  const editPage = (page) => {
    // se non sono admin allora prendo user.id 
    // è presente anche il controllo lato server
    if (!user.isAdmin)
      page.autoreId = user.id;
    API.editPage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleErrors(e));
  }

  return (
    <>
      <UserContext.Provider value={user}>
        <MessageContext.Provider value={handleErrors}>
          <DirtyContext.Provider value={setDirty}>
            <MyNavbar  siteName={siteName} setSiteName={setSiteName} setDirty={setDirty} handleLogout={handleLogout} loggedIn={loggedIn} />
            <Container fluid className="App">
              <Toast show={message !== ''} onClose={() => setMessage('')} delay={6000} autohide bg="danger w-100">
                <Toast.Body>{message}</Toast.Body>
              </Toast>
              <Routes>
                <Route path='/' element={<PagesList pages={pages}  deletePage={deletePage}initialLoading={initialLoading} /> /*frontoffice*/} />
                <Route path='/backoffice' element={loggedIn ? <PagesList pages={pages}  deletePage={deletePage} initialLoading={initialLoading} /> : <Navigate replace to='/' />} />
                <Route path="/add" element={loggedIn ? <PageForm setSiteName={setSiteName} loggedIn={loggedIn} addPage={addPage} /> : <Navigate replace to='/' />} />
                <Route path="/edit/:pageId" element={loggedIn ? <PageForm loggedIn={loggedIn} setSiteName={setSiteName} editPage={editPage} /> : <Navigate replace to='/' />} />
                <Route path="/pages/:pageId" element={<PageForm setSiteName={setSiteName} loggedIn={loggedIn} />} />
                <Route path='/login' element={loggedIn ? <Navigate replace to='/backoffice' /> : <LoginForm handleLogin={handleLogin} />} />
                <Route path='/*' element={<DefaultRoute />} />
              </Routes>
            </Container>
          </DirtyContext.Provider>
        </MessageContext.Provider>
      </UserContext.Provider>
    </>
  );
}

export default App
