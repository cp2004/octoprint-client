import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";

const NavBar = (props) => {
    const name = (props.settings.appearance !== "" && props.settings.appearance.name) || "OctoPrint"

    return (
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand>{name}</Navbar.Brand>
            <Nav className="mr-auto">
                <Nav.Link>Nothing here yet :)</Nav.Link>
            </Nav>
            <Nav>
                <Button variant={"danger"} onClick={props.logout}>
                    Logout
                </Button>
            </Nav>
        </Navbar>
    )
}

export default NavBar