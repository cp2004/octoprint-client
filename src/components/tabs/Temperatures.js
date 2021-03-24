import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Table from "react-bootstrap/Table";

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

    /*
    const TempSet = (tool) => {
        const Target =
    }

     */

    const rows = tools.map((tool, index) => (
        <tr key={"item-" + index}>
            <td>
                {capitalizeFirstLetter(tool)}
            </td>
            <td>
                {tempData[tempData.length - 1][tool].actual + "°C"}
            </td>
            <td>

            </td>
        </tr>
    ))

    return (
        <Table>
            <thead>
            <tr>
                <th>#</th>
                <th>Actual</th>
                <th>Target</th>
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
