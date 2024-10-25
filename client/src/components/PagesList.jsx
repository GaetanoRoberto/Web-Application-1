import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Table, Row, Col } from 'react-bootstrap';
import {  useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {UserContext,DirtyContext} from './UserErrorsContextDirty';
import { Loading } from './utility';
import dayjs from 'dayjs';

function PageRow(props) {
  const navigate = useNavigate();
  const { e } = props;
  const userId = props.user && props.user.id
  const userIsAdmin = props.user && props.user.isAdmin
  // dataPubb vuota se non definita
  const dataPubl = e.dataPubblicazione.format("YYYY-MM-DD") == "Invalid Date" ? " " : e.dataPubblicazione.format("YYYY-MM-DD");

    return (
      <tr >
        <td>{e.titolo}</td>
        <td>{e.autore}</td>
        <td>{e.dataCreazione.format("YYYY-MM-DD")}</td>
        <td>{dataPubl > dayjs().format("YYYY-MM-DD") ? `${dataPubl} ( PROGRAMMATA )` : dataPubl}</td>
        {// BOTTONI EDIT E CANCELLA SOLO SE NON IN FRONT E SONO (ADMIN O AUTORE DELLA PAGINA)
          <td> 
          <Button variant="primary"
            onClick={() => {navigate(`/pages/${e.id}`)}}><i className="bi bi-search" /></Button>
          <Button variant='secondary' className='mx-2' hidden={props.front || (e.autoreId !== userId && !userIsAdmin)}
            onClick={() => { navigate(`/edit/${e.id}`)  }}><i className='bi bi-pencil-square' /></Button>
          <Button variant="danger" hidden={props.front || (e.autoreId !== userId && !userIsAdmin)}
            onClick={() => props.deletePage(e.id)}><i className='bi bi-trash' /></Button>
        </td>}
      </tr>

    );
}

function PagesList(props) {

  const navigate = useNavigate();
  const user = useContext(UserContext);
  const setDirty = useContext(DirtyContext);

  const location = useLocation();
  // location.pathname = / se in frontoffice o /backoffice se sono in backoffice
  const front = location.pathname === '/';
  // se sono in front pagine filtrate per pubblicate
  const pages = front ?
  // filtro per pubblicate e ordino per dataPubblicazione crescente (alternativa meno efficiente per la rete sarebbe fare due chiamate API(pagine filtrate e non) nel main se sono loggato )
  props.pages.filter(page => dayjs(page.dataPubblicazione).isBefore(dayjs())).sort((a, b) => dayjs(a.dataPubblicazione).diff(dayjs(b.dataPubblicazione), "day"))
  :
  props.pages

  //CARICAMENTO PAGINE
  if(props.initialLoading)
    return <Loading />
  //NESSUNA PAGINA ESISTENTE
  else if (pages.length === 0)
    return <>
    <h1  className='fw-bold mb-5 '> Non ci sono pagine </h1>
          {user?.id && !front  
           ? //bottoni solo se loggato (user.id esiste)
           <>
           <Button variant='success' className={"mx-5 mb-4"} onClick={() => {navigate('/add') }} hidden={user?.id ? false : true}>Add page</Button>
            <Button variant='info' className={"mx-4 mb-4"} hidden={user?.id ? false : true} onClick={() =>{ navigate('/');setDirty(true) }} >Front office</Button>
            </>
            :
            <Button variant='info' className={"mx-4 mb-4"} hidden={user?.id ? false : true} onClick={() =>{navigate('/backoffice');setDirty(true) }} >Back office</Button>
          }
    </>
  else
  // PAGINE ESISTENTI
  return (
    <>
      <Row>
        <Col>
          <p className='fw-bold'>Pagine ({pages.length}):</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table hover bordered>
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Autore</th>
                <th>Data di creazione</th>
                <th>Data di pubblicazione</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((e) =>
                <PageRow e={e} deletePage={props.deletePage} user={user} key={e.id} front={front} /*onClick={() => navigate('/add')} */ />)
              }
            </tbody>
          </Table>
        </Col>
      </Row>
      <Row>
        <Col>
          {user?.id && !front ? //bottoni solo se loggato (user.id esiste)
          <>
            <Button variant='success' className={"mx-5 mb-4"} onClick={() =>{ navigate('/add') }} hidden={user?.id ? false : true}>ADD PAGE</Button>
            <Button variant='info' className={"mx-4 mb-4"} hidden={user?.id ? false : true} onClick={() =>{ navigate('/');setDirty(true) }} >FRONT OFFICE</Button>
            </>
            :
            <Button variant='info' className={"mx-4 mb-4"} hidden={user?.id ? false : true} onClick={() => {navigate('/backoffice');setDirty(true) }} >BACK OFFICE</Button>
          }
        </Col>
      </Row>
    </>
  )
}

export { PagesList, PageRow };