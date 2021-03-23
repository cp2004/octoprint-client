import {useEffect, useRef, useState} from "react";
import {nanoid} from "nanoid/non-secure";
import Container from "react-bootstrap/Container";
import {Form, FormControl, InputGroup, Overlay, ToggleButton, Tooltip} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {CopyToClipboard} from "react-copy-to-clipboard";

const OctoPrint = window.OctoPrint;

const Terminal = (props) => {
    const [autoscroll, setAutoscroll] = useState(true)
    const [logLines, setLogLines] = useState([]);

    /* const [printerState, setPrinterState] = useState({
        isErrorOrClosed: undefined,
        isOperational: undefined,
        isPrinting: undefined,
        isPaused: undefined,
        isError: undefined,
        isReady: undefined,
        isLoading: undefined,
    })
     */

    const handleScroll = (event) => {
        const top = event.nativeEvent.target.scrollTop;
        const pos = event.nativeEvent.target.scrollHeight;
        if (pos - top > 370) {  // TODO this doesn't really work
            console.log(pos - top)
            setAutoscroll(false)
        }
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
                <TerminalLog logLines={logLines} autoscroll={autoscroll} onScroll={handleScroll}/>
                <TerminalInput />
                <TerminalStatus logLines={logLines} autoscroll={autoscroll} toggleAutoscroll={toggleAutoScroll} />
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

const TerminalInput = (props) => {
    // Was based on OctoPrint core terminal, adapted to react
    const commandRe = /^(([gmt][0-9]+)(\.[0-9+])?)(\s.*)?/i;

    const [state, setState] = useState({
        command: "",
        history: [],
        historyIndex: 0,
    })

    const handleChange = (event) => {
        setState(prevState => ({...prevState, command: event.target.value, }))
    }

    const handleKeyUp = (event) => {
        if (event.keyCode === 13) {
            // enter to send
            sendCommand()
        }
    }

    const handleKeyDown = (event) => {
        // Cycle through command history using up/down arrows
        const keyCode = event.keyCode;
        if (keyCode === 38 || keyCode === 40) {
            if (
                keyCode === 38 &&
                state.history.length > 0 &&
                state.historyIndex > 0
            ) {
                setState(prevState => ({
                    ...prevState,
                    historyIndex: prevState.historyIndex - 1,
                    command: prevState.history[state.historyIndex - 1],
                }))
            } else if (
                keyCode === 40 &&
                state.historyIndex < state.history.length - 1
            ) {
                setState(prevState => ({
                    ...prevState,
                    historyIndex: prevState.historyIndex + 1,
                    command: prevState.history[state.historyIndex + 1],
                }))
            }

            if (
                state.historyIndex >= 0 &&
                state.historyIndex < state.history.length
            ) {
                setState(prevState => ({
                    ...prevState,
                    command: prevState.history[prevState.historyIndex],
                }));
            }

            // prevent the cursor from being moved to the beginning of the input field (this is actually the reason
            // why we do the arrow key handling in the keydown event handler, keyup would be too late already to
            // prevent this from happening, causing a jumpy cursor)
            event.preventDefault();
        }
    }

    const sendCommand = () =>{
        const command = state.command;
        if (!command){return;}

        let commandToSend = command;
        let commandMatch = commandToSend.match(commandRe);
        if (commandMatch !== null) {
            // let fullCode = commandMatch[1].toUpperCase(); // full code incl. sub code
            // let mainCode = commandMatch[2].toUpperCase(); // main code only without sub code

            commandToSend = commandToSend.toUpperCase();

            // TODO blacklist functionality - requires settings
            // copied here from OctoPrint's terminal view model, but we have no settings so it can't be implemented yet
            /*if (
                self.blacklist.indexOf(mainCode) < 0 &&
                self.blacklist.indexOf(fullCode) < 0
            ) {
                // full or main code not on blacklist -> upper case the whole command
                commandToSend = commandToSend.toUpperCase();
            } else {
                // full or main code on blacklist -> only upper case that and leave parameters as is
                commandToSend =
                    fullCode + (commandMatch[4] !== undefined ? commandMatch[4] : "");
            }*/
        }

        if (commandToSend) {
            OctoPrint.control.sendGcode(commandToSend).done(() =>
                setState(prevState => ({
                    history: prevState.history.concat([command]).slice(-300),  // Set a sane limit on number of commands to be saved
                    historyIndex: (prevState.history.length < 300) ? prevState.history.length + 1 : 300,
                    command: ''
                }))
            );
        }
    }
    return (
        <InputGroup>
            <FormControl
                type="text"
                placeholder="Enter a command"
                value={state.command}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
            />
            <InputGroup.Append>
                <Button onClick={sendCommand} variant={"outline-primary"}>Send</Button>
            </InputGroup.Append>
        </InputGroup>
    )
}

const TerminalStatus = (props) => {
    const copyLines = props.logLines.map(item => item.line).join("\n")

    const copyRef = useRef(null);
    const [show, setShow] = useState(false);

    const onCopy = () => {
        setShow(true)
        setTimeout(() => {
            setShow(false)
        }, 1000)
    }

    return (
        <div className={"mt-2"}>
            <Button
                variant={"outline-secondary"}
                active={props.autoscroll}
                onClick={props.toggleAutoscroll}
            >
                Autoscroll
            </Button>
            <span className={"ml-2"}>Showing {props.logLines.length} lines</span>
            <div className={"float-right"}>
                <CopyToClipboard text={copyLines} onCopy={onCopy}>
                    <span className={"pointer"} ref={copyRef}>Copy to clipboard</span>
                </CopyToClipboard>
            </div>
            <Overlay target={copyRef.current} show={show} placement={"top"}>
                {(props) => (
                    <Tooltip id={"copy-tooltip"} {...props}>
                        Copied!
                    </Tooltip>
                )}
            </Overlay>
        </div>
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