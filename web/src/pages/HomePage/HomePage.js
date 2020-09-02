import React from "react";
import './HomePage.css'
import Header from "../widgets/Header/Header";
import NotesList from "../widgets/NotesList/NotesList";

class HomePage extends React.Component{
    constructor(props) {
        super(props)
        this.globalState = props.state
        this.setter = props.setter
    }
    componentDidMount() {
        this.interval=setInterval(this.props.sync_notes,10000)
    }
    componentWillUnmount() {
        clearInterval(this.interval)
    }

    render(){
        return(
            <React.Fragment>
                <Header username={this.globalState.profile[1]} setter={this.setter} state={this.globalState} button={"add"} />
                <NotesList setter={this.setter} state={this.globalState} />
            </React.Fragment>
        )}
}

export default HomePage
