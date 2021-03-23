import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";

const Connect = (props) => {
    const onButtonClick = () => {
        props.onConnect()
    }

    return (
        <Container className={"text-center"}>
            <h1>Connect to the server</h1>
            <Button onClick={onButtonClick}>Connect</Button>
        </Container>
    )
}

export default Connect