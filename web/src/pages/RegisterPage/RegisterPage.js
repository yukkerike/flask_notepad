import '../LoginPage/LoginPage.css'
import React from "react"
import Api from '../../js/api'
import Alert from '../../pages/widgets/Alert/Alert'

class RegisterPage extends React.Component{
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
        let pass1 = document.getElementById('passwordInput')
        let pass2 = document.getElementById('passwordRepeatInput')
        if (pass1.value !== pass2.value){
            document.getElementsByClassName('invisible')[0].classList.remove('invisible')
            pass1.classList.add('is-invalid')
            pass2.classList.add('is-invalid')
            return
        }
        Api.api("register",{username:login.value,password:pass1.value}).then(this.resolveLogin)
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
                    <h1 className="text-center">Регистрация</h1>
                    <div className="form-group">
                        <label className="col" htmlFor="emailInput">Логин</label>
                        <input type="login" className="form-control" id="emailInput" tabIndex="1" />
                    </div>
                    <div className="form-group">
                        <div className="row">
                            <label className="col" htmlFor="passwordInput">Пароль</label>
                            <span className="invisible text-danger col text-right">Пароли должны совпадать</span>
                        </div>
                        <input type="password" className="form-control" id="passwordInput" tabIndex="2" />
                    </div>
                    <div className="form-group">
                        <div className="row">
                            <label className="col" htmlFor="passwordRepeatInput">Подтвердить пароль</label>
                        </div>
                        <input type="password" className="form-control" id="passwordRepeatInput" tabIndex="3" />
                    </div>
                    <button type="submit" className="btn btn-success btn-lg btn-block" tabIndex="4">Создать аккаунт</button>
                </form>
            </React.Fragment>)}
}

export default RegisterPage
