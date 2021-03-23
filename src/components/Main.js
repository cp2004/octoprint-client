import {useState, useEffect} from "react"
import NavBar from "./NavBar";
import Terminal from "./tabs/Terminal";
import Temperatures from "./tabs/Temperatures";
import Container from "react-bootstrap/Container";
import {Card, Col, Row} from "react-bootstrap";


const Main = (props) => {
    const [settings] = useState({});

    useEffect(() => {
        console.log("Effect? main")
    }, [])

    const UiCard = (props) => (
        <Col lg={6} md={6} sm={12}>
            <Card className={"shadow-md"}  style={{"height": "500px"}}>
                <Card.Body>
                    {props.children}
                </Card.Body>
            </Card>
        </Col>
    )

    return (
        <>
            <NavBar settings={settings} logout={props.onLogout}/>
            <Container fluid>
                <Row>
                    <Col lg={2}>
                        Sidebar?
                    </Col>
                    <Col lg={10}>
                        <Row>
                            <UiCard>
                                <Temperatures />
                            </UiCard>
                            <UiCard>
                                {<Terminal />}
                            </UiCard>
                        </Row>
                        <Row>
                            <UiCard>
                                <h3>Hello :)</h3>
                            </UiCard>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default Main;