import React from 'react'
import './Header.css'
import { NavLink } from "react-router-dom"
import Api from '../../../js/api'
class Header extends React.Component{
    constructor(props) {
        super(props)
        this.props = props
        this.state = {isVisible:false}
    }
    add_note = async () => {
        let id = await Api.api("add_note")
        id = id.response
        this.props.setter({notes:[[id, '', '', Date.now()/1000], ...this.props.state.notes]})
    }
    hide_menu = () => {
        let user = document.getElementsByClassName('user')[0]
        this.setState({isVisible:false})
        user.addEventListener('click', this.show_menu)
        window.removeEventListener('click', this.hide_menu)
    }
    componentWillUnmount() {
        return this.state.isVisible ? this.hide_menu() : undefined
    }
    componentDidMount() {
        let user = document.getElementsByClassName('user')[0]
        user.addEventListener('click', this.show_menu)
    }

    show_menu = () => {
        let user = document.getElementsByClassName('user')[0]
        this.setState({isVisible:true})
        user.removeEventListener('click', this.show_menu)
        setTimeout(() => {
            window.addEventListener('click', this.hide_menu)
        }, 10)
    }
    render() {
        return (
            <header className="navbar bg-dark" style={{height:70, marginBottom: 5, color: 'white'}}>
                {this.props.button === "add" ? <div className="btn btn-primary" onClick={this.add_note}>
                    <svg className="bi bi-plus" width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor"
                         xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd"
                              d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
                        <path fillRule="evenodd"
                              d="M7.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8z"/>
                    </svg>
                </div> : this.props.button === "back" ? <div className="btn btn-primary" onClick={()=>{window.history.go(-1)}}>
                    <svg className="bi bi-arrow-left" width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor"
                         xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd"
                              d="M5.854 4.646a.5.5 0 0 1 0 .708L3.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z"/>
                        <path fillRule="evenodd" d="M2.5 8a.5.5 0 0 1 .5-.5h10.5a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                </div> : <span />}
                <div className="user">{this.props.username}
                    {this.state.isVisible && <Dropdown />}
                </div>
            </header>)}
}

const Dropdown = () =>
    <ul className="dropdown-menu dropdown-menu-right" style={{display: 'block'}}>
        <li><NavLink activeClassName="active" className="dropdown-item" to="/profile">Редактировать</NavLink></li>
        <li><button className="dropdown-item" onClick={(e)=>{
            e.preventDefault()
            Api.logout()
        }}>Выйти</button></li>
    </ul>

export default Header
