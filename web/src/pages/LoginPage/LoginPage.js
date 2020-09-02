import './LoginPage.css'
import React from "react"
import Api from '../../js/api'
import {NavLink} from "react-router-dom";
import Alert from '../../pages/widgets/Alert/Alert'

class LoginPage extends React.Component{
    constructor(props) {
        super(props)
        this.props = props
        this.state = {showAlert: false, textAlert: ""}
    }
    resolveLogin = (req) => {
        if (req.status > 2){
            this.setState({showAlert:true, textAlert:req.response})
            setTimeout(()=>this.setState({showAlert:false}),5000)
        }else if (req.status === 2){
            window.location.href = '/#/home'
        }
    }
    submit = (e) => {
        e.preventDefault()
        let login = document.getElementById('emailInput')
        let pass = document.getElementById('passwordInput')
        Api.api("login",{username:login.value,password:pass.value}).then(this.resolveLogin)
    }
    componentDidMount() {
        if (this.props.isLogged){
            window.location.href = '/#/home'
        }
        let form = document.getElementById('login_form')
        form.addEventListener('submit', this.submit)
    }
    render(){
        return(
            <React.Fragment>
                {this.state.showAlert && <Alert text={this.state.textAlert} />}
                <form id={"login_form"} className="container border rounded p-3 mb-5 bg-white">
                    <h1 className="text-center">Авторизация</h1>
                    <div className="form-group">
                        <label className="col" htmlFor="emailInput">Логин или email</label>
                        <input type="login" className="form-control" id="emailInput" tabIndex="1" />
                    </div>
                    <div className="form-group">
                        <div className="row">
                            <label className="col" htmlFor="passwordInput">Пароль</label>
                            <NavLink to={"/forgot"} className="col text-right">Забыли пароль?</NavLink>
                        </div>
                        <input type="password" className="form-control" id="passwordInput" tabIndex="2" />
                    </div>
                    <button type="submit" className="btn btn-success btn-lg btn-block" tabIndex="3">Вход</button>
                    <hr className="my-md-3" />В первый раз? <NavLink to={"/register"}>Создать аккаунт.</NavLink>
                </form>
            </React.Fragment>
        )}
}

export default LoginPage
