import React from 'react'
import {NavDropdown, Navbar, MenuItem} from 'react-bootstrap';

const NavHead = () => {
  let isHome = window.location.href.match(/\/home/)
  return(
    <Navbar.Brand>
      <NavDropdown title='Chemotion' className="navig-brand" id="bg-nested-dropdown-brand">
        <MenuItem eventKey="11" href="http://www.chemotion.net" target="_blank">Chemotion repository</MenuItem>
        <MenuItem eventKey="13" href="http://www.complat.kit.edu/" target="_blank">Complat</MenuItem>
        <MenuItem eventKey="14" href="https://github.com/ComPlat" target="_blank">Complat on Github</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey='15' href={isHome ? '/' : '/home'} target="_self">{isHome ? 'ELN' : 'Home'}</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey='16' href="https://github.com/Allenskywalker92/ChemotionURIHandler/tree/main/ChemotionURLHandler/Release" target="_blank">Download URL handler </MenuItem>
        <MenuItem divider />
        <MenuItem eventKey='15' href="/about" target="_self">About</MenuItem>
      </NavDropdown>
    </Navbar.Brand>
  )
}

NavHead.propTypes = {
}

export default NavHead;
