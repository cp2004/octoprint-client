import {useEffect, useState} from "react";
import {ButtonGroup, Card, Col, Container, Row, ToggleButton, Button} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowUp, faArrowRight, faArrowDown, faArrowLeft, faHome, faCamera} from "@fortawesome/free-solid-svg-icons";
import { usePageVisibility } from 'react-page-visibility';

const OctoPrint = window.OctoPrint

const Control = (props) => {
    const webcamUrl = (
        props.settings.webcam.webcamEnabled && (
            (props.settings.webcam.streamUrl).startsWith("http")
                ? props.settings.webcam.streamUrl
                :  OctoPrint.options.baseurl + "/" + props.settings.webcam.streamUrl
        )
    )

    const isVisible = usePageVisibility()

    const [jogValue, setJogValue] = useState('1');
    const [webcamError, setWebcamError] = useState(false)
    const [webcamLoaded, setWebcamLoaded] = useState(false)

    useEffect(() =>{
        if (!isVisible) {
            setWebcamLoaded(false)
            setWebcamError(false)
        }
    }, [isVisible])

    const onJogValueChange = (e) => setJogValue(e.currentTarget.value)

    const jogCommand = (name, direction) => {
        // Direction will be 'up' or 'down'
        OctoPrint.printer.jog({[name]: jogValue * (direction === "up" ? 1 : -1)})
    }

    const doHome = (axes) => {
        OctoPrint.printer.home(axes)
    }

    return (
        <Container fluid={"md"}>
            <Row>
                <Col xl={6} lg={8} md={8} sm={6} xs={12}>  {/* An attempt at responsiveness... :D */}
                    <div className={"text-center mb-3"}>
                        <h5>X/Y</h5>
                    </div>
                    <JogPanelXY jogCommand={jogCommand} doHome={() => doHome(["x", "y"])} />
                </Col>
                <Col xl={6} lg={4} md={4} sm={6} xs={12}>
                    <div className={"text-center mb-3"}>
                        <h5>Z</h5>
                    </div>
                    <JogPanelZ jogCommand={jogCommand} doHome={() => doHome(["z"])} />
                </Col>
            </Row>
            <Row>
                <Col xs={12} className={"d-flex justify-content-center"}>
                    <JogSizeSlider value={jogValue} onChange={onJogValueChange} />
                </Col>
            </Row>
            {webcamUrl && isVisible &&
                <Card className={"m-3"}>
                    <Card.Header as={"h5"} className={"text-center"}>
                        <strong><FontAwesomeIcon icon={faCamera}/>{" Webcam"}</strong>
                    </Card.Header>
                    <Card.Body eventKey="0">
                        {!webcamLoaded && !webcamError &&
                        <div className={"text-center"}>
                            <div className={"spinner"} />
                            <p>Loading...</p>
                        </div>
                        }
                        {
                            !webcamError
                                ? <img
                                    alt={"Webcam Stream"}
                                    src={webcamUrl}
                                    width={"100%"}
                                    onError={() => setWebcamError(true)}
                                    onLoad={() => setWebcamLoaded(true)}
                                    style={{visibility: webcamLoaded}}
                                />
                                :
                                <div className={"text-center"}>
                                    <p>Webcam stream failed to load</p>
                                    <p>Currently configured URL: <a href={webcamUrl}>{webcamUrl}</a></p>
                                </div>
                        }
                    </Card.Body>
                </Card>
            }
        </Container>
    )
}

const JogPanelXY = (props) => {
    return (
        <Container fluid>
            <div className={"d-flex justify-content-center mb-3"}>
                <Button size={"lg"} onClick={() => props.jogCommand("y", "up")}>
                    <FontAwesomeIcon icon={faArrowUp} fixedWidth />
                </Button>
            </div>
            <div className={"d-flex justify-content-between mb-3"}>
                <Button size={"lg"} onClick={() => props.jogCommand("x", "down")}>
                    <FontAwesomeIcon icon={faArrowLeft} fixedWidth />
                </Button>
                <Button variant={"dark"} size={"lg"}>
                    <FontAwesomeIcon icon={faHome} fixedWidth onClick={props.doHome} />
                </Button>
                <Button size={"lg"} onClick={() => props.jogCommand("x", "up")}>
                    <FontAwesomeIcon icon={faArrowRight} fixedWidth />
                </Button>
            </div>
            <div className={"d-flex justify-content-center"}>
                <Button size={"lg"} onClick={() => props.jogCommand("y", "down")}>
                    <FontAwesomeIcon icon={faArrowDown} fixedWidth />
                </Button>
            </div>
        </Container>
    )
}

const JogPanelZ = (props) => {
    return (
        <Container fluid>
            <div className={"d-flex justify-content-center mb-3"}>
                <Button size={"lg"} onClick={() => props.jogCommand("z", "up")}>
                    <FontAwesomeIcon icon={faArrowUp} fixedWidth />
                </Button>
            </div>
            <div className={"d-flex justify-content-center mb-3"}>
                <Button variant={"dark"} size={"lg"} onClick={props.doHome}>
                    <FontAwesomeIcon icon={faHome} fixedWidth />
                </Button>
            </div>
            <div className={"d-flex justify-content-center mb-3"}>
                <Button size={"lg"} onClick={() => props.jogCommand("z", "down")}>
                    <FontAwesomeIcon icon={faArrowDown} fixedWidth />
                </Button>
            </div>
        </Container>
    )
}

const JogSizeSlider = (props) => {

    const buttons = [
        { name: '0.1', value: '0.1' },
        { name: '1', value: '1' },
        { name: '10', value: '10' },
        { name: '100', value: '100' },
    ];


    return (
        <ButtonGroup size={"lg"} toggle>
            {buttons.map((radio, index) => (
                <ToggleButton
                    key={index}
                    type={"radio"}
                    variant={"outline-secondary"}
                    name={"Jog" + radio.name}
                    value={radio.value}
                    checked={props.value === radio.value}
                    onChange={props.onChange}
                >
                    {radio.name}
                </ToggleButton>
            ))}
        </ButtonGroup>
    )
}

export default Control