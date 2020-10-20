import React from "react";
import './ProfilePage.css'
import Api from '../../js/api'
import Header from "../widgets/Header/Header"
import Alert from "../widgets/Alert/Alert";

class ProfilePage extends React.Component{
    constructor(props) {
        super(props)
        this.state = {showAlert: false, textAlert: ""}
        this.globalState = props.state
        this.setter = props.setter
    }
    resolveSubmit = (req) => {
        if (req.status > 2) {
            console.log(req.response)
            this.setState({showAlert: true, textAlert: req.response})
            setTimeout(() => this.setState({showAlert: false}), 5000)
            return
        }
        this.setter({profile:[this.globalState.profile[0],this.login.value,this.email.value]})
        window.location.href = '#/home'
    }
    resolveDestroy = async () => {
        await Api.api("remove_user")
        Api.logout()
    }
    show_modal(e){
        e.preventDefault()
        let modal = document.getElementsByClassName('modal')[0]
        modal.style = "display:block"
    }
    close_modal(){
        let modal = document.getElementsByClassName('modal')[0]
        modal.style = "display:none"
    }
    submit = (e) => {
        e.preventDefault()
        let oldPass = document.getElementById('oldPasswordInput')
        let newPass1 = document.getElementById('newPasswordInput1')
        let newPass2 = document.getElementById('newPasswordInput2')
        if (newPass1.value !== newPass2.value){
            document.getElementsByClassName('invisible')[0].classList.remove('invisible')
            newPass1.classList.add('is-invalid')
            newPass2.classList.add('is-invalid')
            return
        }
        newPass1.classList.remove('is-invalid')
        newPass2.classList.remove('is-invalid')
        Api.api("edit_profile",{username:this.login.value,email:this.email.value,password:newPass1.value,old_password:oldPass.value}).then(this.resolveSubmit)
    }

    componentDidMount() {
        let form = document.getElementsByClassName('profile')[0]
        form.addEventListener('submit', this.submit)
        this.login = document.getElementById('loginInput')
        this.login.value = this.globalState.profile[1]
        this.email = document.getElementById('emailInput')
        this.email.value = this.globalState.profile[2]
    }
    render(){
        return(
            <React.Fragment>
                {this.state.showAlert && <Alert text={this.state.textAlert} />}
                <Header username={this.globalState.profile[1]} setter={this.setter} state={this.globalState} button={"back"} />
                <form className={"profile"}>
                    <h3>Редактирование профиля</h3>
                    <div className="form-group">
                        <label className={"col"} htmlFor="loginInput">Логин</label>
                        <input type="login" className="form-control" id="loginInput" placeholder="ник" />
                    </div>
                    <div className="form-group">
                        <label className={"col"} htmlFor="emailInput">Email</label>
                        <input type="email" className="form-control" id="emailInput" placeholder="необязательно" />
                    </div>
                    <div className="form-group">
                        <label className={"col"} htmlFor="oldPasswordInput">Старый пароль</label>
                        <input type="password" className="form-control" id="oldPasswordInput" placeholder="пароль" />
                    </div>
                    <div className="form-group">
                        <div className="row">
                            <label className={"col"} htmlFor="newPasswordInput1">Новый пароль</label>
                            <span className="invisible text-danger col text-right">Пароли должны совпадать</span>
                        </div>
                        <input type="password" className="form-control" id="newPasswordInput1" placeholder="пароль" />
                    </div>
                    <div className="form-group">
                        <label className={"col"} htmlFor="newPasswordInput2">Подтвердить новый пароль</label>
                        <input type="password" className="form-control" id="newPasswordInput2" placeholder="пароль" />
                    </div>
                    <div className={"d-flex justify-content-between"}>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                        <button onClick={this.show_modal} className={"btn btn-danger"} >Удалить аккаунт</button>
                    </div>
                </form>
                <div className="modal" tabIndex="-1" role="dialog" onClick={this.close_modal}>
                    <div className="modal-dialog" role="document" onClick={e=>e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Подтверждение</h5>
                            </div>
                            <div className="modal-body">
                                <p>Вы уверены, что хотите удалить аккаунт?<br />
                                Это действие нельзя отменить.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-danger" onClick={this.resolveDestroy}>Удалить аккаунт</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.close_modal}>Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>)}
}

export default ProfilePage
