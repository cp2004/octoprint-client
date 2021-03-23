import {useEffect, useRef, useState} from "react";
import {nanoid} from "nanoid/non-secure";
import Container from "react-bootstrap/Container";

const OctoPrint = window.OctoPrint;

const Terminal = (props) => {
    const [autoscroll, setAutoscroll] = useState(true)
    const [logLines, setLogLines] = useState([]);
    const [printerState, setPrinterState] = useState({
        isErrorOrClosed: undefined,
        isOperational: undefined,
        isPrinting: undefined,
        isPaused: undefined,
        isError: undefined,
        isReady: undefined,
        isLoading: undefined,
    })

    const handleScroll = (event) => {
        const pos = event.nativeEvent.target.scrollTop;
        const top = event.nativeEvent.target.scrollTop;
        console.log("Top ", top)
        console.log("Pos ", pos)
        //if (top - pos > 360) {  // TODO this is a temporary hack, while it seems to work is fragile to changing height
        // setAutoscroll(false)
        //}
    }

    const toggleAutoScroll = () => {
        setAutoscroll(prevState => !prevState)
    }

    useEffect(() => {
        const processData = (message) => {
            const logs = message.data.logs;

            setLogLines(prevState => (
                prevState.concat(logs.map((line) => toInternalFormat(line))).slice(autoscroll ? -300 : -1500)
            ))
        }
        OctoPrint.socket.onMessage("history", processData)
        OctoPrint.socket.onMessage("current", processData)
        return () => {
            OctoPrint.socket.removeMessage("history", processData)
            OctoPrint.socket.removeMessage("current", processData)
        }
    }, [autoscroll])

    return (
        <>
            <Container fluid>
                <TerminalLog logLines={logLines} onScroll={handleScroll}/>
            </Container>
        </>
    )
}

export default Terminal

// Sub-components that make terminal
const TerminalLog = (props) => {
    const terminalRef = useRef()
    useEffect(() => {
        if (props.autoscroll) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    })

    const logs = props.logLines.map((line) => <LogLine key={line.id} value={line.line} />)

    return (
        <pre
            ref={terminalRef}
            onScroll={props.onScroll}
            className={"pre-scrollable"}
        >
            {logs}
            <div/>
        </pre>
    )
}

const LogLine = (props) => {
    return (
        <span className={props.type === "warn" ? 'text-warning' : null}>
            {props.value + "\n"}
        </span>
    )
}

//~ Some useful helpers

const toInternalFormat = (line, display, type) => {
    display = display || "line"

    if (type === undefined){
        if (line.startsWith("Recv")){
            type = "recv";
        } else if (line.startsWith("Send")) {
            type = "send";
        } else if (line.startsWith("Warn")) {
            type = "warn";
        }
    }

    return {
        line: escapeUnprintableCharacters(line),
        id: nanoid(7),
        display: display,
        type: type,
    }
}

/**
 * Escapes unprintable ASCII characters in the provided string.
 *
 * E.g. turns a null byte in the string into "\x00".
 *
 * Characters 0 to 31 excluding 9, 10 and 13 will be escaped, as will
 * 127, 128 to 159 and 255. That should leave printable characters and unicode
 * alone.
 *
 * Originally based on
 * https://gist.github.com/mathiasbynens/1243213#gistcomment-53590
 *
 * @param str The string to escape
 * @returns {string}
 */
const escapeUnprintableCharacters = (str) => {
    let result = "";
    let index = 0;
    let charCode;

    while (!isNaN((charCode = str.charCodeAt(index)))) {
        if (
            (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) ||
            charCode === 127 ||
            (charCode >= 128 && charCode <= 159) ||
            charCode === 255
        ) {
            // special hex chars
            result += "\\x" + (charCode > 15 ? "" : "0") + charCode.toString(16);
        } else {
            // anything else
            result += str[index];
        }
        index++;
    }
    return result;
};