import React, {useState, useEffect} from 'react';
import { useSnackbar } from 'notistack';

import Container from 'react-bootstrap/Container';
import Spinner from "react-bootstrap/Spinner";

import Main from "./components/Main";
import Login from "./components/Login";
import './App.scss';
import useLocalStorage from "./hooks/useLocalStorage";

const OctoPrint = window.OctoPrint

//OctoPrint.options.baseurl = "http://localhost:5000/"
//OctoPrint.options.apikey = ""
//OctoPrint.socket.connect()

const testOctoPrintConnect = (baseurl, apikey) => {
    return new Promise(((resolve, reject) => {
        const newClient = new window.OctoPrintClient({baseurl: baseurl, apikey: apikey})
        newClient.get("api/version").done((response) => {
            if (response.text.includes("OctoPrint")){
                resolve()
            }
        }).fail(() => reject())
    }))
}

const App = () => {
    const [loading, setLoading] = useState(true);
    const [login, setLogin] = useState(false);

    const [clientOpts, setClientOpts] = useLocalStorage("clientOpts", {
        baseurl: "",
        apikey: ""
    })

    const { enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        // Test connection to OctoPrint, if successful then socket auth
        OctoPrint.options.baseurl = clientOpts.baseurl
        OctoPrint.options.apikey = clientOpts.apikey
        OctoPrint.socket.connect()

        const socketAuth = (name, session) => {
            /* I apologise for the nested error handlers, I can explain...
             * SetTimeout because on first load, the socket takes a few ms to connect.
             * This avoids an issue trying to send a message before connection is established.
             * With a 100ms timeout (quite long -_-) this still sometimes happened, so it will
             * retry after another 100ms. It sometimes worked with 1ms, so this is likely unnecessary.
             */
            setTimeout(() => {
                try {
                    OctoPrint.socket.sendAuth(name, session);
                } catch (e) {
                    // Try again after another 100ms, likely connection not established error
                    console.log("Failed to authenticate on the socket, trying again")
                    setTimeout( () => {
                        try {
                            OctoPrint.socket.sendAuth(name, session)
                        } catch (e) {
                            console.log(e)
                            enqueueSnackbar("Failed to connect to server twice, something went wrong", {variant: "error"})
                        }
                    }, 100)
                }

                setLoading(false)
                setLogin(false)
            }, 100)
        }

        // Test we can read from the API
        testOctoPrintConnect(clientOpts.baseurl, clientOpts.apikey).then(
            () => {
                // success, move on to passive login
                enqueueSnackbar("Successfully connected to server", {variant: "success"})
                OctoPrint.browser.passiveLogin().done((response) => {
                    setLoading(false)
                    if (response.session){
                        socketAuth(response.name, response.session)
                    }
                })
            }, () => {
                // failed, show login screen
                enqueueSnackbar("Failed to connect to OctoPrint, please check credentials")
                setLoading(false)
                setLogin(true)
            })

    }, [clientOpts, setLoading, setLogin, enqueueSnackbar])  // Should only run when baseurl or key change, afaik hooks

    const Loading = () => {
        return (
            <div className={"p-3 text-center"}>
                <Spinner animation="border" />
                <h1>Connecting to the server...</h1>
            </div>
        )
    }

    const onLogin = (host, key) => {
        setClientOpts({
            baseurl: host,
            apikey: key
        })
        // This *should* trigger the useEffect hook again, if I set it up right.
    }

    const onLogout = () => {
        setClientOpts({
            baseurl: "",
            apikey: "",
        })
    }

    return (
        <>
            {!loading && !login && <Main onLogout={onLogout}/>}
            {loading &&
            <Container className={"p-3"}>
                <Loading/>
            </Container>
            }
            {!loading && login && <Login onLogin={onLogin}/>}
        </>
    )
}

export default App;
