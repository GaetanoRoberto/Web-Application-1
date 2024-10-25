import { Button, Navbar, Container, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
import { useState,useContext } from "react"
import 'bootstrap-icons/font/bootstrap-icons.css';
import {UserContext,MessageContext, DirtyContext} from './UserErrorsContextDirty';
import API from '../API';

function Loading() {
  return (
    <Spinner className='m-2' animation="border" role="status" />
  )
}

function MyNavbar(props) {
  const navigate = useNavigate();
  const {siteName,setSiteName} = props; 
  // Stato per tenere traccia delle modifiche al nome del sito
  const [editSiteName, setEditSiteName] = useState(siteName); 

  const handleErrors = useContext(MessageContext);
  const setDirty = useContext(DirtyContext);
  const [isEditing, setIsEditing] = useState(false);
  const user = useContext(UserContext);
  const name = user && user.username; //se è definito prendo il nome
  const isAdmin = user && user.isAdmin; //se è definito prendo isAdmin

  const handleNomeChange = (e) => {
    setEditSiteName(e.target.value);
  };

  const handleSaveNome = () => {    
    if (!editSiteName || editSiteName.trim().length == 0) {
      handleErrors("Inserisci un nome valido")
      props.setDirty(true)
      return;
    } else {
      API.updateSiteName(editSiteName)
      .then(()=>{
        setIsEditing(false);
        //aggiorno nome del sito con nuovo valore
        setSiteName(editSiteName)
      })
      .catch((err)=>handleErrors(err))
    }
  };
  //funzione annulla modifiche al nome del sito
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditSiteName(siteName);
    //setSiteName(previousSiteName); 
  };
  return (
    <Navbar bg='success' variant='dark'  >
      <Container fluid>
        <Link to='/'>
          <Navbar.Brand className="bi bi-house" onClick={()=>setDirty(true)} />
        </Link>
        <Navbar.Brand className='fs-5'>{isEditing && isAdmin? (<input type='text' value={editSiteName} onChange={handleNomeChange} className='fs-5 text-primary' />
        ) : (siteName)}
        </Navbar.Brand>
        {isAdmin ? (
          isEditing ? (
            <>
            <Button className='mx-2' variant='warning' onClick={handleSaveNome}>SALVA</Button>
            <Button className="mx-2" variant="danger" onClick={handleCancelEdit}>ANNULLA</Button>
            </>
          ) : (
            <Button className='mx-2' variant='warning' onClick={() => setIsEditing(true)}>CAMBIA NOME</Button>
          )
        ) : (
          <></>
        )}

        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          {name ? <>
            <Navbar.Text className='fs-5 text-light '>
              {"Ciao " + name}
            </Navbar.Text>
            <Button className='mx-2' variant='danger' onClick={props.handleLogout}>Logout</Button>
          </> :
            <><Navbar.Text className='fs-5 text-light'>
              {"Benvenuto"}
            </Navbar.Text> <Button className='mx-2' variant='warning' onClick={() => navigate('/login')}>Login</Button>
            </>
          }
        </Navbar.Collapse>
      </Container>
    </Navbar >
  );
}

function DefaultRoute() {
  return (
    <Container className='App'>
      <h1>Non dovresti essere qui!</h1>
      <h2>URL sbagliato</h2>
      <Link to='/'>Torna alla pagina principale</Link>
    </Container>
  );
}

export {Loading, MyNavbar, DefaultRoute };
