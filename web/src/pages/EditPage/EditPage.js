import React from "react"
import './EditPage.css'
import Api from '../../js/api'
class EditPage extends React.Component{
    constructor(props) {
        super(props)
        this.notes = props.state.notes
        this.setter = props.setter
        this.state = {note_id: -1, label: '', note: ''}
        this.sync_timeout = undefined
    }
    resolveSync = (req) => {
        localStorage.setItem('sync_stamp', req.response)
        this.notes = this.notes.filter((note)=>note[0]!==this.state.note_id)
        this.notes = [[this.state.note_id, this.state.label, this.state.note, req.response], ...this.notes]
        this.setter({notes:this.notes})
        localStorage.setItem('notes', JSON.stringify(this.notes))
    }
    sync = async () => {
        Api.api("edit_note", {note_id: this.state.note_id, label: this.state.label, note: this.state.note}).then(this.resolveSync)
    }
    close = () => {
        document.getElementById('note').disabled = true
        document.getElementById('label').disabled = true
        let close_btn = document.getElementById('close')
        close_btn.disabled = true
        close_btn.classList.remove('btn-success')
        close_btn.classList.add('btn-secondary')
        clearTimeout(this.sync_timeout)
        this.sync().then(()=>{
            window.location.href = '/#/home'
        })
    }
    componentDidMount() {
        let note_id = parseInt(window.location.href.substring(window.location.href.lastIndexOf('/')+1))
        let note = this.notes.filter((note)=>note[0]===note_id)[0]
        try {
            this.setState({
                note_id:note_id,
                label: note[1],
                note: note[2]
            })
        }catch (e) {
            window.location.href = '/#/home'
        }
    }
    handleChange = (e) => {
        switch (e.target.id){
            case 'note':
                this.setState({note:e.target.value})
                break
            default:
                this.setState({label:e.target.value})
        }
        clearTimeout(this.sync_timeout)
        this.sync_timeout = setTimeout(this.sync,2000)
    }
    render() {
        return(
            <div className={"overlay"} onClick={this.close}>
                <div className={"editor d-flex flex-column"} onClick={e=>e.stopPropagation()}>
                    <textarea id="label" className="bg-light font-weight-bold" value={this.state.label} onChange={this.handleChange} rows={1} />
                    <textarea id="note" className="flex-grow-1" autoFocus value={this.state.note} onChange={this.handleChange} />
                    <button onClick={this.close} id={'close'} className="btn btn-success" style={{textAlign:'center'}}>Закрыть</button>
                </div>
            </div>
        )
    }
}

export default EditPage
