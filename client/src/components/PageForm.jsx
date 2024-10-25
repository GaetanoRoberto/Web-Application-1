import dayjs from 'dayjs';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useContext, useEffect } from 'react';
import { ButtonGroup, Form, Button, Alert, Row, Col, Image } from 'react-bootstrap';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { DirtyContext, UserContext, MessageContext } from './UserErrorsContextDirty';
import { Loading } from './utility';
import API from '../API';

const PageForm = (props) => {
  const user = useContext(UserContext);
  const handleErrors = useContext(MessageContext);
  const setDirty = useContext(DirtyContext);
  // pageID da URL
  const { pageId } = useParams();
  const location = useLocation();
  // location.pathname = /pages/pageId of view or /edit/pageId or /add
  const view = location.pathname === `/pages/${pageId}`
  // info pagina
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(user ? user.username : " ");
  const [datePubbl, setDatePubbl] = useState(null);
  // stato per array dei contenuti {tipo, valore,posizione} inizialiazzato con un header vuoto se sono in add
  const [content, setContent] = useState(pageId ? [] : [{ contentType: 'header', contentValue: '', position: 0 }]);
  // stato per le immagini
  const [images, setImages] = useState([]);
  // stato per mostrare o no la selezione delle immagini 
  const [showImageSelection, setShowImageSelection] = useState(false);
  //stato per mostrare gli utenti registrati al form select 
  const [users, setUsers] = useState([]);
  //stato per il loading della page
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  // USE EFFECT 
  useEffect(() => {
    if (pageId) {// se non sono in add prendo i dati della pagina dal server
      if (props.loggedIn) {
        API.getEveryPage(pageId)
          .then((page) => {
            setTitle(page.titolo);
            setAuthor(page.autore),
              setDateCreation(page.dataCreazione);
            setDatePubbl(page.dataPubblicazione);
            const updatedContent = page.blocchi.map((blocco) => ({
              contentType: blocco.tipo,
              contentValue: blocco.contenuto,
              position: blocco.posizione
            }));
            setContent(updatedContent);
            setLoading(false);
          }
          )
          .catch((err) => handleErrors(err));
      } else {//prendo i dati della pagina solo se è pubblicata
        API.getPagePublished(pageId)
          .then((page) => {
            setTitle(page.titolo);
            setAuthor(page.autore),
              setDateCreation(page.dataCreazione);
            setDatePubbl(page.dataPubblicazione);
            const updatedContent = page.blocchi.map((blocco) => ({
              contentType: blocco.tipo,
              contentValue: blocco.contenuto,
              position: blocco.posizione
            }));
            setContent(updatedContent);
            setLoading(false);
          })
          .catch((err) => handleErrors(err));
      }
    }
    //aggiorno nome del sito nel caso un admin l'abbia modificato 
    API.getSiteName()
      .then((sitename) => {
        props.setSiteName(sitename)
      })
      .catch((err) => handleErrors(err));
    //se sono admin prendo gli utenti per poter cambiare autore di una pagina
    if (user && user.isAdmin) {
      API.getUsers(users)
        .then((u) => setUsers(u))
        .catch((err) => handleErrors(err));
    }
  }, []);
  // FUNZIONI PER GESTIRE CONTENUTO: CAMBIA,SU,GIU',RIMUOVI,AGGIUNGI BLOCCHI
  const handleContentChange = (index, contentType, contentValue) => {
    const updatedContent = [...content];//copia array
    updatedContent[index].contentType = contentType;//creo tipo
    updatedContent[index].contentValue = contentValue;//creo valore
    updatedContent[index].position = index;//associo posizione
    setContent(updatedContent);
  };
  const handleMoveUp = (index) => {
    if (index > 0) {
      const updatedContent = [...content];
      //swap blocchi
      [updatedContent[index - 1], updatedContent[index]] = [updatedContent[index], updatedContent[index - 1]];
      // Aggiorna l'ordine di updatedContent.position
      updatedContent.forEach((blocco, idx) => {
        blocco.position = idx;
      });
      setContent(updatedContent);
    }
  };
  const handleMoveDown = (index) => {
    if (index < content.length - 1) {
      const updatedContent = [...content];
      // swap blocchi
      [updatedContent[index], updatedContent[index + 1]] = [updatedContent[index + 1], updatedContent[index]];
      // Aggiorna l'ordine di updatedContent.position
      updatedContent.forEach((blocco, idx) => {
        blocco.position = idx;
      });
      setContent(updatedContent);
    }
  };
  //rimuovo contenuto dall'array in base all'indice
  const handleRemoveContent = (index) => {
    const updatedContent = [...content];
    updatedContent.splice(index, 1);//rimuove elemento in posizione index
    // Aggiorna l'ordine di updatedContent.position
    updatedContent.forEach((blocco, idx) => {
      blocco.position = idx;
    });
    setContent(updatedContent);
  };
  const handleAddHeader = () => {
    setContent([...content, { contentType: 'header', contentValue: '', position: content.length }]);
  };
  const handleAddParagraph = () => {
    setContent([...content, { contentType: 'paragrafo', contentValue: '', position: content.length }]);
  };
  const handleAddImage = (image) => {
    setContent([...content, { contentType: 'immagine', contentValue: image, position: content.length }]);
    setShowImageSelection(false)
  };
  //funzione richiamata da "Nuova immagine" che mostra il riquadro delle immagini e fa la chiamata al server per prendere le immagini
  const getImages = () => {
    setShowImageSelection(true)
    API.getImages().then((i) => setImages(i.images))
      .catch((err) => handleErrors(err));
  };
  //funzione per trovare l'id conoscendo lo username
  const findUserIdByUsername = (username) => {
    return (users.find((u) => u.username == username).id);
  };
  function handleSubmit(event) {
    setErrorMsg('')
    event.preventDefault();//non invio subito dati del form
    //check blocchi non vuoti e che siano almeno un header e almeno un elemento di tipo paragrafo o immagine
    const isEmpty = content.some((blocco) => blocco.contentValue.trim().length <= 0);
    const hasHeader = content.some((blocco) => blocco.contentType === 'header');
    const paragOrImage = content.some((blocco) => blocco.contentType === 'paragrafo' || blocco.contentType === 'immagine');
    // Form validation
    if (title === '' || title.trim().length === 0)
      setErrorMsg('Titolo non valido');
    else if (!hasHeader || !paragOrImage)
      setErrorMsg("La pagina deve contenere almeno un header e almeno un paragrafo o un'immagine");
    else if (isEmpty)
      setErrorMsg("La pagina non puo' contenere blocchi vuoti");
    else {
      const page = {
        titolo: title,
        autoreId: user.isAdmin ? findUserIdByUsername(author) : user.id,//get autoreId
        dataCreazione: dayjs(dateCreation).format("YYYY-MM-DD"),
        dataPubblicazione: datePubbl ? dayjs(datePubbl).format("YYYY-MM-DD") : null,
        blocchi: content.map((block) => ({
          tipo: block.contentType,
          contenuto: block.contentValue,
          posizione: block.position
        }))
      }
      if (pageId) {  // per vedere se sono in add o in edit
        page.id = pageId;//url
        props.editPage(page);
      } else {
        props.addPage(page);
      }
      navigate('/backoffice');
    }
  }
  if (loading && pageId)
    return <Loading />// se non ho dati spinner
  else return (
    <>
      {pageId ? <h3>PAGINA N. {pageId}</h3> : <br />}
      <Form onSubmit={handleSubmit}    >
        {errorMsg ? <Alert variant='danger' onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert> : false}
{// IN VIEW HO:
          view ?
            <Row>
              <Col>Titolo:<h2 style={{ color: 'red' }}> {title}</h2></Col>
              <Col> Data di creazione: <h5>{dateCreation}</h5></Col>
              <Col>Data di pubblicazione: {datePubbl ? <h5>{datePubbl}</h5> : <h5>Non Pubblicato</h5>}</Col>
              <Col>Autore:<h5>{author}</h5></Col>
            </Row>
:   // IN EDIT/ADD HO:
            <><Row><Col>
              <Form.Group className='mb-3'><Form.Label>Titolo</Form.Label>
                <Form.Control type="text" name="title" value={title} onChange={ev => setTitle(ev.target.value)} />
              </Form.Group>
            </Col><Col>
                <Form.Group className='mb-3'><Form.Label>Autore </Form.Label>
                  {user.isAdmin ? //admin ? form select con utenti 
                    <Form.Select value={author} onChange={ev => setAuthor(ev.target.value)}>
                      {users.map(u => (
                        <option key={u.id} value={u.username}>{u.username}</option>
                      ))
                      }</Form.Select>
                    :  // NON ADMIN : testo con default utente loggato
                    <Form.Control type="text" disabled name="title" value={user.username} />
                  }
                </Form.Group></Col><Col>
                <Form.Group className='mb-3'>
                  <Form.Label>Data di Creazione</Form.Label>
                  <Form.Control type="date" name="dateCreation" value={dateCreation} disabled readOnly />
                </Form.Group></Col><Col>
                <Form.Group className='mb-3'>
                  <Form.Label>Data di Pubblicazione</Form.Label>
                  <Form.Control type="date" min={dateCreation} name="datePubblication" value={datePubbl || ''} onChange={ev => setDatePubbl(ev.target.value)} />
                </Form.Group></Col></Row>

{/* BOTTONI AGGIUNGERE CONTENUTO */}
              <Row className='mb-4 mt-4 ' >
                <Col className="d-flex justify-content-center">
                  <Button variant="info" onClick={handleAddHeader}>Nuovo Header</Button>
                </Col>
                <Col className="d-flex justify-content-center">
                  <Button variant="success" onClick={handleAddParagraph}>Nuovo Paragrafo</Button>
                </Col>
                <Col className="d-flex justify-content-center">
                  <Button variant="warning" onClick={getImages}>Nuova immagine</Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  {showImageSelection && (
                    <>
                      <h3 className='fw bold'>Scegli un'immagine</h3>
                      <div style={{ display: 'flex' }}>
                        {images.map((image, index) => (
                          <div key={{ image } + index} style={{ marginRight: '10px', cursor: 'pointer', width: '300px' }}
                            onClick={() => handleAddImage(image)}>
                            <Image src={`http://localhost:3001/images/${image}`} style={{ height: '100%' }} fluid thumbnail />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Col></Row></>
        }
{content.map((item, index) => (//mappo i singoli componenti (items) in base all'indice dell'item
          <Row key={index} className="align-items-center  "  >
            <Col xs={9}  >
              {item.contentType === 'header' && (// map header
                <Form.Group className="mb-3">
                  <Form.Label hidden={view} className=" fw-bold">Header</Form.Label>
                  <Form.Control disabled={view} type="text" className="text-uppercase fw-bold " placeholder="Inserisci il nuovo Header" value={item.contentValue} style={view ? { backgroundColor: 'white' } : {}}
                    onChange={(e) =>
                      handleContentChange(index, item.contentType, e.target.value)
                    }
                  />
                </Form.Group>
              )}

              {item.contentType === 'paragrafo' && (//map paragrafo
                <Form.Group className="mb-3" >
                  <Form.Label hidden={view} className=" fw-bold" >Paragrafo</Form.Label>
                  <Form.Control disabled={view} as="textarea" style={view ? { backgroundColor: 'white', fontSize: '20px', lineHeight: '1.5', minHeight: '200px' } : { fontSize: '20px', lineHeight: '1.5', minHeight: '200px' }} placeholder="Inserisci il nuovo Paragrafo" value={item.contentValue}
                    onChange={(e) => handleContentChange(index, item.contentType, e.target.value)} />
                </Form.Group>
              )}

              {item.contentType === 'immagine' && (//map immagini selezionate
                <div key={index}>
                  <h6 hidden={view} className='fw-bold'>Immagine selezionata:{" " + item.contentValue}</h6>
                  <Image key={index} src={`http://localhost:3001/images/${item.contentValue}`} style={{ width: '600px', height: '300px' }} fluid /></div>
              )}

            </Col>
            <Col xs={3} className="d-flex justify-content-end">
              <ButtonGroup hidden={view} >
                {/* disabilitato se primo elemento*/}
                <Button variant="success" disabled={index === 0} onClick={() => handleMoveUp(index)} className="btn-lg mx-2"><i className="bi bi-arrow-up" /></Button>
                {/* disabilitato se ultimo elemento*/}
                <Button variant="primary" disabled={index === content.length - 1} onClick={() => handleMoveDown(index)} className="btn-lg mx-2"><i className="bi bi-arrow-down" /></Button>
                <Button variant="danger" onClick={() => handleRemoveContent(index)} className="btn-lg mx-2"><i className="bi bi-trash2-fill" /></Button>
              </ButtonGroup>
            </Col>
          </Row >

        ))
//bottoni submit, front e back       
        }
        <Row hidden={view} ><hr /><Col>
        <Button className="btn-lg mx-2 mb-4 " type='submit' variant="primary">{pageId ? 'Aggiorna la pagina' : 'Aggiungi la pagina'}</Button></Col>
        </Row>
      </Form >
      {view ? <>
        <Button className="btn-lg mx-2 mt-4 " variant='danger' onClick={() => { navigate('/'); setDirty(true) }}>HOME</Button>
        <Button variant='info' className="btn-lg mx-2 mt-4" hidden={user?.id ? false : true} onClick={() => { navigate('/backoffice'); setDirty(true) }} >BACK OFFICE</Button>
      </> :
        <Button onClick={() => { navigate('/backoffice'); setDirty(true) }} className="btn-lg mx-2  " variant='danger'>Annulla</Button>
      }
    </>
  )

}
export { PageForm };
