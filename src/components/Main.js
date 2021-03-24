import {useState, useEffect} from "react"
import NavBar from "./NavBar";
import Terminal from "./tabs/Terminal";
import Temperatures from "./tabs/Temperatures";
import Container from "react-bootstrap/Container";
import {Card, Col, Row} from "react-bootstrap";
import useEvent from "../hooks/useEvent"

const OctoPrint = window.OctoPrint

const UiCard = (props) => {
    return (
        <Col lg={6} md={12} sm={12} className={"p-2"}>
            <Card className={"shadow-md"} style={{"height": "500px"}}>
                <Card.Body>
                    {props.children}
                </Card.Body>
            </Card>
        </Col>
    )
}

const Main = (props) => {
    const [settings, setSettings] = useState({
        api: {},
        appearance: {},
        devel: {},
        feature: {},
        folder: {},
        gcodeAnalysis: {},
        plugins: {},
        printer: {},
        scripts: {},
        serial: {},
        slicing: {},
        system: {},
        temperature: {},
        terminalFilters: {},
        webcam: {}
    });

    useEffect(() => {
        OctoPrint.settings.get().done((response) => {
            setSettings(response)
        })
    }, [])

    useEvent("SettingsUpdated", () => {
        console.log("Got event settings updated")
        OctoPrint.settings.get().done((response) => {
            setSettings(response)
        })
    })

    return (
        <>
            <NavBar settings={settings} logout={props.onLogout}/>
            <Container fluid>
                <Row>
                    {/*<Col lg={2}>
                        Sidebar?
                    </Col>
                    */}
                    <Col lg={12} className={"pt-3"}>
                        <Row>
                            <UiCard>
                                <Temperatures />
                            </UiCard>
                            <UiCard>
                                <Terminal />
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