import {useEffect} from "react";

const OctoPrint = window.OctoPrint

const useEvent = (event, callback) => {
    const handler = (msg) => {
        if (msg.data.type === event){
            callback(msg.data.payload)
        }
    }
    useEffect(() => {
        OctoPrint.socket.onMessage("event", handler)
        return () => OctoPrint.socket.removeMessage("event", handler)
    })
}

export default useEvent
