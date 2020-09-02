import React from 'react'
import {HashRouter, Route} from "react-router-dom"
import HomePage from './pages/HomePage/HomePage'
import LoginPage from './pages/LoginPage/LoginPage'
import Api from "./js/api";
import Loader from "./pages/widgets/Loader/Loader";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import ForgotPage from "./pages/ForgotPage/ForgotPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import EditPage from "./pages/EditPage/EditPage";

class App extends React.Component{
    constructor(props) {
        super(props)
        this.state = {ready: false, logged:false, profile: [], notes: []}
    }
    async componentDidMount() {
        if (Api.getCookie('session').length > 1){
            this.state.logged = Api.getCookie('session').length > 1
        }else{
            if (!window.location.href.match('forgot|register')) {
                window.location.href = '/#/login'
            }
        }
        if (this.state.logged){
            let localNotes = JSON.parse(localStorage.getItem('notes'))
            if (localNotes) this.setState({notes:localNotes})
            let req = await Api.api('show_profile')
            if (req.status === 1){
                this.sync_notes()
                if (!window.location.href.match('profile|note')) window.location.href = '/#/home'
                this.setState({profile:req.response, ready:true})
            }
        }else{
            this.setState({ready:true})
        }
    }

    sync_notes = () => {
        Api.api('get_sync_stamp').then((req)=>{
            if (req.status !== 1)return
            if (localStorage.getItem('sync_stamp') !== req.response.toString()){
                localStorage.setItem('sync_stamp',req.response)
                Api.api('show_notes',{},).then((req)=>{
                    this.setState({notes:req.response})
                    localStorage.setItem('notes', JSON.stringify(req.response))
                })
            }
        })
    }
    setter = (newState) => {
        this.setState(newState)
    }
    render() {
        return (
            <React.Fragment>
                {!this.state.ready ? <Loader /> :
                    <HashRouter>
                        <div className="d-flex flex-column">
                            <Route path="/home" component={(props) => <HomePage sync_notes={this.sync_notes} setter={this.setter} state={this.state} />} />
                            <Route exact path="/login" component={(props) => <LoginPage isLogged={this.state.logged} />} />
                            <Route exact path="/register" component={(props) => <RegisterPage isLogged={this.state.logged} />} />
                            <Route exact path="/forgot" component={(props) => <ForgotPage isLogged={this.state.logged} />} />
                            <Route exact path="/profile" component={(props) => <ProfilePage setter={this.setter} state={this.state} />} />
                            <Route path="*note*" component={(props) => <EditPage setter={this.setter} state={this.state} />} />
                        </div>
                    </HashRouter>
                }
            </React.Fragment>
        )
    }
}

export default App
