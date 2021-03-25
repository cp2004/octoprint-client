import React, {useEffect, useState} from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Table from "react-bootstrap/Table";
import {FormControl, InputGroup} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons'
import Button from "react-bootstrap/Button";

const OctoPrint = window.OctoPrint;

const actualColours = [
    "#EE0202",
    "#3A02EE",
    "#0AEA47"
]

const targetColours = [
    "#02EEEE",
    "#B7EE02",
    "#EA0AAE"
]

const TempGraph = (props) => {
    const tempData = props.tempData
    const tools = props.tools

    const actualLines = tools.map((tool, index) => (
        <Line key={"actual" + index} type="monotone" dataKey={tool + ".actual"} stroke={actualColours[index]}
              dot={false}/>
    ))

    const targetLines = (tools.map((tool, index) =>
        <Line key={"target" + index} type="monotone" dataKey={tool + ".target"} stroke={targetColours[index]}
              dot={false} strokeDasharray="3 3"/>
    ))

    const legendFormatter = (value) => <span>{capitalizeFirstLetter(value.split(".")[0])}</span>

    const tempFormatter = (value) => value + "°C"
    const timeFormatter = (value) => {
        if (value === undefined || value === 0 || isNaN(value)) return ""; // we don't want to display the minutes since the epoch if not connected yet ;)

        // value is in seconds
        //console.log(value)
        const current = Math.round(Date.now() / 1000)  // secs
        const diff = current - value  // secs
        const diffInMins = Math.round(diff / 60)

        if (diffInMins === 0) {
            // don't write anything for "just now"
            return "now";
        } else if (diffInMins < 0) {
            // we can't look into the future
            return "";
        } else {
            return "-" + diffInMins + " min";
        }
    }

    return (
        <ResponsiveContainer width="100%" height="60%">
            <LineChart
                width={500}
                height={300}
                data={tempData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis tickFormatter={timeFormatter} dataKey="time"/>
                <YAxis tickFormatter={tempFormatter} />
                <Tooltip />
                <Legend formatter={legendFormatter}/>
                {actualLines}
                {targetLines}
            </LineChart>
        </ResponsiveContainer>
    );
}

const TempControls = (props) => {
    const tools = props.tools
    const tempData = props.tempData;

    const [targets, setTargets] = useState({})
    const [newTargets, setNewTargets] = useState({
        // Give each possible target an initial value, to prevent uncontrolled components
        bed: "",
        chamber: "",
        tool0: "",
        tool1: "",
        tool2: "",
        tool3: "",
        tool4: "",
        tool5: "",
        tool6: "",
        tool7: "",
        tool8: "",
        tool9: "",
    })

    useEffect(() => {
        // Set actual targets every update of tempData or tools
        // This is what the server thinks the target is, separate from any user input
        const newTargets = {}
        tools.forEach(tool => {
            newTargets[tool] = tempData.length > 0 ? tempData[tempData.length - 1][tool].target : 0
        })
        setTargets(newTargets)
    }, [tools, tempData, setTargets])  // Set actual targets every update of tempData or tools

    const onTargetChange = (event) => {
        // Handle changing the target nicely, checking validity
        let value = event.target.value
        const name = event.target.name;

        if (value !== ""){
            // If the value is not empty, it must be a number, so abort if it is anything else
            // "" is the only allowed non-number state, like nothing - but setting to undefined upsets react
            try {
                value = parseInt(event.target.value);
                if (isNaN(value)) return;
            } catch (e) {return} // If it can't be parsed to int, don't update

            if (!(0 <= value <= 999)) return
        }

        setNewTargets(prevState => ({
            ...prevState,
            [name]: value
        }))
    }

    const onTargetKeyDown = (name, event) => {
        // Handle enter to send here
        if (event.keyCode === 13){
            saveChange(name)
        }
    }

    const changeTarget = (tool, difference) => {
        setNewTargets(prevState => {
            let newValue
            if (prevState[tool] === "") {
                // Empty string means 'no value' so start at the current target from the server
                newValue = targets[tool] + difference
            } else {
                // Add to the current 'new value
                newValue = newTargets[tool] + difference
            }

            // Abort any changes if that is out of bounds
            if (!(0 <= newValue <= 999)) return prevState

            return {
                ...prevState,
                [tool]: newValue
            }
        })
    }

    const increaseTarget = (tool) => {
        changeTarget(tool, 1)
    }

    const decreaseTarget = (tool) => {
        changeTarget(tool, -1)
    }

    const saveChange = (tool) => {
        const value = newTargets[tool]

        const resetChange = (tool) => {
            // Small hack to avoid delays between setting the target and it appearing in the box from socket
            setTargets(prevState => ({
                ...prevState,
                [tool]: value
            }))
            setNewTargets(prevState => ({
                ...prevState,
                [tool]: "",
            }))
        }

        if (tool.includes("bed")) {
            OctoPrint.printer.setBedTargetTemperature(value).done(() => resetChange(tool))
        } else if (tool.includes("chamber")) {
            OctoPrint.printer.setChamberTargetTemperature(value).done(() => resetChange(tool))
        } else {
            OctoPrint.printer.setToolTargetTemperatures({
                [tool]: value
            }).done(() => resetChange(tool))
        }
    }

    const rows = tools.map((tool, index) => (
        <tr key={"item-" + index}>
            <td className={"text-center"}>
                {capitalizeFirstLetter(tool)}
            </td>
            <td className={"text-center"}>
                {tempData[tempData.length - 1][tool].actual + "°C"}
            </td>
            <td className={"text-center"}>
                <InputGroup>
                    <InputGroup.Prepend>
                        <Button onClick={() => decreaseTarget(tool)} variant="secondary">
                            <FontAwesomeIcon icon={faMinus}/>
                        </Button>
                    </InputGroup.Prepend>

                    <FormControl
                        name={tool}
                        value={newTargets[tool]}
                        placeholder={targets[tool] === 0 ? "off" : targets[tool]}
                        onChange={onTargetChange}
                        onKeyDown={(event) => onTargetKeyDown(tool, event)}
                    />

                    <InputGroup.Append>
                        <InputGroup.Text>°C</InputGroup.Text>
                        <Button onClick={() => increaseTarget(tool)} variant="secondary">
                            <FontAwesomeIcon icon={faPlus}/>
                        </Button>
                    </InputGroup.Append>

                    <Button className={"ml-1"} variant={"primary"} onClick={() => saveChange(tool)} disabled={newTargets[tool] === ""}>
                        <FontAwesomeIcon icon={faCheck} />
                    </Button>
                </InputGroup>
            </td>
            <td className={"text-center"}>
                :)
            </td>
        </tr>
    ))

    // TODO convert from table to responsive something

    return (
        <Table>
            <thead className={"thead-light"}>
            <tr>
                <th style={{"width": "20%"}} className={"text-center"}>#</th>
                <th style={{"width": "20%"}} className={"text-center"}>Actual</th>
                <th style={{"width": "50%"}} className={"text-center"}>Target</th>
                <th style={{"width": "10%"}} className={"text-center"}>Offset</th>
            </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
        </Table>
    )
}


const Temperatures = () => {
    const [tempData, setTempData] = React.useState([])

    React.useEffect(() => {
        const processData = (msg) => {
            const data = msg.data.temps
            if (data.length > 0){
                setTempData(prevState => prevState.concat(data).slice(-300))  // TODO tune number of updates to keep
            }
        }
        OctoPrint.socket.onMessage("history", processData)
        OctoPrint.socket.onMessage("current", processData)
        return () => {
            OctoPrint.socket.removeMessage("history", processData)
            OctoPrint.socket.removeMessage("current", processData)
        }
    }, [])


    /*
     * Create an array of tools from the last temps response, filtering out time
     * and any that are showing as null, meaning they were not enabled and reporting.
     */
    const tools = (
        tempData.length > 0 ?
            Object.keys(tempData[tempData.length - 1])
                .filter(key => key !== "time")  // Don't include time
                .filter(key => tempData[tempData.length - 1][key].actual !== null ) // Don't include disabled thing
            : []
    )

    return (
        <>
            <TempGraph tempData={tempData} tools={tools}/>
            <TempControls tempData={tempData} tools={tools}/>
        </>
    )
}

export default Temperatures;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
