import {useState, useEffect} from "react";
import {Col, Row, ProgressBar, Button} from "react-bootstrap";
import Container from "react-bootstrap/Container";

const OctoPrint = window.OctoPrint

const PrinterState = (props) => {
    const [printerState, setPrinterState] = useState({
        text: "",
        flags: {}
    })

    const [jobState, setJobState] = useState({
        file: {},
        estimatedPrintTime: 0,
        lastPrintTime: 0,
        filament: {}
    })

    const [progressState, setProgressState] = useState({
        completion: undefined,
        filepos: undefined,
        printTime: undefined,
        printTimeLeft: undefined,
        printTimeLeftOrigin: undefined,
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const handleMessage = (msg) => {
            setPrinterState(msg.data.state)
            setJobState(msg.data.job)
            setProgressState(msg.data.progress)
        }

        OctoPrint.socket.onMessage("current", handleMessage)
        OctoPrint.socket.onMessage("history", handleMessage)

        return () => {
            OctoPrint.socket.removeMessage("current", handleMessage)
            OctoPrint.socket.removeMessage("history", handleMessage)
        }
    }, [setPrinterState])

    const pausePrint = () => {
        OctoPrint.job.pause()
    }

    const cancelPrint = () => {
        OctoPrint.job.cancel()
    }

    const resumePrint = () => {
        OctoPrint.job.resume()
    }

    const restartPrint = () => {
        OctoPrint.job.restart()
    }

    return (
        <Container>
            <Row className={"text-center"}>
                <Col md={(printerState.flags.printing || printerState.flags.paused) ? 2 : 12}>
                    <h4>{printerState.text}</h4>
                </Col>
                {(printerState.flags.printing || printerState.flags.paused) &&
                <>
                    <Col md={4}>
                        <h4>File: {jobState.file.display}</h4>
                    </Col>
                    <Col md={4}>
                        <h4>Time left: {formatDuration(progressState.printTimeLeft)}</h4>
                    </Col>
                    <Col md={2}>
                        <ProgressBar style={{"height": "30px"}} now={progressState.completion} label={Math.round(progressState.completion) + "%"} />
                    </Col>
                </>
                }
            </Row>
            <Row className={"justify-content-center"}>
                <Col md={6} className={"text-center"}>
                    {printerState.flags.printing &&
                        <>
                            <Button variant={"primary"} className={"mx-3"} onClick={pausePrint}>Pause</Button>
                            <Button variant={"danger"} className={"mx-3"} onClick={cancelPrint}>Cancel</Button>
                        </>
                    }
                    {printerState.flags.paused &&
                    <>
                        <Button variant={"primary"} className={"mx-3"} onClick={resumePrint}>Resume</Button>
                        <Button variant={"danger"} className={"mx-3"} onClick={cancelPrint}>Cancel</Button>
                        <Button variant={"danger"} className={"mx-3"} onClick={restartPrint}>Restart</Button>
                    </>
                    }
                </Col>
            </Row>
        </Container>
    )
}

export default PrinterState;

const formatDuration = (seconds) => {
    if (!seconds) return "-";
    if (seconds < 1) return "00:00:00";

    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds % 3600) / 60);
    const h = Math.floor(seconds / 3600);

    return h + ":" + m + ":" + s
}