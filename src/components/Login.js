import { useSnackbar } from 'notistack';

import {useState} from "react";
import useLocalStorage from "../hooks/useLocalStorage";

import OctoPrintLogo from "../images/octoprint.png"
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import {Col, Row} from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";

const OctoPrint = window.OctoPrint

const Login = (props) => {
    const [state, setState] = useState({
        baseurl: "",
        apikey: "",
        save: false,
    })
    const [connecting, setConnecting] = useState(false)

    const onLoginClick = (event) => {
        props.onLogin(state.baseurl, state.apikey)

        event.preventDefault();
    }

    const onChange = (event) => {
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        const name = event.target.name

        setState(state => ({
            ...state,
            [name]: value,
        }))
    }

    return (
        <Container fluid>
            <Row className={"justify-content-center"}>
                <Col className={"text-center"} xs={10} sm={6} md={5} lg={4} xl={4}>
                    <form className="form-signin">
                        <img className="mb-4" src={OctoPrintLogo} alt="" height="72" />
                        <h1 className="h3 mb-3 font-weight-normal">Please enter the details of your OctoPrint server</h1>
                        <label htmlFor="inputHost" className="sr-only">Base URL</label>
                        <input
                            type="text"
                            id="inputHost"
                            name={"baseurl"}
                            value={state.baseurl}
                            className="form-control my-2"
                            onChange={onChange}
                            placeholder="Base URL"
                            required
                            autoFocus
                        />
                        <label htmlFor="inputApikey" className="sr-only">Password</label>
                        <input
                            type="password"
                            id="inputApikey"
                            name={"apikey"}
                            value={state.apikey}
                            className="form-control my-2"
                            onChange={onChange}
                            placeholder="API Key"
                            required
                        />
                        <small className={"text-muted"}>
                            This will only be stored in your browser, this app is serverless :)
                        </small>
                        <Button variant={"primary"} className={"mt-3"} block size={"lg"} type="submit" onClick={onLoginClick}>{connecting && <Spinner animation="border" /> + " "}Log In</Button>
                    </form>
                </Col>
            </Row>
        </Container>
    )
}

export default Login