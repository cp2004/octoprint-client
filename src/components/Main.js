import {useState, useEffect} from "react"
import NavBar from "./NavBar";
import Terminal from "./tabs/Terminal";
import Temperatures from "./tabs/Temperatures";
import PrinterState from "./PrinterState";
import {Card, Col, Row, Container} from "react-bootstrap";
import useEvent from "../hooks/useEvent"
import Control from "./tabs/Control";

const OctoPrint = window.OctoPrint

const UiCard = (props) => {
    return (
        <Col lg={6} md={12} sm={12} className={"p-2"}>
            <Card className={"shadow-md"} style={{"minHeight": "500px"}}>
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
                    <Col xs={12} className={"pt-3"}>
                        <PrinterState />
                    </Col>
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
                                <Control settings={settings}/>
                            </UiCard>
                            <UiCard>
                                <h3>File manager?</h3>
                            </UiCard>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default Main;